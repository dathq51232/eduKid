'use client';

// Thư viện nhân vật / bối cảnh của Xưởng video: mẫu có sẵn của EduChain + mục thầy cô tạo (dùng chung cho
// giáo viên và quản trị). Mỗi mục có mô tả cố định bằng tiếng Anh (lặp nguyên văn trong mọi câu lệnh) và
// tối đa 4 ảnh tham chiếu để tải lên Google Flow cùng câu lệnh.
import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Copy, ImagePlus, Lock, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { CHARACTER_TEMPLATE, type LibItem } from '@/lib/video-studio/presets';
import { deleteLibItem, saveLibItem, uploadRef, type LibKind } from '@/lib/video-studio/store';

type Props = {
  kind: LibKind;
  items: LibItem[];
  sb: SupabaseClient | null;
  cloud: boolean;
  me: string | null;
  isAdmin: boolean;
  urls: Record<string, string>;
  onChange: (items: LibItem[]) => void;
};
const SETTING_TEMPLATE = 'A [place] for primary school children: [3–5 fixed objects or landmarks], [light and time of day], [main colors of the place].';

export default function LibraryPanel({ kind, items, sb, cloud, me, isAdmin, urls, onChange }: Props) {
  const [draft, setDraft] = useState<LibItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const label = kind === 'character' ? 'nhân vật' : 'bối cảnh';
  const canEdit = (it: LibItem) => !it.builtin && (it.owner === me || isAdmin);

  const startNew = (from?: LibItem) => {
    setErr('');
    setDraft({ id: '', name: from ? `${from.name} (bản sao)` : '', note: from?.note ?? '', anchor: from?.anchor ?? (kind === 'character' ? CHARACTER_TEMPLATE : SETTING_TEMPLATE), refs: [], shared: true });
  };
  const save = async () => {
    if (!draft || !sb) return;
    if (!draft.name.trim() || draft.anchor.trim().length < 10) { setErr('Cần tên và mô tả (ít nhất 10 ký tự).'); return; }
    if (/\[[^\]]+\]/.test(draft.anchor)) { setErr('Mô tả còn chỗ trong ngoặc vuông [ ] chưa điền.'); return; }
    setBusy(true); setErr('');
    try {
      const saved = await saveLibItem(sb, kind, draft);
      onChange(draft.owner ? items.map((x) => (x.id === saved.id ? saved : x)) : [...items, saved]);
      setDraft(null);
    } catch (e) { setErr(`Chưa lưu được: ${(e as Error).message}`); }
    setBusy(false);
  };
  const remove = async (it: LibItem) => {
    if (!sb || !window.confirm(`Xoá ${label} "${it.name}"? Các dự án đang dùng sẽ báo thiếu.`)) return;
    try { await deleteLibItem(sb, it); onChange(items.filter((x) => x.id !== it.id)); } catch (e) { setErr(`Chưa xoá được: ${(e as Error).message}`); }
  };
  const addImages = async (files: FileList | null) => {
    if (!files || !draft || !sb) return;
    setBusy(true); setErr('');
    const refs = [...draft.refs];
    for (const f of [...files].slice(0, 4 - refs.length)) {
      try { refs.push(await uploadRef(sb, f)); } catch (e) { setErr(`Ảnh ${f.name}: ${(e as Error).message}`); }
    }
    setDraft({ ...draft, refs });
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="vs-lib">
      <div className="vs-lib-hd">
        <p className="vs-muted">
          {kind === 'character'
            ? 'Mô tả cố định (tiếng Anh) được chép nguyên văn vào mọi cảnh — đó là cách giữ nhân vật đồng nhất. Thêm 2–4 ảnh (chính diện, nghiêng, biểu cảm) để tải lên Flow làm ảnh tham chiếu.'
            : 'Bối cảnh cố định cho từng nơi trong câu chuyện. Ảnh tham chiếu giúp Flow vẽ lại đúng nơi đó ở các video sau.'}
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => startNew()} disabled={!cloud}><Plus aria-hidden="true" /> Thêm {label}</button>
      </div>
      {!cloud && <p className="vs-warn">Chưa bật lưu thư viện: chạy <code>supabase/migrations/0064_video_studio.sql</code> trên Supabase. Hiện chỉ dùng được mẫu có sẵn.</p>}
      {err && !draft && <p className="vs-warn" role="alert">{err}</p>}

      {draft && (
        <div className="vs-form" role="group" aria-label={`Sửa ${label}`}>
          <div className="vs-row">
            <label className="vs-field"><span>Tên</span><input value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={kind === 'character' ? 'Ví dụ: Bé Chain' : 'Ví dụ: Lớp học tiểu học'} /></label>
            <label className="vs-field"><span>Ghi chú (tiếng Việt, cho AI chọn đúng)</span><input value={draft.note} maxLength={200} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={kind === 'character' ? 'Tính cách, vai trò' : 'Đặc điểm nơi này'} /></label>
          </div>
          <label className="vs-field"><span>Mô tả cố định (tiếng Anh — điền các chỗ [ ])</span>
            <textarea rows={7} value={draft.anchor} maxLength={2000} onChange={(e) => setDraft({ ...draft, anchor: e.target.value })} />
          </label>
          <div className="vs-refs">
            {draft.refs.map((p) => (
              <span key={p} className="vs-ref">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh ký tạm từ Supabase Storage */}
                {urls[p] ? <img src={urls[p]} alt="" /> : <span className="vs-ref-ph">…</span>}
                <button type="button" onClick={() => setDraft({ ...draft, refs: draft.refs.filter((x) => x !== p) })} aria-label="Bỏ ảnh"><X aria-hidden="true" /></button>
              </span>
            ))}
            {draft.refs.length < 4 && (
              <label className="vs-ref vs-ref-add">
                <ImagePlus aria-hidden="true" /><span>Thêm ảnh</span>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => void addImages(e.target.files)} />
              </label>
            )}
          </div>
          <label className="vs-check"><input type="checkbox" checked={draft.shared ?? true} onChange={(e) => setDraft({ ...draft, shared: e.target.checked })} /> Dùng chung cho mọi giáo viên và quản trị</label>
          {err && <p className="vs-warn" role="alert">{err}</p>}
          <div className="vs-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDraft(null)}>Huỷ</button>
          </div>
        </div>
      )}

      <ul className="vs-cards">
        {items.map((it) => (
          <li key={it.id} className="vs-card">
            <div className="vs-card-imgs">
              {it.refs.length ? it.refs.slice(0, 2).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh ký tạm từ Supabase Storage
                urls[p] ? <img key={p} src={urls[p]} alt="" /> : <span key={p} className="vs-ref-ph">…</span>
              )) : <span className="vs-noimg">{kind === 'character' ? '🧍' : '🏞️'}<small>Chưa có ảnh</small></span>}
            </div>
            <div className="vs-card-body">
              <p className="vs-card-name">
                {it.name}
                {it.builtin ? <span className="vs-tag"><Lock aria-hidden="true" /> Mẫu</span> : it.shared ? <span className="vs-tag is-shared"><Users aria-hidden="true" /> Dùng chung</span> : <span className="vs-tag">Riêng</span>}
              </p>
              {it.note && <p className="vs-muted">{it.note}</p>}
              <details><summary>Mô tả cố định</summary><p className="vs-anchor" lang="en">{it.anchor}</p></details>
              <div className="vs-actions">
                <button type="button" className="vs-mini" onClick={() => startNew(it)} disabled={!cloud} title="Tạo bản sao để sửa"><Copy aria-hidden="true" /> Nhân bản</button>
                {canEdit(it) && <button type="button" className="vs-mini" onClick={() => { setErr(''); setDraft({ ...it }); }}><Pencil aria-hidden="true" /> Sửa</button>}
                {canEdit(it) && <button type="button" className="vs-mini is-danger" onClick={() => void remove(it)}><Trash2 aria-hidden="true" /> Xoá</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
