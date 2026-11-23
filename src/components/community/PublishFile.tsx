'use client';

// Nút "Đăng tài liệu" + hộp đăng: chọn file (Word, Excel, PowerPoint, PDF, ảnh ≤ 20 MB), tên, môn, khối, giấy phép, mức hiển thị.
// File tải lên kho riêng tư community-files/tai-lieu/<mã người đăng>/…, rồi gọi community_publish_file (migration 0080).
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ACCEPT, fileProblem, fmtSize, uploadFile } from '@/lib/community/files';
import { LICENSE_INFO, VISIBILITY_LABEL, type License, type Visibility } from '@/lib/community/types';
import '@/styles/cdg.css';

export default function PublishFile({ meId, subjects }: { meId: string; subjects: [string, string][] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [lessonRef, setLessonRef] = useState('');
  const [license, setLicense] = useState<License>('dung');
  const [visibility, setVisibility] = useState<Visibility>('truong');
  const [ownWork, setOwnWork] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const bad = fileProblem(f);
    setNote(bad ?? '');
    if (bad) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 160));
  };
  const submit = async () => {
    if (!file || busy) return;
    if (title.trim().length < 3) return setNote('Tên tài liệu cần ít nhất 3 chữ.');
    if (!ownWork) return setNote('Thầy cô xác nhận mình là tác giả hoặc có quyền chia sẻ tài liệu này.');
    setBusy(true); setNote('');
    try {
      const sb = createClient();
      const meta = await uploadFile(sb, `tai-lieu/${meId}`, file);
      const { error } = await sb.rpc('community_publish_file', {
        p_title: title.trim(), p_summary: summary.trim(), p_subject: subject, p_grade: grade ? Number(grade) : null,
        p_lesson_ref: lessonRef.trim(), p_license: license, p_visibility: visibility, p_file: meta,
      });
      if (error) { await sb.storage.from('community-files').remove([meta.path]); throw new Error(error.message); }
      setOpen(false); setFile(null); setTitle(''); setSummary(''); setLessonRef(''); setOwnWork(false);
      router.push('/giao-vien/cong-dong?tab=da_dang');
      router.refresh();
    } catch (e) {
      const m = (e as Error).message;
      setNote(/rate_limited/.test(m) ? 'Thầy cô đăng nhiều quá trong một giờ, thử lại sau nhé.'
        : /bucket not found|could not find the function|PGRST202/i.test(m) ? 'Đăng tài liệu chưa được bật trên máy chủ (cần chạy migration 0080).'
        : `Chưa đăng được: ${m}`);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" className="cdg-btn" onClick={() => setOpen(true)}><Upload aria-hidden="true" /> Đăng tài liệu</button>
      {open && createPortal(
        <div className="cdg-modal-bg" onClick={() => !busy && setOpen(false)}>
          <form className="cdg-modal is-wide" role="dialog" aria-modal="true" aria-label="Đăng tài liệu" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <header><h2>Đăng tài liệu lên Kho chia sẻ</h2><button type="button" className="cdg-icon" onClick={() => setOpen(false)} aria-label="Đóng"><X aria-hidden="true" /></button></header>
            <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
            <button type="button" className={`cdg-drop${file ? ' has-file' : ''}`} onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}>
              <Upload aria-hidden="true" />
              {file ? <span><b>{file.name}</b><small>{fmtSize(file.size)} · bấm để đổi file</small></span>
                : <span><b>Chọn hoặc kéo thả file vào đây</b><small>Word, Excel, PowerPoint, PDF, ảnh — tối đa 20 MB</small></span>}
            </button>
            <label className="cdg-field">Tên tài liệu<input className="cdg-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required /></label>
            <label className="cdg-field">Giới thiệu ngắn (không bắt buộc)<textarea className="cdg-input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600} rows={2} /></label>
            <div className="cdg-row">
              <label className="cdg-field">Môn<select className="cdg-input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">— Chọn môn —</option>{subjects.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label className="cdg-field">Khối<select className="cdg-input" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Lớp {n}</option>)}</select></label>
              <label className="cdg-field is-grow">Bài / chủ đề<input className="cdg-input" value={lessonRef} onChange={(e) => setLessonRef(e.target.value)} maxLength={160} placeholder="vd. Bài 10 – Phép cộng trong phạm vi 10" /></label>
            </div>
            <fieldset className="cdg-field"><legend>Giấy phép</legend>
              <div className="cdg-opts">{(Object.keys(LICENSE_INFO) as License[]).map((k) => (
                <label key={k} className={license === k ? 'is-on' : ''}><input type="radio" name="lic" checked={license === k} onChange={() => setLicense(k)} /><span><b>{LICENSE_INFO[k].label}</b><small>{LICENSE_INFO[k].desc}</small></span></label>
              ))}</div>
            </fieldset>
            <fieldset className="cdg-field"><legend>Ai được xem</legend>
              <div className="cdg-opts is-2">{(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((k) => (
                <label key={k} className={visibility === k ? 'is-on' : ''}><input type="radio" name="vis" checked={visibility === k} onChange={() => setVisibility(k)} /><span><b>{VISIBILITY_LABEL[k]}</b></span></label>
              ))}</div>
            </fieldset>
            <label className="cdg-check"><input type="checkbox" checked={ownWork} onChange={(e) => setOwnWork(e.target.checked)} />
              <span>Tôi là tác giả hoặc có quyền chia sẻ tài liệu này; tài liệu không chép nguyên sách giáo khoa và không có ảnh, thông tin riêng của học sinh.</span></label>
            {note && <p className="cdg-note" role="alert">{note}</p>}
            <footer>
              <button type="button" className="cdg-btn is-ghost" onClick={() => setOpen(false)} disabled={busy}>Huỷ</button>
              <button type="submit" className="cdg-btn" disabled={busy || !file}>{busy ? 'Đang đăng…' : 'Đăng tài liệu'}</button>
            </footer>
          </form>
        </div>,
        document.body, // hộp thoại ra ngoài khung trang để phủ cả thanh bên
      )}
    </>
  );
}
