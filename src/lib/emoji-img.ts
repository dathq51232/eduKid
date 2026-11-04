// Thay emoji trong chữ (đề bài, đáp án, phiếu) bằng hình 3D / hình minh hoạ cho sinh động, giống thật.
import { illustrationIconSrc } from './illustration-icons';
import { EMOJI_3D } from './emoji-3d';

/** emoji (kể cả chuỗi nối ZWJ, ký tự biến thể FE0F) */
export const EMOJI_RE = /(?:[\u{1F000}-\u{1FAFF}☀-➿⭐⭕⌚-⏿]️?(?:‍[\u{1F000}-\u{1FAFF}☀-➿]️?)*)/gu;

/** đường dẫn hình cho một emoji (ưu tiên hình minh hoạ có sẵn, rồi hình 3D); null nếu không có */
export function emojiSrc(e: string): string | null {
  const k = e.replace(/️/g, '');
  const ill = illustrationIconSrc(e) ?? illustrationIconSrc(k);
  if (ill) return ill;
  const f = EMOJI_3D[k];
  return f ? `/emoji/f3d/${f}.webp` : null;
}

/** tách chữ thành đoạn chữ và emoji (emoji có hình) */
export function splitEmoji(text: string): { t: string; src?: string }[] {
  const out: { t: string; src?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(EMOJI_RE)) {
    const src = emojiSrc(m[0]);
    if (!src) continue;
    if (m.index! > last) out.push({ t: text.slice(last, m.index) });
    out.push({ t: m[0], src });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

/** HTML (đã thoát ký tự) → thay emoji bằng <img data-img> (xuất Word / in phiếu); size: cỡ hình (px) */
export function emojiHtml(html: string, size = 28): string {
  return html.replace(EMOJI_RE, (e) => {
    const src = emojiSrc(e);
    return src ? `<img data-img="${src}" src="${src}" width="${size}" height="${size}" alt="${e}" style="vertical-align:middle" />` : e;
  });
}
