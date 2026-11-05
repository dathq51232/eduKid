// Tạo bài trình chiếu từ các gợi ý thầy cô đã chọn cho một tiết (ngân hàng ý tưởng, src/lib/plans/idea-bank.ts).
// Mỗi hoạt động: 1 trang chia hoạt động (kèm mốc phút) + 1 trang nội dung (tên hoạt động, các bước, thời gian, hình thức).
// Mô tả và mục tiêu hoạt động ghi vào ghi chú của cô (notes). Mở trong trình soạn để chỉnh tiếp như bài thường.
import { emptyDeck, uid, type Deck, type El, type Slide } from './types';
import { badgeEl, cardEl, dividerSlide, modeEl } from './fromLesson';
import { planOf, type Pick } from '@/lib/plans/idea-bank';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥'];
const text = (x: number, y: number, w: number, h: number, t: string, size: number, color: string, o: Partial<El> = {}): El =>
  ({ id: uid(), kind: 'text', x, y, w, h, rot: 0, text: t, size, color, font: 'baloo', align: 'center', bg: '', ...o } as El);

export function deckFromIdeas(subject: string, title: string, pick: Pick, grade: number): Deck {
  const deck = emptyDeck(title, grade);
  deck.slides[0].els.push(text(360, 600, 880, 70, `${subject} · ${pick.dur} phút`, 40, '#475569', { font: 'quick' } as Partial<El>));
  deck.src = { lesson: title };
  planOf(subject, title, pick).forEach((r, k) => {
    const c = r.phase.c, idea = r.idea;
    deck.slides.push({ ...dividerSlide(r.phase.n, 'class', undefined, `${r.start}′ – ${r.end}′`), mins: 0 });
    const steps = idea.s.map((s, j) => `${CIRCLED[j] ?? '•'} ${s}`).join('\n');
    const slide: Slide = {
      id: uid(), bg: 'white', trans: 'fade', anims: [], phase: r.phase.n, mins: idea.m,
      notes: [idea.d, idea.w && `Mục tiêu: ${idea.w}`, idea.p ? `Chuẩn bị trước ${idea.p} phút.` : ''].filter(Boolean).join('\n'),
      els: [
        cardEl(c),
        badgeEl(k + 1, r.phase.n, c),
        text(120, 140, 1360, 110, idea.t, 72, c),
        text(140, 290, 980, 470, steps, 44, '#1f2937', { font: 'quick', align: 'left' } as Partial<El>),
        text(1170, 300, 360, 90, `⏱ ${idea.m} phút`, 44, '#ffffff', { bg: c } as Partial<El>),
        modeEl(idea.g ? 'nhom-2' : 'ca-lop', c),
      ],
    };
    deck.slides.push(slide);
  });
  deck.slides.push(dividerSlide('Hẹn gặp lại', 'class', undefined, 'Cả lớp giỏi lắm!'));
  return deck;
}
