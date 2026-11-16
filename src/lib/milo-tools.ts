// “Đồ nghề của Milo”: tên riêng của từng dạng câu hỏi + lời Milo nói sau khi em trả lời.
// Quy tắc: docs/BAN-SAC-EDUCHAINKIDS.md (mục 3 – giọng Milo, mục 5 – đồ nghề).
import type { QuestionType } from '@/lib/types';

/** code: mã hình Fluent Emoji 3D (cùng bộ hình với thư viện bài giảng), tải từ CDN jsDelivr — CSP đã cho phép */
export type MiloTool = { icon: string; code: string; name: string; hint: string };
export const toolImg = (code: string) => `https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/${code}.webp`;

export const MILO_TOOLS: Record<QuestionType, MiloTool> = {
  single_choice: { icon: '🔍', code: '1f50d', name: 'Kính lúp', hint: 'Soi kỹ rồi chọn 1 đáp án đúng' },
  multiple_choice: { icon: '🎈', code: '1f388', name: 'Chùm bóng', hint: 'Chọn tất cả đáp án đúng' },
  true_false: { icon: '🔦', code: '1f526', name: 'Đèn pin', hint: 'Soi xem đúng hay sai' },
  true_false_table: { icon: '🔦', code: '1f526', name: 'Đèn pin', hint: 'Soi từng ý: Đúng hay Sai' },
  fill_blank: { icon: '✏️', code: '270f-fe0f', name: 'Bút chì', hint: 'Điền vào ô trống' },
  fill_blanks: { icon: '✏️', code: '270f-fe0f', name: 'Bút chì', hint: 'Điền vào các ô trống' },
  matching: { icon: '🧵', code: '1f9f5', name: 'Sợi chỉ', hint: 'Nối mỗi ô bên trái với ô hợp bên phải' },
  ordering: { icon: '🪜', code: '1fa9c', name: 'Bậc thang', hint: 'Xếp theo thứ tự đúng' },
  grouping: { icon: '🎨', code: '1f3a8', name: 'Hộp màu', hint: 'Chạm từng thẻ rồi chạm vào hộp đúng' },
  pair_grid: { icon: '🧩', code: '1f9e9', name: 'Mảnh ghép', hint: 'Tìm từng cặp mảnh ghép hợp nhau' },
};

export const toolFor = (t: QuestionType): MiloTool | undefined => MILO_TOOLS[t];

type Kind = 'correct' | 'wrong' | 'timeout';

/** Khen cụ thể theo việc em vừa làm (không khen chung chung) */
const PRAISE: Record<QuestionType, string[]> = {
  single_choice: ['Chính xác! Em soi rất kỹ đó.', 'Đúng rồi! Em chọn chuẩn luôn.', 'Tuyệt! Em tìm ra đáp án đúng rồi.'],
  multiple_choice: ['Đúng rồi! Em tìm đủ tất cả đáp án.', 'Chính xác! Không sót đáp án nào.'],
  true_false: ['Đúng rồi! Em soi chuẩn lắm.', 'Chính xác! Em nhận ra ngay.'],
  true_false_table: ['Đúng hết! Em soi từng ý rất cẩn thận.', 'Chính xác! Ý nào em cũng soi đúng.'],
  fill_blank: ['Đúng rồi! Em điền chính xác.', 'Chuẩn luôn! Em nhớ bài tốt lắm.'],
  fill_blanks: ['Đúng hết các ô rồi! Em cẩn thận lắm.', 'Chính xác! Ô nào em cũng điền đúng.'],
  matching: ['Đúng rồi! Em nối khớp hết các cặp.', 'Tuyệt! Sợi chỉ nào cũng nối đúng chỗ.'],
  ordering: ['Đúng rồi! Em xếp đúng thứ tự.', 'Chính xác! Bậc nào cũng đúng chỗ.'],
  grouping: ['Đúng rồi! Thẻ nào cũng vào đúng hộp.', 'Tuyệt! Em phân loại rất chuẩn.'],
  pair_grid: ['Đúng rồi! Em ghép khớp hết các mảnh.', 'Tuyệt! Mảnh nào cũng tìm được bạn của nó.'],
};
/** Sai thì gợi, không chê */
const RETRY: Record<QuestionType, string> = {
  single_choice: 'Gần đúng rồi! Em xem lời giải của Milo nhé.',
  multiple_choice: 'Chưa đủ đáp án đúng, không sao! Mình cùng xem lại nhé.',
  true_false: 'Chưa đúng, không sao cả! Em đọc lại lời giải nhé.',
  true_false_table: 'Có ý soi chưa đúng, không sao! Mình xem lại từng ý nhé.',
  fill_blank: 'Gần đúng rồi! Em xem cách làm của Milo nhé.',
  fill_blanks: 'Có ô chưa đúng, không sao! Mình xem lại nhé.',
  matching: 'Có cặp nối chưa khớp, không sao! Em xem lời giải nhé.',
  ordering: 'Thứ tự chưa đúng chỗ, không sao! Mình xem lại nhé.',
  grouping: 'Có thẻ vào nhầm hộp, không sao! Em xem lời giải nhé.',
  pair_grid: 'Có cặp ghép chưa khớp, không sao! Mình xem lại nhé.',
};

/** Lời Milo sau khi chấm; seed (vd. số thứ tự câu) để đổi câu khen cho đỡ lặp mà không ngẫu nhiên mỗi lần vẽ lại */
export function miloLine(kind: Kind, type: QuestionType, seed = 0): string {
  if (kind === 'timeout') return 'Câu này hết thời gian rồi. Mình xem lời giải nhé!';
  if (kind === 'wrong') return RETRY[type] ?? 'Chưa đúng, không sao cả! Mình cùng xem lại nhé.';
  const list = PRAISE[type] ?? ['Đúng rồi! Em làm tốt lắm.'];
  return list[Math.abs(seed) % list.length];
}

/** Lời ngắn trên đường đi của Milo (MiloTrail) */
export const trailLine = (kind: Kind, seed = 0) =>
  kind === 'correct' ? ['Chính xác!', 'Chuẩn luôn!', 'Tuyệt!'][Math.abs(seed) % 3] : 'Không sao, mình thử tiếp nhé!';
