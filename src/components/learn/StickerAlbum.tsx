'use client';

import { useEffect, useState } from 'react';
import Sticker from './Sticker';
import { STICKERS, STICKER_MIN_RATE, readOwnedStickers, stickerName, type StickerId } from '@/lib/stickers';

/** Thẻ "Sticker mới!" (trang Kết quả) */
export function NewSticker({ id }: { id: StickerId }) {
  return (
    <section className="sticker-new" aria-label="Sticker mới">
      <span className="sticker-new-art"><Sticker id={id} size={104} /></span>
      <div>
        <p className="sticker-new-tag">STICKER MỚI!</p>
        <p className="sticker-new-name">{stickerName(id)}</p>
        <p className="sticker-new-note">Đã lưu vào bộ sưu tập ở trang Thành tích.</p>
      </div>
    </section>
  );
}

/** Bộ sưu tập sticker: sticker đã có hiện màu, chưa có là ô "?" */
export default function StickerAlbum({ highlight }: { highlight?: StickerId | null }) {
  const [owned, setOwned] = useState<StickerId[] | null>(null);
  useEffect(() => setOwned(readOwnedStickers()), []);
  if (!owned) return null;
  const have = new Set(owned);
  return (
    <section className="sticker-album" aria-labelledby="sticker-album-title">
      <h2 id="sticker-album-title">Bộ sưu tập sticker <span>({have.size}/{STICKERS.length})</span></h2>
      <ul>
        {STICKERS.map((s) =>
          have.has(s.id) ? (
            <li key={s.id} className={`sticker-slot is-owned${highlight === s.id ? ' is-new' : ''}`}>
              <Sticker id={s.id} size={64} label={s.name} />
            </li>
          ) : (
            <li key={s.id} className="sticker-slot" aria-label="Sticker chưa mở">?</li>
          ),
        )}
      </ul>
      <p className="sticker-album-note">
        Mỗi bài làm đúng từ {Math.round(STICKER_MIN_RATE * 10)}/10 câu trở lên được nhận 1 sticker ngẫu nhiên chưa có. Sticker chỉ để sưu tầm cho vui, lưu trên máy này.
      </p>
    </section>
  );
}
