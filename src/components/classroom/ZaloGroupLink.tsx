'use client';

// Link nhóm Zalo của lớp (migration 0029): giáo viên dán link nhóm một lần, sau đó
// • Sổ lớp: "Chép & mở nhóm Zalo" — chép thông báo cả lớp rồi mở thẳng nhóm để dán;
// • Danh bạ phụ huynh: mở nhóm, chép link, in mã QR mời phụ huynh vào nhóm.
// App không tự gửi tin nhắn vào Zalo (Zalo không cho), thầy cô vẫn bấm dán và gửi.
import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, MessageCircle, Pencil, Printer, QrCode as QrIcon, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QrCode from '@/components/billing/QrCode';
import { normalizeZaloGroup } from '@/lib/classroom/class-tools';

type Props = { classId: string; className: string; /** có thì nút chính là "Chép thông báo & mở nhóm" */ notice?: string; onCopied?: (ok: boolean) => void; variant?: 'diary' | 'contacts' };

async function copy(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

export default function ZaloGroupLink({ classId, className, notice, onCopied, variant = 'diary' }: Props) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    void supabase.rpc('teacher_tool_get', { p_class: classId, p_tool: 'zalo' }).then(({ data, error }) => {
      if (error) setMissing(true);
      else setUrl(normalizeZaloGroup(String((data as { url?: string } | null)?.url ?? '')));
      setLoaded(true);
    });
  }, [supabase, classId]);

  const save = async (raw: string) => {
    const v = raw.trim() ? normalizeZaloGroup(raw) : '';
    if (v === null) { setErr('Link chưa đúng. Link nhóm Zalo có dạng https://zalo.me/g/abcxyz'); return; }
    if (!supabase) return;
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('teacher_tool_save', { p_class: classId, p_tool: 'zalo', p_data: { url: v } });
    setBusy(false);
    if (error) { setErr(/invalid_tool|check constraint/.test(error.message) ? 'Chưa chạy migration 0029 trên Supabase.' : /invalid_zalo/.test(error.message) ? 'Link chưa đúng.' : 'Chưa lưu được. Thử lại nhé.'); return; }
    setUrl(v || null); setEditing(false); setQr(false);
  };

  if (!loaded || missing) return missing && variant === 'contacts' ? <p className="dash-muted">Chạy migration <code>0029_class_zalo_group.sql</code> để lưu link nhóm Zalo lớp.</p> : null;

  const form = (
    <form className="zg-form" onSubmit={(e) => { e.preventDefault(); void save(input); }}>
      <label className="zg-label"><Link2 aria-hidden="true" /> Link nhóm Zalo lớp {className}</label>
      <div className="zg-row">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://zalo.me/g/…" inputMode="url" autoFocus aria-label="Link nhóm Zalo" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setErr(''); }}>Hủy</button>
      </div>
      <small>Lấy link: mở nhóm Zalo → bấm ⋯ (Tùy chọn) → <b>Link tham gia nhóm</b> → Sao chép, rồi dán vào đây.</small>
      {url && <button type="button" className="ct-link zg-del" onClick={() => void save('')}>Xóa link đã lưu</button>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
    </form>
  );

  if (editing || (!url && variant === 'contacts')) {
    return <div className={`zg is-${variant}`}>{editing ? form : <button type="button" className="btn btn-outline btn-sm" onClick={() => { setInput(''); setEditing(true); }}><Link2 aria-hidden="true" /> Thêm link nhóm Zalo lớp</button>}</div>;
  }
  if (!url) {
    return <div className={`zg is-${variant}`}><button type="button" className="ct-link zg-add" onClick={() => { setInput(''); setEditing(true); }}><Link2 aria-hidden="true" /> Thêm link nhóm Zalo lớp để mở nhóm bằng một chạm</button></div>;
  }

  return (
    <div className={`zg is-${variant}`}>
      {notice !== undefined ? (
        <a className="btn zg-open diary-wide" href={url} target="_blank" rel="noopener noreferrer"
          onClick={() => { void copy(notice).then((ok) => onCopied?.(ok)); }}>
          <MessageCircle aria-hidden="true" /> Chép &amp; mở nhóm Zalo lớp
        </a>
      ) : (
        <div className="zg-card">
          <span className="zg-name"><MessageCircle aria-hidden="true" /><span><b>Nhóm Zalo lớp {className}</b><small>{url.replace('https://', '')}</small></span></span>
          <div className="zg-acts">
            <a className="pc-btn is-zalo" href={url} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /> Mở nhóm</a>
            <button type="button" className="pc-btn" onClick={() => void copy(url).then((ok) => { setFlash(ok ? 'Đã chép link' : ''); window.setTimeout(() => setFlash(''), 1500); })}><Copy aria-hidden="true" /> {flash || 'Chép link'}</button>
            <button type="button" className="pc-btn" onClick={() => setQr((v) => !v)} aria-expanded={qr}><QrIcon aria-hidden="true" /> Mã QR mời phụ huynh</button>
          </div>
        </div>
      )}
      <button type="button" className="ct-link zg-edit" onClick={() => { setInput(url); setEditing(true); }}><Pencil aria-hidden="true" /> Sửa link nhóm</button>
      {qr && (
        <div className="zg-qr" role="dialog" aria-label="Mã QR nhóm Zalo">
          <button type="button" className="ct-x zg-qr-x" onClick={() => setQr(false)} aria-label="Đóng"><X aria-hidden="true" /></button>
          <p className="zg-qr-title">Mời phụ huynh lớp {className} vào nhóm Zalo</p>
          <QrCode text={url} size={220} label={`Mã QR nhóm Zalo lớp ${className}`} />
          <p className="zg-qr-sub">Mở Zalo → quét mã QR → Tham gia nhóm</p>
          <button type="button" className="btn btn-primary btn-sm no-print" onClick={() => window.print()}><Printer aria-hidden="true" /> In mã QR</button>
        </div>
      )}
    </div>
  );
}
