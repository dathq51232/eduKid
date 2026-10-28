'use client';

// Xem lớn một tác phẩm: ảnh, tên em, lời nhận xét của cô, tiếng giới thiệu, thả tim / sticker; chuyển bài trước / sau.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2, X } from 'lucide-react';
import { HEARTS, KIND_LABEL, fmtDate, type GalleryItem, type HeartEmoji } from '@/lib/gallery/types';

export default function ArtViewer({ list, id, onClose, onGo, onHeart, canHeart }: {
  list: GalleryItem[]; id: string; onClose: () => void; onGo: (id: string) => void;
  onHeart?: (id: string, e: HeartEmoji) => Promise<void> | void; canHeart: boolean;
}) {
  const i = Math.max(0, list.findIndex((x) => x.id === id));
  const it = list[i];
  const [busy, setBusy] = useState(false);
  const go = (d: number) => { if (list.length > 1) onGo(list[(i + d + list.length) % list.length].id); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  });
  if (!it) return null;
  return (
    <div className="gv-viewer" role="dialog" aria-modal="true" aria-label={`${KIND_LABEL[it.kind]}: ${it.title || it.student_name || ''}`} onClick={onClose}>
      <div className="gv-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="gv-x" onClick={onClose} aria-label="Đóng"><X /></button>
        <div className="gv-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {it.url ? <img src={it.url} alt={it.title || KIND_LABEL[it.kind]} /> : <div className="gv-noimg">Không tải được ảnh</div>}
          {list.length > 1 && (
            <>
              <button type="button" className="gv-nav is-prev" onClick={() => go(-1)} aria-label="Tác phẩm trước"><ChevronLeft /></button>
              <button type="button" className="gv-nav is-next" onClick={() => go(1)} aria-label="Tác phẩm sau"><ChevronRight /></button>
            </>
          )}
        </div>
        <div className="gv-info">
          <span className={`gv-kind k-${it.kind}`}>{KIND_LABEL[it.kind]}</span>
          {it.status !== 'shown' && <span className="gv-pending">{it.status === 'pending' ? 'Chờ cô duyệt' : 'Đang ẩn'}</span>}
          <h2>{it.student_name || 'Cả lớp'}</h2>
          {it.title && <p className="gv-title">{it.title}</p>}
          {it.note && <p className="gv-note">“{it.note}”</p>}
          <p className="gv-date">{fmtDate(it.taken_on)} · {i + 1}/{list.length}</p>
          {it.audio_url && (
            <div className="gv-audio"><Volume2 aria-hidden="true" /><audio controls src={it.audio_url} preload="none">Trình duyệt không phát được tiếng.</audio></div>
          )}
          {canHeart && it.status === 'shown' && !it.sample && (
            <div className="gv-hearts" role="group" aria-label="Thả cảm xúc">
              {HEARTS.map((h) => (
                <button key={h.key} type="button" disabled={busy} className={it.my_heart === h.key ? 'is-on' : ''} aria-pressed={it.my_heart === h.key}
                  onClick={async () => { setBusy(true); try { await onHeart?.(it.id, h.key); } finally { setBusy(false); } }}>
                  <span aria-hidden="true">{h.emoji}</span> {h.label}
                </button>
              ))}
            </div>
          )}
          <p className="gv-count">{it.hearts > 0 ? `${it.hearts} lượt khen` : canHeart && !it.sample ? 'Hãy là người đầu tiên khen tác phẩm này!' : ''}</p>
        </div>
      </div>
    </div>
  );
}
