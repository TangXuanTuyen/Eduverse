import 'server-only';

import { GoogleGenAI } from '@google/genai';

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type AIRequestOptions = {
  systemPrompt: string;
  history?: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  thinkingBudget?: number;
};

export type AIResponse = {
  text: string;
  tokensUsed: number;
};

export interface AIProvider {
  generateText(userMessage: string, opts: AIRequestOptions): Promise<AIResponse>;
  generateStream(userMessage: string, opts: AIRequestOptions): AsyncGenerator<string, AIResponse>;
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;
// Có thể đổi trên Vercel bằng GEMINI_FALLBACK_MODEL khi cần, không cần sửa code
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-3.6-flash';

export class AIOverloadError extends Error {
  constructor() {
    super('Vina đang quá tải hoặc đã hết lượt trả lời hôm nay. Em thử lại sau nhé.');
    this.name = 'AIOverloadError';
  }
}

const STREAM_TIMEOUT_MS = 30000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI timeout')), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

    const requestedTokens = opts.maxTokens ?? 1024;
    const thinkingBudget = opts.thinkingBudget ?? 2048;

    const modelsToTry = [this.model, FALLBACK_MODEL];

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await Promise.race([
            this.ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction: opts.systemPrompt,
                maxOutputTokens: requestedTokens + thinkingBudget,
                temperature: opts.temperature ?? 0.7,
                thinkingConfig: { thinkingBudget },
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI timeout')), opts.timeoutMs ?? 30000),
            ),
          ]);

          const text = response.text ?? '';
          const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

          if (!text) {
            const reason = response.candidates?.[0]?.finishReason;
            if (reason === 'MAX_TOKENS') throw new Error('AI hết token trả lời, thử giảm số câu hỏi');
            throw new Error('AI trả về rỗng');
          }

          return { text, tokensUsed };
        } catch (err: unknown) {
          const status = (err as { status?: number }).status;
          if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
            continue;
          }
          if (status === 503 || status === 429) break; // try fallback model
          throw err;
        }
      }
    }

    throw new AIOverloadError();
  }

  async *generateStream(
    userMessage: string,
    opts: AIRequestOptions,
  ): AsyncGenerator<string, AIResponse> {
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

    const requestedTokens = opts.maxTokens ?? 1024;
    const thinkingBudget = opts.thinkingBudget ?? 2048;

    const modelsToTry = [this.model, FALLBACK_MODEL];
    const timeoutMs = opts.timeoutMs ?? STREAM_TIMEOUT_MS;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let yielded = false;
        try {
          // Mỗi bước chờ đều có hạn: model treo không được làm học sinh chờ mãi
          const stream = await withTimeout(
            this.ai.models.generateContentStream({
              model,
              contents,
              config: {
                systemInstruction: opts.systemPrompt,
                maxOutputTokens: requestedTokens + thinkingBudget,
                temperature: opts.temperature ?? 0.7,
                thinkingConfig: { thinkingBudget },
              },
            }),
            timeoutMs,
          );

          let fullText = '';
          let tokensUsed = 0;
          const iterator = stream[Symbol.asyncIterator]();
          let step = await withTimeout(iterator.next(), timeoutMs);

          while (!step.done) {
            const chunk = step.value;
            const text = chunk.text ?? '';
            if (text) {
              fullText += text;
              yielded = true;
              yield text;
            }
            if (chunk.usageMetadata?.totalTokenCount) {
              tokensUsed = chunk.usageMetadata.totalTokenCount;
            }
            step = await withTimeout(iterator.next(), timeoutMs);
          }

          if (!fullText) throw new Error('AI trả về rỗng');

          return { text: fullText, tokensUsed };
        } catch (err: unknown) {
          // Đã gửi một phần câu trả lời thì không thử lại, tránh lặp chữ trên màn hình
          if (yielded) throw err;

          const status = (err as { status?: number }).status;
          const busy = status === 429 || status === 503;
          const timedOut = err instanceof Error && err.message === 'AI timeout';

          if (busy && attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY_MS * 2 ** attempt);
            continue;
          }
          if (busy || timedOut) break; // chuyển sang model dự phòng
          throw err;
        }
      }
    }

    throw new AIOverloadError();
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
