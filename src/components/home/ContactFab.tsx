'use client';

// Nút liên hệ nổi góc dưới phải trang chủ: bấm mở 3 cách liên hệ (Zalo, gọi điện, Gmail).
import { useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle, Phone, X } from 'lucide-react';
import { SITE_CONTACT as C } from '@/lib/contact';

export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className={`cfab${open ? ' is-open' : ''}`} ref={box}>
      {open && (
        <div className="cfab-menu" role="menu" aria-label="Liên hệ EduChain Kids">
          <b className="cfab-h">Liên hệ EduChain Kids</b>
          <a role="menuitem" className="cfab-it is-zalo" href={`https://zalo.me/${C.zalo}`} target="_blank" rel="noopener noreferrer">
            <span className="cfab-ic">Zalo</span><span><b>Nhắn Zalo</b><small>{C.zaloName} · {C.phoneDisplay}</small></span>
          </a>
          <a role="menuitem" className="cfab-it is-phone" href={`tel:${C.phone}`}>
            <span className="cfab-ic"><Phone aria-hidden="true" /></span><span><b>Gọi điện</b><small>{C.phoneDisplay}</small></span>
          </a>
          <a role="menuitem" className="cfab-it is-mail" href={`mailto:${C.email}?subject=${encodeURIComponent('Liên hệ EduChain Kids')}`}>
            <span className="cfab-ic"><Mail aria-hidden="true" /></span><span><b>Gửi Gmail</b><small>{C.email}</small></span>
          </a>
        </div>
      )}
      <button type="button" className="cfab-btn" aria-expanded={open} aria-label={open ? 'Đóng liên hệ' : 'Liên hệ EduChain Kids'} onClick={() => setOpen((v) => !v)}>
        {open ? <X aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
        {!open && <span className="cfab-lbl">Liên hệ</span>}
      </button>
    </div>
  );
}
