import 'server-only';

import { GoogleGenAI } from '@google/genai';

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type AIRequestOptions = {
  systemPrompt: string;
  history?: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export type AIResponse = {
  text: string;
  tokensUsed: number;
};

export interface AIProvider {
  generateText(userMessage: string, opts: AIRequestOptions): Promise<AIResponse>;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-3.8-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateText(userMessage: string, opts: AIRequestOptions): Promise<AIResponse> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (opts.history) {
      for (const msg of opts.history) {
        if (msg.role === 'system') continue;
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await Promise.race([
          this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
              systemInstruction: opts.systemPrompt,
              maxOutputTokens: opts.maxTokens ?? 1024,
              temperature: opts.temperature ?? 0.7,
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI timeout')), opts.timeoutMs ?? 30000),
          ),
        ]);

        const text = response.text ?? '';
        const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

        return { text, tokensUsed };
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
          continue;
        }
        throw err;
      }
    }

    throw new Error('AI request failed after retries');
  }
}

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_provider) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Chưa cấu hình GEMINI_API_KEY');
    _provider = new GeminiProvider(apiKey);
  }
  return _provider;
}
