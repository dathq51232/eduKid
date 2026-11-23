'use client';

// Nút trên trang chi tiết tài nguyên: Sao chép về sửa · Mở file / liên kết · Lưu · Nhắn tác giả · Báo vi phạm · (của mình) Ẩn / Hiện.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Copy, Download, ExternalLink, EyeOff, Eye, Flag, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { openFile, type FileMeta } from '@/lib/community/files';
import { copyDeckToMine, shareError } from '@/lib/community/share';
import type { ResourceCard } from '@/lib/community/types';

const REASONS: [string, string][] = [['ban_quyen', 'Vi phạm bản quyền / chép sách'], ['hoc_sinh', 'Lộ ảnh, thông tin học sinh'], ['sai_kien_thuc', 'Sai kiến thức'], ['khong_phu_hop', 'Không phù hợp'], ['khac', 'Lý do khác']];

export default function ResourceActions({ r, classId }: { r: ResourceCard; classId: string | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState(r.saved);
  const [status, setStatus] = useState(r.status);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [report, setReport] = useState(false);
  const canCopy = (r.kind === 'bai_giang' || r.kind === 'giao_an') && (r.license === 'sua' || r.mine);
  const sb = () => createClient();

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setNote('');
    try { await fn(); } catch (e) { setNote(shareError((e as Error).message)); } finally { setBusy(''); }
  };
  const copy = () => run('Đang sao chép…', async () => {
    if (!classId) throw new Error('Thầy cô tạo lớp trước rồi mới sao chép bài về được.');
    if (r.kind === 'bai_giang') {
      const id = await copyDeckToMine(sb(), r.id, classId, setBusy);
      router.push(`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${id}`);
    } else router.push(`/giao-vien/lop/${classId}/ke-hoach?tu-cong-dong=${r.id}`);
  });
  const toggleSave = () => run('…', async () => {
    const { data, error } = await sb().rpc('community_toggle_save', { p_id: r.id });
    if (error) throw new Error(error.message);
    setSaved(Boolean(data));
  });
  const message = () => run('…', async () => {
    const { data, error } = await sb().rpc('chat_open_direct', { p_user: r.author.id });
    if (error) throw new Error(/not_allowed/.test(error.message) ? 'Chỉ nhắn được thầy cô cùng trường.' : error.message);
    router.push(`/giao-vien/cong-dong/tin-nhan?t=${data as string}`);
  });
  const setVis = (s: 'hien' | 'an') => run('…', async () => {
    const { error } = await sb().rpc('community_set_status', { p_id: r.id, p_status: s });
    if (error) throw new Error(error.message);
    setStatus(s); router.refresh();
  });
  const sendReport = (reason: string, text: string) => run('…', async () => {
    const { error } = await sb().rpc('community_report', { p_id: r.id, p_reason: reason, p_note: text });
    if (error) throw new Error(error.message);
    setReport(false); setNote('Đã gửi báo cáo, quản trị sẽ xem xét. Cảm ơn thầy cô!');
  });

  return (
    <div className="cdg-acts">
      <div className="cdg-row">
        {canCopy && <button type="button" className="cdg-btn" disabled={!!busy} onClick={copy}><Copy aria-hidden="true" /> Sao chép về sửa</button>}
        {r.file && <button type="button" className="cdg-btn" onClick={() => void openFile(sb(), r.file as FileMeta).then((ok) => { if (!ok) setNote('Không mở được file.'); })}><Download aria-hidden="true" /> Mở file</button>}
        {r.link && <a className="cdg-btn" href={r.link.url} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /> Mở liên kết</a>}
        <button type="button" className={`cdg-btn is-ghost${saved ? ' is-on' : ''}`} disabled={!!busy} onClick={toggleSave} aria-pressed={saved}><Bookmark aria-hidden="true" /> {saved ? 'Đã lưu' : 'Lưu'}</button>
        {!r.mine && <button type="button" className="cdg-btn is-ghost" disabled={!!busy} onClick={message}><MessageCircle aria-hidden="true" /> Nhắn tác giả</button>}
        {r.mine && status !== 'go' && (status === 'hien'
          ? <button type="button" className="cdg-btn is-ghost" disabled={!!busy} onClick={() => setVis('an')}><EyeOff aria-hidden="true" /> Ẩn bài</button>
          : <button type="button" className="cdg-btn is-ghost" disabled={!!busy} onClick={() => setVis('hien')}><Eye aria-hidden="true" /> Hiện lại</button>)}
        {!r.mine && <button type="button" className="cdg-btn is-ghost is-quiet" onClick={() => setReport((v) => !v)}><Flag aria-hidden="true" /> Báo vi phạm</button>}
      </div>
      {!canCopy && (r.kind === 'bai_giang' || r.kind === 'giao_an') && <p className="cdg-muted">Tác giả chọn giấy phép không cho sao chép về sửa — thầy cô xem để tham khảo.</p>}
      {busy && busy !== '…' && <p className="cdg-muted" role="status">{busy}</p>}
      {note && <p className="cdg-note" role="alert">{note}</p>}
      {report && (
        <form className="cdg-report" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void sendReport(String(f.get('ly-do')), String(f.get('ghi-chu') ?? '')); }}>
          <select name="ly-do" className="cdg-input" aria-label="Lý do">{REASONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="ghi-chu" className="cdg-input" maxLength={500} placeholder="Ghi chú thêm (không bắt buộc)" aria-label="Ghi chú" />
          <button type="submit" className="cdg-btn">Gửi báo cáo</button>
        </form>
      )}
    </div>
  );
}
