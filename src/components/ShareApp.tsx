'use client';

// NÚT "CHIA SẺ APP" (trang giáo viên, Góc Phụ huynh): bấm → khung có sẵn lời giới thiệu + link app,
// "Sao chép" · "Chép & mở Zalo" (Zalo không cho app tự gửi tin: chép sẵn rồi mở Zalo để dán) · "Chia sẻ khác" (bảng chia sẻ của máy, có Zalo trên điện thoại).
// Link kèm utm để biết người dùng mới đến từ lời mời của cô hay của phụ huynh.
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Send, Share2, X } from 'lucide-react';
import '@/styles/share.css';

type Who = 'teacher' | 'parent';
const TEXT: Record<Who, (link: string) => string> = {
  teacher: (l) => `Mời thầy cô dùng thử EduChain Kids — app học tập cho học sinh tiểu học: giao bài, phòng thi lớp chấm tự động, lịch báo giảng và giáo án xuất Word. Miễn phí cho thầy cô 👉 ${l}`,
  parent: (l) => `Ba mẹ tham khảo EduChain Kids — con luyện Toán, Tiếng Việt, Tiếng Anh theo bài trên lớp, ba mẹ xem con tiến bộ mỗi ngày 👉 ${l}`,
};
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
/** Chép chữ: clipboard API → cách cũ (execCommand) → không được thì trả false (khung tự bôi đen để chép tay) */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* thử cách cũ */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

export default function ShareApp({ who, className }: { who: Who; className?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<'' | 'copy' | 'zalo'>('');
  const [canShare, setCanShare] = useState(false);
  const [link, setLink] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/?utm_source=chia-se&utm_medium=${who === 'teacher' ? 'giao-vien' : 'phu-huynh'}`);
    setCanShare(typeof navigator.share === 'function');
  }, [who]);
  // bấm ra ngoài / Esc → đóng
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const text = link ? TEXT[who](link) : '';
  const copy = async (kind: 'copy' | 'zalo') => {
    if (!(await copyText(text))) {
      // máy không cho chép tự động: bôi đen sẵn đoạn chữ để người dùng tự chép
      setManual(true);
      const sel = window.getSelection();
      if (para.current && sel) { const r = document.createRange(); r.selectNodeContents(para.current); sel.removeAllRanges(); sel.addRange(r); }
      return;
    }
    setManual(false);
    setDone(kind); setTimeout(() => setDone(''), 2500);
    if (kind === 'zalo') {
      if (isMobile()) window.location.href = 'zalo://';
      else window.open('https://chat.zalo.me/', '_blank', 'noopener');
    }
  };
  const shareOther = async () => {
    try { await navigator.share({ title: 'EduChain Kids', text: TEXT[who](''), url: link }); } catch { /* người dùng đóng bảng chia sẻ */ }
  };

  return (
    <div className={`share-app${className ? ` ${className}` : ''}`} ref={box}>
      <button type="button" className="share-btn" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((v) => !v)}>
        <Share2 aria-hidden="true" /> Chia sẻ app
      </button>
      {open && (
        <div className="share-pop" role="dialog" aria-label="Chia sẻ EduChain Kids">
          <div className="share-pop-hd">
            <b>{who === 'teacher' ? 'Giới thiệu cho đồng nghiệp' : 'Giới thiệu cho ba mẹ khác'}</b>
            <button type="button" className="share-x" onClick={() => setOpen(false)} aria-label="Đóng"><X aria-hidden="true" /></button>
          </div>
          <p className="share-text" ref={para}>{text}</p>
          {manual && <small className="share-hint is-warn">Máy chưa cho chép tự động — đoạn chữ đã được bôi đen, bấm giữ (hoặc Ctrl+C) để chép.</small>}
          <div className="share-actions">
            <button type="button" className="share-act is-zalo" onClick={() => void copy('zalo')}>
              <Send aria-hidden="true" /> {done === 'zalo' ? 'Đã chép — dán vào Zalo' : 'Chép & mở Zalo'}
            </button>
            <button type="button" className="share-act" onClick={() => void copy('copy')}>
              {done === 'copy' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {done === 'copy' ? 'Đã chép' : 'Sao chép'}
            </button>
            {canShare && <button type="button" className="share-act" onClick={() => void shareOther()}><Share2 aria-hidden="true" /> Chia sẻ khác</button>}
          </div>
          <small className="share-hint">Mở Zalo, chọn người hoặc nhóm, giữ ngón tay vào ô chat → <b>Dán</b> → Gửi.</small>
        </div>
      )}
    </div>
  );
}
