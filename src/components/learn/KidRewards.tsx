'use client';

// Trang Của em: Rương quà mỗi ngày + kệ sticker (xem nhanh bộ sưu tập, sticker chưa có hiện bóng mờ cho tò mò).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Gift, Lock } from 'lucide-react';
import Sticker from './Sticker';
import { STICKERS, STICKER_EVT, openChest, readChest, readOwnedStickers, readRecentStickers, stickerName, type ChestOpen, type StickerId } from '@/lib/stickers';
import { playSound } from '@/lib/sound';

function ChestArt({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 140 120" className={`kc-art${open ? ' is-open' : ''}`} aria-hidden="true">
      <defs>
        <linearGradient id="kcWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d08a46" /><stop offset="1" stopColor="#8a4f22" /></linearGradient>
        <linearGradient id="kcLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e09a52" /><stop offset="1" stopColor="#a8622c" /></linearGradient>
        <linearGradient id="kcGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe48a" /><stop offset="1" stopColor="#f2a516" /></linearGradient>
        <radialGradient id="kcGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff3b0" /><stop offset="1" stopColor="#fff3b0" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="70" cy="110" rx="52" ry="6" fill="#000" opacity=".15" />
      {open && <ellipse cx="70" cy="58" rx="54" ry="30" fill="url(#kcGlow)" />}
      <rect x="20" y="56" width="100" height="50" rx="8" fill="url(#kcWood)" />
      <path d="M22 72 H118 M22 88 H118" stroke="#6e3c17" strokeOpacity=".35" strokeWidth="2" />
      <rect x="32" y="56" width="10" height="50" fill="url(#kcGold)" />
      <rect x="98" y="56" width="10" height="50" fill="url(#kcGold)" />
      <rect x="59" y="62" width="22" height="24" rx="5" fill="url(#kcGold)" stroke="#c97f06" strokeWidth="2" />
      <circle cx="70" cy="72" r="3.5" fill="#7a4a12" /><rect x="68.5" y="73" width="3" height="7" rx="1.5" fill="#7a4a12" />
      <g className="kc-lid">
        <path d="M18 58 V46 Q70 12 122 46 V58 Z" fill="url(#kcLid)" stroke="#8a4f22" strokeWidth="2" />
        <path d="M32 54 V36 Q37 33 42 31 V54 Z M98 31 Q103 33 108 36 V54 H98 Z" fill="url(#kcGold)" />
        <path d="M30 40 Q70 18 110 40" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Rương quà mỗi ngày: học xong 1 bài hôm nay thì mở được (quà là 1 sticker chưa có) */
export function DailyChest({ day, studied }: { day: string; studied: boolean }) {
  const [opened, setOpened] = useState<ChestOpen | null | undefined>(undefined);
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    const c = readChest();
    setOpened(c?.day === day ? c : null);
  }, [day]);
  if (opened === undefined) return <section className="kc" aria-hidden="true" />;

  const open = () => {
    setAnim(true);
    playSound('complete');
    window.setTimeout(() => {
      setOpened(openChest(day));
      setAnim(false);
    }, 900);
  };
  const state = opened ? 'done' : anim ? 'opening' : studied ? 'ready' : 'locked';

  return (
    <section className={`kc is-${state}`} aria-labelledby="kc-t">
      <h2 id="kc-t"><Gift aria-hidden="true" /> Rương quà hôm nay</h2>
      <div className="kc-stage">
        {state === 'locked' && <span className="kc-lock" aria-hidden="true"><Lock /></span>}
        {(state === 'ready' || state === 'opening') && <span className="kc-rays" aria-hidden="true" />}
        <ChestArt open={state === 'opening' || state === 'done'} />
        {opened?.id && <span className="kc-prize"><Sticker id={opened.id} size={76} /></span>}
        {opened && !opened.id && <span className="kc-prize kc-star" aria-hidden="true">⭐</span>}
      </div>
      <div className="kc-txt" aria-live="polite">
        {state === 'locked' && <p>Làm xong <b>1 bài</b> hôm nay để mở rương nhé!</p>}
        {state === 'ready' && <button type="button" className="btn btn-yellow kc-btn" onClick={open}><Gift aria-hidden="true" /> Mở rương!</button>}
        {state === 'opening' && <p>Đang mở…</p>}
        {state === 'done' && (opened?.id
          ? <p>Em nhận được sticker <b>{stickerName(opened.id)}</b>! Mai quay lại mở rương mới nhé.</p>
          : <p>Em đã có đủ bộ sticker, rương hôm nay tặng em <b>ngôi sao chăm chỉ</b>! ⭐</p>)}
      </div>
    </section>
  );
}

/** Kệ sticker: vài sticker mới nhất + bóng mờ của sticker chưa có */
export function StickerShelf() {
  const [data, setData] = useState<{ have: number; recent: StickerId[]; next: StickerId[] } | null>(null);
  useEffect(() => {
    const load = () => {
      const owned = new Set(readOwnedStickers());
      setData({
        have: owned.size,
        recent: readRecentStickers(5),
        next: STICKERS.filter((s) => !owned.has(s.id)).slice(0, 3).map((s) => s.id),
      });
    };
    load();
    window.addEventListener(STICKER_EVT, load);
    return () => window.removeEventListener(STICKER_EVT, load);
  }, []);
  if (!data) return <section className="ks" aria-hidden="true" />;
  const pct = Math.round((data.have / STICKERS.length) * 100);
  return (
    <section className="ks" aria-labelledby="ks-t">
      <h2 id="ks-t">Bộ sưu tập sticker <span>{data.have}/{STICKERS.length}</span></h2>
      <span className="ks-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
      <ul className="ks-row">
        {data.recent.map((id) => <li key={id} className="is-owned"><Sticker id={id} size={56} label={stickerName(id)} /></li>)}
        {data.next.map((id) => <li key={id} className="is-ghost" aria-label="Sticker chưa mở"><Sticker id={id} size={56} /><b aria-hidden="true">?</b></li>)}
      </ul>
      <p className="ks-note">{data.have === 0 ? 'Làm đúng từ 7/10 câu để nhận sticker đầu tiên!' : data.next.length ? `Còn ${STICKERS.length - data.have} sticker bí mật đang chờ em.` : 'Em đã sưu tầm đủ bộ, tuyệt vời!'}</p>
      <Link href="/thanh-tich" className="ks-link">Xem cả album <ChevronRight aria-hidden="true" /></Link>
    </section>
  );
}
