'use client';

// Khung MÀN TRÌNH CHIẾU dùng chung cho Đấu tổ (TeamQuiz) và Đấu cặp (BattleShow) — theo mẫu “Đấu tổ Toán”:
// nền trời + cỏ, thanh trên (logo · huy hiệu cuộc thi · nhãn phòng), dải tên + số câu / vòng, hàng chip, nhân vật
// (hai bạn nhỏ + cú Milo của app), đồng hồ đếm ngược có thanh tiến độ, bảng điểm bên phải.
// Hình có sẵn: public/brand (Milo, bạn nhỏ, logo), public/emoji (Fluent Emoji 3D). Kiểu: src/styles/dto.css.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { teamIconSrc } from '@/lib/classroom/class-tools';
import '@/styles/btn.css';
import '@/styles/dto.css';

/** Ảnh nhỏ cỡ cố định (ảnh webp đã tối ưu sẵn; ghi đè cỡ 22px của img.ic3d) */
export function Pic({ src, size, className }: { src: string; size: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- ảnh minh hoạ nhỏ đã tối ưu sẵn (webp)
  return <img src={src} width={size} height={size} style={{ width: size, height: size }} alt="" aria-hidden="true" className={`ic3d ${className ?? ''}`.trim()} decoding="async" />;
}
/** Hình đại diện tổ (hình 3D nếu có, không thì ký tự emoji) */
export function TeamPic({ emoji, size }: { emoji: string; size: number }) {
  const src = teamIconSrc(emoji);
  return src ? <Pic src={src} size={size} /> : <span style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden="true">{emoji}</span>;
}

const mmss = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
/** Đồng hồ: viên thuốc “00:30” có hình đồng hồ báo thức + thanh tiến độ (chỉ đổi transform) */
export function ShowTimer({ left, total, label }: { left: number; total: number; label?: string }) {
  const k = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  return (
    <div className={`dto-clock${left <= 5 ? ' is-low' : ''}${left <= 0 ? ' is-up' : ''}`} role="timer" aria-live="off">
      <div className="dto-clock-pill"><Pic src="/emoji/f3d/alarm-clock.webp" size={46} /><b>{label ?? mmss(left)}</b></div>
      <div className="dto-clock-bar" aria-hidden="true"><i style={{ transform: `scaleX(${k})` }} /></div>
    </div>
  );
}
/** Hai bạn nhỏ cổ vũ + cú Milo (nhân vật của app) phía trên thẻ câu hỏi */
export function ShowHero({ children }: { children?: ReactNode }) {
  return (
    <div className="dto-hero">
      {/* eslint-disable-next-line @next/next/no-img-element -- tranh minh hoạ đã tối ưu sẵn (webp) */}
      <img src="/brand/home/boy.webp" alt="" aria-hidden="true" width={640} height={852} className="dto-hero-kid is-l" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tranh minh hoạ đã tối ưu sẵn (webp) */}
      <img src="/brand/milo-professor-sm.webp" alt="" aria-hidden="true" width={240} height={330} className="dto-hero-milo" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tranh minh hoạ đã tối ưu sẵn (webp) */}
      <img src="/brand/home/girl.webp" alt="" aria-hidden="true" width={640} height={848} className="dto-hero-kid is-r" decoding="async" />
      {children}
    </div>
  );
}

type Props = {
  /** “Đấu tổ” / “Đấu cặp” */ kind: string; subject: string; /** nhãn góc phải, vd “Phòng thi tổ” */ tag: string;
  title: string; /** vd “Câu 2/10”, “Vòng 1” */ counter?: string;
  chips?: ReactNode; /** nút thêm bên phải hàng chip (trước nút Kết thúc) */ tools?: ReactNode;
  onEnd?: () => void; endLabel?: string; onClose: () => void;
  board: ReactNode; children: ReactNode;
};

export default function ShowFrame({ kind, subject, tag, title, counter, chips, tools, onEnd, endLabel = 'Kết thúc', onClose, board, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', on);
    // khoá cuộn trang phía sau khi đang chiếu
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('fullscreenchange', on); document.body.style.overflow = prev; };
  }, []);
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.().catch(() => undefined); };

  return (
    <div className="dto" ref={root} role="dialog" aria-modal="true" aria-label={`${kind} ${subject}`}>
      <header className="dto-bar">
        <span className="dto-brand"><Pic src="/brand/logo-mark-sm.webp" size={40} /><b>EduChain <em>Kids</em></b></span>
        <span className="dto-badge"><Pic src="/brand/ph/cup.webp" size={44} /><b>{kind} {subject}</b></span>
        <span className="dto-tag">{tag}</span>
      </header>
      {/* dải tiêu đề: tên cuộc thi · chip (giây / số tổ…) · số câu · nút toàn màn hình, kết thúc, thoát */}
      <div className="dto-strip">
        <Pic src="/emoji/hd/trophy.webp" size={30} />
        <b>{title}</b>
        <span className="dto-chips">{chips}</span>
        {counter && <span className="dto-strip-n">{counter}</span>}
        <span className="dto-row-act">
          {tools}
          <button type="button" className="dto-sq" onClick={toggleFull} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} title={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>{full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
          {onEnd && <button type="button" className="dto-end-btn" onClick={onEnd}>{endLabel}</button>}
          <button type="button" className="dto-sq" onClick={onClose} aria-label="Thoát màn chiếu" title="Thoát"><X aria-hidden="true" /></button>
        </span>
      </div>
      <div className="dto-main">
        <section className="dto-stage" aria-live="polite">{children}</section>
        <aside className="dto-board">{board}</aside>
      </div>
    </div>
  );
}

/** Bảng điểm bên phải: tiêu đề có cúp, danh sách, ghi chú, cúp trang trí */
export function ShowBoard({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <>
      <h3><Pic src="/brand/ph/cup.webp" size={40} /> {title}</h3>
      {children}
      {note && <p className="dto-rule">ⓘ {note}</p>}
      <Pic src="/emoji/hd/trophy.webp" size={120} className="dto-board-cup" />
    </>
  );
}
