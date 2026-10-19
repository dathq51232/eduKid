import type { StickerId } from '@/lib/stickers';

const INK = '#1f2a44';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Hình vẽ của từng sticker trong khung 100 × 100 (tự vẽ, cùng nét mực + màu phẳng như Milo) */
function Art({ id }: { id: StickerId }) {
  switch (id) {
    case 'dino':
      return (
        <g {...S}>
          <path d="M22 70 Q20 48 40 44 Q48 22 66 22 Q84 22 84 38 Q84 48 74 50 L68 50 Q74 62 70 72 Z" fill="#1f9d6b" />
          <path d="M40 44 L36 34 L46 40 M50 34 L49 24 L56 32 M60 28 L63 18 L66 28" fill="#ffc83d" />
          <rect x="31" y="68" width="10" height="14" rx="3" fill="#1f9d6b" />
          <rect x="56" y="68" width="10" height="14" rx="3" fill="#1f9d6b" />
          <path d="M22 62 Q8 64 6 54" fill="none" />
          <circle cx="72" cy="32" r="3.5" fill={INK} stroke="none" />
        </g>
      );
    case 'rocket':
      return (
        <g {...S}>
          <path d="M50 10 Q68 26 66 62 H34 Q32 26 50 10Z" fill="#fff" />
          <circle cx="50" cy="38" r="8" fill="#2f6fed" />
          <path d="M34 50 L22 70 L34 66Z M66 50 L78 70 L66 66Z" fill="#e2483d" />
          <path d="M40 64 Q50 90 60 64Z" fill="#ffc83d" />
        </g>
      );
    case 'planet':
      return (
        <g {...S}>
          <circle cx="50" cy="50" r="24" fill="#8b5cf6" />
          <ellipse cx="50" cy="52" rx="42" ry="11" fill="none" stroke="#f08a24" strokeWidth="5" transform="rotate(-15 50 52)" />
          <circle cx="42" cy="42" r="5" fill="#c9b5ff" stroke="none" />
          <circle cx="60" cy="58" r="3" fill="#c9b5ff" stroke="none" />
        </g>
      );
    case 'rainbow':
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M14 70 A36 36 0 0 1 86 70" stroke="#e2483d" strokeWidth="9" />
          <path d="M24 70 A26 26 0 0 1 76 70" stroke="#ffc83d" strokeWidth="9" />
          <path d="M34 70 A16 16 0 0 1 66 70" stroke="#2f6fed" strokeWidth="9" />
          <path d="M8 74 q6 -10 16 -4 q10 -6 14 4 z M62 74 q6 -10 16 -4 q10 -6 14 4 z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      );
    case 'whale':
      return (
        <g {...S}>
          <path d="M12 58 Q14 34 44 34 Q72 34 76 50 L88 40 L86 62 L76 58 Q66 72 42 72 Q14 72 12 58Z" fill="#2f6fed" />
          <path d="M20 60 Q40 68 66 60" fill="none" stroke="#e1ebff" />
          <path d="M42 32 q-2 -12 4 -16 M42 32 q4 -12 12 -12" fill="none" stroke="#2f6fed" />
          <circle cx="30" cy="50" r="3.5" fill={INK} stroke="none" />
        </g>
      );
    case 'cactus':
      return (
        <g {...S}>
          <rect x="42" y="16" width="16" height="56" rx="8" fill="#1f9d6b" />
          <path d="M42 46 H30 V32" fill="none" stroke="#1f9d6b" strokeWidth="10" />
          <path d="M58 54 H70 V40" fill="none" stroke="#1f9d6b" strokeWidth="10" />
          <path d="M28 70 H72 L66 88 H34Z" fill="#f08a24" />
          <circle cx="50" cy="14" r="5" fill="#e2483d" />
        </g>
      );
    case 'sun':
      return (
        <g {...S}>
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M50 6 L56 20 H44Z" fill="#f08a24" transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="24" fill="#ffc83d" />
          <circle cx="42" cy="46" r="3" fill={INK} stroke="none" />
          <circle cx="58" cy="46" r="3" fill={INK} stroke="none" />
          <path d="M42 57 Q50 64 58 57" fill="none" />
        </g>
      );
    case 'moon':
      return (
        <g {...S}>
          <path d="M62 12 C38 14 24 32 24 52 C24 72 40 88 60 88 C70 88 78 84 84 78 C60 80 44 64 44 46 C44 32 50 20 62 12Z" fill="#ffc83d" />
          <path d="M74 26l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z M82 50l1.5 3.5 3.5.5-2.5 2.5.6 3.5-3.1-1.7-3.1 1.7.6-3.5-2.5-2.5 3.5-.5z" fill="#fff" strokeWidth="2" />
        </g>
      );
    case 'cloud':
      return (
        <g {...S}>
          <path d="M22 70 Q8 70 10 56 Q12 44 26 46 Q28 28 46 28 Q62 28 66 42 Q82 38 88 52 Q92 70 74 70 Z" fill="#fff" />
          <circle cx="40" cy="54" r="3" fill={INK} stroke="none" />
          <circle cx="60" cy="54" r="3" fill={INK} stroke="none" />
          <path d="M44 62 Q50 67 56 62" fill="none" />
          <path d="M34 80 l-4 8 M50 80 l-4 8 M66 80 l-4 8" stroke="#2f6fed" />
        </g>
      );
    case 'sunflower':
      return (
        <g {...S}>
          <path d="M50 56 V94" stroke="#1f9d6b" strokeWidth="5" />
          <path d="M50 78 Q34 70 30 80 Q40 88 50 82" fill="#1f9d6b" />
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx="50" cy="20" rx="7" ry="13" fill="#ffc83d" transform={`rotate(${i * 36} 50 38)`} />
          ))}
          <circle cx="50" cy="38" r="13" fill="#8a5a2b" />
        </g>
      );
    case 'tree':
      return (
        <g {...S}>
          <rect x="44" y="58" width="12" height="30" rx="3" fill="#8a5a2b" />
          <circle cx="50" cy="38" r="26" fill="#1f9d6b" />
          <circle cx="40" cy="32" r="4" fill="#e2483d" />
          <circle cx="60" cy="44" r="4" fill="#e2483d" />
          <circle cx="56" cy="26" r="4" fill="#e2483d" />
        </g>
      );
    case 'cat':
      return (
        <g {...S}>
          <path d="M24 40 L22 14 L40 28 Q50 24 60 28 L78 14 L76 40 Q82 70 50 74 Q18 70 24 40Z" fill="#f08a24" />
          <path d="M34 30 L40 38 M66 30 L60 38" stroke="#c96a12" />
          <circle cx="40" cy="48" r="4" fill={INK} stroke="none" />
          <circle cx="60" cy="48" r="4" fill={INK} stroke="none" />
          <path d="M47 56 L50 59 L53 56 M50 59 Q46 64 42 62 M50 59 Q54 64 58 62" fill="none" />
          <path d="M14 52 H30 M14 60 H30 M70 52 H86 M70 60 H86" strokeWidth="2" />
          <path d="M60 74 Q80 88 86 72" fill="none" stroke="#f08a24" strokeWidth="7" />
        </g>
      );
    case 'goldfish':
      return (
        <g {...S}>
          <path d="M16 50 Q30 26 56 30 Q72 34 76 50 Q72 66 56 70 Q30 74 16 50Z" fill="#f08a24" />
          <path d="M74 50 L92 34 L88 50 L92 66Z" fill="#ffc83d" />
          <path d="M44 30 Q50 18 60 22" fill="#ffc83d" />
          <circle cx="30" cy="46" r="4" fill={INK} stroke="none" />
          <circle cx="10" cy="30" r="3" fill="#e1ebff" strokeWidth="2" />
          <circle cx="16" cy="20" r="4" fill="#e1ebff" strokeWidth="2" />
        </g>
      );
    case 'turtle':
      return (
        <g {...S}>
          <ellipse cx="80" cy="56" rx="10" ry="8" fill="#9bd6a8" />
          <rect x="24" y="64" width="12" height="14" rx="5" fill="#9bd6a8" />
          <rect x="60" y="64" width="12" height="14" rx="5" fill="#9bd6a8" />
          <path d="M14 66 Q16 30 48 30 Q78 30 80 66 Z" fill="#1f9d6b" />
          <path d="M30 66 L38 44 H58 L66 66 M38 44 L48 32 L58 44" fill="none" stroke="#9bd6a8" />
          <circle cx="83" cy="54" r="2.5" fill={INK} stroke="none" />
        </g>
      );
    case 'butterfly':
      return (
        <g {...S}>
          <path d="M50 46 Q30 10 14 26 Q6 44 48 50Z" fill="#8b5cf6" />
          <path d="M50 46 Q70 10 86 26 Q94 44 52 50Z" fill="#8b5cf6" />
          <path d="M48 54 Q20 60 22 76 Q36 86 50 58Z" fill="#e2483d" />
          <path d="M52 54 Q80 60 78 76 Q64 86 50 58Z" fill="#e2483d" />
          <ellipse cx="50" cy="52" rx="5" ry="20" fill={INK} />
          <path d="M48 32 Q42 18 36 16 M52 32 Q58 18 64 16" fill="none" />
        </g>
      );
    case 'apple':
      return (
        <g {...S}>
          <path d="M50 30 Q30 18 20 38 Q12 62 30 80 Q40 88 50 82 Q60 88 70 80 Q88 62 80 38 Q70 18 50 30Z" fill="#e2483d" />
          <path d="M50 30 Q50 18 56 12" fill="none" />
          <path d="M54 20 Q66 8 76 16 Q68 28 54 20Z" fill="#1f9d6b" />
          <path d="M32 42 Q30 50 34 56" fill="none" stroke="#ffb3ab" strokeWidth="4" />
        </g>
      );
    case 'icecream':
      return (
        <g {...S}>
          <path d="M32 50 L50 94 L68 50Z" fill="#f2c27b" />
          <path d="M38 58 L60 58 M42 68 L57 68" stroke="#c9944a" strokeWidth="2" />
          <circle cx="40" cy="42" r="14" fill="#ff9cc0" />
          <circle cx="60" cy="42" r="14" fill="#9fd8ff" />
          <circle cx="50" cy="28" r="14" fill="#fff3d1" />
          <circle cx="50" cy="13" r="5" fill="#e2483d" />
        </g>
      );
    case 'balloon':
      return (
        <g {...S}>
          <path d="M50 70 Q46 82 54 94" fill="none" />
          <ellipse cx="50" cy="40" rx="24" ry="30" fill="#2f6fed" />
          <path d="M46 70 L54 70 L50 64Z" fill="#2f6fed" />
          <path d="M38 26 Q34 34 36 42" fill="none" stroke="#9fc0ff" strokeWidth="4" />
        </g>
      );
    case 'kite':
      return (
        <g {...S}>
          <path d="M50 8 L80 40 L50 76 L20 40Z" fill="#ffc83d" />
          <path d="M50 8 V76 M20 40 H80" fill="none" />
          <path d="M50 8 L80 40 L50 40Z M20 40 L50 76 L50 40Z" fill="#e2483d" />
          <path d="M50 76 Q40 84 50 88 Q60 92 50 98" fill="none" />
          <path d="M44 84 l-6 2 4 4z M56 92 l6 2 -4 4z" fill="#2f6fed" strokeWidth="2" />
        </g>
      );
    case 'boat':
      return (
        <g {...S}>
          <path d="M48 12 V66" />
          <path d="M50 14 L78 58 H50Z" fill="#fff" />
          <path d="M46 26 L24 58 H46Z" fill="#ffc83d" />
          <path d="M14 66 H86 L74 82 H26Z" fill="#e2483d" />
          <path d="M6 90 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="#2f6fed" />
        </g>
      );
    case 'car':
      return (
        <g {...S}>
          <path d="M10 66 V52 Q10 46 18 44 L30 30 Q34 26 40 26 H62 Q68 26 72 32 L80 44 Q90 46 90 54 V66Z" fill="#e2483d" />
          <path d="M34 44 L40 32 H50 V44Z M56 44 V32 H64 L70 44Z" fill="#e1ebff" />
          <circle cx="30" cy="68" r="10" fill={INK} />
          <circle cx="70" cy="68" r="10" fill={INK} />
          <circle cx="30" cy="68" r="4" fill="#c9d1de" stroke="none" />
          <circle cx="70" cy="68" r="4" fill="#c9d1de" stroke="none" />
        </g>
      );
    case 'house':
      return (
        <g {...S}>
          <path d="M18 48 L50 20 L82 48" fill="none" strokeWidth="4" />
          <path d="M24 46 L50 24 L76 46 V86 H24Z" fill="#fff3d1" />
          <path d="M14 50 L50 18 L86 50 L80 54 L50 28 L20 54Z" fill="#e2483d" />
          <rect x="42" y="62" width="16" height="24" rx="2" fill="#2f6fed" />
          <rect x="30" y="54" width="10" height="10" fill="#9fd8ff" />
          <rect x="62" y="54" width="10" height="10" fill="#9fd8ff" />
        </g>
      );
    case 'crown':
      return (
        <g {...S}>
          <path d="M14 72 L18 30 L36 50 L50 22 L64 50 L82 30 L86 72Z" fill="#ffc83d" />
          <rect x="14" y="72" width="72" height="12" rx="3" fill="#f5b82e" />
          <circle cx="50" cy="56" r="6" fill="#e2483d" />
          <circle cx="30" cy="62" r="4" fill="#2f6fed" />
          <circle cx="70" cy="62" r="4" fill="#1f9d6b" />
        </g>
      );
    case 'lucky':
      return (
        <g {...S}>
          <path d="M50 8l11 23 25 3.6-18 17.6 4.3 25-22.3-11.8-22.3 11.8 4.3-25-18-17.6 25-3.6z" fill="#ffc83d" />
          <circle cx="42" cy="44" r="3" fill={INK} stroke="none" />
          <circle cx="58" cy="44" r="3" fill={INK} stroke="none" />
          <path d="M43 54 Q50 60 57 54" fill="none" />
          <path d="M84 72l2 4 4 .6-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.6z M16 76l1.6 3.4 3.4.4-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.4z" fill="#8b5cf6" strokeWidth="2" />
        </g>
      );
  }
}

export default function Sticker({ id, size = 96, label }: { id: StickerId; size?: number; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="sticker-art" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Art id={id} />
    </svg>
  );
}
