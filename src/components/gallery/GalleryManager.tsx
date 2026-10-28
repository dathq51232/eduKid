'use client';

// Phòng triển lãm của lớp — trang giáo viên: xem phòng 3D, thêm tác phẩm (chụp, làm phẳng), duyệt bài học sinh nộp,
// ẩn / xoá / sửa lời nhận xét, ghi âm lời giới thiệu, Hành trình nét chữ của từng em, chọn chủ đề trang trí.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, GalleryHorizontalEnd, Inbox, LayoutDashboard, PenLine, Plus, Settings2, Trash2, TrendingUp, Upload } from 'lucide-react';
import GalleryView from './GalleryView';
import ScanUpload from './ScanUpload';
import WritingJourney from './WritingJourney';
import ArtViewer from './ArtViewer';
import { ArrangePanel, EditItemDialog } from './ArrangePanel';
import { arrange, deleteItem, editItem, galleryError, loadGallery, saveSettings, updateItem, uploadFile } from '@/lib/gallery/client';
import { sampleItems } from '@/lib/gallery/samples';
import { KIND_LABEL, THEMES, autoSize, fmtDate, wallOrder, type GalleryData, type GalleryItem, type GalleryKind, type NameMode, type ThemeKey, type WallSizes } from '@/lib/gallery/types';

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
    try { await saveSettings(classId, nm, th); setData((d) => (d ? { ...d, settings: { ...d.settings, name_mode: nm, theme: th } } : d)); setMsg('Đã lưu cài đặt phòng.'); }
    catch (e) { setMsg(galleryError(e)); }
  };
  // ------------------------------------------------ sắp xếp & chỉnh sửa (migration 0040)
  const [arrangeOn, setArrangeOn] = useState(false);
  const [over, setOver] = useState<Record<string, { pos?: number; scale?: number }>>({});
  const [draftSizes, setDraftSizes] = useState<WallSizes | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [praiseFirst, setPraiseFirst] = useState(false);
  const draft = useMemo(() => items.map((i) => (over[i.id] ? { ...i, ...over[i.id] } : i)), [items, over]);
  const sizes: WallSizes = draftSizes ?? data?.settings.sizes ?? {};
  const dirty = Object.keys(over).length > 0 || draftSizes !== null;
  const autoK = useMemo(() => {
    const n = (k: GalleryKind) => draft.filter((i) => i.kind === k && i.status === 'shown').length;
    return { praise: autoSize(n('praise')), art: autoSize(n('art')), writing: autoSize(n('writing')) };
  }, [draft]);
  const wall = (k: GalleryKind, list = draft) => list.filter((i) => i.kind === k && i.status === 'shown').sort(wallOrder);
  const move = (id: string, d: -1 | 1 | 'first' | 'last') => {
    const it = draft.find((i) => i.id === id); if (!it) return;
    const ids = wall(it.kind).map((i) => i.id);
    const at = ids.indexOf(id);
    ids.splice(at, 1);
    const to = d === 'first' ? 0 : d === 'last' ? ids.length : Math.max(0, Math.min(ids.length, at + d));
    ids.splice(to, 0, id);
    setOver((o) => { const n = { ...o }; ids.forEach((x, i) => { n[x] = { ...n[x], pos: i }; }); return n; });
  };
  const scaleOf = (id: string, v: number) => setOver((o) => ({ ...o, [id]: { ...o[id], scale: Math.round(Math.max(0.4, Math.min(1.6, v)) * 100) / 100 } }));
  const setSize = (k: GalleryKind, v: number | undefined) => setDraftSizes((cur) => {
    const n = { ...(cur ?? data?.settings.sizes ?? {}) };
    if (v === undefined) delete n[k]; else n[k] = v;
    return n;
  });
  const cancelArrange = () => { setOver({}); setDraftSizes(null); };
  const saveArrange = async () => {
    setBusy(true);
    try {
      const payload = (['praise', 'art', 'writing'] as GalleryKind[]).flatMap((k) => wall(k).map((i, pos) => ({ id: i.id, pos, scale: i.scale ?? 1 })));
      await arrange(classId, sizes, payload);
      const byId = new Map(payload.map((p) => [p.id, p]));
      setData((d) => (d ? { ...d, settings: { ...d.settings, sizes }, items: d.items.map((i) => (byId.has(i.id) ? { ...i, pos: byId.get(i.id)!.pos, scale: byId.get(i.id)!.scale } : i)) } : d));
      setOver({}); setDraftSizes(null);
      setMsg('Đã lưu bố cục phòng triển lãm.');
    } catch (e) { setMsg(galleryError(e)); } finally { setBusy(false); }
  };
  const patchLocal = (id: string, p: Partial<GalleryItem>) => setData((d) => (d ? { ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) } : d));
  const hideItem = async (id: string) => {
    setBusy(true);
    try { await updateItem(id, { status: 'hidden' }); patchLocal(id, { status: 'hidden' }); setSelected(null); setMsg('Đã ẩn khỏi tường (xem lại ở mục Quản lý).'); }
    catch (e) { setMsg(galleryError(e)); } finally { setBusy(false); }
  };
  const removeItem = async (id: string) => {
    const it = items.find((i) => i.id === id); if (!it) return;
    if (!window.confirm(`Xoá hẳn ${KIND_LABEL[it.kind].toLowerCase()} “${it.title || ''}” của ${it.student_name || 'cả lớp'}?`)) return;
    setBusy(true);
    try { await deleteItem(id); setData((d) => (d ? { ...d, items: d.items.filter((i) => i.id !== id) } : d)); setSelected(null); setMsg('Đã xoá.'); }
    catch (e) { setMsg(galleryError(e)); } finally { setBusy(false); }
  };
  const saveEdit = async (id: string, p: { title: string; note: string; student: string | null; classWide: boolean; kind: GalleryKind; audio: Blob | null; clearAudio: boolean }) => {
    const it = items.find((i) => i.id === id);
    await editItem(id, p);
    if (p.audio) { const a = await uploadFile(classId, p.audio); await updateItem(id, { audio: a }); }
    else if (p.clearAudio) await updateItem(id, { clearAudio: true });
    patchLocal(id, {
      title: p.title.trim(), note: p.note.trim(), student_id: p.student, student_name: p.student ? students.find((s) => s.id === p.student)?.name ?? null : null,
      kind: p.kind, ...(it && it.kind !== p.kind ? { pos: null } : {}), ...(p.clearAudio && !p.audio ? { audio_path: null, audio_url: undefined } : {}),
    });
    if (p.audio) void reload();
    setMsg('Đã lưu thông tin tác phẩm.');
  };
  const editingItem = editing ? items.find((i) => i.id === editing) ?? null : null;

  const viewItems = empty || err ? (showSample ? samples ?? [] : []) : arrangeOn ? draft : items;
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
          sizes={sizes} selected={arrangeOn ? selected : null} onSelect={arrangeOn ? setSelected : undefined}
          editPanel={arrangeOn && data ? (
            <ArrangePanel items={draft} sizes={sizes} auto={autoK} selected={draft.find((i) => i.id === selected) ?? null} dirty={dirty} busy={busy} classId={classId}
              onSize={setSize} onMove={move} onScale={scaleOf} onEdit={setEditing} onHide={(id) => void hideItem(id)} onDelete={(id) => void removeItem(id)}
              onSave={() => void saveArrange()} onCancel={cancelArrange} onUploadPraise={() => { setPraiseFirst(true); setTab('them'); }}
              onClose={() => { if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu?')) return; cancelArrange(); setArrangeOn(false); setSelected(null); }} />
          ) : undefined}
          banner={(empty || err) ? (
            <p className="adm-alert is-info gm-sample">
              {showSample && !samples ? 'Đang dựng phòng mẫu…' : showSample ? 'Đây là PHÒNG MẪU (tranh và thư khen minh hoạ) để thầy cô hình dung. Thêm tác phẩm thật ở mục “Thêm tác phẩm”.' : 'Phòng đang trống.'}
              <button type="button" className="mini-btn" onClick={() => setShowSample((v) => !v)}>{showSample ? 'Ẩn phòng mẫu' : 'Xem phòng mẫu'}</button>
              {!err && <button type="button" className="mini-btn" onClick={() => setTab('them')}><Upload aria-hidden="true" /> Thêm tác phẩm</button>}
            </p>
          ) : undefined}
          tools={data && (
            <span className="gm-set">
              {!empty && !arrangeOn && <button type="button" className="btn btn-primary btn-sm" onClick={() => { setArrangeOn(true); setMsg(''); }}><LayoutDashboard aria-hidden="true" /> Sắp xếp & chỉnh sửa</button>}
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
          <ScanUpload key={praiseFirst ? 'praise' : 'art'} classId={classId} students={students} kinds={praiseFirst ? ['praise', 'art', 'writing'] : ['art', 'writing', 'praise']} onSaved={() => void reload()} />
          <p className="dash-muted gm-note">Thư khen: tạo ở mục <Link href={`/giao-vien/lop/${classId}/thu-khen`}>Thư khen</Link>, tích “Treo lên Phòng triển lãm” thì thư tự lên tường khi tải PDF / ảnh / in.
            Ảnh có khuôn mặt các em: chỉ đăng khi gia đình đồng ý.</p>
        </section>
      )}

      {tab === 'duyet' && (
        <section className="dash-section">
          <h2>Bài các em tự nộp ({pending.length})</h2>
          {!pending.length && <p className="dash-muted">Chưa có bài nào chờ duyệt. Các em nộp ở trang Phòng triển lãm hoặc Luyện chữ.</p>}
          <ul className="gm-list">
            {pending.map((it) => <Row key={it.id} it={it} onOpen={setOpen} onChanged={reload} onMsg={setMsg} onEdit={setEditing} approve />)}
          </ul>
        </section>
      )}

      {tab === 'quan-ly' && (
        <section className="dash-section">
          <h2>Tất cả tác phẩm ({items.length})</h2>
          {!items.length && <p className="dash-muted">Chưa có tác phẩm nào.</p>}
          <ul className="gm-list">
            {sorted.map((it) => <Row key={it.id} it={it} onOpen={setOpen} onChanged={reload} onMsg={setMsg} onEdit={setEditing} />)}
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
      {editingItem && <EditItemDialog key={editingItem.id} item={editingItem} students={students} onClose={() => setEditing(null)} onSave={(p) => saveEdit(editingItem.id, p)} />}
    </div>
  );
}

function Row({ it, onOpen, onChanged, onMsg, onEdit, approve }: {
  it: GalleryItem; onOpen: (id: string) => void; onChanged: () => Promise<void> | void; onMsg: (s: string) => void; onEdit: (id: string) => void; approve?: boolean;
}) {
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
        <small>{it.title || '—'}{it.note ? ` · “${it.note}”` : ''} · {fmtDate(it.taken_on)}{it.hearts ? ` · ${it.hearts} lượt khen` : ''}{it.audio_path ? ' · có tiếng giới thiệu' : ''}</small>
      </div>
      <div className="gm-act">
        {approve || it.status === 'pending' ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'shown' }), 'Đã duyệt, tác phẩm lên tường.')}><Check aria-hidden="true" /> Duyệt</button>
        ) : it.status === 'shown' ? (
          <button type="button" className="mini-btn" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'hidden' }), 'Đã ẩn khỏi tường.')}><EyeOff aria-hidden="true" /> Ẩn</button>
        ) : (
          <button type="button" className="mini-btn" disabled={busy} onClick={() => void run(() => updateItem(it.id, { status: 'shown' }), 'Đã treo lại.')}><Eye aria-hidden="true" /> Hiện</button>
        )}
        <button type="button" className="mini-btn" onClick={() => onEdit(it.id)}>Sửa</button>
        <button type="button" className="mini-btn is-danger" disabled={busy} aria-label="Xoá tác phẩm" onClick={() => {
          if (window.confirm(`Xoá hẳn tác phẩm “${it.title || KIND_LABEL[it.kind]}” của ${it.student_name || 'cả lớp'}?`)) void run(() => deleteItem(it.id), 'Đã xoá.');
        }}><Trash2 aria-hidden="true" /></button>
      </div>
    </li>
  );
}
