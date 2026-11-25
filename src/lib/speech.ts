// Đọc đề bằng giọng của trình duyệt (Web Speech API).
//
// Vì sao trước đây đọc sai: chỉ đặt utterance.lang = 'vi-VN' mà không chọn giọng. Trên Windows + Chrome
// không có sẵn giọng tiếng Việt nên trình duyệt dùng giọng tiếng Anh mặc định -> đọc tiếng Việt méo mó.
// Danh sách giọng còn được tải bất đồng bộ, lần bấm đầu tiên thường chưa có giọng nào.
//
// Cách làm ở đây:
//   1. Chờ danh sách giọng tải xong, chọn đúng giọng vi-VN (ưu tiên giọng tự nhiên/online).
//   2. Mọi môn: tự nhận đoạn tiếng Anh → giọng Anh, phần còn lại → giọng Việt (ký hiệu + − = > < đổi thành chữ).
//      - Môn Tiếng Anh: chuỗi từ không dấu là tiếng Anh (trừ vài từ Việt không dấu hay gặp).
//      - Môn khác / không rõ môn: chỉ coi là tiếng Anh khi có dấu hiệu rõ (trong ngoặc kép, hoặc từ không thể là
//        tiếng Việt như "hello", "school", hoặc từ tiếng Anh thông dụng như "my", "the"), để tên riêng không dấu
//        ("Lan", "Minh Anh"), đơn vị ("cm", "kg"), số La Mã, chữ cái biến số (a, b) vẫn đọc giọng Việt.
//   3. Số đứng giữa hai từ tiếng Anh đọc theo tiếng Anh ("Unit 4" → "unit four").
//   4. Máy không có giọng Việt thì KHÔNG đọc bằng giọng Anh, mà báo cho người dùng cách cài.

import type { SubjectCode } from './types';

export type SpeechLang = 'vi' | 'en';
export type Segment = { text: string; lang: SpeechLang };
export type VoiceStatus = { supported: boolean; vi: boolean; en: boolean; viName?: string };

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve(now);
  if (!voicesPromise) {
    voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve(s.getVoices());
      };
      s.addEventListener('voiceschanged', finish, { once: true });
      // Một số trình duyệt không bắn sự kiện: thử lại vài lần rồi thôi
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (s.getVoices().length || tries > 20) {
          clearInterval(poll);
          finish();
        }
      }, 100);
    }).then((v: SpeechSynthesisVoice[]) => {
      if (!v.length) voicesPromise = null; // cho phép thử lại lần sau
      return v;
    });
    return voicesPromise;
  }
  return voicesPromise;
}

function score(v: SpeechSynthesisVoice, lang: SpeechLang): number {
  const code = v.lang.toLowerCase().replace('_', '-');
  if (!code.startsWith(lang)) return -1;
  let s = 1;
  if (lang === 'vi' && code === 'vi-vn') s += 1;
  if (lang === 'en' && (code === 'en-us' || code === 'en-gb')) s += 1;
  const name = v.name.toLowerCase();
  if (name.includes('natural') || name.includes('online')) s += 4; // Edge: HoaiMy, NamMinh
  if (name.includes('google')) s += 3;
  if (name.includes('linh') || name.includes('hoaimy') || name.includes('an ')) s += 1;
  return s;
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: SpeechLang): SpeechSynthesisVoice | undefined {
  return voices
    .map((v) => ({ v, s: score(v, lang) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0]?.v;
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  if (typeof window === 'undefined') return { supported: false, vi: false, en: false };
  const voices = synth() ? await loadVoices() : [];
  const vi = pickVoice(voices, 'vi');
  // Luôn hỗ trợ đọc tiếng Việt & tiếng Anh nhờ tích hợp sẵn /api/tts làm fallback trực tuyến
  return {
    supported: true,
    vi: true,
    en: true,
    viName: vi?.name ?? 'Giọng đọc trực tuyến EduChain',
  };
}

// ---------------------------------------------------------------------------
// Chuẩn bị văn bản
// ---------------------------------------------------------------------------

// Đổi ký hiệu toán sang lời đọc tiếng Việt: "3 + 6 = ..." -> "3 cộng 6 bằng mấy".
export function mathToVietnamese(text: string): string {
  return text
    .replace(/(\d)\s*[x×]\s*(?=\d)/g, '$1 nhân ')
    .replace(/(\d)\s*[:÷]\s*(?=\d)/g, '$1 chia ')
    .replace(/=\s*(\?|\.{2,}|…|_+)/g, ' bằng mấy')
    .replace(/(\d)\s*\+\s*/g, '$1 cộng ')
    .replace(/(\d)\s*[-−–]\s*(?=\d)/g, '$1 trừ ')
    .replace(/\s*>=\s*/g, ' lớn hơn hoặc bằng ')
    .replace(/\s*<=\s*/g, ' bé hơn hoặc bằng ')
    .replace(/\s*>\s*/g, ' lớn hơn ')
    .replace(/\s*<\s*/g, ' bé hơn ')
    .replace(/\s*=\s*/g, ' bằng ')
    .replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét')
    .replace(/(\.{3,}|…|_{2,}|(?:_\s){2,}_?)/g, ' chỗ trống ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Bỏ emoji/hình: giọng đọc sẽ đọc tên hình bằng tiếng Anh ("red apple") nên phải loại ra.
export function stripPictographs(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F\u20E3]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function viText(text: string): string {
  return mathToVietnamese(stripPictographs(text).replace(/["“”']/g, ''));
}

/** Âm tiết tiếng Việt viết không dấu (phụ âm đầu + vần + phụ âm cuối): "lan", "minh", "nguyen"… */
const VI_SYLLABLE = /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnpqrstvx])?[aeiouy]{1,3}(ch|ng|nh|[cmnpt])?$/;
/** Từ tiếng Anh thông dụng mà viết ra trông giống âm tiết tiếng Việt ("my", "the", "to"…) */
const EN_COMMON = new Set(['a', 'an', 'the', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'he', 'she', 'it', 'we', 'they', 'you', 'is', 'am', 'are', 'was', 'be', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'and', 'or', 'not', 'no', 'yes', 'this', 'that', 'these', 'those', 'what', 'who', 'how', 'can', 'do', 'go', 'see', 'say', 'hi', 'bye', 'cat', 'dog', 'pen', 'book', 'big', 'pig', 'hen', 'ten', 'one', 'two', 'six', 'nine', 'red', 'tea', 'sun', 'cup', 'man', 'boy', 'toy', 'key', 'kite', 'happy', 'mum', 'dad']);
/** Đơn vị đo, viết tắt hay gặp trong đề Toán: đọc theo tiếng Việt */
const VI_UNITS = new Set(['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 'mg', 'ml', 'l', 'ha', 'dam', 'hm', 'yen', 'ta', 'tan', 'cm2', 'dm2', 'm2', 'km2', 'cm3', 'dm3', 'm3']);
const ROMAN = /^[IVXLCDM]+$/;

/** Từ mượn quen thuộc, trong câu tiếng Việt đọc theo giọng Việt */
const VI_LOAN = new Set(['video', 'robot', 'radio', 'pizza', 'piano', 'taxi', 'sofa', 'karaoke', 'email', 'internet', 'website', 'laptop', 'game', 'online', 'ok', 'tivi', 'ti-vi', 'com-pa', 'ki-lo-gam', 'ki-lo-met', 'xang-ti-met', 'met']);
/** Âm đầu / chữ ghép tiếng Việt đứng riêng (bài học vần: "ng", "ngh", "gh", "tr"…) */
const VI_ONSET = /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnpqrstvx])$/;

/**
 * Ở môn không phải Tiếng Anh, phân loại một từ không dấu:
 * 'en' = chắc chắn tiếng Anh (không thể là âm tiết tiếng Việt: "hello", "school"…);
 * 'amb' = vừa là từ tiếng Anh thông dụng vừa đọc được như tiếng Việt ("an", "to", "can", "my") → theo từ bên cạnh;
 * 'vi' = còn lại (tên riêng không dấu, âm / vần, đơn vị, số La Mã, viết tắt, từ mượn quen thuộc).
 */
function classifyStrict(tok: string): 'en' | 'vi' | 'amb' {
  const w = tok.toLowerCase().replace(/’/g, "'");
  if (w.length < 2 || VI_UNITS.has(w) || VI_LOAN.has(w) || ROMAN.test(tok) || VI_ONSET.test(w)) return 'vi';
  if (tok === tok.toUpperCase()) return 'vi'; // viết tắt / chữ in hoa (HCN, ABCDEF) đọc từng chữ theo giọng Việt
  if (!/[aeiouy]/.test(w)) return 'vi'; // không có nguyên âm: đọc từng chữ cái
  // tên phiên âm có gạch nối (Ma-ri-a, Yu-ki, An-na): mỗi phần là một âm tiết Việt
  if (w.includes('-') && w.split('-').every((x) => VI_SYLLABLE.test(x))) return 'vi';
  const viLike = VI_SYLLABLE.test(w) && !/[fjwz']/.test(w);
  if (viLike) return EN_COMMON.has(w) ? 'amb' : 'vi';
  return 'en';
}

// Từ tiếng Việt không dấu hay gặp: không coi là tiếng Anh khi đứng một mình
const VI_NO_MARK = new Set(['con', 'cho', 'ba', 'me', 'bo', 'ca', 'ga', 'to', 'nho', 'xa', 'xe', 'hoa', 'em', 'anh', 'chi', 'co', 'thi', 'va', 'la', 'hay', 'bao', 'nhieu', 'tim', 'hai', 'mai', 'tranh', 'xanh', 'trong', 'hong', 'den', 'nau', 'tim', 'mau', 'sai', 'dung', 'cau']);
const ASCII_WORD = /^[A-Za-z][A-Za-z'’-]*$/;

function englishBlankToSpeech(t: string) {
  return t.replace(/(?:_\s?){1,}/g, ' blank ').replace(/\s{2,}/g, ' ').trim();
}

// Tách đoạn tiếng Anh (trong ngoặc kép hoặc chuỗi từ không dấu) khỏi phần tiếng Việt.
// strict = môn không phải Tiếng Anh: chỉ nhận từ tiếng Anh rõ ràng (xem classifyStrict).
export function splitEnglishVietnamese(input: string, strict = false): Segment[] {
  // strict: bỏ ngoặc kép (để "hello" vẫn nhận ra là một từ tiếng Anh); không strict: đổi 'x' thành "x" để tách theo ngoặc
  const text = strict ? stripPictographs(input).replace(/["“”]|(^|\s)'|'(?=\s|[.,!?;:]|$)/g, '$1 ') : stripPictographs(input).replace(/'([^']+)'/g, '"$1"');
  type Run = { text: string; lang: SpeechLang; quoted: boolean; words: number };
  const runs: Run[] = [];

  // Tiếng Việt / Toán hay dùng ngoặc kép cho từ tiếng Việt ("học sinh") → ở chế độ strict không tách theo ngoặc kép
  text.split(strict ? /(?!)/ : /["“”]/).forEach((part, i) => {
    if (i % 2 === 1) {
      runs.push({ text: part, lang: 'en', quoted: true, words: 99 });
      return;
    }
    const tokens = part.split(/(\s+|[(),.!?;:])/).filter((t) => t !== '');
    // dấu câu, ký hiệu đứng riêng (·, –, /, …) không phải từ: không quyết định ngôn ngữ
    const isWord = (t: string) => /\S/.test(t) && !/^[\p{P}\p{S}]+$/u.test(t);
    // số (và số có dấu chấm, phẩy) không quyết định ngôn ngữ: đi theo đoạn đang đọc
    const isNumber = (t: string) => /^\d+([.,]\d+)*$/.test(t);
    const wordCount = tokens.filter(isWord).length;
    // ngôn ngữ từng từ (null = số / dấu câu: đi theo đoạn đang đọc)
    const langs: (SpeechLang | 'amb' | null)[] = tokens.map((tok) => {
      if (!isWord(tok) || isNumber(tok)) return null;
      const ascii = ASCII_WORD.test(tok) || /^_+$/.test(tok);
      if (strict) return ascii && !/^_+$/.test(tok) ? classifyStrict(tok) : 'vi';
      return ascii && !(VI_NO_MARK.has(tok.toLowerCase()) && wordCount > 1) ? 'en' : 'vi';
    });
    // từ lưỡng nghĩa ("my", "an", "to") đứng cạnh từ tiếng Anh chắc chắn thì là tiếng Anh, còn lại là tiếng Việt
    const near = (i: number, step: number) => { for (let j = i + step; j >= 0 && j < langs.length; j += step) { const l = langs[j]; if (l === 'en' || l === 'vi') return l; } return null; };
    langs.forEach((l, i) => { if (l === 'amb') langs[i] = near(i, 1) === 'en' || near(i, -1) === 'en' ? 'en' : 'vi'; });
    let cur: Run | null = null;
    for (let k = 0; k < tokens.length; k++) {
      const tok = tokens[k];
      const lang = langs[k] as SpeechLang | null;
      if (lang && cur && cur.lang !== lang) {
        runs.push(cur);
        cur = null;
      }
      if (!cur) cur = { text: '', lang: lang ?? 'vi', quoted: false, words: 0 };
      if (lang) cur.words++;
      cur.text += tok;
    }
    if (cur) runs.push(cur);
  });

  // Một từ không dấu đứng lẻ giữa hai đoạn tiếng Việt (vd. "màu xanh dương") là tiếng Việt.
  // (Ở chế độ strict từ đó đã được xét là tiếng Anh rõ ràng nên giữ nguyên, trừ từ thông dụng ngắn như "to", "me".)
  // Một từ không dấu đứng đầu / cuối câu, sát đoạn tiếng Việt, đọc được như âm tiết Việt (vd. "Nghe và chọn") cũng là tiếng Việt.
  runs.forEach((r, i) => {
    if (r.lang !== 'en' || r.quoted || r.words !== 1) return;
    const prev = runs[i - 1]?.lang, next = runs[i + 1]?.lang;
    const w = r.text.replace(/[^A-Za-z']/g, '').toLowerCase();
    const viLike = VI_SYLLABLE.test(w) && !EN_COMMON.has(w);
    if (prev === 'vi' && next === 'vi') { if (!strict || viLike || (EN_COMMON.has(w) && VI_SYLLABLE.test(w))) r.lang = 'vi'; }
    else if ((prev === 'vi' || next === 'vi') && viLike) r.lang = 'vi';
  });

  const out: Segment[] = [];
  for (const r of runs) {
    const clean = r.lang === 'en' ? englishBlankToSpeech(r.text.replace(/[()]/g, ' ')) : viText(r.text.replace(/[()]/g, ' '));
    if (!clean.replace(/[\s\p{P}\p{S}]/gu, '')) continue;
    const last = out[out.length - 1];
    if (last && last.lang === r.lang) last.text += ' ' + clean;
    else out.push({ text: clean, lang: r.lang });
  }
  return out;
}

function merge(segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.lang === s.lang) last.text += ' ' + s.text;
    else out.push({ ...s });
  }
  return out;
}

/**
 * Chữ cái / âm ghép đứng riêng trong bài Tiếng Việt → đọc theo ÂM như sách Tiếng Việt 1 (Kết nối tri thức),
 * không đọc tên chữ cái kiểu "xê", "bê", "giê hát": c → "cờ", gh → "gờ kép", ngh → "ngờ kép", k → "ca"…
 * Chỉ đổi khi chữ đứng một mình ("Điền c hay k", đáp án "ng" / "ngh"); tiếng có vần ("bê", "cá") giữ nguyên.
 */
const VI_LETTER_SOUND: Record<string, string> = {
  ngh: 'ngờ kép', gh: 'gờ kép', ng: 'ngờ', nh: 'nhờ', ch: 'chờ', gi: 'di', kh: 'khờ', ph: 'phờ', qu: 'quờ', th: 'thờ', tr: 'trờ',
  b: 'bờ', c: 'cờ', d: 'dờ', đ: 'đờ', g: 'gờ', h: 'hờ', k: 'ca', l: 'lờ', m: 'mờ', n: 'nờ', p: 'pờ', q: 'cu', r: 'rờ', s: 'sờ', t: 'tờ', v: 'vờ', x: 'xờ',
  ă: 'á', â: 'ớ', y: 'i dài',
};
const VI_LETTER_RE = /(?<![\p{L}\p{N}])(ngh|gh|ng|nh|ch|gi|kh|ph|qu|th|tr|[bcdđghklmnpqrstvxăây])(?![\p{L}\p{N}])/giu;
export function letterSounds(text: string): string {
  return text.replace(VI_LETTER_RE, (m) => VI_LETTER_SOUND[m.toLowerCase()] ?? m);
}

// Chia đoạn đọc theo môn học ('auto' = không rõ môn: lời nhắn, tiêu đề, nội dung chung).
export function segmentsFor(text: string, subject: SubjectCode | 'auto'): Segment[] {
  const segs = splitEnglishVietnamese(text, subject !== 'tieng-anh');
  // Tiếng Việt: chữ cái đứng riêng đọc theo âm (Toán giữ nguyên vì a, b, c là tên biến / nhãn)
  return subject === 'tieng-viet' ? segs.map((g) => (g.lang === 'vi' ? { ...g, text: letterSounds(g.text) } : g)) : segs;
}

/** Đọc một đoạn bất kỳ, tự chọn giọng Anh / Việt theo từng đoạn. */
export function speakText(text: string, opts: { subject?: SubjectCode | 'auto'; rate?: number; onStart?: () => void; onEnd?: () => void } = {}): Promise<SpeakResult> {
  const { subject = 'auto', ...rest } = opts;
  return speakSegments(segmentsFor(text, subject), rest);
}

// Đề + các lựa chọn (giúp bé lớp 1 chưa đọc thạo vẫn làm được bài).
export function questionSegments(prompt: string, options: string[], subject: SubjectCode | 'auto'): Segment[] {
  const segs = segmentsFor(prompt, subject);
  // Lựa chọn chỉ là hình (vd ⭐⭐⭐) thì không đọc danh sách lựa chọn
  if (options.length < 2 || options.some((o) => !stripPictographs(o).replace(/[\s.,?!]/g, ''))) return segs;
  const last = segs[segs.length - 1];
  if (last && !/[.!?:]$/.test(last.text)) last.text += '.';

  const isEnglish = subject === 'tieng-anh';
  const list: Segment[] = [{ text: isEnglish ? 'The options are:' : 'Các đáp án là:', lang: isEnglish ? 'en' : 'vi' }];
  options.forEach((o, i) => {
    if (i === options.length - 1) list.push({ text: isEnglish ? 'or' : 'hay là', lang: isEnglish ? 'en' : 'vi' });
    const parts = segmentsFor(o.replace(/[.!?]+\s*$/, ''), subject);
    if (parts.length && i < options.length - 2) parts[parts.length - 1].text += ',';
    list.push(...parts);
  });
  return merge([...segs, ...list]);
}

// Đọc trọn một câu hỏi: đề + (nếu có) các dòng điền ô (ô trống đọc là "mấy"), nhận định Đúng/Sai
// và danh sách lựa chọn. Dùng chung cho trang Làm bài và Phòng thi lớp.
export function speakableQuestion(
  q: { prompt: string; type: string; options?: string[]; blanks?: string[]; statements?: string[] },
  subject: SubjectCode | 'auto',
  prompt: string = q.prompt,
): Segment[] {
  const readOptions = ['single_choice', 'true_false', 'multiple_choice'].includes(q.type) ? (q.options ?? []) : [];
  const extra = [
    ...(q.blanks ?? []).map((line) => line.replace(/\{\}/g, ' mấy ')),
    // nhãn ý Đúng/Sai: Tiếng Việt đọc "Ý 1, Ý 2…" (chữ a, b, c đứng riêng sẽ bị đọc theo âm "bờ", "cờ")
    ...(q.statements ?? []).map((t, i) => (subject === 'tieng-viet' ? `Ý ${i + 1}: ${t}` : `${String.fromCharCode(97 + i)}: ${t}`)),
  ];
  const text = [prompt, ...extra].map((t) => (/[.!?:]$/.test(t.trim()) ? t : `${t}.`)).join(' ');
  return questionSegments(text, readOptions, subject);
}

// ---------------------------------------------------------------------------
// Phát âm
// ---------------------------------------------------------------------------

// Chrome cắt ngang câu dài hơn ~15 giây: chia nhỏ theo câu.
function chunk(text: string, max = 160): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = '';
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

let session = 0;
let activeAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  session++;
  if (activeAudio) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  synth()?.cancel();
}

export type SpeakResult = { ok: true } | { ok: false; reason: 'unsupported' | 'no_vi_voice' };

async function speakViaCloudTts(
  segments: Segment[],
  my: number,
  opts: { rate?: number; onStart?: () => void; onEnd?: () => void },
): Promise<SpeakResult> {
  const merged = merge(segments).flatMap((seg) =>
    chunk(seg.text, 480).map((text) => ({ text, lang: seg.lang })),
  );
  if (merged.length === 0) {
    opts.onEnd?.();
    return { ok: true };
  }

  // Tạo sẵn danh sách Audio và preload đoạn tiếp theo để không bị ngắt quãng
  const audios = merged.map((seg) => {
    const a = new Audio(`/api/tts?lang=${seg.lang}&q=${encodeURIComponent(seg.text)}`);
    a.preload = 'auto';
    a.playbackRate = opts.rate ?? (seg.lang === 'en' ? 0.92 : 1.0);
    return a;
  });

  let started = false;
  for (let i = 0; i < audios.length; i++) {
    if (my !== session) return { ok: true };
    const audio = audios[i];
    if (audios[i + 1]) audios[i + 1].load();
    activeAudio = audio;

    if (!started) {
      started = true;
      opts.onStart?.();
    }

    const ok = await new Promise<boolean>((resolve) => {
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    });

    if (activeAudio === audio) activeAudio = null;
    if (my !== session) return { ok: true };
    if (!ok) {
      opts.onEnd?.();
      return { ok: false, reason: 'no_vi_voice' };
    }
  }

  if (my === session) opts.onEnd?.();
  return { ok: true };
}

export async function speakSegments(
  segments: Segment[],
  opts: { rate?: number; onStart?: () => void; onEnd?: () => void } = {},
): Promise<SpeakResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  const s = synth();
  const voices = s ? await loadVoices() : [];
  const vi = pickVoice(voices, 'vi');
  const en = pickVoice(voices, 'en');
  const needVi = segments.some((x) => x.lang === 'vi');
  const needEn = segments.some((x) => x.lang === 'en');

  stopSpeaking();
  const my = session;

  // Nếu máy chưa cài giọng tiếng Việt (ví dụ Windows + Chrome) hoặc không có Web Speech API:
  // tự động phát qua /api/tts mà không bắt phụ huynh/học sinh cài đặt thủ công.
  if (!s || (needVi && !vi) || (needEn && !en)) {
    return speakViaCloudTts(segments, my, opts);
  }

  // Chrome đôi khi nuốt lệnh speak() gọi ngay sau cancel(): đợi một nhịp
  await new Promise((r) => setTimeout(r, 60));
  if (my !== session) return { ok: true };
  if (s.paused) s.resume();

  const items = segments.flatMap((seg) => chunk(seg.text).map((text) => ({ text, lang: seg.lang })));
  if (items.length === 0) {
    opts.onEnd?.();
    return { ok: true };
  }

  let fallbackTriggered = false;
  items.forEach((item, i) => {
    const u = new SpeechSynthesisUtterance(item.text);
    const voice = item.lang === 'vi' ? vi : en ?? undefined;
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (item.lang === 'vi' ? 'vi-VN' : 'en-US');
    u.rate = opts.rate ?? (item.lang === 'en' ? 0.8 : 0.9);
    u.pitch = 1.05;
    if (i === 0) u.onstart = () => my === session && opts.onStart?.();
    if (i === items.length - 1) {
      u.onend = () => my === session && !fallbackTriggered && opts.onEnd?.();
    }
    u.onerror = (ev) => {
      if (my !== session || fallbackTriggered) return;
      if (ev.error === 'canceled' || ev.error === 'interrupted') return;
      fallbackTriggered = true;
      s.cancel();
      void speakViaCloudTts(segments, my, opts);
    };
    s.speak(u);
  });
  return { ok: true };
}
