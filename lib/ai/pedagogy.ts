export type Intent =
  | 'answer_request'
  | 'check_answer'
  | 'unknown'
  | 'exercise'
  | 'experiment'
  | 'definition'
  | 'attempt'
  | 'concept';

export type SupportLevel = 0 | 1 | 2 | 3;

const ANSWER_REQUEST = /đáp án|làm hộ|giải giúp|giải hộ|cho em (kết quả|lời giải)|cho mình (kết quả|lời giải)|cho (em|mình) biết luôn|viết sẵn/i;
const CHECK_ANSWER = /đúng không|có đúng không|sai không|kiểm tra giúp|kiểm tra (đáp án|bài)|em làm vậy (có )?đúng/i;
const UNKNOWN = /không biết|chưa biết|chịu|khó quá|không hiểu|chưa hiểu|không nhớ|chưa nhớ|hướng dẫn (em|mình)|giúp (em|mình) với/i;
const EXPERIMENT = /thí nghiệm|quan sát|hiện tượng|dự đoán|mô hình 3d|stem/i;
const EXERCISE = /bài tập|bài toán|tính|giải bài|tìm x|\d+\s*[+\-*/×=]|=/i;
const DEFINITION = /là gì|là sao|định nghĩa|khái niệm|nghĩa là gì/i;

export function classifyIntent(message: string, previousAssistantAskedQuestion = false): Intent {
  const text = message.trim();
  if (ANSWER_REQUEST.test(text)) return 'answer_request';
  if (CHECK_ANSWER.test(text)) return 'check_answer';
  if (UNKNOWN.test(text)) return 'unknown';
  if (EXPERIMENT.test(text)) return 'experiment';
  if (EXERCISE.test(text)) return 'exercise';
  if (DEFINITION.test(text)) return 'definition';
  if (previousAssistantAskedQuestion && text.length <= 200 && !text.includes('?')) return 'attempt';
  return 'concept';
}

export function supportLevelFromHistory(
  history: { role: string; content: string }[],
): SupportLevel {
  const assistantTurns = history.filter((m) => m.role === 'assistant').length;
  const unknownCount = history
    .filter((m) => m.role === 'user')
    .filter((m) => classifyIntent(m.content) === 'unknown').length;

  if (assistantTurns === 0) return 0;
  if (unknownCount >= 2 || assistantTurns >= 4) return 3;
  if (unknownCount >= 1 || assistantTurns >= 2) return 2;
  return 1;
}

const LEVEL_GUIDE: Record<SupportLevel, string> = {
  0: 'Mức 0 (lần đầu): không nêu kết luận, không khẳng định hay phủ định đáp án, không mở đầu bằng "Đúng rồi" hoặc "Sai rồi". Chỉ đặt đúng một câu hỏi gợi mở ngắn để học sinh tự suy ra (ví dụ hỏi về một đặc điểm cần kiểm tra).',
  1: 'Mức 1 (gợi ý nhẹ): nhắc lại kiến thức nền liên quan rồi đặt một câu hỏi định hướng. Không đưa đáp án.',
  2: 'Mức 2 (gợi ý cụ thể): đưa một ví dụ tương tự (không phải bài gốc) và một câu hỏi để học sinh áp dụng vào bài của mình.',
  3: 'Mức 3 (giải thích từng bước): giải thích ngắn gọn từng bước với minh họa; sau đó yêu cầu học sinh tự diễn đạt lại kết luận bằng lời của mình.',
};

const INTENT_GUIDE: Record<Intent, string> = {
  answer_request:
    'Học sinh yêu cầu đáp án. Không đưa đáp án hoàn chỉnh ngay. Hỏi học sinh đã thử cách nào và đang vướng ở đâu, rồi áp dụng mức hỗ trợ bên dưới.',
  check_answer:
    'Học sinh muốn kiểm tra đáp án. Hỏi học sinh đã chọn đáp án đó dựa trên căn cứ nào. Sau đó mới kiểm tra và giải thích ngắn gọn.',
  unknown:
    'Học sinh chưa biết hoặc cần giúp đỡ. Hỗ trợ theo mức bên dưới, không chuyển ngay sang đáp án.',
  exercise:
    'Bài tập hoặc bài toán: hướng dẫn một bước đầu tiên và yêu cầu học sinh thử thực hiện bước tiếp theo. Không giải hết cả bài.',
  experiment:
    'Câu hỏi thực hành hoặc thí nghiệm: yêu cầu học sinh dự đoán kết quả trước khi giải thích hiện tượng.',
  definition:
    'Yêu cầu định nghĩa hoặc giải thích: có thể đưa lời giải thích ngắn (2-3 câu) rồi đặt một câu hỏi để học sinh vận dụng.',
  attempt:
    'Học sinh vừa trả lời. Nếu đúng, ghi nhận cụ thể phần suy luận đúng và hỏi vì sao. Nếu chưa đúng, chỉ ra điểm cần xem lại một cách tích cực, đưa gợi ý để tự sửa, không phán xét và không đưa đáp án ngay.',
  concept:
    'Câu hỏi kiến thức: gợi mở trước, xác nhận và giải thích sau khi học sinh đã nghĩ.',
};

export function buildPedagogyDirective(intent: Intent, level: SupportLevel): string {
  return `
Hướng dẫn sư phạm cho lượt trả lời này:
- ${INTENT_GUIDE[intent]}
- ${LEVEL_GUIDE[level]}
- Đây là quy tắc ưu tiên cao nhất, áp dụng cho cả chế độ đồng hành: không đưa câu trả lời trực tiếp cho câu hỏi kiến thức ở lượt đầu, dù câu hỏi ngắn hay đơn giản.
- Mỗi lượt chỉ đặt một câu hỏi gợi mở trọng tâm. Không hỏi nhiều câu cùng lúc.
- Không lặp lại câu hỏi hoặc gợi ý đã nêu trong lịch sử hội thoại; nếu học sinh chưa tiến bộ, đổi cách tiếp cận thay vì quay về bước đầu.
- Khen cụ thể vào cách suy luận hoặc nỗ lực của học sinh, không khen chung chung.
- Khuyến khích học sinh giải thích bằng lời của mình, không yêu cầu chép lại câu trả lời của AI.
- Khi học sinh đã hiểu, gợi ý vận dụng vào tình huống mới hoặc mô hình 3D, thí nghiệm ảo, hoạt động STEM trên nền tảng.
- Nếu có nội dung an toàn khẩn cấp, cung cấp thông tin an toàn trước, không trì hoãn bằng câu hỏi gợi mở.`;
}
