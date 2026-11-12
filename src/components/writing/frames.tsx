// Khung trang vở theo chủ đề (vẽ SVG, đơn vị mm) — tự vẽ, không dùng ảnh ngoài.
// Quy luật (tổng hợp từ các mẫu giấy viết A4 phổ biến): hoạ tiết chỉ nằm ở dải lề ~0–11 mm (lưới ô li bắt đầu từ 12 mm),
// cụm hoạ tiết dày ở 2 góc chéo, cạnh thưa; khung "mở" (nét đứt, thanh bo tròn, dây leo) thay cho đường liền đậm;
// màu pastel 3–4 màu, nét viền nâu sẫm mảnh kiểu vẽ tay. Cụm ở góc trên gọn trong 20 mm để không đè tiêu đề / họ tên.
import { useId } from 'react';

export const FRAMES: { id: string; label: string; hint: string }[] = [
  { id: 'pastel', label: 'Dễ thương pastel', hint: 'Tim, sao, nơ, thanh bo tròn' },
  { id: 'hoc-tap', label: 'Dụng cụ học tập', hint: 'Sách, bút chì, thước, máy bay giấy' },
  { id: 'hoa-dao', label: 'Xuân hoa đào', hint: 'Cành đào, cánh hoa rơi, bướm' },
  { id: 'mua-dong', label: 'Mùa đông', hint: 'Mây, bông tuyết, người tuyết, cây thông' },
  { id: 'con-vat', label: 'Bạn thú', hint: 'Thỏ, gấu, gà con, dây tim' },
  { id: 'caro-xanh', label: 'Caro picnic xanh', hint: 'Kẻ caro 2 góc chéo, ruy băng, sao' },
  { id: 'caro-do', label: 'Caro picnic đỏ', hint: 'Kẻ caro 2 góc chéo, ruy băng, sao' },
  { id: 'toi-gian', label: 'Tối giản (in đen trắng)', hint: 'Viền đôi mảnh, sao nhỏ — tiết kiệm mực' },
];

const INK = '#5b4636'; // nét viền nâu sẫm kiểu vẽ tay
const P = { pink: '#f6a5b8', blue: '#a9c4e6', yellow: '#f7d77a', lilac: '#b9a7e0', mint: '#9fdcc0', peach: '#fbc9a8' };

/* ---------------------------------------------------------------- hình nhỏ (toạ độ tâm, cỡ theo mm) */
const Heart = ({ x, y, s, fill, stroke = INK }: { x: number; y: number; s: number; fill: string; stroke?: string }) => (
  <path d="M0 -1.6 C-0.2 -3.4 -3.2 -3.6 -3.2 -1.2 C-3.2 0.8 -1.2 2 0 3.2 C1.2 2 3.2 0.8 3.2 -1.2 C3.2 -3.6 0.2 -3.4 0 -1.6Z"
    transform={`translate(${x} ${y}) scale(${s / 6.4})`} fill={fill} stroke={stroke} strokeWidth={(0.3 * 6.4) / s} strokeLinejoin="round" />
);
function starPts(r: number, inner = 0.48) {
  return Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * inner : r; return `${(rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`; }).join(' ');
}
const Star = ({ x, y, r, fill, stroke = INK, rot = 0 }: { x: number; y: number; r: number; fill: string; stroke?: string; rot?: number }) => (
  <polygon points={starPts(r)} transform={`translate(${x} ${y}) rotate(${rot})`} fill={fill} stroke={stroke} strokeWidth={0.3} strokeLinejoin="round" />
);
const Sparkle = ({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) => (
  <path d={`M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z`} transform={`translate(${x} ${y})`} fill={fill} />
);
const Dot = ({ x, y, r = 0.5, fill }: { x: number; y: number; r?: number; fill: string }) => <circle cx={x} cy={y} r={r} fill={fill} />;
const Bow = ({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 10})`} stroke={INK} strokeWidth="0.45" strokeLinejoin="round" fill={fill}>
    <path d="M0 0 C-2 -3 -5.5 -3.6 -5 0 C-5.5 3.6 -2 3 0 0Z" /><path d="M0 0 C2 -3 5.5 -3.6 5 0 C5.5 3.6 2 3 0 0Z" />
    <path d="M-0.6 0.6 L-2.2 4.6 L-1 4.2 M0.6 0.6 L2.2 4.6 L1 4.2" fill="none" /><circle r="1" />
  </g>
);
const Flower5 = ({ x, y, r, fill, center = '#facc15', stroke = INK }: { x: number; y: number; r: number; fill: string; center?: string; stroke?: string }) => (
  <g transform={`translate(${x} ${y})`} stroke={stroke} strokeWidth={0.28}>
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy={-r * 0.55} rx={r * 0.42} ry={r * 0.55} fill={fill} transform={`rotate(${a})`} />)}
    <circle r={r * 0.3} fill={center} />
  </g>
);
const Snowflake = ({ x, y, r, color }: { x: number; y: number; r: number; color: string }) => (
  <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={0.35} strokeLinecap="round">
    {[0, 60, 120].map((a) => <line key={a} x1={-r} y1="0" x2={r} y2="0" transform={`rotate(${a})`} />)}
    {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d={`M${r * 0.55} 0 l${r * 0.25} ${-r * 0.22} M${r * 0.55} 0 l${r * 0.25} ${r * 0.22}`} transform={`rotate(${a})`} fill="none" />)}
  </g>
);
/** Thanh bo tròn đứt đoạn dọc theo một cạnh (kiểu băng dính / bút dạ) */
function Bars({ x1, y1, x2, y2, color, w = 1.6, pattern = [26, 3, 6, 3, 2, 3] }: { x1: number; y1: number; x2: number; y2: number; color: string; w?: number; pattern?: number[] }) {
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const segs: React.ReactNode[] = [];
  let t = 0, i = 0;
  while (t < len) {
    const d = pattern[i % pattern.length];
    if (i % 2 === 0) { const e = Math.min(len, t + d); segs.push(<line key={i} x1={x1 + ux * t} y1={y1 + uy * t} x2={x1 + ux * e} y2={y1 + uy * e} />); }
    t += d; i++;
  }
  return <g stroke={color} strokeWidth={w} strokeLinecap="round">{segs}</g>;
}

/* ---------------------------------------------------------------- dụng cụ học tập */
const Pencil = ({ x, y, len, rot, body }: { x: number; y: number; len: number; rot: number; body: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={INK} strokeWidth="0.3" strokeLinejoin="round">
    <rect x="0" y="-1.3" width={len} height="2.6" fill={body} /><rect x="-1.6" y="-1.3" width="1.6" height="2.6" fill="#f9a8b8" />
    <path d={`M${len} -1.3 L${len + 3} 0 L${len} 1.3Z`} fill="#fde7c2" /><path d={`M${len + 2} -0.45 L${len + 3} 0 L${len + 2} 0.45Z`} fill={INK} />
  </g>
);
const Books = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 14})`} stroke={INK} strokeWidth="0.35">
    <rect x="-7" y="1" width="14" height="3" rx="0.6" fill={P.blue} /><rect x="-6" y="-2" width="12.5" height="3" rx="0.6" fill={P.pink} />
    <rect x="-6.5" y="-5" width="13" height="3" rx="0.6" fill={P.yellow} />
    <line x1="-4.5" y1="2.5" x2="3" y2="2.5" stroke="#fff" strokeWidth="0.5" /><line x1="-4" y1="-0.5" x2="3.5" y2="-0.5" stroke="#fff" strokeWidth="0.5" />
    <line x1="-4.5" y1="-3.5" x2="3" y2="-3.5" stroke="#fff" strokeWidth="0.5" />
  </g>
);
const Plane = ({ x, y, s, rot = -15 }: { x: number; y: number; s: number; rot?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 10})`} stroke={INK} strokeWidth="0.4" strokeLinejoin="round">
    <path d="M-5 0 L5 -3 L-1 2 Z" fill="#fff" /><path d="M-1 2 L0 4 L1 0.6" fill={P.blue} />
  </g>
);
const Ruler = ({ x, y, len, rot }: { x: number; y: number; len: number; rot: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={INK} strokeWidth="0.3">
    <rect x="0" y="-1.6" width={len} height="3.2" rx="0.4" fill={P.yellow} />
    {Array.from({ length: Math.floor(len / 1.5) }, (_, i) => <line key={i} x1={1 + i * 1.5} y1="-1.6" x2={1 + i * 1.5} y2={i % 2 ? -0.6 : 0} strokeWidth="0.2" />)}
  </g>
);
const Cup = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 12})`} stroke={INK} strokeWidth="0.35" strokeLinejoin="round">
    <rect x="-1.2" y="-10" width="1.6" height="8" fill={P.pink} transform="rotate(-12)" /><rect x="1" y="-11" width="1.6" height="9" fill={P.blue} transform="rotate(8)" />
    <rect x="-3.4" y="-9" width="1.6" height="7" fill={P.yellow} transform="rotate(-25)" />
    <path d="M-5 -2 L5 -2 L4 6 L-4 6Z" fill={P.mint} /><Heart x={0} y={2} s={3} fill="#fff" />
  </g>
);
const Bulb = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 8})`} stroke={INK} strokeWidth="0.35">
    <circle cx="0" cy="-1" r="3" fill={P.yellow} /><rect x="-1.4" y="1.8" width="2.8" height="2" rx="0.4" fill="#cbd5e1" />
    {[-60, -30, 0, 30, 60].map((a) => <line key={a} x1="0" y1="-5" x2="0" y2="-6.3" transform={`rotate(${a} 0 -1)`} />)}
  </g>
);

/* ---------------------------------------------------------------- bạn thú (mặt tròn đơn giản, tự vẽ) */
const Bunny = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 12})`} stroke={INK} strokeWidth="0.35" strokeLinejoin="round">
    <ellipse cx="-2.2" cy="-6" rx="1.6" ry="4" fill="#fff" /><ellipse cx="2.2" cy="-6" rx="1.6" ry="4" fill="#fff" />
    <ellipse cx="-2.2" cy="-6" rx="0.7" ry="2.6" fill={P.pink} stroke="none" /><ellipse cx="2.2" cy="-6" rx="0.7" ry="2.6" fill={P.pink} stroke="none" />
    <ellipse cx="0" cy="0.5" rx="5" ry="4.2" fill="#fff" />
    <circle cx="-1.8" cy="0" r="0.5" fill={INK} stroke="none" /><circle cx="1.8" cy="0" r="0.5" fill={INK} stroke="none" />
    <ellipse cx="-3" cy="1.6" rx="0.9" ry="0.5" fill={P.pink} stroke="none" /><ellipse cx="3" cy="1.6" rx="0.9" ry="0.5" fill={P.pink} stroke="none" />
    <path d="M-0.6 1.2 Q0 1.9 0.6 1.2" fill="none" />
  </g>
);
const Bear = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 12})`} stroke={INK} strokeWidth="0.35">
    <circle cx="-3.6" cy="-3.4" r="1.8" fill="#e3b98f" /><circle cx="3.6" cy="-3.4" r="1.8" fill="#e3b98f" />
    <circle cx="0" cy="0" r="5" fill="#e3b98f" /><ellipse cx="0" cy="1.6" rx="2.2" ry="1.6" fill="#f6e3cf" />
    <circle cx="-1.8" cy="-0.6" r="0.5" fill={INK} stroke="none" /><circle cx="1.8" cy="-0.6" r="0.5" fill={INK} stroke="none" />
    <ellipse cx="0" cy="1" rx="0.6" ry="0.45" fill={INK} stroke="none" />
  </g>
);
const Chick = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 12})`} stroke={INK} strokeWidth="0.35" strokeLinejoin="round">
    <ellipse cx="0" cy="0.6" rx="5" ry="4.6" fill="#fde68a" /><path d="M-1 -4 q1 -2 2 0" fill="none" />
    <circle cx="-1.6" cy="-0.4" r="0.45" fill={INK} stroke="none" /><circle cx="1.6" cy="-0.4" r="0.45" fill={INK} stroke="none" />
    <path d="M-0.8 0.8 L0 1.8 L0.8 0.8Z" fill="#fb923c" />
  </g>
);
const Berry = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 6})`} stroke={INK} strokeWidth="0.3">
    <path d="M0 3 C-3 1 -2.6 -2 0 -2 C2.6 -2 3 1 0 3Z" fill="#f87171" /><path d="M-1.4 -2 L0 -3 L1.4 -2 L0 -1.4Z" fill="#4ade80" />
    {[[-0.8, 0], [0.8, 0], [0, 1.2], [0, -0.9]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="0.18" fill="#fff" stroke="none" />)}
  </g>
);

/* ---------------------------------------------------------------- mùa đông */
const Snowman = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 20})`} stroke={INK} strokeWidth="0.35" strokeLinejoin="round">
    <circle cx="0" cy="4" r="6" fill="#fff" /><circle cx="0" cy="-4.5" r="4.2" fill="#fff" />
    <path d="M-4.2 -1.6 Q0 0.4 4.2 -1.6 L4.6 0 Q0 2 -4.6 0Z" fill="#f87171" /><rect x="2" y="-0.4" width="1.6" height="4" fill="#f87171" />
    <path d="M-3.2 -8 Q0 -12 3.2 -8Z" fill={P.blue} /><circle cx="0" cy="-11" r="0.9" fill="#fff" />
    <circle cx="-1.4" cy="-5" r="0.45" fill={INK} stroke="none" /><circle cx="1.4" cy="-5" r="0.45" fill={INK} stroke="none" />
    <path d="M0 -4 L2.4 -3.5 L0 -3.1Z" fill="#fb923c" />
    <circle cx="0" cy="2.6" r="0.5" fill={INK} stroke="none" /><circle cx="0" cy="5" r="0.5" fill={INK} stroke="none" />
  </g>
);
const Pine = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 16})`} stroke={INK} strokeWidth="0.35" strokeLinejoin="round">
    <path d="M0 -8 L4 -2 L2 -2 L6 4 L-6 4 L-2 -2 L-4 -2Z" fill="#86c9a4" /><rect x="-1" y="4" width="2" height="3" fill="#b08968" />
    <path d="M-3.6 -1 q1.8 1.2 3.6 0 q1.8 1.2 3.6 0" fill="none" stroke="#fff" strokeWidth="0.5" />
  </g>
);

/* ---------------------------------------------------------------- hoa đào */
function Blossom({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#db7093" strokeWidth={0.22}>
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d={`M0 0 C${-r * 0.6} ${-r * 0.4} ${-r * 0.55} ${-r} ${-r * 0.15} ${-r} Q0 ${-r * 0.85} ${r * 0.15} ${-r} C${r * 0.55} ${-r} ${r * 0.6} ${-r * 0.4} 0 0Z`} fill="#fbcfe0" transform={`rotate(${a})`} />)}
      <circle r={r * 0.22} fill="#f472b6" stroke="none" />
    </g>
  );
}
const Petal = ({ x, y, r, rot }: { x: number; y: number; r: number; rot: number }) => (
  <ellipse cx={x} cy={y} rx={r} ry={r * 0.55} fill="#fbcfe0" stroke="#db7093" strokeWidth="0.15" transform={`rotate(${rot} ${x} ${y})`} />
);
const Butterfly = ({ x, y, s, c1, c2 }: { x: number; y: number; s: number; c1: string; c2: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 10}) rotate(-20)`} stroke={INK} strokeWidth="0.3">
    <path d="M0 0 C-3 -5 -6 -4 -5 -1 C-6 2 -3 2 0 0Z" fill={c1} /><path d="M0 0 C3 -5 6 -4 5 -1 C6 2 3 2 0 0Z" fill={c1} />
    <path d="M0 0 C-2 3 -4 4 -3 1.5Z" fill={c2} /><path d="M0 0 C2 3 4 4 3 1.5Z" fill={c2} />
    <path d="M0 -0.5 L0 2" strokeWidth="0.6" /><path d="M0 -0.5 q-1 -2 -2 -2.4 M0 -0.5 q1 -2 2 -2.4" fill="none" />
  </g>
);

/* ---------------------------------------------------------------- khung từng chủ đề */
type FrameProps = { W: number; H: number; uid: string };

function Pastel({ W, H }: FrameProps) {
  return (
    <g>
      <Bars x1={30} y1={5} x2={W - 26} y2={5} color={P.blue} /><Bars x1={5} y1={30} x2={5} y2={H - 26} color={P.blue} pattern={[30, 3, 4, 3, 18, 3, 2, 3]} />
      <Bars x1={W - 5} y1={24} x2={W - 5} y2={H - 30} color={P.blue} pattern={[18, 3, 2, 3, 30, 3, 5, 3]} /><Bars x1={26} y1={H - 5} x2={W - 30} y2={H - 5} color={P.blue} />
      {/* góc trên trái: hoa cúc + nơ + tim + sao */}
      <Flower5 x={11} y={11} r={7.5} fill="#fff" center={P.yellow} /><Bow x={8} y={25} s={9} fill={P.pink} />
      <Heart x={23} y={6.5} s={6.5} fill={P.pink} /><Star x={31} y={7} r={3} fill={P.yellow} /><Heart x={6} y={35} s={4.2} fill={P.lilac} /><Sparkle x={16} y={20} r={1.6} fill={P.pink} />
      {/* rải dọc các cạnh */}
      <Sparkle x={W - 24} y={7} r={2} fill={INK} /><Star x={W - 15} y={8} r={3.4} fill={P.yellow} /><Heart x={W - 6.5} y={19} s={6} fill={P.pink} />
      <Heart x={5.5} y={H * 0.42} s={5.5} fill={P.blue} /><Sparkle x={8} y={H * 0.55} r={1.6} fill={P.pink} /><Star x={6} y={H * 0.6} r={3} fill={P.yellow} />
      <Sparkle x={W - 6} y={H * 0.36} r={1.7} fill={INK} /><Star x={W - 5.5} y={H * 0.4} r={2.9} fill={P.yellow} /><Heart x={W - 5.5} y={H * 0.56} s={5.5} fill={P.lilac} />
      {[[16, 4], [W - 30, 4.5], [4, H * 0.3], [W - 4, H * 0.7], [W * 0.5, H - 4], [W * 0.3, 4]].map(([a, b], i) => <Dot key={i} x={a} y={b} r={0.55} fill={i % 2 ? P.pink : P.peach} />)}
      {/* góc dưới phải: tim to + sao + lấp lánh */}
      <Heart x={W - 12} y={H - 11} s={8.5} fill={P.pink} /><Star x={W - 24} y={H - 6.5} r={3.6} fill={P.yellow} /><Sparkle x={W - 6} y={H - 24} r={2} fill={P.pink} />
      <Heart x={W - 5.5} y={H - 31} s={4.2} fill={P.blue} /><Star x={W * 0.42} y={H - 5} r={3} fill={P.yellow} /><Sparkle x={W * 0.48} y={H - 5} r={1.6} fill={P.pink} />
      <Heart x={8} y={H - 9} s={4.6} fill={P.lilac} /><Sparkle x={14} y={H - 6} r={1.6} fill={P.blue} /><Star x={7} y={H - 18} r={2.2} fill={P.yellow} />
    </g>
  );
}

function HocTap({ W, H }: FrameProps) {
  const c = '#a07856';
  return (
    <g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="4" fill="none" stroke={c} strokeWidth="0.4" strokeDasharray="2.4 1.6" strokeLinecap="round" />
      <Books x={15} y={11} s={21} /><Pencil x={5} y={34} len={17} rot={-80} body={P.yellow} />
      <Plane x={W - 15} y={10} s={15} /><path d={`M${W - 34} 14 q6 -6 12 -3`} fill="none" stroke={c} strokeWidth="0.3" strokeDasharray="1 1" />
      <Star x={W - 6} y={22} r={1.8} fill={P.yellow} /><Sparkle x={W - 28} y={6} r={1.2} fill={c} />
      <Cup x={12} y={H - 14} s={20} /><Ruler x={W - 36} y={H - 7} len={24} rot={0} /><Bulb x={W - 8} y={H - 19} s={11} />
      <Pencil x={W - 5} y={H - 56} len={20} rot={95} body={P.pink} />
      {[[5, H * 0.35], [W - 5, H * 0.45], [5, H * 0.65], [W * 0.5, 5], [W * 0.6, H - 5]].map(([a, b], i) => <Star key={i} x={a} y={b} r={2} fill={[P.yellow, P.pink, P.blue, P.mint, P.lilac][i]} />)}
    </g>
  );
}

function HoaDao({ W, H }: FrameProps) {
  const branch = '#8b5e3c';
  return (
    <g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="5" fill="none" stroke="#f3b6cb" strokeWidth="0.35" strokeDasharray="0.1 1.6" strokeLinecap="round" />
      <path d={`M2 3 Q${W * 0.18} 9 ${W * 0.42} 5 M${W * 0.18} 7 q4 -4 9 -3`} fill="none" stroke={branch} strokeWidth="1.1" strokeLinecap="round" />
      <Blossom x={10} y={8} r={5.6} /><Blossom x={23} y={10} r={4.6} /><Blossom x={38} y={6.5} r={3.8} /><Blossom x={W * 0.42} y={5} r={3.2} /><Blossom x={6} y={20} r={3.4} />
      <circle cx={28} cy={4} r={1.1} fill="#f472b6" /><circle cx={46} cy={7} r={0.9} fill="#f472b6" />
      <path d={`M${W - 2} ${H - 3} Q${W * 0.82} ${H - 9} ${W * 0.6} ${H - 5}`} fill="none" stroke={branch} strokeWidth="0.9" strokeLinecap="round" />
      <Blossom x={W - 10} y={H - 8} r={5.6} /><Blossom x={W - 24} y={H - 10} r={4.4} /><Blossom x={W * 0.62} y={H - 5} r={3.2} /><Blossom x={W - 6} y={H - 20} r={3.4} />
      {[[5, 40, 20], [7, 70, -30], [4, H * 0.45, 40], [6, H * 0.7, -10], [W - 5, 50, 30], [W - 6, H * 0.4, -20], [W - 4, H * 0.62, 50], [W * 0.75, 5, 10], [W * 0.3, H - 5, -40]].map(([a, b, r], i) => <Petal key={i} x={a} y={b} r={2} rot={r} />)}
      <Butterfly x={W - 13} y={13} s={15} c1={P.pink} c2={P.lilac} />
    </g>
  );
}

function MuaDong({ W, H }: FrameProps) {
  // viền dạng mây (gợn tròn) xanh nhạt
  const m = 6, seg = 7, w = W - m * 2, h = H - m * 2;
  const nx = Math.round(w / seg), ny = Math.round(h / seg), sx = w / nx, sy = h / ny;
  let d = `M${m} ${m}`;
  for (let i = 0; i < nx; i++) d += ` a${sx / 2} ${sx / 2.4} 0 0 1 ${sx} 0`;
  for (let i = 0; i < ny; i++) d += ` a${sy / 2.4} ${sy / 2} 0 0 1 0 ${sy}`;
  for (let i = 0; i < nx; i++) d += ` a${sx / 2} ${sx / 2.4} 0 0 1 ${-sx} 0`;
  for (let i = 0; i < ny; i++) d += ` a${sy / 2.4} ${sy / 2} 0 0 1 0 ${-sy}`;
  return (
    <g>
      <path d={d + 'Z'} fill="none" stroke="#9cc3ec" strokeWidth="0.5" />
      {[[11, 11, 4.2], [25, 6, 2.4], [6, 24, 2.2], [W - 11, 11, 4.4], [W - 26, 6, 2.2], [W - 6, 25, 2.2], [5, H * 0.35, 2.6], [W - 5, H * 0.3, 2.8], [5, H * 0.6, 2.2], [W - 5, H * 0.58, 2.4], [W * 0.5, 4, 2], [W * 0.5, H - 4, 2]].map(([a, b, r], i) => <Snowflake key={i} x={a} y={b} r={r} color={i % 2 ? '#7fb2e5' : '#a5b4fc'} />)}
      <Snowman x={13} y={H - 16} s={28} /><Pine x={W - 11} y={H - 14} s={21} /><Pine x={W - 24} y={H - 9} s={13} />
      <Star x={W * 0.3} y={5} r={1.6} fill={P.yellow} /><Star x={W * 0.7} y={H - 5} r={1.6} fill={P.yellow} />
    </g>
  );
}

function ConVat({ W, H }: FrameProps) {
  const hearts: React.ReactNode[] = [];
  const along = (x1: number, y1: number, x2: number, y2: number, step: number, key: string) => {
    const n = Math.floor(Math.hypot(x2 - x1, y2 - y1) / step);
    for (let i = 1; i < n; i++) if (i % 4 === 0) hearts.push(<Heart key={`${key}${i}`} x={x1 + ((x2 - x1) * i) / n} y={y1 + ((y2 - y1) * i) / n} s={3.6} fill={P.pink} />);
  };
  along(24, 6, W - 24, 6, 6, 't'); along(24, H - 6, W - 24, H - 6, 6, 'b'); along(6, 24, 6, H - 24, 6, 'l'); along(W - 6, 24, W - 6, H - 24, 6, 'r');
  return (
    <g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="5" fill="none" stroke="#f3a6bd" strokeWidth="0.4" strokeDasharray="1.2 1.4" strokeLinecap="round" />
      {hearts}
      <Bunny x={12} y={13} s={19} /><Berry x={25} y={6.5} s={6.5} /><Bear x={W - 12} y={12} s={17} /><Bow x={W - 26} y={6.5} s={8} fill={P.pink} />
      <Chick x={12} y={H - 11} s={17} /><Bunny x={W - 12} y={H - 12} s={19} /><Berry x={W - 26} y={H - 6.5} s={6.5} /><Heart x={24} y={H - 6} s={4} fill={P.pink} />
    </g>
  );
}

function Caro({ W, H, uid, color }: FrameProps & { color: string }) {
  const pat = `${uid}-caro`;
  const blob = (flip: boolean) => {
    // mảng caro ôm góc, mép trong lượn sóng
    const d = 'M0 0 H42 C37 7 32 7 27 11 C21 15 17 20 13 27 C10 34 7 37 0 42 Z';
    return <path d={d} fill={`url(#${pat})`} transform={flip ? `translate(${W} ${H}) rotate(180)` : undefined} />;
  };
  return (
    <g>
      <defs>
        <pattern id={pat} width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="#fff" /><rect width="1.5" height="3" fill={color} opacity=".38" /><rect width="3" height="1.5" fill={color} opacity=".38" />
        </pattern>
      </defs>
      {blob(false)}{blob(true)}
      <path d={`M38 3 C${W * 0.4} 9 ${W * 0.55} 1 ${W - 30} 5`} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity=".7" />
      <path d={`M3 42 C9 ${H * 0.4} 1 ${H * 0.6} 5 ${H - 30}`} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity=".7" />
      <path d={`M${W - 3} ${H - 42} C${W - 9} ${H * 0.6} ${W - 1} ${H * 0.4} ${W - 5} 30`} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity=".7" />
      <Star x={15} y={14} r={6} fill={color} stroke={INK} rot={-12} /><Star x={W - 15} y={H - 14} r={6} fill={color} stroke={INK} rot={14} />
      <text x={W - 18} y={15} fontSize="9" fontWeight="800" fill={color} fontFamily="Arial, sans-serif">!!</text>
      <Sparkle x={W - 6} y={26} r={1.6} fill={color} /><Sparkle x={8} y={H - 22} r={1.6} fill={color} />
      {[[W * 0.5, 5], [5, H * 0.5], [W - 5, H * 0.5], [W * 0.5, H - 5]].map(([a, b], i) => <Star key={i} x={a} y={b} r={1.4} fill="#fff" stroke={color} />)}
    </g>
  );
}

function ToiGian({ W, H }: FrameProps) {
  const c = '#6b7280';
  return (
    <g fill="none" stroke={c}>
      <rect x="5" y="5" width={W - 10} height={H - 10} rx="4" strokeWidth="0.45" />
      <rect x="7" y="7" width={W - 14} height={H - 14} rx="3" strokeWidth="0.2" strokeDasharray="1.2 1.2" />
      <g stroke="none" fill={c}>
        <Sparkle x={5} y={5} r={2.2} fill={c} /><Sparkle x={W - 5} y={5} r={2.2} fill={c} /><Sparkle x={5} y={H - 5} r={2.2} fill={c} /><Sparkle x={W - 5} y={H - 5} r={2.2} fill={c} />
      </g>
      <Star x={W / 2} y={5} r={1.6} fill="#fff" stroke={c} /><Star x={W / 2} y={H - 5} r={1.6} fill="#fff" stroke={c} />
    </g>
  );
}

/** Vẽ khung trang theo chủ đề (vẽ trước lưới ô li: đường kẻ nằm trên hoạ tiết, chữ nằm trên cùng) */
export function PageFrame({ id, W, H }: { id: string; W: number; H: number }) {
  const uid = `fr${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const p = { W, H, uid };
  switch (id) {
    case 'pastel': return <Pastel {...p} />;
    case 'hoc-tap': return <HocTap {...p} />;
    case 'hoa-dao': return <HoaDao {...p} />;
    case 'mua-dong': return <MuaDong {...p} />;
    case 'con-vat': return <ConVat {...p} />;
    case 'caro-xanh': return <Caro {...p} color="#4f86d6" />;
    case 'caro-do': return <Caro {...p} color="#dc4b4b" />;
    case 'toi-gian': return <ToiGian {...p} />;
    default: return null;
  }
}
