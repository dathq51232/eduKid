'use client';

// Thư viện nhân vật / bối cảnh của Xưởng video (chỉ quản trị; mọi quản trị viên dùng chung).
// Nhân vật mới tạo nhanh bằng vài lựa chọn (dáng người, tóc, đồ vật nhận diện, màu) — mô tả tiếng Anh tự ghép,
// vẫn sửa tay được ở phần "Nâng cao". Mỗi mục có tối đa 4 ảnh tham chiếu để tải lên Google Flow cùng câu lệnh.
import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Copy, ImagePlus, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { CHAR_COLORS, CHAR_HAIR, CHAR_ITEMS, CHAR_KINDS, buildCharacterAnchor, type CharBuild, type LibItem } from '@/lib/video-studio/presets';
import { deleteLibItem, saveLibItem, uploadRef, type LibKind } from '@/lib/video-studio/store';

type Props = {
  kind: LibKind;
  items: LibItem[];
  sb: SupabaseClient | null;
  cloud: boolean;
  urls: Record<string, string>;
  onChange: (items: LibItem[]) => void;
};
const SETTING_TEMPLATE = 'A [place] for primary school children: [3-5 fixed objects or landmarks], [light and time of day], [main colors of the place].';
const START: CharBuild = { kind: 'child', hair: 'short', item: 'cap', color: 'red' };

export default function LibraryPanel({ kind, items, sb, cloud, urls, onChange }: Props) {
  const [draft, setDraft] = useState<LibItem | null>(null);
  const [build, setBuild] = useState<CharBuild | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isChar = kind === 'character';
  const label = isChar ? 'nhân vật' : 'bối cảnh';

  const startNew = (from?: LibItem) => {
    setErr('');
    const b = isChar && !from ? START : null;
    setBuild(b);
    setDraft({ id: '', name: from ? `${from.name} (bản sao)` : '', note: from?.note ?? '', anchor: from?.anchor ?? (b ? buildCharacterAnchor(b) : SETTING_TEMPLATE), refs: [], shared: true });
  };
  const setB = (patch: Partial<CharBuild>) => {
    if (!build || !draft) return;
    const b = { ...build, ...patch };
    setBuild(b);
    setDraft({ ...draft, anchor: buildCharacterAnchor(b), note: draft.note || (b.kind === 'adult' ? 'người lớn' : b.kind === 'elder' ? 'ông bà' : 'học sinh') });
  };
  const save = async () => {
    if (!draft || !sb) return;
    if (!draft.name.trim() || draft.anchor.trim().length < 10) { setErr('Cần tên và mô tả (ít nhất 10 ký tự).'); return; }
    if (/\[[^\]]+\]/.test(draft.anchor)) { setErr('Mô tả còn chỗ trong ngoặc vuông [ ] chưa điền.'); return; }
    setBusy(true); setErr('');
    try {
      const saved = await saveLibItem(sb, kind, { ...draft, shared: true });
      onChange(draft.owner ? items.map((x) => (x.id === saved.id ? saved : x)) : [...items, saved]);
      setDraft(null); setBuild(null);
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
          {isChar
            ? 'Mỗi nhân vật có một mô tả cố định (tiếng Anh) được chép nguyên văn vào mọi cảnh — nhờ vậy Veo vẽ nhân vật giống nhau giữa các cảnh. Ghi chú có chữ “cô / thầy / giáo viên” thì khi tách cảnh tự động, nhân vật đó đóng vai người giảng bài.'
            : 'Bối cảnh cố định cho từng nơi trong câu chuyện. Ảnh tham chiếu giúp Flow vẽ lại đúng nơi đó ở các video sau.'}
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => startNew()} disabled={!cloud}><Plus aria-hidden="true" /> Thêm {label}</button>
      </div>
      {!cloud && <p className="vs-warn">Chưa bật lưu thư viện: chạy <code>0064_video_studio.sql</code> rồi <code>0066_video_studio_admin_only.sql</code> trên Supabase. Hiện chỉ dùng được mẫu có sẵn.</p>}
      {err && !draft && <p className="vs-warn" role="alert">{err}</p>}

      {draft && (
        <div className="vs-form" role="group" aria-label={`${draft.owner ? 'Sửa' : 'Thêm'} ${label}`}>
          <div className="vs-row">
            <label className="vs-field"><span>Tên</span><input value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={isChar ? 'Ví dụ: Bạn Na' : 'Ví dụ: Phòng y tế'} /></label>
            <label className="vs-field"><span>Ghi chú (vai trò, tính cách)</span><input value={draft.note} maxLength={200} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={isChar ? 'học sinh lớp 2, nhút nhát' : 'Đặc điểm nơi này'} /></label>
          </div>
          {build && (
            <div className="vs-build">
              <label className="vs-field"><span>Dáng người</span><select value={build.kind} onChange={(e) => setB({ kind: e.target.value as CharBuild['kind'] })}>{CHAR_KINDS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
              <label className="vs-field"><span>Tóc</span><select value={build.hair} onChange={(e) => setB({ hair: e.target.value })}>{CHAR_HAIR.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
              <label className="vs-field"><span>Đồ vật nhận diện</span><select value={build.item} onChange={(e) => setB({ item: e.target.value })}>{CHAR_ITEMS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
              <label className="vs-field"><span>Màu đồ vật</span><select value={build.color} onChange={(e) => setB({ color: e.target.value })}>{CHAR_COLORS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
              <p className="vs-muted vs-build-tip">Mỗi nhân vật nên có một đồ vật + màu riêng (không trùng nhân vật khác) để Veo phân biệt.</p>
            </div>
          )}
          <details className="vs-adv" open={!build}>
            <summary>{build ? 'Nâng cao: xem / sửa mô tả tiếng Anh' : 'Mô tả cố định (tiếng Anh — điền các chỗ [ ])'}</summary>
            <textarea rows={6} value={draft.anchor} maxLength={2000} lang="en" onChange={(e) => { setBuild(null); setDraft({ ...draft, anchor: e.target.value }); }} aria-label="Mô tả cố định" />
          </details>
          <div>
            <p className="vs-field-label">Ảnh tham chiếu (tối đa 4: chính diện, nghiêng, biểu cảm)</p>
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
          </div>
          {err && <p className="vs-warn" role="alert">{err}</p>}
          <div className="vs-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setDraft(null); setBuild(null); }}>Huỷ</button>
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
              )) : <span className="vs-noimg">{isChar ? '🧍' : '🏞️'}<small>Chưa có ảnh</small></span>}
            </div>
            <div className="vs-card-body">
              <p className="vs-card-name">{it.name}{it.builtin && <span className="vs-tag"><Lock aria-hidden="true" /> Mẫu</span>}</p>
              {it.note && <p className="vs-muted">{it.note}</p>}
              <details><summary>Mô tả cố định</summary><p className="vs-anchor" lang="en">{it.anchor}</p></details>
              <div className="vs-actions">
                <button type="button" className="vs-mini" onClick={() => startNew(it)} disabled={!cloud} title="Tạo bản sao để sửa"><Copy aria-hidden="true" /> Nhân bản</button>
                {!it.builtin && <button type="button" className="vs-mini" onClick={() => { setErr(''); setBuild(null); setDraft({ ...it }); }}><Pencil aria-hidden="true" /> Sửa</button>}
                {!it.builtin && <button type="button" className="vs-mini is-danger" onClick={() => void remove(it)}><Trash2 aria-hidden="true" /> Xoá</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
