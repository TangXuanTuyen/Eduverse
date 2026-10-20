import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import type { CreateQuestionData, QuestionType } from '@/services/questions';

const SUBJECTS: Record<string, string> = {
  'vat-ly': 'Vật lý',
  'hoa-hoc': 'Hóa học',
  'sinh-hoc': 'Sinh học',
  'khtn': 'Khoa học tự nhiên (tổng hợp)',
};

const GRADE_LABELS: Record<number, string> = {
  6: 'lớp 6',
  7: 'lớp 7',
  8: 'lớp 8',
  9: 'lớp 9',
};

const TYPE_INSTRUCTIONS: Record<string, string> = {
  single_choice: 'Trắc nghiệm một đáp án đúng. Có 4 lựa chọn (a, b, c, d). correct_answer là chữ cái đáp án đúng (VD: "a").',
  multiple_choice: 'Trắc nghiệm nhiều đáp án đúng. Có 4 lựa chọn (a, b, c, d). correct_answer là mảng chữ cái (VD: ["a","c"]).',
  short_answer: 'Trả lời ngắn. correct_answer là mảng các đáp án chấp nhận (VD: ["Newton","N"]).',
  essay: 'Tự luận. correct_answer là null.',
};

export type GenerateParams = {
  subject: string;
  grade: number;
  topic: string;
  type: QuestionType;
  difficulty: number;
  count: number;
};

export async function generateQuestions(params: GenerateParams): Promise<CreateQuestionData[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình ANTHROPIC_API_KEY');

  const client = new Anthropic({ apiKey });

  const subjectName = SUBJECTS[params.subject] ?? params.subject;
  const gradeName = GRADE_LABELS[params.grade] ?? `lớp ${params.grade}`;
  const diffLabel = params.difficulty === 1 ? 'dễ' : params.difficulty === 2 ? 'trung bình' : 'khó';
  const typeInst = TYPE_INSTRUCTIONS[params.type] ?? '';

  const prompt = `Tạo ${params.count} câu hỏi ${subjectName} cho học sinh ${gradeName} về chủ đề "${params.topic}".

Yêu cầu:
- Độ khó: ${diffLabel}
- Loại câu hỏi: ${typeInst}
- Nội dung phải chính xác về mặt khoa học, phù hợp chương trình KHTN Việt Nam.
- Nếu có công thức, dùng KaTeX: $E = mc^2$ (inline) hoặc $$F = ma$$ (block).
- Mỗi câu hỏi cần có explanation (giải thích ngắn gọn đáp án đúng).
- skill_tags: 2-3 kỹ năng liên quan (tiếng Việt, kebab-case, VD: ["luc", "co-hoc"]).

Trả về JSON array, mỗi phần tử có dạng:
{
  "type": "${params.type}",
  "content": "nội dung câu hỏi",
  "options": ${params.type.includes('choice') ? '[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]' : 'null'},
  "correct_answer": ...,
  "difficulty": ${params.difficulty},
  "skill_tags": ["..."],
  "explanation": "..."
}

CHỈ trả về JSON array, không có text khác.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI không trả về định dạng hợp lệ');

  const parsed = JSON.parse(jsonMatch[0]) as CreateQuestionData[];
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Không tạo được câu hỏi');

  return parsed;
}

export function getSubjects() {
  return Object.entries(SUBJECTS).map(([id, name]) => ({ id, name }));
}
