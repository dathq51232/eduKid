// Âm, vần, dấu thanh theo thứ tự bài trong sách Tiếng Việt 1 (Kết nối tri thức), tập 1.
// Dùng để kiểm tra câu hỏi không dùng âm/vần chưa học. Số = bài đầu tiên dạy âm/vần đó.

export const ONSETS: Record<string, number> = {
  b: 2, c: 3, d: 8, đ: 8, k: 11, h: 12, l: 12, ch: 14, kh: 14, m: 16, n: 16, g: 17, gi: 17,
  gh: 18, nh: 18, ng: 19, ngh: 19, r: 21, s: 21, t: 22, tr: 22, th: 23, ph: 26, qu: 26, v: 27, x: 27,
};

const R = (lesson: number, list: string) => list.split(' ').map((r) => [r, lesson] as const);
export const RIMES: Record<string, number> = Object.fromEntries([
  ...R(1, 'a'), ...R(4, 'e ê'), ...R(6, 'o'), ...R(7, 'ô'), ...R(9, 'ơ'), ...R(11, 'i'), ...R(13, 'u ư'),
  ...R(23, 'ia'), ...R(24, 'ua ưa'), ...R(28, 'y'),
  ...R(31, 'an ăn ân'), ...R(32, 'on ôn ơn'), ...R(33, 'en ên in un'), ...R(34, 'am ăm âm'),
  ...R(36, 'om ôm ơm'), ...R(37, 'em êm im um'), ...R(38, 'ai ay ây'), ...R(39, 'oi ôi ơi'),
  ...R(41, 'ui ưi'), ...R(42, 'ao eo'), ...R(43, 'au âu êu'), ...R(44, 'iu ưu'),
  ...R(46, 'ac ăc âc'), ...R(47, 'oc ôc uc ưc'), ...R(48, 'at ăt ât'), ...R(49, 'ot ôt ơt'),
  ...R(51, 'et êt it'), ...R(52, 'ut ưt'), ...R(53, 'ap ăp âp'), ...R(54, 'op ôp ơp'),
  ...R(56, 'ep êp ip up'), ...R(57, 'anh ênh inh'), ...R(58, 'ach êch ich'), ...R(59, 'ang ăng âng'),
  ...R(61, 'ong ông ung ưng'), ...R(62, 'iêc iên iêp'), ...R(63, 'iêng iêm yên'), ...R(64, 'iêt iêu yêu'),
  ...R(66, 'uôi uôm'), ...R(67, 'uôc uôt'), ...R(68, 'uôn uông'), ...R(69, 'ươi ươu'),
  ...R(71, 'ươc ươt'), ...R(72, 'ươm ươp'), ...R(73, 'ươn ương'), ...R(74, 'oa oe'),
  ...R(76, 'oan oăn oat oăt'), ...R(77, 'oai uê uy'), ...R(78, 'uân uât'), ...R(79, 'uyên uyêt'),
  // Các vần ít gặp học ở cuối Tập 1 / ôn tập (chưa gắn số bài cụ thể): chỉ dùng được ở đề ôn cuối kì trở đi
  ...R(90, 'oac oăc oang oăng oanh oach oen oet uynh uych uơ uya ooc oong'),
]);

// Dấu thanh: huyền (bài 2), sắc (3), hỏi (6), nặng (7), ngã (9)
export const TONES: Record<string, { name: string; lesson: number }> = {
  '̀': { name: 'huyền', lesson: 2 },
  '́': { name: 'sắc', lesson: 3 },
  '̉': { name: 'hỏi', lesson: 6 },
  '̣': { name: 'nặng', lesson: 7 },
  '̃': { name: 'ngã', lesson: 9 },
};

const ONSET_ORDER = Object.keys(ONSETS).sort((a, b) => b.length - a.length);

/** Phân tích một tiếng. Trả về lỗi (chuỗi) nếu dùng âm/vần/dấu chưa học đến bài `lessonNo`, ngược lại null. */
export function checkSyllable(word: string, lessonNo: number): string | null {
  const d = word.toLowerCase().normalize('NFD');
  const toneMarks = d.match(/[̣̀́̃̉]/g) ?? [];
  for (const t of toneMarks) {
    const tone = TONES[t];
    if (tone.lesson > lessonNo) return `dấu ${tone.name} (bài ${tone.lesson})`;
  }
  const base = d.replace(/[̣̀́̃̉]/g, '').normalize('NFC');
  if (!/^[a-zăâđêôơư]+$/.test(base)) return `ký tự lạ trong "${word}"`;

  const tries: [string, string][] = [];
  for (const on of ONSET_ORDER) if (base.startsWith(on)) tries.push([on, base.slice(on.length)]);
  tries.push(['', base]);

  let firstErr: string | null = null;
  for (const [on, rime0] of tries) {
    let rime = rime0;
    if (on === 'gi' && rime === '') rime = 'i'; // "gì"
    if (rime === '' && on) {
      // Một chữ cái/âm đứng riêng (vd đáp án "b", "ngh")
      if (ONSETS[on] <= lessonNo) return null;
      firstErr ??= `âm ${on} (bài ${ONSETS[on]})`;
      continue;
    }
    if (!(rime in RIMES)) continue;
    if (on && ONSETS[on] > lessonNo) { firstErr ??= `âm ${on} (bài ${ONSETS[on]})`; continue; }
    if (RIMES[rime] > lessonNo) { firstErr ??= `vần ${rime} (bài ${RIMES[rime]})`; continue; }
    return null;
  }
  return firstErr ?? `không phân tích được "${word}"`;
}

export type ToneName = 'ngang' | 'huyền' | 'sắc' | 'hỏi' | 'nặng' | 'ngã';
export type Syllable = { onset: string; rime: string; tone: ToneName; lesson: number };

/** Tách một tiếng thành âm đầu, vần, thanh; `lesson` = bài sớm nhất đã học đủ (null nếu không phân tích được). */
export function parseSyllable(word: string): Syllable | null {
  const d = word.toLowerCase().normalize('NFD');
  const marks = d.match(/[̣̀́̃̉]/g) ?? [];
  if (marks.length > 1) return null;
  const mark = marks[0];
  const tone: ToneName = mark ? (TONES[mark].name as ToneName) : 'ngang';
  const toneLesson = mark ? TONES[mark].lesson : 1;
  const base = d.replace(/[̣̀́̃̉]/g, '').normalize('NFC');
  if (!/^[a-zăâđêôơư]+$/.test(base)) return null;
  const tries: [string, string][] = [];
  for (const on of ONSET_ORDER) if (base.startsWith(on)) tries.push([on, base.slice(on.length)]);
  tries.push(['', base]);
  for (const [on, rime0] of tries) {
    const rime = on === 'gi' && rime0 === '' ? 'i' : rime0;
    if (!(rime in RIMES)) continue;
    return { onset: on, rime, tone, lesson: Math.max(on ? ONSETS[on] : 1, RIMES[rime], toneLesson) };
  }
  return null;
}
