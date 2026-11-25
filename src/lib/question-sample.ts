// Câu mẫu đọc được ngoài trang làm bài (thư viện /hoc, giáo án): đề + lựa chọn + đáp án + lời giải.
// Bỏ câu cần hình / âm thanh và câu điền nhiều ô ("{}"). Không phụ thuộc máy chủ (script kiểm tra cũng dùng được).
import type { ContentQuestion } from '@/lib/content/types';
import { shuffle } from '@/lib/shuffle';

export type Sample = { prompt: string; options: string[]; answer: string; explanation: string; multi: boolean };

/** Câu không đọc được nếu thiếu hình / âm thanh của trang làm bài thì bỏ qua */
const NEEDS_MEDIA = /(hình (bên|dưới|vẽ)|tranh|nghe|bức ảnh|ảnh bên|quan sát hình)/i;

/** Lựa chọn trong dữ liệu thường để đáp án đúng đứng đầu (trang làm bài tự đảo) → đảo cố định theo câu; giữ nguyên Đúng/Sai và > < = */
const mix = (opts: string[], seed: string) => (opts.length > 2 && !opts.every((o) => ['>', '<', '='].includes(o)) ? shuffle(opts, seed) : opts);

export function sampleOf(q: ContentQuestion): Sample | null {
  // "{}" = câu điền nhiều ô (chỉ hiện đúng trên trang làm bài)
  if (NEEDS_MEDIA.test(q.prompt) || q.prompt.includes('{}') || q.prompt.length > 400) return null;
  const k = q.key as Record<string, unknown>;
  if ((q.type === 'single_choice' || q.type === 'true_false') && typeof k.correct === 'string') {
    return { prompt: q.prompt, options: q.type === 'true_false' && !q.options.length ? ['Đúng', 'Sai'] : mix(q.options, q.prompt), answer: k.correct, explanation: q.explanation, multi: false };
  }
  if (q.type === 'multiple_choice' && Array.isArray(k.correct)) {
    return { prompt: q.prompt, options: mix(q.options, q.prompt), answer: (k.correct as string[]).join('; '), explanation: q.explanation, multi: true };
  }
  if (q.type === 'fill_blank' && Array.isArray(k.accepted) && typeof k.accepted[0] === 'string') {
    return { prompt: q.prompt, options: [], answer: k.accepted[0], explanation: q.explanation, multi: false };
  }
  return null;
}

