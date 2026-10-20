// Mẫu thư khen. Toàn bộ hình trang trí tự vẽ bằng SVG (không dùng ảnh ngoài),
// cộng thêm sticker 3D có sẵn của app (public/stickers). Khổ chuẩn 1414 × 1000 (tỉ lệ A4 ngang).
import type { StickerId } from '@/lib/stickers';

export const LETTER_W = 1414;
export const LETTER_H = 1000;

export type PraiseTemplateId = 'ong-vang' | 'bau-troi' | 'vuon-hoa' | 'huy-chuong';

export type PraiseTemplate = {
  id: PraiseTemplateId;
  label: string;
  /** khối lớp được gợi ý */
  grades: number[];
  tag: string;
  /** SVG nền + họa tiết (vẽ trước, dưới chữ) */
  art: () => string;
  stickers: { id: StickerId; x: number; y: number; w: number; rot?: number }[];
  ink: string;
  title: { fill: string; ring: string; size: number };
  name: { fill: string; ring: string };
  wish: string;
  /** mép trên của tiêu đề THƯ KHEN */
  top: number;
  /** chừa bên phải cho hình (px) */
  right: number;
  /** mẫu có dòng tên trường */
  school: boolean;
  /** tâm khối ký tên theo trục ngang */
  signX: number;
};

// ------------------------------------------------------------------ hình vẽ dùng chung
function flower(cx: number, cy: number, r: number, petal: string, center: string, rot = 0) {
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
  for (let i = 0; i < 5; i++) s += `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.42}" ry="${r * 0.6}" fill="${petal}" transform="rotate(${i * 72})"/>`;
  return `${s}<circle r="${r * 0.3}" fill="${center}"/><circle r="${r * 0.13}" fill="#5b3415"/></g>`;
}
function star(cx: number, cy: number, r: number, fill: string, rot = 0) {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<path d="M${p.join('L')}Z" fill="${fill}" transform="rotate(${rot} ${cx} ${cy})"/>`;
}
function laurel(cx: number, cy: number, R: number, c1: string, c2: string) {
  let s = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const a = (200 - i * 17) * (Math.PI / 180);
      const x = (cx - side * R * Math.cos(a)).toFixed(1);
      const y = (cy - R * Math.sin(a) + 10).toFixed(1);
      const rot = side * (i * 17 - 20) + side * 35;
      s += `<ellipse cx="${x}" cy="${y}" rx="11" ry="26" fill="${i % 2 ? c1 : c2}" transform="rotate(${rot} ${x} ${y})"/>`;
    }
  }
  return s;
}
function trophy(x: number, y: number, k: number) {
  return `<g transform="translate(${x} ${y}) scale(${k})">
    ${star(18, 8, 13, '#e2483d')}${star(56, 2, 9, '#8b5cf6')}${star(92, 0, 8, '#ffc83d')}${star(128, 2, 9, '#8b5cf6')}${star(166, 8, 13, '#ffc83d')}
    <path d="M40 60 C-10 60 0 140 60 140" fill="none" stroke="#7c4ddf" stroke-width="12" stroke-linecap="round"/>
    <path d="M144 60 C194 60 184 140 124 140" fill="none" stroke="#7c4ddf" stroke-width="12" stroke-linecap="round"/>
    <path d="M38 40 H146 C146 120 120 160 92 168 C64 160 38 120 38 40Z" fill="#ffc83d"/>
    <path d="M92 168 C120 160 146 120 146 40 H120 C120 110 108 150 92 168Z" fill="#f5a524"/>
    <ellipse cx="92" cy="42" rx="54" ry="10" fill="#2a2f7a"/>
    ${star(92, 96, 26, '#fff')}
    <rect x="80" y="166" width="24" height="26" fill="#f5a524"/>
    <path d="M52 192 H132 L140 222 H44Z" fill="#e2483d"/><rect x="62" y="202" width="60" height="8" rx="4" fill="#fff"/>
  </g>`;
}
function bee(x: number, y: number, k: number) {
  return `<g transform="translate(${x} ${y}) scale(${-k} ${k})">
    <path d="M-6 -88 Q-20 -120 -34 -126 M14 -88 Q22 -122 38 -128" stroke="#3b2414" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="-34" cy="-126" r="6" fill="#3b2414"/><circle cx="38" cy="-128" r="6" fill="#3b2414"/>
    <ellipse cx="-46" cy="-10" rx="40" ry="24" fill="#cfeaff" opacity=".9" transform="rotate(-25 -46 -10)"/>
    <ellipse cx="52" cy="-14" rx="40" ry="24" fill="#cfeaff" opacity=".9" transform="rotate(25 52 -14)"/>
    <ellipse cx="4" cy="20" rx="48" ry="62" fill="#ffcf33"/>
    <path d="M-44 10 Q4 22 50 10 L52 26 Q4 40 -46 26Z M-40 44 Q4 56 46 44 L40 60 Q4 72 -34 60Z" fill="#4a2c17"/>
    <circle cx="4" cy="-50" r="44" fill="#ffd84a"/>
    <path d="M-16 -54 q6 -6 12 0 M12 -54 q6 -6 12 0" stroke="#3b2414" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M-8 -36 q12 10 24 0" stroke="#3b2414" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="-22" cy="-40" r="7" fill="#ff9b7a" opacity=".6"/><circle cx="30" cy="-40" r="7" fill="#ff9b7a" opacity=".6"/>
    <path d="M-20 80 l-6 22 M24 80 l6 22" stroke="#3b2414" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}
const cloud = (x: number, y: number, k: number, fill: string) =>
  `<path transform="translate(${x} ${y}) scale(${k})" fill="${fill}" d="M20 60 C0 60 0 30 24 30 C26 8 60 4 70 22 C80 6 116 10 116 36 C140 36 140 60 118 60Z"/>`;
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LETTER_W}" height="${LETTER_H}" viewBox="0 0 ${LETTER_W} ${LETTER_H}">${body}</svg>`;

// ------------------------------------------------------------------ 4 mẫu
export const PRAISE_TEMPLATES: PraiseTemplate[] = [
  {
    id: 'ong-vang', label: 'Ong vàng', grades: [1, 2], tag: 'Lớp 1 – 2',
    ink: '#5a3418', title: { fill: '#5a3418', ring: '#fcd38a', size: 150 }, name: { fill: '#e04e2b', ring: '#f8c9b9' }, wish: '#e04e2b',
    top: 120, right: 0, school: false, signX: 830,
    art: () => svg(`<rect width="1414" height="1000" fill="#fffaf1"/>
      <path d="M0 0 H380 C300 40 250 120 170 160 C100 200 60 280 0 300Z" fill="#f5a524"/>
      <path d="M0 0 H250 C200 40 150 60 90 110 C50 140 30 170 0 180Z" fill="#f18f1c"/>
      <path d="M1414 0 H1010 C1100 60 1200 90 1260 170 C1300 230 1360 280 1414 300Z" fill="#ffc93c"/>
      <path d="M1414 1000 H1080 C1150 940 1240 920 1300 840 C1340 790 1380 740 1414 720Z" fill="#f5a524"/>
      <path d="M0 1000 H340 C280 960 200 960 140 900 C90 850 50 800 0 790Z" fill="#ffc93c"/>
      <path d="M30 50 C80 120 0 160 40 230 C70 280 140 250 170 300" fill="none" stroke="#fff3df" stroke-width="7" stroke-linecap="round"/>
      ${[[80, 820], [1330, 120], [1300, 880], [240, 90]].map(([x, y], i) => flower(x, y, 30, i % 2 ? '#fff3b0' : '#ffd23f', '#f08a24', i * 20)).join('')}
      ${[[120, 420], [1280, 420], [200, 700], [1240, 640], [640, 60], [900, 960]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="18" fill="#efe8dc"/>`).join('')}
      ${bee(1210, 860, 1.05)}
      ${laurel(330, 862, 122, '#f5c518', '#f5a524')}<circle cx="330" cy="862" r="108" fill="#fff" stroke="#bfe6fb" stroke-width="6"/>`),
    stickers: [{ id: 'sunflower', x: 250, y: 782, w: 160 }, { id: 'butterfly', x: 1154, y: 150, w: 110, rot: 12 }],
  },
  {
    id: 'bau-troi', label: 'Bầu trời', grades: [1, 2, 3], tag: 'Lớp 1 – 3',
    ink: '#24477a', title: { fill: '#2a4a7c', ring: '#fcd38a', size: 150 }, name: { fill: '#e04e2b', ring: '#bfe6fb' }, wish: '#e04e2b',
    top: 100, right: 270, school: false, signX: 860,
    art: () => svg(`<rect width="1414" height="1000" fill="#b6e3f5"/>
      <rect x="22" y="48" width="1370" height="904" fill="#fff9ef"/>
      <path d="M1414 0 H1250 C1230 80 1240 170 1300 210 C1350 240 1390 230 1414 228Z" fill="#4a9be0"/>
      <path d="M0 0 C40 40 110 30 130 90 C150 150 90 180 40 170 C10 160 0 140 0 120Z" fill="none" stroke="#ec6a5e" stroke-width="22" stroke-linecap="round"/>
      <path d="M0 1000 V760 C60 760 100 820 100 880 C100 940 70 980 110 1000Z" fill="#e8904a"/>
      <path d="M1414 1000 C1330 1000 1300 940 1320 890 C1340 840 1400 840 1414 860Z" fill="none" stroke="#1f4f99" stroke-width="22" stroke-linecap="round"/>
      ${cloud(820, 70, 1.6, '#cdeefb')}${star(860, 120, 20, '#ffc83d', 10)}${star(940, 170, 14, '#ffc83d')}${star(1320, 90, 12, '#fff')}${star(1350, 150, 9, '#fff')}
      ${[0, 1, 2, 3, 4].map((i) => star(470 + i * 60, 62, 14, '#f5b82e')).join('')}
      ${trophy(250, 750, 1)}`),
    stickers: [{ id: 'rocket', x: 1144, y: 250, w: 200, rot: 14 }, { id: 'planet', x: 1159, y: 520, w: 160 }],
  },
  {
    id: 'vuon-hoa', label: 'Vườn hoa', grades: [2, 3, 4], tag: 'Lớp 2 – 4',
    ink: '#1e4a8f', title: { fill: '#11649a', ring: '#fcd38a', size: 128 }, name: { fill: '#e04e2b', ring: '#bfe6fb' }, wish: '#e04e2b',
    top: 150, right: 230, school: true, signX: 860,
    art: () => svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde7d9"/><stop offset=".4" stop-color="#e3f1f8"/><stop offset=".7" stop-color="#fff4d6"/><stop offset="1" stop-color="#e9f4fb"/></linearGradient></defs>
      <rect width="1414" height="1000" fill="url(#g)"/>
      <path d="M0 520 L560 0 H700 L0 650Z" fill="#cfe6f6" opacity=".7"/>
      <path d="M800 1000 L1414 380 V520 L940 1000Z" fill="#fde2b0" opacity=".6"/>
      <rect x="70" y="40" width="1280" height="920" rx="22" fill="#fbfdff" fill-opacity=".72" stroke="#3f78a8" stroke-width="7"/>
      ${[[60, 90, 34], [120, 180, 26], [40, 300, 30], [150, 40, 22]].map(([x, y, r], i) => flower(x, y, r, i % 2 ? '#8fc4ef' : '#f8b331', '#e0861b', i * 30)).join('')}
      ${[[1350, 880, 38], [1270, 960, 28], [1380, 740, 26], [1200, 920, 22]].map(([x, y, r], i) => flower(x, y, r, i % 2 ? '#8fc4ef' : '#f8b331', '#e0861b', i * 25)).join('')}
      <path d="M90 60 C140 140 120 260 70 330 M120 120 c30 10 40 30 40 50 M80 230 c30 -10 50 0 60 20" stroke="#4f9a5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M1330 940 C1290 860 1300 760 1360 700 M1310 820 c-30 -10 -40 -30 -40 -50" stroke="#4f9a5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${trophy(255, 760, 0.8)}`),
    stickers: [{ id: 'rainbow', x: 1109, y: 80, w: 210 }, { id: 'balloon', x: 1154, y: 470, w: 110 }],
  },
  {
    id: 'huy-chuong', label: 'Huy chương', grades: [4, 5], tag: 'Lớp 4 – 5',
    ink: '#1d2f5a', title: { fill: '#1d2f5a', ring: '#f3d27a', size: 128 }, name: { fill: '#b8321f', ring: '#f6e3b0' }, wish: '#e04e2b',
    top: 140, right: 160, school: true, signX: 940,
    art: () => svg(`<rect width="1414" height="1000" fill="#1d2f5a"/>
      <rect x="30" y="30" width="1354" height="940" fill="#fffdf6"/>
      <rect x="52" y="52" width="1310" height="896" fill="none" stroke="#c9a23a" stroke-width="5"/>
      <rect x="66" y="66" width="1282" height="868" fill="none" stroke="#c9a23a" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>
      ${[[52, 52], [1362, 52], [52, 948], [1362, 948]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(45)"><rect x="-16" y="-16" width="32" height="32" fill="#c9a23a"/><rect x="-8" y="-8" width="16" height="16" fill="#1d2f5a"/></g>`).join('')}
      <g transform="translate(250 815) scale(.82)">
        <path d="M-40 -10 L-70 130 L-30 110 L-10 150 L10 0Z" fill="#2f6fed"/><path d="M40 -10 L70 130 L30 110 L10 150 L-10 0Z" fill="#e2483d"/>
        <circle r="78" fill="#f5c542" stroke="#b8862a" stroke-width="6"/><circle r="60" fill="#ffd96a" stroke="#c9a23a" stroke-width="3" stroke-dasharray="6 6"/>
        ${star(0, 0, 40, '#fff6cf')}
      </g>
      ${laurel(250, 806, 98, '#c9a23a', '#ad8526')}`),
    stickers: [{ id: 'crown', x: 1139, y: 95, w: 170 }, { id: 'lucky', x: 1204, y: 540, w: 115 }],
  },
];

export const templateById = (id: string): PraiseTemplate => PRAISE_TEMPLATES.find((t) => t.id === id) ?? PRAISE_TEMPLATES[0];

/** Mẫu gợi ý theo khối */
export function defaultTemplateFor(grade: number): PraiseTemplateId {
  if (grade <= 2) return 'ong-vang';
  if (grade === 3) return 'bau-troi';
  if (grade === 4) return 'vuon-hoa';
  return 'huy-chuong';
}

/** Câu khen có sẵn; {ky} được thay bằng thời gian khen (vd "tháng 9", "học kì I") */
export const PRAISE_REASONS = [
  'Đã hoàn thành xuất sắc nhiệm vụ học tập {ky}',
  'Đã có nhiều cố gắng và tiến bộ trong học tập {ky}',
  'Là tấm gương chăm ngoan, học tốt {ky}',
  'Đã tích cực tham gia các hoạt động của lớp {ky}',
] as const;

export const fillReason = (text: string, ky: string) => text.replace('{ky}', ky.trim()).replace(/\s+/g, ' ').trim();
