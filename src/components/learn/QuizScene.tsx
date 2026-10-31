'use client';

// Khung cảnh trò chơi phía sau màn làm bài (bầu trời, mây, đồi, cây, lâu đài, lối đi, hoa)
// + đồ trang trí hai bên trên màn hình rộng (Milo đứng trên gốc cây, biển gỗ, chồng sách 3 môn, cúp).
// Vẽ bằng SVG ngay trong trang (rất nhẹ, không tải ảnh nền lớn), không ảnh hưởng nội dung câu hỏi.
import { useEffect, useState } from 'react';
import MiloMascot from '@/components/mascot/MiloMascot';
import { SUBJECT_MASCOT } from '@/lib/mascots';
import { createClient } from '@/lib/supabase/client';
import { rankFor } from '@/lib/levels';
import { readTotalPoints } from '@/lib/progress';

type Subject = 'toan' | 'tieng-viet' | 'tieng-anh';

function Cloud({ x, y, s = 1, cls = '' }: { x: number; y: number; s?: number; cls?: string }) {
  return (
    <g className={`qz-cloud ${cls}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="70" ry="30" />
      <ellipse cx="-45" cy="8" rx="45" ry="24" />
      <ellipse cx="48" cy="10" rx="50" ry="22" />
      <ellipse cx="10" cy="-22" rx="40" ry="28" />
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 0 L-10 -120 L10 -120 L14 0 Z" fill="#8a5a33" />
      <circle cx="0" cy="-150" r="62" fill="#3f9a3a" />
      <circle cx="-48" cy="-118" r="44" fill="#4daa43" />
      <circle cx="46" cy="-122" r="46" fill="#46a23f" />
      <circle cx="-14" cy="-190" r="40" fill="#5bb84d" />
      <circle cx="22" cy="-176" r="30" fill="#6cc55a" opacity=".9" />
    </g>
  );
}

function Castle({ x, y }: { x: number; y: number }) {
  const tower = (tx: number, w: number, h: number) => (
    <g key={tx}>
      <rect x={tx - w / 2} y={-h} width={w} height={h} fill="#eef0f6" stroke="#c9cfdd" strokeWidth="2" />
      <path d={`M${tx - w / 2 - 6} ${-h} L${tx} ${-h - w * 1.1} L${tx + w / 2 + 6} ${-h} Z`} fill="#3b6fd8" />
      <line x1={tx} y1={-h - w * 1.1} x2={tx} y2={-h - w * 1.1 - 22} stroke="#7a5a3a" strokeWidth="2" />
      <path d={`M${tx} ${-h - w * 1.1 - 22} l16 5 l-16 5 Z`} fill="#f5c330" />
      <rect x={tx - 5} y={-h + 18} width="10" height="16" rx="5" fill="#5b7bbf" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-95" y="-120" width="190" height="120" fill="#e9ecf4" stroke="#c9cfdd" strokeWidth="2" />
      {[-80, -50, -20, 10, 40, 70].map((cx) => <rect key={cx} x={cx} y="-132" width="18" height="14" fill="#e9ecf4" stroke="#c9cfdd" strokeWidth="2" />)}
      <path d="M-26 0 L-26 -46 A26 26 0 0 1 26 -46 L26 0 Z" fill="#a9733f" />
      {tower(-110, 46, 170)}
      {tower(110, 46, 170)}
      {tower(-55, 38, 200)}
      {tower(55, 38, 200)}
      {tower(0, 54, 250)}
    </g>
  );
}

/** Nền trò chơi: cố định phía sau toàn trang */
export function QuizBackdrop({ motion }: { motion: boolean }) {
  return (
    <div className={`qz-scene${motion ? ' is-live' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="qzSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5ab0f2" />
            <stop offset=".55" stopColor="#a9dcfb" />
            <stop offset="1" stopColor="#e8f7ff" />
          </linearGradient>
          <linearGradient id="qzHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd16a" />
            <stop offset="1" stopColor="#5fae45" />
          </linearGradient>
          <linearGradient id="qzGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cc85a" />
            <stop offset="1" stopColor="#4c9a38" />
          </linearGradient>
          <radialGradient id="qzSun" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#fffbe0" stopOpacity=".95" />
            <stop offset="1" stopColor="#fffbe0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#qzSky)" />
        <circle cx="1180" cy="120" r="210" fill="url(#qzSun)" />
        <Cloud x={260} y={130} s={1.1} cls="c1" />
        <Cloud x={760} y={90} s={0.8} cls="c2" />
        <Cloud x={1320} y={200} s={1} cls="c3" />
        <Cloud x={1050} y={330} s={0.6} cls="c1" />
        {/* đồi xa + lâu đài */}
        <path d="M0 600 Q200 470 420 560 T860 540 T1260 520 T1600 560 L1600 900 L0 900 Z" fill="#b5e39a" />
        <Castle x={1360} y={585} />
        <path d="M0 660 Q260 560 560 640 T1120 620 T1600 640 L1600 900 L0 900 Z" fill="url(#qzHill)" />
        <Tree x={1520} y={690} s={0.8} />
        <Tree x={1180} y={680} s={0.55} />
        <Tree x={90} y={700} s={1.25} />
        <Tree x={300} y={690} s={0.7} />
        {/* mặt cỏ + lối đi */}
        <path d="M0 720 Q400 680 800 712 T1600 708 L1600 900 L0 900 Z" fill="url(#qzGround)" />
        <path d="M720 900 Q760 820 880 760 T1220 700 L1250 706 Q1000 760 930 810 T860 900 Z" fill="#e9cf9a" opacity=".9" />
        {[[180, 800, '#ff8fb1'], [260, 845, '#fff'], [430, 812, '#ffd23f'], [560, 860, '#ff8fb1'], [1040, 830, '#fff'], [1180, 860, '#ffd23f'], [1330, 815, '#ff8fb1'], [1460, 860, '#fff'], [640, 790, '#fff'], [1260, 770, '#ffd23f']].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-7" rx="4.5" ry="7" fill={c as string} transform={`rotate(${a})`} />)}
            <circle r="4" fill="#f5b400" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Đồ trang trí hai bên (chỉ hiện trên màn hình rộng) */
export function QuizSideProps({ subject }: { subject: Subject }) {
  const books: { id: Subject; label: string; color: string }[] = [
    { id: 'toan', label: 'Toán', color: '#2f6fd6' },
    { id: 'tieng-viet', label: 'Tiếng Việt', color: '#f08a24' },
    { id: 'tieng-anh', label: 'Tiếng Anh', color: '#2e9f53' },
  ];
  return (
    <>
      <div className="qz-side qz-left" aria-hidden="true">
        <div className="qz-milo"><MiloMascot size={210} variant={SUBJECT_MASCOT[subject]} /></div>
        <div className="qz-stump" />
      </div>
      <div className="qz-side qz-right" aria-hidden="true">
        <div className="qz-sign"><span>Cùng học<br />thật tốt nhé!</span><i>♡</i></div>
        <div className="qz-books">
          {books.map((b) => <span key={b.id} className={b.id === subject ? 'is-on' : ''} style={{ background: b.color }}>{b.label}</span>)}
        </div>
        <div className="qz-cup">🏆</div>
      </div>
    </>
  );
}

/** Ô "Học sinh: tên · ⭐ Lv" ở góc dưới bên trái */
export function StudentPill() {
  const [name, setName] = useState('');
  const [lv, setLv] = useState<{ n: number; name: string } | null>(null);
  useEffect(() => {
    try { const r = rankFor(readTotalPoints()); setLv({ n: r.index + 1, name: r.name }); } catch { /* bỏ qua */ }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let live = true;
    const sb = createClient();
    void sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      const { data: p } = await sb.from('profiles').select('display_name').eq('id', uid).maybeSingle();
      const n = (p as { display_name?: string } | null)?.display_name?.trim();
      if (live && n) setName(n);
    });
    return () => { live = false; };
  }, []);
  return (
    <div className="qz-student">
      <span className="qz-student-av" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4.2" /><path d="M3.5 21c.8-4.3 4.3-6.6 8.5-6.6s7.7 2.3 8.5 6.6z" /></svg>
      </span>
      <span className="qz-student-name">Học sinh: <b>{name || 'em'}</b></span>
      {lv && <span className="qz-student-lv" title={`Cấp: ${lv.name}`}><span aria-hidden="true">⭐</span> Lv.{lv.n}</span>}
    </div>
  );
}
