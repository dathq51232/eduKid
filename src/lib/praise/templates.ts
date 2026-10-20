// Mẫu thư khen. Toàn bộ hình trang trí tự vẽ bằng SVG (không dùng ảnh ngoài),
// cộng thêm sticker 3D có sẵn của app (public/stickers). Khổ chuẩn 1414 × 1000 (tỉ lệ A4 ngang).
import type { StickerId } from '@/lib/stickers';

export const LETTER_W = 1414;
export const LETTER_H = 1000;

export type PraiseTemplateId = 'ong-vang' | 'bau-troi' | 'vuon-hoa' | 'huy-chuong' | 'do-vang' | 'pastel' | 'vien-vang' | 'bong-bay' | 'song-xanh';

export type PraiseTemplate = {
  id: PraiseTemplateId;
  label: string;
  /** khối lớp được gợi ý */
  grades: number[];
  tag: string;
  /** nhóm hiển thị: Vui nhộn / Trang trọng */
  style: 'Vui nhộn' | 'Trang trọng';
  /** SVG nền + họa tiết (vẽ trước, dưới chữ) */
  art: () => string;
  stickers: { id: StickerId; x: number; y: number; w: number; rot?: number }[];
  ink: string;
  title: { fill: string; ring: string; size: number };
  name: { fill: string; ring: string };
  wish: string;
  /** mép trên của tiêu đề THƯ KHEN */
  top: number;
  /** lề hai bên của khối chữ (px) — chữ luôn căn giữa trang */
  side: number;
  /** 'fun': kiểu vui nhộn (tên in hoa viền màu, ký tên bên phải); 'formal': kiểu trang trọng (tên chữ viết tay, hàng dưới: lớp – ngày | lời kết – người ký) */
  layout: 'fun' | 'formal';
  /** màu đường kẻ trang trí (kiểu trang trọng) */
  accent: string;
  /** tâm 2 cột hàng dưới (kiểu trang trọng) */
  cols?: [number, number];
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
/** Huy chương hoa thị vàng có hai dải ruy băng */
function rosette(cx: number, cy: number, r: number, ribbon = '#f5b82e', ribbon2 = '#e29a12') {
  let petals = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    petals += `<circle cx="${(cx + Math.cos(a) * r * 0.92).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.92).toFixed(1)}" r="${(r * 0.16).toFixed(1)}" fill="#f5b82e"/>`;
  }
  return `<g>
    <path d="M${cx - r * 0.55} ${cy + r * 0.4} L${cx - r * 0.95} ${cy + r * 1.75} L${cx - r * 0.55} ${cy + r * 1.55} L${cx - r * 0.3} ${cy + r * 1.9} L${cx - r * 0.05} ${cy + r * 0.6}Z" fill="${ribbon}"/>
    <path d="M${cx + r * 0.55} ${cy + r * 0.4} L${cx + r * 0.95} ${cy + r * 1.75} L${cx + r * 0.55} ${cy + r * 1.55} L${cx + r * 0.3} ${cy + r * 1.9} L${cx + r * 0.05} ${cy + r * 0.6}Z" fill="${ribbon2}"/>
    ${petals}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="url(#gold)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="#ffd54a" stroke="#fff6cf" stroke-width="${(r * 0.05).toFixed(1)}" stroke-dasharray="${(r * 0.12).toFixed(1)} ${(r * 0.08).toFixed(1)}"/>
  </g>`;
}
const GOLD_DEFS = `<radialGradient id="gold" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff2b0"/><stop offset=".55" stop-color="#f7c534"/><stop offset="1" stop-color="#d49a10"/></radialGradient>`;
function balloon(x: number, y: number, rx: number, color: string) {
  return `<path d="M${x} ${y + rx * 1.2} Q${x - 18} ${y + rx * 2.2} ${x + 6} ${y + rx * 3.2}" stroke="#b9a7c9" stroke-width="2.5" fill="none"/>
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 1.2}" fill="${color}" opacity=".85"/>
    <ellipse cx="${x - rx * 0.35}" cy="${y - rx * 0.45}" rx="${rx * 0.22}" ry="${rx * 0.34}" fill="#fff" opacity=".55"/>
    <path d="M${x - 7} ${y + rx * 1.22} h14 l-7 -10Z" fill="${color}"/>`;
}
const cloud = (x: number, y: number, k: number, fill: string) =>
  `<path transform="translate(${x} ${y}) scale(${k})" fill="${fill}" d="M20 60 C0 60 0 30 24 30 C26 8 60 4 70 22 C80 6 116 10 116 36 C140 36 140 60 118 60Z"/>`;
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LETTER_W}" height="${LETTER_H}" viewBox="0 0 ${LETTER_W} ${LETTER_H}">${body}</svg>`;

// ------------------------------------------------------------------ 4 mẫu
export const PRAISE_TEMPLATES: PraiseTemplate[] = [
  {
    id: 'ong-vang', style: 'Vui nhộn', label: 'Ong vàng', grades: [1, 2], tag: 'Lớp 1 – 2',
    ink: '#5a3418', title: { fill: '#5a3418', ring: '#fcd38a', size: 150 }, name: { fill: '#e04e2b', ring: '#f8c9b9' }, wish: '#e04e2b',
    top: 120, side: 90, layout: 'fun', accent: '#f5b04a', school: false, signX: 830,
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
    id: 'bau-troi', style: 'Vui nhộn', label: 'Bầu trời', grades: [1, 2, 3], tag: 'Lớp 1 – 3',
    ink: '#24477a', title: { fill: '#2a4a7c', ring: '#fcd38a', size: 150 }, name: { fill: '#e04e2b', ring: '#bfe6fb' }, wish: '#e04e2b',
    top: 100, side: 230, layout: 'fun', accent: '#f5b04a', school: false, signX: 860,
    art: () => svg(`<rect width="1414" height="1000" fill="#b6e3f5"/>
      <rect x="22" y="48" width="1370" height="904" fill="#fff9ef"/>
      <path d="M1414 0 H1250 C1230 80 1240 170 1300 210 C1350 240 1390 230 1414 228Z" fill="#4a9be0"/>
      <path d="M0 0 C40 40 110 30 130 90 C150 150 90 180 40 170 C10 160 0 140 0 120Z" fill="none" stroke="#ec6a5e" stroke-width="22" stroke-linecap="round"/>
      <path d="M0 1000 V760 C60 760 100 820 100 880 C100 940 70 980 110 1000Z" fill="#e8904a"/>
      <path d="M1414 1000 C1330 1000 1300 940 1320 890 C1340 840 1400 840 1414 860Z" fill="none" stroke="#1f4f99" stroke-width="22" stroke-linecap="round"/>
      ${cloud(820, 70, 1.6, '#cdeefb')}${star(860, 120, 20, '#ffc83d', 10)}${star(940, 170, 14, '#ffc83d')}${star(1320, 90, 12, '#fff')}${star(1350, 150, 9, '#fff')}
      ${[0, 1, 2, 3, 4].map((i) => star(470 + i * 60, 62, 14, '#f5b82e')).join('')}
      ${trophy(250, 750, 1)}`),
    stickers: [{ id: 'rocket', x: 1190, y: 250, w: 170, rot: 14 }, { id: 'planet', x: 1205, y: 520, w: 140 }],
  },
  {
    id: 'vuon-hoa', style: 'Vui nhộn', label: 'Vườn hoa', grades: [2, 3, 4], tag: 'Lớp 2 – 4',
    ink: '#1e4a8f', title: { fill: '#11649a', ring: '#fcd38a', size: 128 }, name: { fill: '#e04e2b', ring: '#bfe6fb' }, wish: '#e04e2b',
    top: 150, side: 220, layout: 'fun', accent: '#f5b04a', school: true, signX: 860,
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
    stickers: [{ id: 'rainbow', x: 1109, y: 80, w: 210 }, { id: 'balloon', x: 1195, y: 470, w: 100 }],
  },
  {
    id: 'huy-chuong', style: 'Vui nhộn', label: 'Huy chương', grades: [4, 5], tag: 'Lớp 4 – 5',
    ink: '#1d2f5a', title: { fill: '#1d2f5a', ring: '#f3d27a', size: 128 }, name: { fill: '#b8321f', ring: '#f6e3b0' }, wish: '#e04e2b',
    top: 140, side: 200, layout: 'fun', accent: '#f5b04a', school: true, signX: 900,
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
    stickers: [{ id: 'crown', x: 1139, y: 95, w: 170 }, { id: 'lucky', x: 1220, y: 520, w: 100 }],
  },
  // ---------------------------------------------------------------- kiểu trang trọng (chữ căn giữa, tên viết tay)
  {
    id: 'do-vang', style: 'Trang trọng', label: 'Đỏ vàng', grades: [3, 4, 5], tag: 'Lớp 3 – 5',
    ink: '#3a2a20', title: { fill: '#a3141b', ring: '', size: 128 }, name: { fill: '#2b1d16', ring: '' }, wish: '#a3141b',
    top: 100, side: 215, layout: 'formal', accent: '#c9a23a', cols: [330, 1000], school: true, signX: 0,
    art: () => svg(`<defs>${GOLD_DEFS}
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f4e6cb"/></linearGradient>
        <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4142c"/><stop offset="1" stop-color="#7a0a12"/></linearGradient>
        <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#d9b04a"/><stop offset="1" stop-color="#fbe7a6"/></linearGradient></defs>
      <rect width="1414" height="1000" fill="url(#bg)"/>
      <rect x="58" y="58" width="1298" height="884" fill="none" stroke="#a3141b" stroke-width="4"/>
      <rect x="74" y="74" width="1266" height="852" fill="none" stroke="#a3141b" stroke-width="1.5"/>
      <path d="M0 0 H340 Q250 40 190 110 Q120 190 0 270Z" fill="url(#red)"/>
      <path d="M340 0 Q252 42 192 112 Q150 162 118 236 Q232 176 302 94 Q336 52 340 0Z" fill="url(#gl)"/>
      <path d="M560 1000 Q960 950 1180 900 Q1330 862 1414 760 V1000Z" fill="url(#gl)"/>
      <path d="M640 1000 Q1000 962 1200 918 Q1340 884 1414 800 V1000Z" fill="url(#red)"/>
      <path d="M900 1000 Q1150 975 1300 935 Q1380 910 1414 880 V1000Z" fill="#7a0a12"/>
      ${rosette(1190, 160, 66, '#b3121f', '#8e0c16')}`),
    stickers: [],
  },
  {
    id: 'pastel', style: 'Trang trọng', label: 'Hoa pastel', grades: [1, 2, 3, 4, 5], tag: 'Lớp 1 – 5',
    ink: '#1d3f6e', title: { fill: '#c0161b', ring: '', size: 128 }, name: { fill: '#1d4f91', ring: '' }, wish: '#b3261e',
    top: 96, side: 215, layout: 'formal', accent: '#4a86b5', cols: [320, 1094], school: true, signX: 0,
    art: () => svg(`<defs>${GOLD_DEFS}</defs>
      <rect width="1414" height="1000" fill="#eef5fb"/>
      <path d="M0 330 L420 0 H600 L0 470Z" fill="#d6ecf8"/><path d="M0 760 L760 0 H860 L0 860Z" fill="#fde3cf" opacity=".8"/>
      <path d="M560 1000 L1414 210 V360 L760 1000Z" fill="#fff1c9" opacity=".9"/><path d="M1000 1000 L1414 620 V760 L1160 1000Z" fill="#d6ecf8"/>
      <rect x="60" y="48" width="1294" height="904" rx="16" fill="#fbfdff" fill-opacity=".8" stroke="#4a86b5" stroke-width="6"/>
      ${[[70, 80, 40, 1], [150, 30, 28, 0], [40, 200, 30, 0], [130, 150, 22, 1], [60, 330, 26, 1]].map(([x, y, r, b], i) => flower(x, y, r, b ? '#8fc4ef' : '#f8b331', '#e0861b', i * 30)).join('')}
      ${[[1344, 80, 40, 0], [1264, 30, 28, 1], [1374, 200, 30, 1], [1284, 150, 22, 0], [1354, 330, 26, 0]].map(([x, y, r, b], i) => flower(x, y, r, b ? '#8fc4ef' : '#f8b331', '#e0861b', i * 25)).join('')}
      <path d="M20 40 C90 120 60 260 110 360 M180 20 C150 90 170 160 120 230" stroke="#4f9a5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M1394 40 C1324 120 1354 260 1304 360 M1234 20 C1264 90 1244 160 1294 230" stroke="#4f9a5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${rosette(707, 845, 56)}`),
    stickers: [{ id: 'butterfly', x: 90, y: 520, w: 110, rot: -10 }, { id: 'sunflower', x: 1205, y: 430, w: 120 }],
  },
  {
    id: 'vien-vang', style: 'Trang trọng', label: 'Viền vàng', grades: [3, 4, 5], tag: 'Lớp 3 – 5',
    ink: '#4a3d2e', title: { fill: '#9a2b2b', ring: '', size: 128 }, name: { fill: '#8e1c1c', ring: '' }, wish: '#b3261e',
    top: 110, side: 215, layout: 'formal', accent: '#c9a23a', cols: [320, 1094], school: true, signX: 0,
    art: () => svg(`<defs>${GOLD_DEFS}</defs>
      <rect width="1414" height="1000" fill="#ffffff"/>
      <path d="M0 0 H200 L0 130Z" fill="#2b3150"/><path d="M1414 0 H1214 L1414 130Z" fill="#2b3150"/>
      <path d="M0 1000 V880 Q330 960 640 1000Z" fill="#2b3150"/><path d="M1414 1000 V880 Q1084 960 774 1000Z" fill="#2b3150"/>
      <path d="M0 1000 V930 Q300 985 520 1000Z" fill="#f5b82e"/><path d="M1414 1000 V930 Q1114 985 894 1000Z" fill="#f5b82e"/>
      <rect x="70" y="58" width="1274" height="872" fill="none" stroke="#c9a23a" stroke-width="4"/>
      <rect x="86" y="74" width="1242" height="840" fill="none" stroke="#c9a23a" stroke-width="1.5"/>
      ${[[70, 58], [1344, 58], [70, 930], [1344, 930]].map(([x, y]) => `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" fill="#fff" stroke="#c9a23a" stroke-width="3" transform="rotate(45 ${x} ${y})"/>`).join('')}
      <path d="M20 150 Q260 60 520 18" stroke="#2b3150" stroke-width="3" fill="none"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const t = (i + 0.5) / 8, x = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 260 + t * t * 520, y = (1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * 60 + t * t * 18;
        const c = ['#e2483d', '#2f6fed', '#f5b82e', '#1f9d6b'][i % 4];
        return `<path d="M${(x - 24).toFixed(1)} ${(y - 4).toFixed(1)} L${(x + 24).toFixed(1)} ${(y - 4).toFixed(1)} L${x.toFixed(1)} ${(y + 52).toFixed(1)}Z" fill="${c}" transform="rotate(${(-22 + i * 3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>${star(x, y + 14, 8, '#fff')}`;
      }).join('')}
      <path d="M560 236 H660 M754 236 H854" stroke="#c9a23a" stroke-width="3"/>
      ${rosette(707, 840, 58)}`),
    stickers: [{ id: 'apple', x: 110, y: 690, w: 110 }, { id: 'kite', x: 1170, y: 150, w: 150, rot: 10 }],
  },
  {
    id: 'bong-bay', style: 'Trang trọng', label: 'Bóng bay', grades: [1, 2, 3], tag: 'Lớp 1 – 3',
    ink: '#1d3f6e', title: { fill: '#c0161b', ring: '', size: 128 }, name: { fill: '#1d4f91', ring: '' }, wish: '#b3261e',
    top: 96, side: 215, layout: 'formal', accent: '#4a86b5', cols: [320, 1094], school: true, signX: 0,
    art: () => svg(`<defs>${GOLD_DEFS}</defs>
      <rect width="1414" height="1000" fill="#ffffff"/>
      <path d="M760 0 H1414 V120 Q1250 160 1120 120 Q980 80 760 0Z" fill="#fff1a8"/>
      <path d="M1340 140 H1414 V1000 H1340Z" fill="#e6dcf5"/>
      <path d="M0 640 Q160 560 330 620 Q520 690 560 1000 H0Z" fill="#cfe3f5"/>
      <path d="M560 1000 Q700 780 960 820 Q1180 850 1414 760 V1000Z" fill="#d9f0d9"/>
      <path d="M50 52 H170 L150 72 H72 V150 L50 172Z" fill="#f59a2e"/><path d="M50 948 H170 L150 928 H72 V850 L50 828Z" fill="#f59a2e"/>
      ${[0, 1, 2, 3, 4].map((i) => star(170 + i * 42, 160, 14, '#f5a524')).join('')}
      ${balloon(1180, 110, 50, '#f9a8c9')}${balloon(1260, 80, 46, '#a8d8f9')}${balloon(1330, 150, 44, '#c9b5f5')}${balloon(1220, 200, 48, '#fbe38a')}${balloon(1300, 250, 42, '#ffb3a7')}
      ${rosette(707, 845, 56)}`),
    stickers: [{ id: 'dino', x: 70, y: 330, w: 150 }, { id: 'turtle', x: 1180, y: 600, w: 150 }],
  },
  {
    id: 'song-xanh', style: 'Trang trọng', label: 'Sóng xanh', grades: [2, 3, 4, 5], tag: 'Lớp 2 – 5',
    ink: '#2a3f6e', title: { fill: '#c0161b', ring: '', size: 128 }, name: { fill: '#1d4f91', ring: '' }, wish: '#b3261e',
    top: 100, side: 215, layout: 'formal', accent: '#3b8fd0', cols: [320, 1094], school: true, signX: 0,
    art: () => svg(`<defs>${GOLD_DEFS}</defs>
      <rect width="1414" height="1000" fill="#ffffff"/>
      ${[[300, 160, 60, '#fde6a8'], [1060, 160, 70, '#f8c9d0'], [250, 520, 90, '#fde6a8'], [1180, 470, 55, '#cfe3f5'], [420, 320, 50, '#f8c9d0'], [980, 640, 80, '#cfe3f5'], [1260, 760, 70, '#f8c9d0'], [520, 900, 40, '#cfe3f5']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".45"/>`).join('')}
      <rect x="50" y="44" width="1314" height="912" fill="none" stroke="#2a3f7a" stroke-width="3"/>
      <path d="M760 0 H1414 V270 Q1270 120 1080 92 Q900 66 760 0Z" fill="#2a3f7a"/>
      <path d="M900 0 H1414 V200 Q1280 80 1110 52 Q990 34 900 0Z" fill="#3bb0c0"/>
      <path d="M0 860 Q220 930 470 965 Q560 980 620 1000 H0Z" fill="#2a3f7a"/>
      <path d="M0 910 Q180 965 380 985 Q440 992 480 1000 H0Z" fill="#3bb0c0"/>
      ${rosette(150, 150, 62)}`),
    stickers: [{ id: 'whale', x: 1190, y: 330, w: 150 }, { id: 'goldfish', x: 80, y: 560, w: 120 }],
  },
];

export const templateById = (id: string): PraiseTemplate => PRAISE_TEMPLATES.find((t) => t.id === id) ?? PRAISE_TEMPLATES[0];

/** Mẫu gợi ý theo khối */
export function defaultTemplateFor(grade: number): PraiseTemplateId {
  if (grade <= 2) return 'ong-vang';
  if (grade === 3) return 'bau-troi';
  if (grade === 4) return 'vien-vang';
  return 'do-vang';
}

/** Câu khen có sẵn; {ky} được thay bằng thời gian khen (vd "tháng 9", "học kì I") */
export const PRAISE_REASONS = [
  'Đã hoàn thành xuất sắc nhiệm vụ học tập {ky}',
  'Đã có nhiều cố gắng và tiến bộ trong học tập {ky}',
  'Là tấm gương chăm ngoan, học tốt {ky}',
  'Đã tích cực tham gia các hoạt động của lớp {ky}',
] as const;

export const fillReason = (text: string, ky: string) => text.replace('{ky}', ky.trim()).replace(/\s+/g, ' ').trim();
