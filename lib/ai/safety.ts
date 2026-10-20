import 'server-only';

const MAX_INPUT_LENGTH = 500;

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\bprompt\s*injection\b/i,
  /\bDAN\b/,
  /\bjailbreak\b/i,
];

const CRISIS_KEYWORDS_VI = [
  'tự tử', 'tự hại', 'muốn chết', 'không muốn sống',
  'tự sát', 'cắt tay', 'uống thuốc chết',
  'bạo lực', 'bị đánh', 'bị bắt nạt',
  'xâm hại', 'sờ soạng', 'bị ép',
];

const PII_PATTERNS = [
  /0\d{9,10}/g,               // phone
  /[\w.-]+@[\w.-]+\.\w{2,}/g, // email
  /\b\d{9,12}\b/g,            // ID numbers
];

export const CRISIS_RESPONSE = `Mình hiểu em đang gặp khó khăn. Đây là thông tin hỗ trợ:
- Tổng đài bảo vệ trẻ em: 111 (miễn phí, 24/7)
- Đường dây tư vấn tâm lý: 1800 599 920

Hãy nói chuyện với thầy cô hoặc người lớn em tin tưởng. Em không cô đơn.`;

export type SafetyResult = { safe: true } | { safe: false; reason: string };
export type CrisisResult = { detected: false } | { detected: true; keyword: string };

export function filterInput(text: string): SafetyResult {
  if (!text || text.trim().length === 0) {
    return { safe: false, reason: 'empty_input' };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return { safe: false, reason: 'too_long' };
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'injection_detected' };
    }
  }
  return { safe: true };
}

export function detectCrisis(text: string): CrisisResult {
  const lower = text.toLowerCase();
  for (const kw of CRISIS_KEYWORDS_VI) {
    if (lower.includes(kw)) {
      return { detected: true, keyword: kw };
    }
  }
  return { detected: false };
}

export function filterOutput(text: string): string {
  let result = text;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[đã ẩn]');
  }
  return result;
}

export function sanitizeForAI(text: string): string {
  let result = text;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[***]');
  }
  return result.slice(0, 2000);
}
