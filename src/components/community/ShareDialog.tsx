'use client';

// Hộp "Chia sẻ lên Cộng đồng" dùng chung (bài giảng, giáo án, tài liệu): ít ô nhất có thể.
//   Bắt buộc: tên (điền sẵn) · ai được xem · giấy phép (nhớ lựa chọn lần trước) · xác nhận quyền tác giả.
//   Tài liệu: thêm chọn file (≤ 20 MB) HOẶC dán liên kết Drive / OneDrive / YouTube / Canva (file lớn), môn + khối.
//   Mô tả, bài / chủ đề: gói trong "Thêm chi tiết" (không bắt buộc).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Link2, School, Upload, X } from 'lucide-react';
import { ACCEPT, fileProblem, fmtSize, linkInfo } from '@/lib/community/files';
import { LICENSE_INFO, type License, type Visibility } from '@/lib/community/types';
import type { ShareForm } from '@/lib/community/share';
import '@/styles/cdg.css';

export type ShareKind = 'bai_giang' | 'giao_an' | 'tai_lieu';
export type ShareResult = { form: ShareForm; file?: File; link?: string };
const PREF = 'cdg-share-pref';
const loadPref = (): { license?: License; visibility?: Visibility } => { try { return JSON.parse(localStorage.getItem(PREF) ?? '{}'); } catch { return {}; } };

export default function ShareDialog({ kind, defaults, subjects, onClose, onSubmit }: {
  kind: ShareKind;
  defaults: Partial<ShareForm>;
  /** danh sách môn (mã, tên) — chỉ cần khi đăng tài liệu */
  subjects?: [string, string][];
  onClose: () => void;
  /** đăng; ném lỗi (câu tiếng Việt) để hiện trong hộp. onStep: báo tiến độ */
  onSubmit: (r: ShareResult, onStep: (t: string) => void) => Promise<void>;
}) {
  const isDoc = kind === 'tai_lieu';
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState(defaults.title ?? '');
  const [subject, setSubject] = useState(defaults.subject ?? '');
  const [grade, setGrade] = useState<string>(defaults.grade ? String(defaults.grade) : '');
  const [summary, setSummary] = useState(defaults.summary ?? '');
  const [lessonRef, setLessonRef] = useState(defaults.lessonRef ?? '');
  const [license, setLicense] = useState<License>(defaults.license ?? (isDoc ? 'dung' : 'sua'));
  const [visibility, setVisibility] = useState<Visibility>(defaults.visibility ?? 'truong');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const p = loadPref(); if (p.visibility) setVisibility(p.visibility); if (p.license && !defaults.license) setLicense(p.license); }, [defaults.license]);

  const pick = (f?: File) => {
    if (!f) return;
    const bad = fileProblem(f);
    setNote(bad ?? '');
    if (bad) { if (f.size > 20 * 1024 * 1024) setMode('link'); return; }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 160));
  };
  const li = mode === 'link' ? linkInfo(link) : null;
  const ready = title.trim().length >= 3 && ok && (!isDoc || (mode === 'file' ? !!file : !!li));

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true); setNote('');
    try { localStorage.setItem(PREF, JSON.stringify({ license, visibility })); } catch { /* bỏ qua */ }
    try {
      await onSubmit({
        form: { title: title.trim(), summary, subject, grade: grade ? Number(grade) : null, lessonRef, license, visibility },
        file: isDoc && mode === 'file' ? file ?? undefined : undefined,
        link: isDoc && mode === 'link' ? li?.url : undefined,
      }, setStep);
    } catch (e) { setNote((e as Error).message); } finally { setBusy(false); setStep(''); }
  };

  const heading = kind === 'bai_giang' ? 'Chia sẻ bài giảng lên Cộng đồng' : kind === 'giao_an' ? 'Chia sẻ giáo án lên Cộng đồng' : 'Đăng tài liệu lên Cộng đồng';
  return createPortal(
    <div className="cdg-modal-bg" onClick={() => !busy && onClose()}>
      <form className="cdg-modal cdg-share" role="dialog" aria-modal="true" aria-label={heading} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <header><h2>{heading}</h2><button type="button" className="cdg-icon" onClick={onClose} disabled={busy} aria-label="Đóng"><X aria-hidden="true" /></button></header>

        {isDoc && (
          <>
            <div className="cdg-seg" role="radiogroup" aria-label="Cách đăng">
              <button type="button" role="radio" aria-checked={mode === 'file'} className={mode === 'file' ? 'is-on' : ''} onClick={() => setMode('file')}><Upload aria-hidden="true" /> Tải file lên <small>≤ 20 MB</small></button>
              <button type="button" role="radio" aria-checked={mode === 'link'} className={mode === 'link' ? 'is-on' : ''} onClick={() => setMode('link')}><Link2 aria-hidden="true" /> Dán liên kết <small>file lớn</small></button>
            </div>
            {mode === 'file' ? (
              <>
                <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
                <button type="button" className={`cdg-drop${file ? ' has-file' : ''}`} onClick={() => input.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}>
                  <Upload aria-hidden="true" />
                  {file ? <span><b>{file.name}</b><small>{fmtSize(file.size)} · bấm để đổi file</small></span>
                    : <span><b>Chọn hoặc kéo thả file</b><small>Word, Excel, PowerPoint, PDF, ảnh</small></span>}
                </button>
              </>
            ) : (
              <label className="cdg-field">Liên kết Google Drive, OneDrive, YouTube hoặc Canva
                <input className="cdg-input" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/…" />
                <small className={`cdg-hint${link && !li ? ' is-bad' : ''}`}>{link && !li ? 'Chỉ nhận liên kết https của Drive, OneDrive, YouTube, Canva.' : li ? `✓ ${li.source} — nhớ bật quyền “Người có liên kết được xem”. File nằm ở kho của thầy cô, app chỉ giữ liên kết.` : 'File để ở Drive của thầy cô, không tốn dung lượng app.'}</small>
              </label>
            )}
          </>
        )}

        <label className="cdg-field">Tên<input className="cdg-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required /></label>
        {isDoc && (
          <div className="cdg-row">
            <label className="cdg-field">Môn<select className="cdg-input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">—</option>{(subjects ?? []).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="cdg-field">Khối<select className="cdg-input" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Lớp {n}</option>)}</select></label>
          </div>
        )}

        <div className="cdg-field" role="radiogroup" aria-label="Ai được xem">Ai được xem
          <div className="cdg-seg">
            <button type="button" role="radio" aria-checked={visibility === 'truong'} className={visibility === 'truong' ? 'is-on' : ''} onClick={() => setVisibility('truong')}><School aria-hidden="true" /> Cùng trường</button>
            <button type="button" role="radio" aria-checked={visibility === 'giao_vien'} className={visibility === 'giao_vien' ? 'is-on' : ''} onClick={() => setVisibility('giao_vien')}><Globe aria-hidden="true" /> Mọi giáo viên</button>
          </div>
        </div>
        <label className="cdg-field">Giấy phép
          <select className="cdg-input" value={license} onChange={(e) => setLicense(e.target.value as License)}>
            {(Object.keys(LICENSE_INFO) as License[]).filter((k) => isDoc ? k !== 'sua' : true).map((k) => <option key={k} value={k}>{LICENSE_INFO[k].label}</option>)}
          </select>
          <small className="cdg-hint">{LICENSE_INFO[license].desc}</small>
        </label>

        <details className="cdg-more">
          <summary>Thêm mô tả, bài / chủ đề (không bắt buộc)</summary>
          <label className="cdg-field">Mô tả ngắn<textarea className="cdg-input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600} rows={2} placeholder="Dùng cho tiết nào, có gì hay…" /></label>
          <label className="cdg-field">Bài / chủ đề<input className="cdg-input" value={lessonRef} onChange={(e) => setLessonRef(e.target.value)} maxLength={160} placeholder="vd. Bài 10 – Phép cộng trong phạm vi 10" /></label>
        </details>

        <label className="cdg-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>Tôi là tác giả (hoặc được phép chia sẻ); không chép nguyên sách giáo khoa, không có ảnh hay thông tin riêng của học sinh.</span></label>
        {note && <p className="cdg-note" role="alert">{note}</p>}
        <footer>
          {step && <small className="cdg-step" role="status">{step}</small>}
          <button type="button" className="cdg-btn is-ghost" onClick={onClose} disabled={busy}>Huỷ</button>
          <button type="submit" className="cdg-btn" disabled={busy || !ready}>{busy ? 'Đang đăng…' : 'Chia sẻ'}</button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
