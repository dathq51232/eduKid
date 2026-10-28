// Hoa văn bo góc vở kiểu hoa thật (tranh vẽ có đổ bóng màu cánh hoa, gân lá) — không dùng ảnh ngoài.
// Vẽ trong ô 100 x 100, dáng cho góc trên-trái: cành hoa ôm theo mép trên và mép trái; góc khác lật gương.
// Màu gradient khai báo trong <FloralDefs /> (mỗi SVG có dùng hoa văn đều chèn một lần; id giống nhau nên trùng không sao).
import { createContext, useContext, useId, type ReactNode } from 'react';

// Mỗi SVG dùng tiền tố id riêng cho gradient: id trùng giữa nhiều SVG thì trình duyệt lấy cái đầu tiên —
// nếu cái đó nằm trong vùng đang ẩn (vd. lúc in) thì hoa mất màu.
const Prefix = createContext('fl');
const useU = () => { const p = useContext(Prefix); return (n: string) => `url(#${p}-${n})`; };

/** Bọc SVG có hoa văn: tạo tiền tố id riêng + khai báo màu */
export function FloralScope({ children }: { children: ReactNode }) {
  const p = `fl${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <Prefix.Provider value={p}><FloralDefs />{children}</Prefix.Provider>;
}

export const FLORALS: { id: string; label: string }[] = [
  { id: 'hong', label: 'Hoa hồng' }, { id: 'dao', label: 'Hoa đào' }, { id: 'mai', label: 'Hoa mai' }, { id: 'phuong', label: 'Hoa phượng' },
  { id: 'cuc', label: 'Hoa cúc' }, { id: 'sen', label: 'Hoa sen' }, { id: 'huong-duong', label: 'Hướng dương' }, { id: 'oai-huong', label: 'Oải hương' },
];

function RG({ id, stops, cx = 0.5, cy = 0.85, r = 0.85 }: { id: string; stops: [number, string][]; cx?: number; cy?: number; r?: number }) {
  const p = useContext(Prefix);
  return (
  <radialGradient id={`${p}-${id}`} cx={cx} cy={cy} r={r}>{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</radialGradient>
  );
}

export function FloralDefs() {
  const p = useContext(Prefix);
  return (
    <defs>
      <RG id="rose" stops={[[0, '#9f1239'], [0.45, '#e11d48'], [1, '#fda4af']]} />
      <RG id="rose2" stops={[[0, '#881337'], [0.6, '#be123c'], [1, '#fb7185']]} />
      <RG id="peach" stops={[[0, '#db2777'], [0.35, '#f9a8d4'], [1, '#fff1f6']]} />
      <RG id="mai" stops={[[0, '#ca8a04'], [0.35, '#facc15'], [1, '#fef9c3']]} />
      <RG id="red" stops={[[0, '#991b1b'], [0.4, '#dc2626'], [1, '#f87171']]} />
      <RG id="white" stops={[[0, '#cbd5e1'], [0.3, '#f8fafc'], [1, '#ffffff']]} />
      <RG id="lotus" stops={[[0, '#be185d'], [0.5, '#f472b6'], [1, '#fdf2f8']]} cy={0.1} r={1} />
      <RG id="sun" stops={[[0, '#b45309'], [0.35, '#f59e0b'], [1, '#fde047']]} />
      <RG id="violet" stops={[[0, '#5b21b6'], [0.6, '#8b5cf6'], [1, '#c4b5fd']]} cx={0.4} cy={0.4} r={0.7} />
      <RG id="eye" stops={[[0, '#fde68a'], [0.55, '#f59e0b'], [1, '#92400e']]} cy={0.4} r={0.6} />
      <RG id="seed" stops={[[0, '#78350f'], [0.7, '#451a03'], [1, '#292524']]} cy={0.45} r={0.6} />
      <linearGradient id={`${p}-leaf`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4ade80" /><stop offset=".55" stopColor="#16a34a" /><stop offset="1" stopColor="#14532d" /></linearGradient>
      <linearGradient id={`${p}-leaf2`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#65a30d" /><stop offset="1" stopColor="#a3e635" /></linearGradient>
      <linearGradient id={`${p}-lotusleaf`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#86efac" /><stop offset="1" stopColor="#15803d" /></linearGradient>
    </defs>
  );
}

/* ----------------------------------------------------------- nét vẽ dùng chung */
/** Cánh hoa hướng lên, gốc ở (0,0): dài L, rộng W; notch = khía ở đầu cánh (hoa đào) */
const petalD = (L: number, W: number, notch = false) => notch
  ? `M0 0 C${-W} ${-L * 0.35} ${-W * 0.9} ${-L} ${-W * 0.25} ${-L} Q0 ${-L * 0.88} ${W * 0.25} ${-L} C${W * 0.9} ${-L} ${W} ${-L * 0.35} 0 0Z`
  : `M0 0 C${-W} ${-L * 0.3} ${-W * 0.85} ${-L} 0 ${-L} C${W * 0.85} ${-L} ${W} ${-L * 0.3} 0 0Z`;

function Leaf({ x, y, a, L, W = L * 0.38, fill }: { x: number; y: number; a: number; L: number; W?: number; fill?: string }) {
  const u = useU();
  const f = fill ?? u('leaf');
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 C${L * 0.3} ${-W} ${L * 0.72} ${-W * 0.9} ${L} 0 C${L * 0.72} ${W * 0.9} ${L * 0.3} ${W} 0 0Z`} fill={f} stroke="#14532d" strokeWidth="0.35" strokeOpacity=".6" />
      <path d={`M0 0 L${L * 0.95} 0`} stroke="#dcfce7" strokeWidth="0.45" strokeOpacity=".8" />
      {[0.3, 0.5, 0.7].map((k) => (
        <path key={k} d={`M${L * k} 0 l${L * 0.14} ${-W * 0.55} M${L * k} 0 l${L * 0.14} ${W * 0.55}`} stroke="#dcfce7" strokeWidth="0.3" strokeOpacity=".55" />
      ))}
    </g>
  );
}

/** Hoa 5 cánh (đào, mai, phượng...) + nhị */
function Blossom({ x, y, r, fill, notch, stamen = '#facc15', a = 0, stroke = '#00000022' }: { x: number; y: number; r: number; fill: string; notch?: boolean; stamen?: string; a?: number; stroke?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      {[0, 72, 144, 216, 288].map((d) => <path key={d} d={petalD(r, r * 0.62, notch)} fill={fill} stroke={stroke} strokeWidth="0.3" transform={`rotate(${d})`} />)}
      {Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30 * Math.PI) / 180, l = r * (0.42 + (i % 3) * 0.08);
        return (
          <g key={i}>
            <line x1="0" y1="0" x2={l * Math.cos(t)} y2={l * Math.sin(t)} stroke={stamen} strokeWidth="0.35" strokeOpacity=".9" />
            <circle cx={l * Math.cos(t)} cy={l * Math.sin(t)} r={r * 0.05} fill="#b45309" />
          </g>
        );
      })}
      <circle r={r * 0.14} fill="#a16207" />
    </g>
  );
}

function Bud({ x, y, a, s, fill }: { x: number; y: number; a: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 C${-s * 0.5} ${-s * 0.4} ${-s * 0.35} ${-s} 0 ${-s * 1.15} C${s * 0.35} ${-s} ${s * 0.5} ${-s * 0.4} 0 0Z`} fill={fill} stroke="#00000022" strokeWidth="0.3" />
      <path d={`M0 0.5 C${-s * 0.45} ${-s * 0.1} ${-s * 0.3} ${-s * 0.45} ${-s * 0.1} ${-s * 0.55} M0 0.5 C${s * 0.45} ${-s * 0.1} ${s * 0.3} ${-s * 0.45} ${s * 0.1} ${-s * 0.55}`} fill="none" stroke="#15803d" strokeWidth="0.9" />
    </g>
  );
}

function Rose({ x, y, r, a = 0 }: { x: number; y: number; r: number; a?: number }) {
  const u = useU();
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      {[0, 72, 144, 216, 288].map((d) => <path key={d} d={petalD(r, r * 0.78)} fill={u('rose')} stroke="#881337" strokeOpacity=".35" strokeWidth="0.3" transform={`rotate(${d})`} />)}
      {[36, 108, 180, 252, 324].map((d) => <path key={d} d={petalD(r * 0.72, r * 0.62)} fill={u('rose2')} stroke="#881337" strokeOpacity=".4" strokeWidth="0.3" transform={`rotate(${d})`} />)}
      <circle r={r * 0.42} fill="#be123c" />
      <path d={`M${-r * 0.3} ${r * 0.05} C${-r * 0.3} ${-r * 0.35} ${r * 0.32} ${-r * 0.35} ${r * 0.3} ${r * 0.02} C${r * 0.28} ${r * 0.3} ${-r * 0.15} ${r * 0.32} ${-r * 0.16} ${r * 0.02} C${-r * 0.16} ${-r * 0.15} ${r * 0.12} ${-r * 0.16} ${r * 0.12} ${r * 0.02}`}
        fill="none" stroke="#fda4af" strokeWidth={r * 0.06} strokeLinecap="round" />
      <path d={`M${-r * 0.42} ${-r * 0.1} Q${-r * 0.1} ${-r * 0.62} ${r * 0.42} ${-r * 0.12}`} fill="none" stroke="#fecdd3" strokeWidth={r * 0.05} strokeOpacity=".7" />
    </g>
  );
}

function Daisy({ x, y, r, a = 0 }: { x: number; y: number; r: number; a?: number }) {
  const u = useU();
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      {Array.from({ length: 18 }, (_, i) => <ellipse key={i} cx="0" cy={-r * 0.55} rx={r * 0.14} ry={r * 0.5} fill={u('white')} stroke="#94a3b8" strokeWidth="0.25" transform={`rotate(${i * 20})`} />)}
      <circle r={r * 0.3} fill={u('eye')} />
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={r * 0.17 * Math.cos(i * 2.4)} cy={r * 0.17 * Math.sin(i * 2.4)} r={r * 0.03} fill="#92400e" />)}
    </g>
  );
}

function Sunflower({ x, y, r }: { x: number; y: number; r: number }) {
  const u = useU();
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 16 }, (_, i) => <path key={`o${i}`} d={petalD(r, r * 0.26)} fill={u('sun')} stroke="#b45309" strokeOpacity=".4" strokeWidth="0.3" transform={`rotate(${i * 22.5})`} />)}
      {Array.from({ length: 16 }, (_, i) => <path key={`i${i}`} d={petalD(r * 0.8, r * 0.22)} fill={u('sun')} stroke="#b45309" strokeOpacity=".4" strokeWidth="0.3" transform={`rotate(${i * 22.5 + 11})`} />)}
      <circle r={r * 0.42} fill={u('seed')} />
      {Array.from({ length: 34 }, (_, i) => { const rr = r * 0.38 * Math.sqrt((i + 0.5) / 34), t = i * 2.39996; return <circle key={i} cx={rr * Math.cos(t)} cy={rr * Math.sin(t)} r={r * 0.025} fill="#a16207" fillOpacity=".8" />; })}
    </g>
  );
}

/** Lá phượng (lá kép lông chim) */
function Fern({ x, y, a, L }: { x: number; y: number; a: number; L: number }) {
  const u = useU();
  const n = 12;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 Q${L * 0.5} ${-L * 0.06} ${L} 0`} stroke="#4d7c0f" strokeWidth="0.6" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 1) / (n + 1), px = L * t, s = L * 0.075 * (1 - t * 0.4);
        return (
          <g key={i}>
            <ellipse cx={px} cy={-s * 0.9} rx={s * 0.35} ry={s} fill={u('leaf2')} transform={`rotate(-25 ${px} ${-s * 0.9})`} />
            <ellipse cx={px} cy={s * 0.9} rx={s * 0.35} ry={s} fill={u('leaf2')} transform={`rotate(25 ${px} ${s * 0.9})`} />
          </g>
        );
      })}
    </g>
  );
}

function Lavender({ x, y, a, L }: { x: number; y: number; a: number; L: number }) {
  const u = useU();
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 L${L} 0`} stroke="#4d7c0f" strokeWidth="0.7" />
      {Array.from({ length: 11 }, (_, i) => {
        const px = L * (0.42 + i * 0.055), s = 2.1 - i * 0.08;
        return (
          <g key={i}>
            <ellipse cx={px} cy={-1.2} rx={s * 0.75} ry={s} fill={u('violet')} transform={`rotate(-30 ${px} -1.2)`} />
            <ellipse cx={px + 1} cy={1.2} rx={s * 0.75} ry={s} fill={u('violet')} transform={`rotate(30 ${px + 1} 1.2)`} />
          </g>
        );
      })}
      <Leaf x={L * 0.12} y={0} a={-28} L={L * 0.28} W={2} fill={u('leaf2')} />
      <Leaf x={L * 0.2} y={0} a={26} L={L * 0.26} W={2} fill={u('leaf2')} />
    </g>
  );
}

/** Cành ôm góc: chạy dọc mép trên rồi vòng xuống mép trái */
const STEM = 'M100 7 C60 3 30 4 15 15 C4 30 3 60 7 100';
const BRANCH = 'M100 9 C62 2 34 2 18 16 C5 32 2 62 9 100';

function Branch({ color = '#5b3a29' }: { color?: string }) {
  return (<g fill="none" strokeLinecap="round">
    <path d={BRANCH} stroke={color} strokeWidth="2.6" />
    <path d="M60 4 q8 -1 14 4 M5 60 q-1 8 4 14 M30 6 q-3 -4 -1 -9 M6 30 q-4 -3 -9 -1" stroke={color} strokeWidth="1.2" />
    <path d={BRANCH} stroke="#a8836b" strokeWidth="0.6" strokeOpacity=".7" transform="translate(-0.6 -0.6)" />
  </g>);
}

export function Floral({ id }: { id: string }): ReactNode {
  const u = useU();
  switch (id) {
    case 'hong':
      return (<g>
        <path d={STEM} stroke="#166534" strokeWidth="1.4" fill="none" />
        {[[40, 4, 160, 13], [62, 4, 20, 12], [84, 6, 170, 10], [4, 40, -70, 13], [4, 62, 110, 12], [6, 84, -80, 10], [26, 10, 200, 11], [10, 26, 70, 11]].map(([x, y, a, L], i) => <Leaf key={i} x={x} y={y} a={a} L={L} />)}
        <Rose x={20} y={20} r={15} a={10} />
        <Rose x={52} y={10} r={8.5} a={40} />
        <Rose x={10} y={52} r={8.5} a={-20} />
        <Bud x={78} y={8} a={80} s={6} fill={u('rose')} />
        <Bud x={8} y={78} a={170} s={6} fill={u('rose')} />
      </g>);
    case 'dao':
      return (<g>
        <Branch />
        {[[46, 3, 200, 8], [6, 46, 60, 8], [70, 4, 30, 7], [4, 70, 120, 7]].map(([x, y, a, L], i) => <Leaf key={i} x={x} y={y} a={a} L={L} />)}
        <Blossom x={20} y={20} r={12} fill={u('peach')} notch stamen="#be185d" />
        <Blossom x={50} y={10} r={8} fill={u('peach')} notch stamen="#be185d" a={20} />
        <Blossom x={10} y={50} r={8} fill={u('peach')} notch stamen="#be185d" a={-15} />
        <Blossom x={78} y={8} r={6} fill={u('peach')} notch stamen="#be185d" a={40} />
        <Blossom x={8} y={78} r={6} fill={u('peach')} notch stamen="#be185d" a={10} />
        <Bud x={92} y={9} a={70} s={4} fill={u('peach')} /><Bud x={9} y={92} a={190} s={4} fill={u('peach')} />
        <Bud x={34} y={4} a={10} s={3.5} fill={u('peach')} /><Bud x={4} y={34} a={-100} s={3.5} fill={u('peach')} />
      </g>);
    case 'mai':
      return (<g>
        <Branch color="#3f2a1d" />
        {[[44, 3, 200, 7], [6, 44, 60, 7], [68, 4, 20, 6], [4, 68, 110, 6]].map(([x, y, a, L], i) => <Leaf key={i} x={x} y={y} a={a} L={L} fill={u('leaf2')} />)}
        <Blossom x={20} y={20} r={12} fill={u('mai')} stamen="#b45309" a={8} />
        <Blossom x={50} y={10} r={8} fill={u('mai')} stamen="#b45309" a={30} />
        <Blossom x={10} y={50} r={8} fill={u('mai')} stamen="#b45309" a={-20} />
        <Blossom x={77} y={8} r={6} fill={u('mai')} stamen="#b45309" a={14} />
        <Blossom x={8} y={77} r={6} fill={u('mai')} stamen="#b45309" a={50} />
        <Bud x={92} y={9} a={70} s={4} fill={u('mai')} /><Bud x={9} y={92} a={190} s={4} fill={u('mai')} />
        <Bud x={34} y={4} a={10} s={3.5} fill={u('mai')} /><Bud x={4} y={34} a={-100} s={3.5} fill={u('mai')} />
      </g>);
    case 'phuong':
      return (<g>
        <Fern x={22} y={6} a={-4} L={78} /><Fern x={6} y={22} a={94} L={78} /><Fern x={26} y={20} a={22} L={46} /><Fern x={20} y={26} a={68} L={46} />
        <path d={STEM} stroke="#3f6212" strokeWidth="1" fill="none" />
        {[[18, 18, 13, 0], [42, 10, 9, 30], [10, 42, 9, -30], [32, 30, 7, 60], [64, 8, 6, 10], [8, 64, 6, 80]].map(([x, y, r, a], i) => (
          <g key={i}>
            <Blossom x={x} y={y} r={r} fill={u('red')} stamen="#7f1d1d" a={a} stroke="#7f1d1d33" />
            {/* cánh cờ: cánh trên có sọc trắng vàng */}
            <path d={petalD(r * 0.85, r * 0.48)} fill="#fef3c7" fillOpacity=".75" transform={`translate(${x} ${y}) rotate(${a})`} />
            <path d={`M0 0 L0 ${-r * 0.8} M${-r * 0.18} ${-r * 0.1} L${-r * 0.3} ${-r * 0.7} M${r * 0.18} ${-r * 0.1} L${r * 0.3} ${-r * 0.7}`} stroke="#dc2626" strokeWidth="0.45" transform={`translate(${x} ${y}) rotate(${a})`} />
          </g>
        ))}
      </g>);
    case 'cuc':
      return (<g>
        <path d={STEM} stroke="#166534" strokeWidth="1.2" fill="none" />
        {[[44, 4, 170, 10], [70, 5, 10, 9], [4, 44, -80, 10], [5, 70, 100, 9], [30, 14, 40, 9], [14, 30, 50, 9]].map(([x, y, a, L], i) => <Leaf key={i} x={x} y={y} a={a} L={L} W={3} />)}
        <Daisy x={18} y={18} r={15} a={8} />
        <Daisy x={50} y={9} r={9} a={20} />
        <Daisy x={9} y={50} r={9} a={-10} />
        <Daisy x={80} y={8} r={6} a={5} />
        <Daisy x={8} y={80} r={6} a={30} />
      </g>);
    case 'sen': {
      // lá sen tròn có khía + gân toả, hoa sen nhiều lớp cánh, nụ sen
      const pad = (cx: number, cy: number, r: number, rot: number) => (
        <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
          <path d={`M0 0 L${r * Math.cos(0.22)} ${-r * Math.sin(0.22)} A${r} ${r} 0 1 0 ${r * Math.cos(0.22)} ${r * Math.sin(0.22)} Z`} fill={u('lotusleaf')} stroke="#166534" strokeWidth="0.4" />
          {Array.from({ length: 9 }, (_, i) => { const t = 0.45 + (i * (2 * Math.PI - 0.9)) / 8; return <line key={i} x1="0" y1="0" x2={r * 0.92 * Math.cos(t)} y2={r * 0.92 * Math.sin(t)} stroke="#dcfce7" strokeWidth="0.35" strokeOpacity=".8" />; })}
        </g>
      );
      return (<g>
        {pad(66, 14, 13, 200)}{pad(14, 70, 13, 290)}
        <path d="M66 27 q-4 10 -18 6 M27 70 q10 -4 6 -18" stroke="#15803d" strokeWidth="0.9" fill="none" />
        <g transform="translate(30 34)">
          {[-64, 64, -38, 38].map((d) => <path key={d} d={petalD(22, 9)} fill={u('lotus')} stroke="#9d174d" strokeOpacity=".35" strokeWidth="0.35" transform={`rotate(${d})`} />)}
          {[-14, 14].map((d) => <path key={d} d={petalD(24, 9)} fill={u('lotus')} stroke="#9d174d" strokeOpacity=".35" strokeWidth="0.35" transform={`rotate(${d})`} />)}
          <path d={petalD(25, 8)} fill={u('lotus')} stroke="#9d174d" strokeOpacity=".35" strokeWidth="0.35" />
          {[-14, 0, 14].map((d) => <path key={`v${d}`} d={`M0 -2 Q${d * 0.2} -12 ${d * 0.5} -22`} stroke="#be185d" strokeWidth="0.3" fill="none" strokeOpacity=".5" />)}
          <ellipse cx="0" cy="1" rx="10" ry="3" fill="#15803d" />
        </g>
        <Bud x={88} y={20} a={25} s={7} fill={u('lotus')} />
        <path d="M88 21 q2 6 0 14" stroke="#15803d" strokeWidth="0.9" fill="none" />
        <Bud x={20} y={88} a={115} s={6} fill={u('lotus')} />
      </g>);
    }
    case 'huong-duong':
      return (<g>
        <path d={STEM} stroke="#3f6212" strokeWidth="2" fill="none" />
        {[[38, 6, 190, 16], [64, 5, 15, 13], [6, 38, -100, 16], [5, 64, 75, 13]].map(([x, y, a, L], i) => <Leaf key={i} x={x} y={y} a={a} L={L} />)}
        <Sunflower x={20} y={20} r={17} />
        <Sunflower x={84} y={8} r={7} />
        <Sunflower x={8} y={84} r={7} />
      </g>);
    case 'oai-huong':
      return (<g>
        {[[2, 2, 2, 98], [2, 2, 14, 92], [2, 2, 28, 86], [2, 2, 45, 70], [2, 2, 62, 86], [2, 2, 76, 92], [2, 2, 88, 98]].map(([x, y, a, L], i) => <Lavender key={i} x={x} y={y} a={a} L={L} />)}
        <path d="M2 2 q6 4 10 2 q-4 6 -2 10" fill="#7c3aed" fillOpacity=".25" />
      </g>);
    default:
      return null;
  }
}
