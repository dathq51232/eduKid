// Tạo bài trình chiếu cho một tiết từ: nội dung bài học (ngân hàng nội dung của app) + các gợi ý thầy cô đã chọn.
// Mỗi hoạt động (Khởi động → Vận dụng): trang chia hoạt động (mốc phút) → trang hướng dẫn hoạt động đã chọn
// → (hoạt động thi đua: bảng thi đua tổ) → các trang nội dung bài học của đúng hoạt động đó.
// Trang hướng dẫn gắn công cụ cho màn hình của cô (Slide.tool): hẹn giờ thảo luận / gọi tên.
import { emptyDeck, uid, type Deck, type El, type Slide } from './types';
import { MASCOTS, badgeEl, boardPage, buildPlan, cardEl, dividerSlide, modeEl, planSlides, tietOf, type PhaseId } from './fromLesson';
import { planOf, type LessonIdea, type Pick } from '@/lib/plans/idea-bank';
import type { ContentLesson } from '@/lib/content/types';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥'];
const PER_PHASE: Record<string, number> = { kd: 2, kp: 3, lt: 4, vd: 2 };
const text = (x: number, y: number, w: number, h: number, t: string, size: number, color: string, o: Record<string, unknown> = {}): El =>
  ({ id: uid(), kind: 'text', x, y, w, h, rot: 0, text: t, size, color, font: 'baloo', align: 'center', bg: '', ...o } as El);

const norm = (t: string) => t.toLowerCase().replace(/\s*-\s*ti[eế]t\s*\d+.*$/i, '').replace(/\s+/g, ' ').trim();
const subjCode = (s: string) => (/to[aá]n/i.test(s) ? 'toan' : /vi[eệ]t/i.test(s) ? 'tieng-viet' : /anh/i.test(s) ? 'tieng-anh' : '');

/** Hoạt động cần công cụ gì trên lớp */
function toolsOf(x: LessonIdea) {
  const all = `${x.t} ${x.d} ${x.s.join(' ')}`;
  return {
    teams: /thi|đội|tiếp sức|bingo|thắng|rung chuông|cộng sao/i.test(all),
    timer: x.g || /thảo luận|đếm ngược|phút/i.test(all) ? Math.max(1, Math.round(x.m)) : 0,
    name: /mời|gọi|lên bảng|trình bày|chia sẻ|đóng vai/i.test(all),
  };
}

function guideSlide(n: number, phase: { n: string; c: string }, x: LessonIdea): Slide {
  const tl = toolsOf(x);
  const steps = x.s.map((s, j) => `${CIRCLED[j] ?? '•'} ${s}`).join('\n');
  return {
    id: uid(), bg: 'white', trans: 'fade', anims: [], phase: phase.n, mins: x.m,
    notes: [x.d, x.w && `Mục tiêu: ${x.w}`, x.p ? `Chuẩn bị trước ${x.p} phút.` : ''].filter(Boolean).join('\n'),
    tool: { timer: tl.timer || undefined, name: tl.name || undefined, teams: tl.teams || undefined, label: x.t },
    els: [
      cardEl(phase.c), badgeEl(n, phase.n, phase.c),
      text(120, 140, 1360, 110, x.t, 72, phase.c),
      text(140, 290, 980, 470, steps, 44, '#1f2937', { font: 'quick', align: 'left' }),
      text(1170, 300, 360, 90, `⏱ ${x.m} phút`, 44, '#ffffff', { bg: phase.c }),
      modeEl(x.g ? 'nhom-4' : 'ca-lop', phase.c),
    ],
  };
}

export async function deckFromIdeas(subject: string, title: string, pick: Pick, grade: number): Promise<Deck> {
  // tìm bài trong ngân hàng nội dung (tải khi cần — file rất lớn)
  const code = subjCode(subject);
  let lessonPlan: ReturnType<typeof buildPlan> | null = null;
  let lessonId: string | undefined;
  if (code) {
    const [c, k] = await Promise.all([import('@/lib/content'), import('@/lib/content/knowledge')]);
    const want = norm(title);
    const list = (c.CONTENT as ContentLesson[]).filter((l) => l.subject === code);
    const l = list.find((x) => norm(x.title) === want && (x as { grade?: number }).grade === grade) ?? list.find((x) => norm(x.title) === want)
      ?? list.find((x) => want.includes(norm(x.title).replace(/^bài\s*\d+[.:]?\s*/, '')) && norm(x.title).length > 6);
    if (l) {
      lessonId = l.id;
      lessonPlan = buildPlan(l, k.knowledgeFor(l.id), { mascot: MASCOTS[0].id, warmup: 'quiz', scene: 'class', seed: 1, tiet: tietOf(title) });
    }
  }
  const bo = { dividers: false, mascot: MASCOTS[0].src, math: code === 'toan' };
  const contentOf = (ph: PhaseId, max: number) => {
    if (!lessonPlan) return [];
    const keys = lessonPlan.cands.filter((c) => c.phase === ph).slice(0, max).map((c) => c.key);
    return keys.length ? planSlides(lessonPlan, new Set(keys), {}, bo) : [];
  };

  const deck = emptyDeck(title, grade);
  const cover = contentOf('bia', 1);
  if (cover.length) deck.slides = cover;
  else deck.slides[0].els.push(text(360, 600, 880, 70, `${subject} · ${pick.dur} phút`, 40, '#475569', { font: 'quick' }));
  deck.src = { lesson: lessonId ?? title };
  deck.mins = pick.dur;

  planOf(subject, title, pick).forEach((r, k) => {
    deck.slides.push(dividerSlide(r.phase.n, 'class', undefined, `${r.start}′ – ${r.end}′`));
    deck.slides.push(guideSlide(k + 1, r.phase, r.idea));
    if (toolsOf(r.idea).teams) deck.slides.push({ ...boardPage('class'), phase: r.phase.n });
    deck.slides.push(...contentOf(r.phase.k as PhaseId, PER_PHASE[r.phase.k] ?? 2).map((s) => ({ ...s, phase: r.phase.n })));
  });
  deck.slides.push(...contentOf('cc', 1));
  deck.slides.push(dividerSlide('Hẹn gặp lại', 'class', undefined, 'Cả lớp giỏi lắm!'));
  return deck;
}
