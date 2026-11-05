// Tạo bài trình chiếu cho một tiết từ: nội dung bài học (ngân hàng nội dung của app) + các gợi ý thầy cô đã chọn.
// Mỗi hoạt động (Khởi động → Vận dụng): trang chia hoạt động (mốc phút) → trang hướng dẫn hoạt động đã chọn
// → (hoạt động thi đua: bảng thi đua tổ) → các trang nội dung bài học của đúng hoạt động đó.
// Trang hướng dẫn gắn công cụ cho màn hình của cô (Slide.tool): hẹn giờ thảo luận / gọi tên.
import { emptyDeck, uid, type Deck, type El, type Slide } from './types';
import { MASCOTS, badgeEl, boardPage, buildPlan, cardEl, dividerSlide, modeEl, planSlides, tietOf, type PhaseId } from './fromLesson';
import { planOf, type LessonIdea, type Pick } from '@/lib/plans/idea-bank';
import type { ContentLesson } from '@/lib/content/types';

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

// ===== Trang cho HỌC SINH theo từng ý tưởng (hướng dẫn của cô nằm trong ghi chú) =====
type Spec = { q: string; big?: string; cards?: string[]; reveal?: string };
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

function specsOf(x: LessonIdea, topic: string, math: boolean, minus: boolean, r: () => number): Spec[] {
  const T = x.t.toLowerCase();
  const toks = topic.replace(/[“”"]/g, '').split(/[\s,]+/).filter((t) => t && t.length <= 6).slice(0, 6);
  const big = toks.length ? toks.join('   ') : topic;
  const pair = () => { const a = 1 + Math.floor(r() * 6), b = 1 + Math.floor(r() * (minus ? a : 10 - a)); return minus ? [a + (a < b ? b : 0), Math.min(a, b)] as const : [a, Math.max(1, Math.min(b, 10 - a))] as const; };
  const op = minus ? '–' : '+', calc = (a: number, b: number) => (minus ? a - b : a + b);
  const many = (n: number, f: () => Spec) => Array.from({ length: n }, f);
  if (math) {
    if (/ngón tay/.test(T)) return many(3, () => { const [a, b] = pair(); return { q: 'Cô giơ mấy ngón tay? Nói phép tính!', big: `${'☝️'.repeat(a)}   ${op}   ${'☝️'.repeat(b)}`, reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/xe buýt/.test(T)) return many(2, () => { const [a, b] = pair(); return { q: minus ? `Trên xe có ${a} bạn. Đến bến, ${b} bạn xuống xe. Trên xe còn mấy bạn?` : `Trên xe có ${a} bạn. Đến bến, lên thêm ${b} bạn. Có tất cả mấy bạn?`, big: `🚌  ${'🧒'.repeat(a)}`, reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/domino/.test(T)) return many(2, () => { const [a, b] = pair(); return { q: 'Đếm chấm hai bên. Viết phép tính!', cards: ['●'.repeat(a), '●'.repeat(b)], reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/tia số/.test(T)) return many(2, () => { const [a, b] = pair(); return { q: `Đứng ở số ${a}, nhảy ${minus ? 'lùi' : 'thêm'} ${b} bước. Đến số mấy?`, cards: Array.from({ length: 11 }, (_, i) => String(i)), reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/tìm bạn/.test(T)) return [{ q: 'Tìm bạn để hai số cộng lại bằng 10!', cards: ['1', '9', '3', '7', '4', '6', '2', '8', '5'], reveal: '1 + 9 · 3 + 7 · 4 + 6 · 2 + 8 · 5 + 5' }];
    if (/đi chợ/.test(T)) return [{ q: 'Chọn mua 2 món. Con phải trả bao nhiêu hạt?', cards: ['🍎 2 hạt', '🍌 3 hạt', '🎈 4 hạt', '🧸 5 hạt', '✏️ 1 hạt'], reveal: 'VD: 🍎 + 🎈 → 2 + 4 = 6 hạt' }];
    if (/bingo/.test(T)) { const ps = many(6, () => { const [a, b] = pair(); return `${a} ${op} ${b}`; }); return [{ q: 'BINGO! Khoanh kết quả trên phiếu của con', cards: ps.map((p) => `${p} = ?`), reveal: ps.map((p) => { const [a, , b] = p.split(' '); return `${p} = ${calc(+a, +b)}`; }).join(' · ') }]; }
    if (/vẽ tranh/.test(T)) { const [a, b] = pair(); return [{ q: 'Vẽ tranh cho phép tính này rồi đố bạn bên cạnh!', big: `${a} ${op} ${b} = ?`, reveal: `${calc(a, b)}` }]; }
    if (/đếm/.test(T)) return [{ q: 'Đếm theo nhịp vỗ tay 👏 — nhanh dần!', big: '1  2  3  4  5  6  7  8  9  10' }];
    if (/bắn tên|rung chuông|bảng con|tiếp sức|ai nhanh|truyền/.test(T)) return many(4, () => { const [a, b] = pair(); return { q: /rung/.test(T) ? 'Rung chuông vàng! Ghi đáp án lên bảng con' : 'Ai nhanh nhất?', big: `${a} ${op} ${b} = ?`, reveal: `${calc(a, b)}` }; });
  }
  if (/hộp|truyền|vòng quay/.test(T)) return [{ q: `Đọc một tiếng có: ${toks.join(', ') || topic}`, big: /vòng/.test(T) ? '🎡' : '🎁', cards: toks }];
  if (/đọc to|đèn giao thông/.test(T)) return [{ q: /đèn/.test(T) ? '🟢 nhanh · 🟡 chậm · 🔴 im lặng' : 'Đọc theo tay cô: to – vừa – thì thầm', big }];
  if (/viết/.test(T)) return [{ q: 'Viết theo cô trên không ✍️', big }];
  if (/thám tử|săn|câu cá|tìm/.test(T)) return [{ q: `Tìm ${toks.length ? `tiếng có ${toks.join(', ')}` : 'những đồ vật đúng với bài học'}!`, big: /câu cá/.test(T) ? '🎣' : '🔍', cards: toks }];
  if (/bánh xe|ghép/.test(T)) return [{ q: 'Ghép âm đầu với vần — đọc tiếng mới!', big: '🎡', cards: toks }];
  if (/ô chữ/.test(T)) return [{ q: 'Giải ô chữ — tìm từ khoá!', cards: ['1', '2', '3', '4', '5'] }];
  if (/đoán nhân vật/.test(T)) return [{ q: 'Cô đang là nhân vật nào?', big: '🗣️ ❓' }];
  if (/phóng viên/.test(T)) return [{ q: 'Ai? · Ở đâu? · Làm gì?', big: '🎤' }];
  if (/đóng vai|nói theo tranh/.test(T)) return [{ q: 'Đóng vai và nói 1–2 câu với bạn', big: '🎭' }];
  if (/tranh|kể|rối/.test(T)) return [{ q: 'Chuyện gì xảy ra tiếp theo?', big: '🖼️ ➜ ❓' }];
  if (/đọc/.test(T)) return [{ q: 'Đọc nối tiếp theo dãy 📖', big }];
  if (/gõ cửa/.test(T)) return [{ q: 'Chào bạn! Bạn tên là gì? Bạn thích gì?', big: '🚪 ✊' }];
  if (/nên hay/.test(T)) return [{ q: 'Bạn làm vậy là nên hay không nên?', big: '😊   😢' }];
  if (/bàn tay/.test(T)) return [{ q: 'Mỗi ngón tay — một việc làm tốt', big: '🖐️' }];
  if (/ghế nóng/.test(T)) return [{ q: 'Nói một điều tốt về bạn!', big: '🪑 🔥' }];
  if (/cây/.test(T)) return [{ q: 'Con sẽ làm gì sau bài học hôm nay?', big: '🌳' }];
  if (/thẻ ra về/.test(T)) return [{ q: 'Hôm nay con hiểu bài thế nào?', big: '😊   😐   😢' }];
  if (/simon/.test(T)) return [{ q: 'Simon says…', big: '🙋' }];
  if (/flashcard/.test(T)) return [{ q: 'Read aloud!', big: '🃏' }];
  if (/chant/.test(T)) return [{ q: 'Clap and chant! 👏', big: '🎵' }];
  if (/hỏi – đáp/.test(T)) return [{ q: 'Ask and answer with your friend', big: '💬' }];
  if (/bố mẹ|thử thách/.test(T)) return [{ q: 'Nhiệm vụ về nhà', big: '🏠' }];
  if (/quan sát/.test(T)) return [{ q: 'Quan sát và nói điều con thấy', big: '👀' }];
  return [{ q: x.t, big: '⭐' }];
}

function studentSlide(sp: Spec, phase: { n: string; c: string }, n: number): Slide {
  const els: El[] = [cardEl(phase.c), badgeEl(n, phase.n, phase.c), text(120, 140, 1360, 150, sp.q, sp.q.length > 50 ? 48 : 60, '#1f2937')];
  if (sp.big) els.push(text(120, sp.cards?.length ? 300 : 330, 1360, 260, sp.big, sp.big.length > 24 ? 80 : 140, phase.c));
  const cards = sp.cards ?? [];
  if (cards.length) {
    const w = Math.min(260, Math.floor(1300 / cards.length) - 16), y = sp.big ? 570 : 380, x0 = 800 - (cards.length * (w + 16) - 16) / 2;
    cards.forEach((c, i) => els.push({ id: uid(), kind: 'shape', shape: 'round', x: x0 + i * (w + 16), y, w, h: 130, rot: 0, fill: '#ffffff', stroke: phase.c, sw: 6, text: c, color: '#1f2937', size: c.length > 6 ? 34 : 56 } as El));
  }
  const anims: Slide['anims'] = [];
  if (sp.reveal) {
    const r = text(200, 740, 1200, 100, sp.reveal, sp.reveal.length > 40 ? 40 : 60, '#ffffff', { bg: phase.c });
    els.push(r);
    anims.push({ id: uid(), el: r.id, fx: 'pop', start: 'click', delay: 0, dur: 0.6, sound: 'tada' });
  }
  return { id: uid(), bg: 'white', trans: 'fade', anims, els, notes: '', phase: phase.n };
}

/** các trang học sinh của một hoạt động; trang đầu mang ghi chú hướng dẫn + công cụ cho cô */
function activitySlides(n: number, phase: { n: string; c: string }, x: LessonIdea, topic: string, math: boolean, minus: boolean, r: () => number): Slide[] {
  const tl = toolsOf(x);
  const slides = specsOf(x, topic, math, minus, r).map((sp) => studentSlide(sp, phase, n));
  slides[0] = {
    ...slides[0], mins: x.m,
    notes: [`${x.t} (${x.m} phút${x.p ? `, chuẩn bị trước ${x.p} phút` : ''})`, ...x.s.map((s, j) => `${j + 1}. ${s}`), x.w && `Mục tiêu: ${x.w}`].filter(Boolean).join('\n'),
    tool: { timer: tl.timer || undefined, name: tl.name || undefined, teams: tl.teams || undefined, label: x.t },
  };
  return slides;
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

  const topic = title.replace(/^.*?:\s*/, '').replace(/\s*-\s*ti[eế]t\s*\d+.*$/i, '').trim();
  const minus = /tr[uừ]/i.test(title);
  const rand = rnd(title.length * 7 + pick.dur);
  planOf(subject, title, pick).forEach((r, k) => {
    deck.slides.push(dividerSlide(r.phase.n, 'class', undefined, `${r.start}′ – ${r.end}′`));
    deck.slides.push(...activitySlides(k + 1, r.phase, r.idea, topic, code === 'toan', minus, rand));
    if (toolsOf(r.idea).teams) deck.slides.push({ ...boardPage('class'), phase: r.phase.n });
    deck.slides.push(...contentOf(r.phase.k as PhaseId, PER_PHASE[r.phase.k] ?? 2).map((s) => ({ ...s, phase: r.phase.n })));
  });
  deck.slides.push(...contentOf('cc', 1));
  deck.slides.push(dividerSlide('Hẹn gặp lại', 'class', undefined, 'Cả lớp giỏi lắm!'));
  return deck;
}
