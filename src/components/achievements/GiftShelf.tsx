'use client';

// Tủ quà EDKC trong trang Thành tích: vật phẩm theo bộ nhận diện, mở khoá khi đạt mốc học tập thật.
import { useEffect, useMemo, useState } from 'react';
import { Gift as GiftIcon, Lock, Sparkles, X } from 'lucide-react';
import GiftArt from './GiftArt';
import { GIFTS, giftHave, giftNeed, giftOpen, nextGift, readSeen, saveSeen, type Gift, type GiftStats } from '@/lib/gifts';

export default function GiftShelf({ stats, demo = false }: { stats: GiftStats | null; demo?: boolean }) {
  const [seen, setSeen] = useState<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Gift | null>(null);

  useEffect(() => { setSeen(readSeen()); }, []);
  // quà vừa mở (chưa xem lần nào) → gắn "Mới!" trong lần xem này, rồi ghi nhớ đã xem
  useEffect(() => {
    if (!stats || !seen || demo) return;
    const opened = GIFTS.filter((g) => giftOpen(g, stats)).map((g) => g.id);
    const n = opened.filter((id) => !seen.has(id));
    if (n.length) { setFresh(new Set(n)); saveSeen(opened); setSeen(new Set(opened)); }
  }, [stats, seen, demo]);

  const count = useMemo(() => (stats ? GIFTS.filter((g) => giftOpen(g, stats)).length : 0), [stats]);
  const next = stats ? nextGift(stats) : null;
  if (!stats) return null;

  return (
    <section className="ach-section gift-shelf" aria-labelledby="gift-title">
      <div className="gift-head">
        <div>
          <h2 id="gift-title"><GiftIcon aria-hidden="true" /> Tủ quà EDKC <span>{count}/{GIFTS.length}</span></h2>
          <p className="ach-muted">Học chăm, đạt mốc là mở được quà mang logo EDKC. Bấm vào món quà để xem rõ.</p>
        </div>
        <div className="gift-meter" aria-label={`Đã mở ${count} trên ${GIFTS.length} món quà`}>
          <span style={{ width: `${(count / GIFTS.length) * 100}%` }} />
        </div>
      </div>

      {next && (
        <div className="gift-next">
          <GiftArt art={next.id} size={84} />
          <div>
            <p className="gift-next-tag"><Sparkles aria-hidden="true" /> Quà sắp mở</p>
            <p className="gift-next-name">{next.name}</p>
            <div className="gift-bar" role="progressbar" aria-valuemin={0} aria-valuemax={next.need} aria-valuenow={giftHave(next, stats)} aria-label={`Tiến độ mở ${next.name}`}>
              <span style={{ width: `${(giftHave(next, stats) / next.need) * 100}%` }} />
            </div>
            <p className="gift-next-left">Còn <b>{(next.need - giftHave(next, stats)).toLocaleString('vi-VN')}</b> nữa — cần {giftNeed(next)}</p>
          </div>
        </div>
      )}

      <ul className="gift-grid">
        {GIFTS.map((g) => {
          const ok = giftOpen(g, stats);
          return (
            <li key={g.id}>
              <button type="button" className={`gift-card${ok ? ' is-open' : ''}`} onClick={() => setOpen(g)} aria-label={`${g.name}${ok ? ', đã mở' : `, chưa mở — cần ${giftNeed(g)}`}`}>
                {fresh.has(g.id) && <span className="gift-new">Mới!</span>}
                <span className="gift-pic"><GiftArt art={g.id} size={104} locked={!ok} />{!ok && <span className="gift-lock"><Lock aria-hidden="true" /></span>}</span>
                <b>{g.name}</b>
                {ok ? <small className="gift-ok">Đã mở</small> : (
                  <>
                    <small>Cần {giftNeed(g)}</small>
                    <span className="gift-bar is-sm"><span style={{ width: `${(giftHave(g, stats) / g.need) * 100}%` }} /></span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="ach-muted gift-note">{demo ? 'Đang xem minh hoạ. ' : ''}Quà trong tủ là quà sưu tầm để động viên em học, không đổi được thành tiền.</p>

      {open && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setOpen(null)}>
          <div className="dialog-card gift-dialog" role="dialog" aria-modal="true" aria-labelledby="gift-dlg-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gift-close" aria-label="Đóng" onClick={() => setOpen(null)}><X aria-hidden="true" /></button>
            <div className={`gift-stage${giftOpen(open, stats) ? ' is-open' : ''}`}><GiftArt art={open.id} size={220} locked={!giftOpen(open, stats)} /></div>
            <h2 id="gift-dlg-title">{open.name}</h2>
            <p>{open.desc}</p>
            {giftOpen(open, stats)
              ? <p className="gift-ok-line">🎉 Em đã mở món quà này!</p>
              : <p className="gift-need-line"><Lock aria-hidden="true" /> Cần {giftNeed(open)} — em đang có {giftHave(open, stats).toLocaleString('vi-VN')}.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
