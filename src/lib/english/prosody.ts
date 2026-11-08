import type { CommunicationQuestion } from './communicationBank';

/**
 * Từ chức năng (Function words) trong tiếng Anh thường đọc lướt (weak form),
 * không nhận trọng âm câu trừ khi đứng cuối mệnh đề.
 */
const FUNCTION_WORDS = new Set([
  'i', 'you', 'we', 'they', 'he', 'she', 'it',
  'me', 'us', 'them', 'him', 'her',
  'my', 'your', 'our', 'their', 'his', 'its',
  'a', 'an', 'the',
  'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'onto', 'after', 'before', 'under', 'over',
  'and', 'or', 'but', 'so', 'that', 'because', 'as', 'if', 'when', 'while',
  'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
]);

export type ProsodyToken = {
  word: string;
  wordIndex: number;
  stressed: boolean;
  pauseAfter: boolean; // kết thúc cụm hơi (Action -> Reason)
  intonationAfter: 'rise' | 'fall' | null;
};

/**
 * Kiểm tra một từ có phải Content Word (nhận trọng âm câu) hay không.
 */
export function isStressedWord(rawWord: string): boolean {
  const clean = rawWord.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean) return false;
  // Trợ động từ phủ định (won't, don't, can't, isn't) luôn được nhấn mạnh trong câu nói
  if (clean.endsWith("n't")) return true;
  return !FUNCTION_WORDS.has(clean);
}

/**
 * Tạo câu có dấu phẩy prosodic giữa mệnh đề hành động (action) và mệnh đề mục đích (reason)
 * để bộ tổng hợp giọng đọc Neural tự động lên giọng nhẹ (↗) ở cuối action và nghỉ 1 nhịp ngắn (~220ms)
 * trước khi vào mệnh đề mục đích (to / so that...).
 */
export function toProsodicSentence(q: Pick<CommunicationQuestion, 'action' | 'reason' | 'sentence'>): string {
  const cleanAction = q.action.replace(/[.!?,;]+$/, '').trim();
  const cleanReason = q.reason.trim();
  if (!cleanAction || !cleanReason) return q.sentence;
  const withDot = /[.!?]$/.test(cleanReason) ? cleanReason : `${cleanReason}.`;
  return `${cleanAction}, ${withDot}`;
}

/**
 * Phân tích câu thành danh sách từ kèm thông tin trọng âm (stressed),
 * vị trí ngắt cụm hơi (pauseAfter) và hướng ngữ điệu (↗ / ↘).
 */
export function analyzeSentenceProsody(q: Pick<CommunicationQuestion, 'action' | 'reason' | 'sentence'>): ProsodyToken[] {
  const words = q.sentence.match(/[^\s]+/g) ?? [];
  const actionWordCount = (q.action.replace(/[.!?,;]+$/, '').trim().match(/[^\s]+/g) ?? []).length;

  return words.map((word, idx) => {
    const isActionEnd = actionWordCount > 0 && actionWordCount < words.length && idx === actionWordCount - 1;
    const isSentenceEnd = idx === words.length - 1;
    return {
      word,
      wordIndex: idx,
      stressed: isStressedWord(word),
      pauseAfter: isActionEnd,
      intonationAfter: isActionEnd ? 'rise' : isSentenceEnd ? 'fall' : null,
    };
  });
}
