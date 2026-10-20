import 'server-only';

import { getAIProvider } from '@/lib/ai/provider';
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

const DIFF_LABELS: Record<number, string> = { 1: 'dễ', 2: 'trung bình', 3: 'khó' };

const TYPE_INSTRUCTIONS: Record<string, string> = {
  single_choice: 'Trắc nghiệm một đáp án đúng. Có 4 lựa chọn (a, b, c, d). correct_answer là chữ cái đáp án đúng (VD: "a").',
  multiple_choice: 'Trắc nghiệm nhiều đáp án đúng. Có 4 lựa chọn (a, b, c, d). correct_answer là mảng chữ cái (VD: ["a","c"]).',
  short_answer: 'Trả lời ngắn. correct_answer là mảng các đáp án chấp nhận (VD: ["Newton","N"]).',
  essay: 'Tự luận. correct_answer là null.',
};

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'trắc nghiệm 1 đáp án',
  multiple_choice: 'trắc nghiệm nhiều đáp án',
  short_answer: 'trả lời ngắn',
  essay: 'tự luận',
};

export type GenerateParams = {
  subject: string;
  grade: number;
  topic: string;
  types: QuestionType[];
  difficulties: number[];
  count: number;
};

export async function generateQuestions(params: GenerateParams): Promise<CreateQuestionData[]> {
  const provider = getAIProvider();

  const subjectName = SUBJECTS[params.subject] ?? params.subject;
  const gradeName = GRADE_LABELS[params.grade] ?? `lớp ${params.grade}`;
  const diffList = params.difficulties.map((d) => DIFF_LABELS[d] ?? `${d}`).join(', ');
  const typeList = params.types.map((t) => TYPE_LABELS[t] ?? t).join(', ');

  const typeInstructions = params.types
    .map((t) => `- Loại "${t}": ${TYPE_INSTRUCTIONS[t] ?? ''}`)
    .join('\n');

  const typeEnumStr = params.types.map((t) => `"${t}"`).join(' | ');
  const exampleOptions = params.types.some((t) => t.includes('choice'))
    ? '[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]'
    : 'null';

  const prompt = `Tạo ${params.count} câu hỏi ${subjectName} cho học sinh ${gradeName} về chủ đề "${params.topic}".

Yêu cầu:
- Độ khó: phân bố đều giữa các mức ${diffList}
- Loại câu hỏi: phân bố đều giữa các loại ${typeList}
${typeInstructions}
- Nội dung phải chính xác về mặt khoa học, phù hợp chương trình KHTN Việt Nam.
- Nếu có công thức, dùng KaTeX: $E = mc^2$ (inline) hoặc $$F = ma$$ (block).
- Mỗi câu hỏi cần có explanation (giải thích ngắn gọn đáp án đúng).
- skill_tags: 2-3 kỹ năng liên quan (tiếng Việt, kebab-case, VD: ["luc", "co-hoc"]).

Trả về JSON array, mỗi phần tử có dạng:
{
  "type": ${typeEnumStr},
  "content": "nội dung câu hỏi",
  "options": ${exampleOptions} hoặc null (nếu không phải trắc nghiệm),
  "correct_answer": ...,
  "difficulty": 1 | 2 | 3,
  "skill_tags": ["..."],
  "explanation": "..."
}

CHỈ trả về JSON array, không có text khác.`;

  const response = await provider.generateText(prompt, {
    systemPrompt: 'Bạn là chuyên gia soạn câu hỏi KHTN cho học sinh Việt Nam. CHỈ trả về JSON array.',
    maxTokens: 4096,
    temperature: 0.8,
  });

  const text = response.text;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI không trả về định dạng hợp lệ');

  const parsed = JSON.parse(jsonMatch[0]) as CreateQuestionData[];
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Không tạo được câu hỏi');

  return parsed;
}

export function getSubjects() {
  return Object.entries(SUBJECTS).map(([id, name]) => ({ id, name }));
}
