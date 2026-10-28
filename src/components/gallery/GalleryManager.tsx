'use client';

// Phòng triển lãm của lớp — trang giáo viên: xem phòng 3D, thêm tác phẩm (chụp, làm phẳng), duyệt bài học sinh nộp,
// ẩn / xoá / sửa lời nhận xét, ghi âm lời giới thiệu, Hành trình nét chữ của từng em, chọn chủ đề trang trí.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, GalleryHorizontalEnd, Inbox, PenLine, Plus, Settings2, Trash2, TrendingUp, Upload, X } from 'lucide-react';
import GalleryView from './GalleryView';
import ScanUpload from './ScanUpload';
import WritingJourney from './WritingJourney';
import ArtViewer from './ArtViewer';
import AudioRecorder from './AudioRecorder';
import { deleteItem, galleryError, loadGallery, saveSettings, updateItem, uploadFile } from '@/lib/gallery/client';
import { sampleItems } from '@/lib/gallery/samples';
import { KIND_LABEL, THEMES, fmtDate, type GalleryData, type GalleryItem, type NameMode, type ThemeKey } from '@/lib/gallery/types';

type Tab = 'phong' | 'them' | 'duyet' | 'quan-ly' | 'net-chu';
type Student = { id: string; name: string };

export default function GalleryManager({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const [tab, setTab] = useState<Tab>('phong');
  const [data, setData] = useState<GalleryData | null>(null);
  const [err, setErr] = useState('');
  const [samples, setSamples] = useState<GalleryItem[] | null>(null);
  const [showSample, setShowSample] = useState(true);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try { setData(await loadGallery(classId)); setErr(''); } catch (e) { setErr(e instanceof Error ? e.message : galleryError(e)); }
  }, [classId]);
  useEffect(() => { void reload(); }, [reload]);
  const items = useMemo(() => data?.items ?? [], [data]);
  const empty = !!data && !items.length;
  useEffect(() => { if ((empty || err) && !samples) void sampleItems(className).then(setSamples); }, [empty, err, samples, className]);

  const pending = items.filter((i) => i.status === 'pending');
  const theme = data?.settings.theme ?? 'nang';
  const nameMode = data?.settings.name_mode ?? 'given';
  const setSettings = async (nm: NameMode, th: ThemeKey) => {
    try { await saveSettings(classId, nm, th); setData((d) => (d ? { ...d, settings: { name_mode: nm, theme: th } } : d)); setMsg('Đã lưu cài đặt phòng.'); }
    catch (e) { setMsg(galleryError(e)); }
  };
  const viewItems = empty || err ? (showSample ? samples ?? [] : []) : items;
  const sorted = useMemo(() => [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)), [items]);

  const TABS: { key: Tab; label: string; Icon: typeof Eye; badge?: number }[] = [
    { key: 'phong', label: 'Phòng triển lãm', Icon: GalleryHorizontalEnd },
    { key: 'them', label: 'Thêm tác phẩm', Icon: Plus },
    { key: 'duyet', label: 'Chờ duyệt', Icon: Inbox, badge: pending.length },
    { key: 'quan-ly', label: 'Quản lý', Icon: Settings2 },
    { key: 'net-chu', label: 'Hành trình nét chữ', Icon: TrendingUp },
  ];

  return (
    <div className="gm">
      <header className="gm-head">
        <div>
          <h1>Phòng triển lãm lớp {className}</h1>
          <p className="dash-muted">Thư khen, tranh mỹ thuật, bài luyện chữ của các em — phụ huynh đăng nhập tài khoản của con để vào xem và thả tim.</p>
        </div>
        <Link href={`/giao-vien/lop/${classId}/thu-khen`} className="btn btn-outline btn-sm">Tạo thư khen</Link>
      </header>
      <nav className="gm-tabs" role="tablist" aria-label="Phòng triển lãm">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-on' : ''} onClick={() => { setTab(key); setMsg(''); }}>
            <Icon aria-hidden="true" /> {label}{badge ? <span className="gm-badge">{badge}</span> : null}
          </button>
        ))}
      </nav>
      {err && <p className="adm-alert is-error">{err}</p>}
      {msg && <p className="adm-alert is-info" role="status">{msg}</p>}

      {tab === 'phong' && (
        <GalleryView items={viewItems} className={className} theme={theme} mine={[]} canHeart={false}
          banner={(empty || err) ? (
            <p className="adm-alert is-info gm-sample">
              {showSample && !samples ? 'Đang dựng phòng mẫu…' : showSample ? 'Đây là PHÒNG MẪU (tranh và thư khen minh hoạ) để thầy cô hình dung. Thêm tác phẩm thật ở mục “Thêm tác phẩm”.' : 'Phòng đang trống.'}
              <button type="button" className="mini-btn" onClick={() => setShowSample((v) => !v)}>{showSample ? 'Ẩn phòng mẫu' : 'Xem phòng mẫu'}</button>
              {!err && <button type="button" className="mini-btn" onClick={() => setTab('them')}><Upload aria-hidden="true" /> Thêm tác phẩm</button>}
            </p>
          ) : undefined}
          tools={data && (
            <span className="gm-set">
              <label>Trang trí <select value={theme} onChange={(e) => void setSettings(nameMode, e.target.value as ThemeKey)}>
                {(Object.keys(THEMES) as ThemeKey[]).map((k) => <option key={k} value={k}>{THEMES[k].label}</option>)}
              </select></label>
              <label title="Phụ huynh thấy tên con mình đầy đủ; tên các bạn hiện theo lựa chọn này">Tên các bạn <select value={nameMode} onChange={(e) => void setSettings(e.target.value as NameMode, theme)}>
                <option value="given">Chỉ tên gọi (An)</option>
                <option value="full">Họ và tên</option>
              </select></label>
            </span>
          )} />
      )}

      {tab === 'them' && (
        <section className="dash-section">
          <h2>Thêm tác phẩm lên tường</h2>
          <ScanUpload classId={classId} students={students} kinds={['art', 'writing', 'praise']} onSaved={() => void reload()} />
          <p className="dash-muted gm-note">Thư khen: tạo ở mục <Link href={`/giao-vien/lop/${classId}/thu-khen`}>Thư khen</Link>, tích “Treo lên Phòng triển lãm” thì thư tự lên tường khi tải PDF / ảnh / in.
            Ảnh có khuôn mặt các em: chỉ đăng khi gia đình đồng ý.</p>
        </section>
      )}

      {tab === 'duyet' && (
        <section className="dash-section">
          <h2>Bài các em tự nộp ({pending.length})</h2>
          {!pending.length && <p className="dash-muted">Chưa có bài nào chờ duyệt. Các em nộp ở trang Phòng triển lãm hoặc Luyện chữ.</p>}
          <ul className="gm-list">
            {pending.map((it) => <Row key={it.id} it={it} onOpen={setOpen} onChanged={reload} onMsg={setMsg} classId={classId} approve />)}
          </ul>
        </section>
      )}

      {tab === 'quan-ly' && (
        <section className="dash-section">
          <h2>Tất cả tác phẩm ({items.length})</h2>
          {!items.length && <p className="dash-muted">Chưa có tác phẩm nào.</p>}
          <ul className="gm-list">
            {sorted.map((it) => <Row key={it.id} it={it} onOpen={setOpen} onChanged={reload} onMsg={setMsg} classId={classId} />)}
          </ul>
        </section>
      )}

      {tab === 'net-chu' && (
        <section className="dash-section">
          <WritingJourney items={items} students={students} onOpen={setOpen} />
          <p className="dash-muted gm-note"><PenLine aria-hidden="true" /> Bài viết lấy từ ảnh chụp vở (loại “Nét chữ”) và bài các em luyện trên màn hình đã được duyệt.</p>
        </section>
      )}

      {open && <ArtViewer list={items} id={open} onClose={() => setOpen(null)} onGo={setOpen} canHeart={false} />}
    </div>
  );
}

function Row({ it, onOpen, onChanged, onMsg, classId, approve }: {
  it: GalleryItem; onOpen: (id: string) => void; onChanged: () => Promise<void> | void; onMsg: (s: string) => void; classId: string; approve?: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(it.title);
  const [note, setNote] = useState(it.note);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); onMsg(ok); await onChanged(); } catch (e) { onMsg(galleryError(e)); } finally { setBusy(false); }
  };
  return (
    <li className={`gm-row s-${it.status}`}>
      <button type="button" className="gm-thumb" onClick={() => onOpen(it.id)} aria-label="Xem lớn">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {it.url && <img src={it.url} alt="" loading="lazy" />}
      </button>
      <div className="gm-meta">
        <b>{it.student_name || 'Cả lớp'}</b> <span className={`gv-kind k-${it.kind}`}>{KIND_LABEL[it.kind]}</span>
        {it.status !== 'shown' && <span className="gv-pending">{it.status === 'pending' ? 'Chờ duyệt' : 'Đang ẩn'}</span>}
        {!edit && <small>{it.title || '—'}{it.note ? ` · “${it.note}”` : ''} · {fmtDate(it.taken_on)}{it.hearts ? ` · ${it.hearts} lượt khen` : ''}{it.audio_path ? ' · có tiếng giới thiệu' : ''}</small>}
        {edit && (
          <div className="gm-edit">
            <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} aria-label="Tên tác phẩm" placeholder="Tên tác phẩm" />
            <textarea rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} aria-label="Lời nhận xét" placeholder="Lời nhận xét của cô" />
            <AudioRecorder value={audio} onChange={setAudio} label={it.audio_path ? 'Ghi âm lại lời giới thiệu' : 'Ghi âm lời giới thiệu'} />
            <span className="gm-edit-act">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(async () => {
                const a = audio ? await uploadFile(classId, audio) : null;
                await updateItem(it.id, { title, note, audio: a });
                setEdit(false); setAudio(null);
              }, 'Đã lưu.')}><Check aria-hidden="true" /> Lưu</button>
              {it.audio_path && <button type="button" className="mini-btn" disabled={busy} onClick={() => void run(() => updateItem(it.id, { clearAudio: true }), 'Đã xoá tiếng giới thiệu.')}>Xoá tiếng</button>}
              <button type="button" className="mini-btn" onClick={() => setEdit(false)}><X aria-hidden="true" /> Thôi</button>
            </span>
          </div>
        )}
      </div>
      <div className="gm-act">
        {approve || it.status === 'pending' ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'shown', note: note || undefined }), 'Đã duyệt, tác phẩm lên tường.')}><Check aria-hidden="true" /> Duyệt</button>
        ) : it.status === 'shown' ? (
          <button type="button" className="mini-btn" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'hidden' }), 'Đã ẩn khỏi tường.')}><EyeOff aria-hidden="true" /> Ẩn</button>
        ) : (
          <button type="button" className="mini-btn" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'shown' }), 'Đã treo lại.')}><Eye aria-hidden="true" /> Hiện</button>
        )}
        {!edit && <button type="button" className="mini-btn" onClick={() => setEdit(true)}>Sửa</button>}
        <button type="button" className="mini-btn is-danger" disabled={busy} aria-label="Xoá tác phẩm" onClick={() => {
          if (window.confirm(`Xoá hẳn tác phẩm “${it.title || KIND_LABEL[it.kind]}” của ${it.student_name || 'cả lớp'}?`)) void run(() => deleteItem(it.id), 'Đã xoá.');
        }}><Trash2 aria-hidden="true" /></button>
      </div>
    </li>
  );
}
