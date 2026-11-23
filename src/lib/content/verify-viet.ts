// Kiểm CHÍNH TẢ & TRÌNH BÀY tiếng Việt bằng luật cố định (không cần mạng, không đoán):
//  1. Mã chữ: chữ phải ở dạng dựng sẵn (NFC) — chữ ghép từ dấu rời nhìn giống nhưng máy coi là chữ khác (tìm kiếm, chấm điền sai).
//  2. Âm tiết hợp lệ: tách phụ âm đầu + vần, vần phải có trong bảng vần tiếng Việt ("nghành", "quyêt" → lỗi).
//  3. Luật c/k/q, g/gh, ng/ngh: k, gh, ngh đứng trước e, ê, i (y); c, g, ng đứng trước các âm khác.
//  4. Dấu thanh: tối đa một dấu, đặt đúng chữ cái (chấp nhận cả kiểu cũ "hòa" lẫn kiểu mới "hoà").
//  5. Lỗi hay gặp: danh sách cặp sai → đúng ("sử lý" → "xử lý").
//  6. Trình bày: hai khoảng trắng liền, khoảng trắng trước dấu câu, thiếu khoảng trắng sau dấu phẩy, lặp hư từ ("là là").
// Chỉ xét các tiếng CÓ chữ riêng của tiếng Việt (đ ă â ê ô ơ ư hoặc có dấu thanh): từ tiếng Anh, mã, tên nước ngoài viết
// không dấu được bỏ qua để không báo nhầm. Dùng chung cho script `check:tieng-viet` và có thể gọi ở trang Quản trị.

const TONE_MARKS = '̣̀́̃̉'; // huyền, sắc, ngã, hỏi, nặng
const TONE_RE = /[̣̀́̃̉]/g;
const VN_SPECIAL = /[đăâêôơự̀́̃̉]/;

/** Bảng vần tiếng Việt (không dấu thanh) — đủ các vần dùng trong sách tiểu học và văn bản thông thường. */
const RIMES = new Set(
  (
    'a ac ach ai am an ang anh ao ap at au ay ' +
    'ă ăc ăm ăn ăng ăp ăt ' +
    'â âc âm ân âng âp ât âu ây ' +
    'e ec em en eng eo ep et ' +
    'ê êch êm ên ênh êp êt êu ' +
    'i ia ich iêc iêm iên iêng iêp iêt iêu im in inh ip it iu ' +
    'o oa oac oach oai oam oan oang oanh oao oap oat oay oăc oăm oăn oăng oăt oe oem oen oeo oet ' +
    'oc oi om on ong ooc oong op ot ' +
    'ô ôc ôi ôm ôn ông ôp ôt ' +
    'ơ ơi ơm ơn ơp ơt ' +
    'u ua uân uâng uât uây uc uê uêch uênh ui um un ung uô uôc uôi uôm uôn uông uôt up ut ' +
    'uơ uy uya uych uyên uyêt uynh uyp uyt uyu ' +
    'ư ưa ưc ưi ưm ưn ưng ươc ươi ươm ươn ương ươp ươt ươu ưt ưu ' +
    'y yêm yên yêng yêt yêu'
  ).split(' '),
);
// Phụ âm đầu — "" là tiếng bắt đầu bằng nguyên âm. gi, qu xử lí riêng (chữ i / u dùng chung với vần).
const ONSETS = ['ngh', 'ng', 'gh', 'gi', 'ch', 'kh', 'nh', 'ph', 'th', 'tr', 'qu', 'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x', ''];
const FRONT = /^[eêiy]/; // trước các nguyên âm này phải viết k / gh / ngh
// p đứng đầu (pin, Pác Bó, pích-ních) có trong ONSETS. Từ mượn giữ nguyên chữ nước ngoài:
const LOAN_WORDS = new Set(['café']);

/** Bỏ dấu thanh, giữ dấu chữ (ă â ê ô ơ ư đ) */
export const stripTone = (s: string) => s.normalize('NFD').replace(TONE_RE, '').normalize('NFC');
const toneOf = (s: string) => s.normalize('NFD').match(TONE_RE) ?? [];

type Split = { onset: string; rime: string };
/** Mọi cách tách hợp lệ (phụ âm đầu + vần có trong bảng, đúng luật c/k, g/gh, ng/ngh). Rỗng = tiếng không hợp lệ. */
function validSplits(base: string): Split[] {
  const out: Split[] = [];
  for (const on of ONSETS) {
    if (!base.startsWith(on)) continue;
    const r = base.slice(on.length);
    if (on === 'gi') { // "gì" = gi + i, "giếng" = gi + iêng, "gìn" = gi + in
      if (RIMES.has(r) || RIMES.has('i' + r)) out.push({ onset: on, rime: r });
      continue;
    }
    if (on === 'qu') { // "quả" = qu + (o)a, "quê" = qu + (u)ê, "quyển" = qu + (u)yên
      if (r && (RIMES.has(r) || RIMES.has('o' + r) || RIMES.has('u' + r))) out.push({ onset: on, rime: r });
      continue;
    }
    if (!RIMES.has(r)) continue;
    if ((on === 'k' || on === 'gh' || on === 'ngh') && !FRONT.test(r)) continue;
    if ((on === 'c' || on === 'g' || on === 'ng') && /^[eêi]/.test(r)) continue;
    out.push({ onset: on, rime: r });
  }
  return out;
}

/** Chữ cái được phép mang dấu thanh trong vần (theo cả kiểu cũ và kiểu mới). Trả về chỉ số trong vần. */
function tonePositions(rime: string): number[] {
  const vowels = [...rime].map((c, i) => (/[aăâeêioôơuưy]/.test(c) ? i : -1)).filter((i) => i >= 0);
  if (!vowels.length) return [];
  if (vowels.length === 1) return vowels;
  // có nguyên âm mang dấu chữ: dấu thanh đặt ở đó (ươ → ơ; ưu, ưa, ưi → ư)
  const marked = vowels.filter((i) => /[ăâêôơư]/.test(rime[i]));
  if (marked.length) return [marked[marked.length - 1]];
  const closed = vowels[vowels.length - 1] < rime.length - 1; // vần có âm cuối
  if (closed) return [vowels[vowels.length - 1]]; // hoàng, tuyết, khuynh → nguyên âm cuối
  if (vowels.length === 3) return [vowels[1]]; // oai, uya, uyu, oeo → giữa
  // hai nguyên âm, vần mở: ia, ua, ai, ao, au, ay, oi, ui… → chữ đầu; oa, oe, uy, uê → chấp nhận cả hai kiểu
  if (/^(oa|oe|uy)$/.test(rime)) return [vowels[0], vowels[1]];
  return [vowels[0]];
}

/** Lỗi của một tiếng (đã bỏ chữ hoa), null nếu đúng. */
export function syllableIssue(word: string): string | null {
  const w = word.toLowerCase();
  if ([...w].length < 2 || LOAN_WORDS.has(w)) return null; // chữ cái đứng riêng ("âm đ"), từ mượn giữ nguyên dạng
  if (!VN_SPECIAL.test(w.normalize('NFC')) && !VN_SPECIAL.test(w.normalize('NFD'))) return null; // không có chữ riêng tiếng Việt → bỏ qua (tiếng Anh, mã…)
  const tones = toneOf(w);
  if (tones.length > 1) return `"${word}" có ${tones.length} dấu thanh`;
  const base = stripTone(w);
  const splits = validSplits(base);
  // mảnh âm / vần đang dạy ("vần iê", "kiê" khi tra từ điển): không dấu thanh và là phần đầu của một vần có thật
  if (!splits.length && !tones.length && [...RIMES].some((r) => r.length > 1 && ONSETS.some((on) => base === on + r.slice(0, base.length - on.length) && base.length > on.length))) return null;
  if (!splits.length) {
    // gợi ý lỗi c/k, g/gh, ng/ngh khi vần vẫn hợp lệ
    const m = base.match(/^(ngh|ng|gh|g|c|k)(.*)$/);
    if (m && RIMES.has(m[2])) {
      const want = FRONT.test(m[2]) ? ({ c: 'k', g: 'gh', ng: 'ngh' } as Record<string, string>)[m[1]] : ({ k: 'c', gh: 'g', ngh: 'ng' } as Record<string, string>)[m[1]];
      if (want) return `"${word}": viết "${want}" thay cho "${m[1]}" (luật k/gh/ngh đứng trước e, ê, i)`;
    }
    return `"${word}" không phải tiếng Việt viết đúng (vần lạ)`;
  }
  if (!tones.length) return null;
  // vị trí dấu thanh: tìm chữ cái đang mang dấu trong tiếng
  const nfd = [...w.normalize('NFD')];
  let letter = -1, seenLetters = 0;
  for (const ch of nfd) {
    if (TONE_MARKS.includes(ch)) { letter = seenLetters - 1; break; }
    if (!/[̀-ͯ]/.test(ch)) seenLetters++;
  }
  const ok = splits.some(({ onset, rime }) => {
    const pos = tonePositions(rime).map((i) => i + [...onset].length);
    // "gì", "gìn": i của gi mang dấu khi vần không có nguyên âm riêng
    if (onset === 'gi' && !/[aăâeêoôơuưy]/.test(rime)) pos.push(1);
    return pos.includes(letter);
  });
  return ok ? null : `"${word}": dấu thanh đặt sai chữ`;
}

/** Lỗi chính tả hay gặp: [viết sai, viết đúng] — so khớp nguyên cụm từ, không phân biệt hoa thường. */
export const COMMON_MISSPELLINGS: [string, string][] = [
  ['sử lý', 'xử lý'], ['sử lí', 'xử lí'], ['chuẩn đoán', 'chẩn đoán'], ['xuất xắc', 'xuất sắc'], ['sắc xảo', 'sắc sảo'],
  ['xinh nhật', 'sinh nhật'], ['sinh đẹp', 'xinh đẹp'], ['chia xẻ', 'chia sẻ'], ['sẳn sàng', 'sẵn sàng'], ['cũng cố', 'củng cố'],
  ['dữ gìn', 'giữ gìn'], ['giúp đở', 'giúp đỡ'], ['suy nghỉ', 'suy nghĩ'], ['rạng rở', 'rạng rỡ'], ['bổng nhiên', 'bỗng nhiên'],
  ['đẹp đẻ', 'đẹp đẽ'], ['lẩn lộn', 'lẫn lộn'], ['khuyếch khích', 'khuyến khích'], ['sơ xuất', 'sơ suất'], ['năng nỗ', 'năng nổ'],
  ['chân trọng', 'trân trọng'], ['trau chuốc', 'trau chuốt'], ['chau chuốt', 'trau chuốt'], ['sát nhập', 'sáp nhập'],
  ['dành giật', 'giành giật'], ['tranh dành', 'tranh giành'], ['giành dụm', 'dành dụm'], ['dản dị', 'giản dị'], ['dở dàng', 'dở dang'],
  ['xử dụng', 'sử dụng'], ['dục giã', 'giục giã'], ['bàng hoàn', 'bàng hoàng'], ['ngỡ ngàn', 'ngỡ ngàng'], ['xung xướng', 'sung sướng'],
  ['sum xuê', 'sum suê'], ['xâu xắc', 'sâu sắc'], ['sâu xắc', 'sâu sắc'], ['dỗ dành', 'dỗ dành'], ['vẻ tranh', 'vẽ tranh'],
  ['kĩ năng sống', 'kĩ năng sống'], ['tham quang', 'tham quan'], ['thăm quan', 'tham quan'], ['yếu điểm', 'điểm yếu'],
  ['bàng quan', 'bàng quan'], ['lãng mạng', 'lãng mạn'], ['chính sát', 'chính xác'], ['xuông xẻ', 'suôn sẻ'], ['dữ dội', 'dữ dội'],
].filter(([a, b]) => a !== b) as [string, string][];

const FUNCTION_WORDS = 'là và của có các những được thì mà với cho trong một này đó để khi';
const REPEAT_RE = new RegExp(`(^|[^\\p{L}])(${FUNCTION_WORDS.split(' ').join('|')}) \\2(?=$|[^\\p{L}])`, 'iu');

export type VietIssue = { kind: 'mã chữ' | 'chính tả' | 'trình bày'; msg: string };

/** Mọi lỗi tiếng Việt trong một đoạn chữ. `prose`: đoạn văn (đề, nhận xét, lời giải, kiến thức) — bật thêm luật trình bày câu. */
export function vietIssues(text: string | undefined | null, prose = true): VietIssue[] {
  if (!text) return [];
  const out: VietIssue[] = [];
  if (text !== text.normalize('NFC')) out.push({ kind: 'mã chữ', msg: 'có chữ ghép từ dấu rời (chưa ở dạng dựng sẵn NFC)' });
  const t = text.normalize('NFC');
  const seen = new Set<string>();
  for (const m of t.matchAll(/\p{L}+/gu)) {
    const w = m[0];
    // tiếng trong tên phiên âm có gạch nối (Mát-xđa, Pa-xtơ, Ô-lim-pích) giữ cách viết của sách — không xét vần
    if (t[m.index! - 1] === '-' || t[m.index! + w.length] === '-') continue;
    if (seen.has(w)) continue;
    seen.add(w);
    const e = syllableIssue(w);
    if (e) out.push({ kind: 'chính tả', msg: e });
  }
  const low = t.toLowerCase();
  for (const [bad, good] of COMMON_MISSPELLINGS) {
    const i = low.indexOf(bad);
    if (i >= 0 && !/\p{L}/u.test(low[i - 1] ?? '') && !/\p{L}/u.test(low[i + bad.length] ?? '')) out.push({ kind: 'chính tả', msg: `"${t.slice(i, i + bad.length)}" → viết đúng: "${good}"` });
  }
  if (prose) {
    if (/\S {2,}\S/.test(t)) out.push({ kind: 'trình bày', msg: 'có hai khoảng trắng liền nhau' });
    const sp = t.match(/\p{L} +[,;.](?=\s|$)/u);
    if (sp) out.push({ kind: 'trình bày', msg: `khoảng trắng trước dấu câu: "${sp[0]}"` });
    const nc = t.match(/\p{L}[,;](?=\p{L})/u);
    if (nc) out.push({ kind: 'trình bày', msg: `thiếu khoảng trắng sau dấu câu: "${t.slice(nc.index!, nc.index! + 4)}"` });
    const rp = t.match(REPEAT_RE);
    if (rp) out.push({ kind: 'trình bày', msg: `lặp từ: "${rp[0].trim()}"` });
  }
  return out;
}

/** Tự kiểm: bộ luật phải bắt được lỗi cố ý cài và không báo nhầm câu đúng. Trả về danh sách lỗi của chính bộ kiểm tra. */
export function vietSelfTestErrors(): string[] {
  const errs: string[] = [];
  const good = [
    'Nghỉ hè, em về quê thăm ông bà ngoại.', 'Gia đình em gìn giữ giếng nước ở quê.', 'Quyển vở của Khuê có hình con khỉ.',
    'Hoà và Thuý khoẻ mạnh.', 'Hòa và Thúy khỏe mạnh.', 'Ngoằn ngoèo, khuỷu tay, quả xoài, chuyện, tuyết, khuya, nguệch ngoạc.',
    'Gì thế? Kìa, ghế ghi chữ "ký".', 'Bông hoa hồng thơm ngát; chim hót líu lo.', 'Hello, Milo! 7 + 5 = 12, 2,5 kg.',
    'Xanh xanh, đo đỏ, từ từ, ngày ngày.', 'Thuở xưa, người ta gọi là ươm tơ.', 'Bâng khuâng, huýt sáo, quây quần, oai vệ.',
    'Thành phố Mát-xđa, Lu-i Pa-xtơ, Ô-lim-pích, hang Pác Bó; âm đ; vần iê, uyê.',
  ];
  for (const s of good) {
    const is = vietIssues(s);
    if (is.length) errs.push(`[tự kiểm tiếng Việt] báo nhầm câu đúng "${s}": ${is.map((i) => i.msg).join('; ')}`);
  }
  const bad: [string, RegExp][] = [
    ['Em yêu nghành giáo dục.', /nghành/],
    ['Con kà trống gáy.', /"c" thay cho "k"|kà/],
    ['Bé ngỉ hè.', /ngh/],
    ['Em gé thăm bà.', /gh/],
    ['Bà muà cho em cái áo.', /dấu thanh đặt sai/],
    ['Tíên lên!', /dấu thanh đặt sai/],
    ['Em cần sử lý bài toán.', /xử lý/],
    ['Hôm nay là  thứ hai.', /hai khoảng trắng/],
    ['Em học bài , rồi đi ngủ.', /trước dấu câu/],
    ['Mẹ là là cô giáo.', /lặp từ/],
    ['Bé vè tranh.', /NFC/],
    ['Trời mưâ to.', /vần lạ/],
  ];
  for (const [s, re] of bad) {
    const msgs = vietIssues(s).map((i) => i.msg).join('; ');
    if (!re.test(msgs)) errs.push(`[tự kiểm tiếng Việt] không bắt được lỗi trong "${s}" (nhận: ${msgs || 'không lỗi'})`);
  }
  return errs;
}
