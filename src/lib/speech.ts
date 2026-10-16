// Đọc đề bằng giọng của trình duyệt (Web Speech API).
//
// Vì sao trước đây đọc sai: chỉ đặt utterance.lang = 'vi-VN' mà không chọn giọng. Trên Windows + Chrome
// không có sẵn giọng tiếng Việt nên trình duyệt dùng giọng tiếng Anh mặc định -> đọc tiếng Việt méo mó.
// Danh sách giọng còn được tải bất đồng bộ, lần bấm đầu tiên thường chưa có giọng nào.
//
// Cách làm ở đây:
//   1. Chờ danh sách giọng tải xong, chọn đúng giọng vi-VN (ưu tiên giọng tự nhiên/online).
//   2. Toán, Tiếng Việt: đọc toàn bộ bằng giọng Việt; ký hiệu + − = > < được đổi thành chữ.
//   3. Tiếng Anh: phần tiếng Anh đọc bằng giọng Anh, phần hướng dẫn tiếng Việt đọc bằng giọng Việt.
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
  if (!synth()) return { supported: false, vi: false, en: false };
  const voices = await loadVoices();
  const vi = pickVoice(voices, 'vi');
  return { supported: true, vi: Boolean(vi), en: Boolean(pickVoice(voices, 'en')), viName: vi?.name };
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

// Từ tiếng Việt không dấu hay gặp: không coi là tiếng Anh khi đứng một mình
const VI_NO_MARK = new Set(['con', 'cho', 'ba', 'me', 'bo', 'ca', 'ga', 'to', 'nho', 'xa', 'xe', 'hoa', 'em', 'anh', 'chi', 'co', 'thi', 'va', 'la', 'hay', 'bao', 'nhieu', 'tim', 'hai', 'mai', 'tranh', 'xanh', 'trong', 'hong', 'den', 'nau', 'tim', 'mau', 'sai', 'dung', 'cau']);
const ASCII_WORD = /^[A-Za-z][A-Za-z'’-]*$/;

function englishBlankToSpeech(t: string) {
  return t.replace(/(?:_\s?){1,}/g, ' blank ').replace(/\s{2,}/g, ' ').trim();
}

// Tiếng Anh: tách đoạn tiếng Anh (trong ngoặc kép hoặc chuỗi từ không dấu) khỏi phần tiếng Việt.
export function splitEnglishVietnamese(input: string): Segment[] {
  const text = stripPictographs(input).replace(/'([^']+)'/g, '"$1"');
  type Run = { text: string; lang: SpeechLang; quoted: boolean; words: number };
  const runs: Run[] = [];

  text.split(/["“”]/).forEach((part, i) => {
    if (i % 2 === 1) {
      runs.push({ text: part, lang: 'en', quoted: true, words: 99 });
      return;
    }
    const tokens = part.split(/(\s+|[(),.!?;:])/).filter((t) => t !== '');
    const isWord = (t: string) => /\S/.test(t) && !/^[(),.!?;:]$/.test(t);
    const wordCount = tokens.filter(isWord).length;
    let cur: Run | null = null;
    for (const tok of tokens) {
      let lang: SpeechLang | null = null;
      if (isWord(tok)) {
        const ascii = ASCII_WORD.test(tok) || /^_+$/.test(tok);
        lang = ascii && !(VI_NO_MARK.has(tok.toLowerCase()) && wordCount > 1) ? 'en' : 'vi';
      }
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

  // Một từ không dấu đứng lẻ giữa hai đoạn tiếng Việt (vd. "màu xanh dương") là tiếng Việt
  runs.forEach((r, i) => {
    if (r.lang === 'en' && !r.quoted && r.words === 1 && runs[i - 1]?.lang === 'vi' && runs[i + 1]?.lang === 'vi') r.lang = 'vi';
  });

  const out: Segment[] = [];
  for (const r of runs) {
    const clean = r.lang === 'en' ? englishBlankToSpeech(r.text.replace(/[()]/g, ' ')) : viText(r.text.replace(/[()]/g, ' '));
    if (!clean.replace(/[\s.,!?;:]/g, '')) continue;
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

// Chia đoạn đọc theo môn học.
export function segmentsFor(text: string, subject: SubjectCode): Segment[] {
  if (subject === 'tieng-anh') return splitEnglishVietnamese(text);
  const t = viText(text);
  return t ? [{ text: t, lang: 'vi' }] : [];
}

// Đề + các lựa chọn (giúp bé lớp 1 chưa đọc thạo vẫn làm được bài).
export function questionSegments(prompt: string, options: string[], subject: SubjectCode): Segment[] {
  const segs = segmentsFor(prompt, subject);
  // Lựa chọn chỉ là hình (vd ⭐⭐⭐) thì không đọc danh sách lựa chọn
  if (options.length < 2 || options.some((o) => !stripPictographs(o).replace(/[\s.,?!]/g, ''))) return segs;
  const last = segs[segs.length - 1];
  if (last && !/[.!?:]$/.test(last.text)) last.text += '.';

  const list: Segment[] = [{ text: 'Các đáp án là:', lang: 'vi' }];
  options.forEach((o, i) => {
    if (i === options.length - 1) list.push({ text: 'hay là', lang: 'vi' });
    const parts = segmentsFor(o.replace(/[.!?]+\s*$/, ''), subject);
    if (parts.length && i < options.length - 2) parts[parts.length - 1].text += ',';
    list.push(...parts);
  });
  return merge([...segs, ...list]);
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

export function stopSpeaking() {
  session++;
  synth()?.cancel();
}

export type SpeakResult = { ok: true } | { ok: false; reason: 'unsupported' | 'no_vi_voice' };

export async function speakSegments(
  segments: Segment[],
  opts: { rate?: number; onStart?: () => void; onEnd?: () => void } = {},
): Promise<SpeakResult> {
  const s = synth();
  if (!s) return { ok: false, reason: 'unsupported' };
  const voices = await loadVoices();
  const vi = pickVoice(voices, 'vi');
  const en = pickVoice(voices, 'en');
  if (segments.some((x) => x.lang === 'vi') && !vi) return { ok: false, reason: 'no_vi_voice' };

  stopSpeaking();
  const my = session;
  // Chrome đôi khi nuốt lệnh speak() gọi ngay sau cancel(): đợi một nhịp
  await new Promise((r) => setTimeout(r, 60));
  if (my !== session) return { ok: true };
  if (s.paused) s.resume();

  const items = segments.flatMap((seg) => chunk(seg.text).map((text) => ({ text, lang: seg.lang })));
  items.forEach((item, i) => {
    const u = new SpeechSynthesisUtterance(item.text);
    const voice = item.lang === 'vi' ? vi : en ?? undefined;
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (item.lang === 'vi' ? 'vi-VN' : 'en-US');
    u.rate = opts.rate ?? (item.lang === 'en' ? 0.8 : 0.9);
    u.pitch = 1.05;
    if (i === 0) u.onstart = () => my === session && opts.onStart?.();
    if (i === items.length - 1) {
      u.onend = () => my === session && opts.onEnd?.();
      u.onerror = () => my === session && opts.onEnd?.();
    }
    s.speak(u);
  });
  if (items.length === 0) opts.onEnd?.();
  return { ok: true };
}
