'use client';

// Chế độ "Sắp xếp & chỉnh sửa" của Phòng triển lãm (giáo viên):
// chọn cỡ khung cho cả bức tường (nhỏ lại để treo được nhiều em), dời chỗ / phóng to / thu nhỏ từng khung, sửa, ẩn, xoá, thêm thư khen.
import { useState } from 'react';
import Link from 'next/link';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, EyeOff, Minus, Pencil, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import { KIND_LABEL, SIZE_PRESETS, WALL_LABEL, wallOrder, type GalleryItem, type GalleryKind, type WallSizes } from '@/lib/gallery/types';

const KINDS: GalleryKind[] = ['praise', 'art', 'writing'];

export function ArrangePanel({ items, sizes, auto, selected, dirty, busy, classId, onSize, onMove, onScale, onEdit, onHide, onDelete, onSave, onCancel, onUploadPraise, onClose }: {
  items: GalleryItem[]; sizes: WallSizes; auto: Record<GalleryKind, number>; selected: GalleryItem | null; dirty: boolean; busy: boolean; classId: string;
  onSize: (k: GalleryKind, v: number | undefined) => void; onMove: (id: string, d: -1 | 1 | 'first' | 'last') => void; onScale: (id: string, v: number) => void;
  onEdit: (id: string) => void; onHide: (id: string) => void; onDelete: (id: string) => void; onSave: () => void; onCancel: () => void; onUploadPraise: () => void; onClose: () => void;
}) {
  const shown = items.filter((i) => i.status === 'shown');
  const sel = selected;
  const wallList = sel ? shown.filter((i) => i.kind === sel.kind).sort(wallOrder) : [];
  const idx = sel ? wallList.findIndex((i) => i.id === sel.id) : -1;
  const sc = sel?.scale ?? 1;
  return (
    <section className="ap" aria-label="Sắp xếp phòng triển lãm">
      <div className="ap-head">
        <h2>Sắp xếp & chỉnh sửa</h2>
        <div className="ap-foot">
          <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || busy} onClick={onSave}><Save aria-hidden="true" /> Lưu bố cục</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={!dirty || busy} onClick={onCancel}><RotateCcw aria-hidden="true" /> Huỷ thay đổi</button>
          <button type="button" className="mini-btn" onClick={onClose}><X aria-hidden="true" /> Đóng</button>
        </div>
      </div>
      {dirty && <p className="ap-dirty">Có thay đổi chưa lưu — bấm “Lưu bố cục” để phụ huynh thấy phòng mới.</p>}

      <div className="ap-walls">
        {KINDS.map((k) => {
          const n = shown.filter((i) => i.kind === k).length;
          const cur = sizes[k];
          return (
            <div key={k} className="ap-wall">
              <b>{WALL_LABEL[k]} <small>({n})</small></b>
              <div className="ap-sizes" role="radiogroup" aria-label={`Cỡ khung ${WALL_LABEL[k]}`}>
                <button type="button" role="radio" aria-checked={cur === undefined} className={cur === undefined ? 'is-on' : ''} onClick={() => onSize(k, undefined)} title={`Tự chọn theo số tác phẩm (đang ${Math.round(auto[k] * 100)}%)`}>Tự động</button>
                {SIZE_PRESETS.map((p) => (
                  <button key={p.k} type="button" role="radio" aria-checked={cur === p.k} className={cur === p.k ? 'is-on' : ''} onClick={() => onSize(k, p.k)}>{p.label}</button>
                ))}
              </div>
            </div>
          );
        })}
        <p className="dash-muted ap-tip">Khung nhỏ lại thì mỗi bức tường treo được nhiều hàng, nhiều em hơn.</p>
      </div>

      {!sel && <p className="ap-hint">Bấm vào một khung trong phòng (hoặc ảnh ở dạng lưới) để chọn, rồi dời chỗ, phóng to / thu nhỏ, sửa hoặc xoá.</p>}
      {sel && (
        <div className="ap-sel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {sel.url && <img src={sel.url} alt="" />}
          <div className="ap-sel-info">
            <b>{sel.student_name || 'Cả lớp'}</b> <span className={`gv-kind k-${sel.kind}`}>{KIND_LABEL[sel.kind]}</span>
            <small>{sel.title || '—'} · vị trí {idx + 1}/{wallList.length} · cỡ {Math.round(sc * 100)}%</small>
            <div className="ap-row" role="group" aria-label="Dời chỗ">
              <button type="button" className="mini-btn" disabled={idx <= 0} onClick={() => onMove(sel.id, 'first')} aria-label="Lên đầu tường"><ChevronsLeft aria-hidden="true" /></button>
              <button type="button" className="mini-btn" disabled={idx <= 0} onClick={() => onMove(sel.id, -1)}><ChevronLeft aria-hidden="true" /> Lên trước</button>
              <button type="button" className="mini-btn" disabled={idx >= wallList.length - 1} onClick={() => onMove(sel.id, 1)}>Ra sau <ChevronRight aria-hidden="true" /></button>
              <button type="button" className="mini-btn" disabled={idx >= wallList.length - 1} onClick={() => onMove(sel.id, 'last')} aria-label="Xuống cuối tường"><ChevronsRight aria-hidden="true" /></button>
            </div>
            <div className="ap-row" role="group" aria-label="Cỡ khung này">
              <button type="button" className="mini-btn" disabled={sc <= 0.4} onClick={() => onScale(sel.id, sc - 0.1)}><Minus aria-hidden="true" /> Nhỏ lại</button>
              <input type="range" min={40} max={160} step={5} value={Math.round(sc * 100)} onChange={(e) => onScale(sel.id, Number(e.target.value) / 100)} aria-label="Cỡ khung (%)" />
              <button type="button" className="mini-btn" disabled={sc >= 1.6} onClick={() => onScale(sel.id, sc + 0.1)}><Plus aria-hidden="true" /> To ra</button>
              <button type="button" className="mini-btn" disabled={sc === 1} onClick={() => onScale(sel.id, 1)}>Cỡ chuẩn</button>
            </div>
            <div className="ap-row">
              <button type="button" className="mini-btn" onClick={() => onEdit(sel.id)}><Pencil aria-hidden="true" /> Sửa thông tin</button>
              <button type="button" className="mini-btn" disabled={busy} onClick={() => onHide(sel.id)}><EyeOff aria-hidden="true" /> Ẩn khỏi tường</button>
              <button type="button" className="mini-btn is-danger" disabled={busy} onClick={() => onDelete(sel.id)}><Trash2 aria-hidden="true" /> Xoá</button>
            </div>
          </div>
        </div>
      )}

      <div className="ap-add">
        <b>Thêm thư khen:</b>
        <Link href={`/giao-vien/lop/${classId}/thu-khen`} className="mini-btn"><Plus aria-hidden="true" /> Tạo thư khen mới</Link>
        <button type="button" className="mini-btn" onClick={onUploadPraise}><Upload aria-hidden="true" /> Tải ảnh / chụp thư khen giấy</button>
      </div>
    </section>
  );
}

/** Sửa thông tin một tác phẩm: tên, lời nhận xét, của em nào, treo tường nào, tiếng giới thiệu */
export function EditItemDialog({ item, students, onClose, onSave }: {
  item: GalleryItem; students: { id: string; name: string }[]; onClose: () => void;
  onSave: (p: { title: string; note: string; student: string | null; classWide: boolean; kind: GalleryKind; audio: Blob | null; clearAudio: boolean }) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const [student, setStudent] = useState(item.student_id ?? 'ca-lop');
  const [kind, setKind] = useState<GalleryKind>(item.kind);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [clearAudio, setClearAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="gv-viewer" role="dialog" aria-modal="true" aria-label="Sửa thông tin tác phẩm" onClick={onClose}>
      <form className="ed-card" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr('');
        try { await onSave({ title, note, student: student === 'ca-lop' ? null : student, classWide: student === 'ca-lop', kind, audio, clearAudio }); onClose(); }
        catch (x) { setErr(x instanceof Error ? x.message : 'Chưa lưu được.'); } finally { setBusy(false); }
      }}>
        <h2>Sửa {KIND_LABEL[item.kind].toLowerCase()}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.url && <img src={item.url} alt="" className="ed-img" />}
        <label><span>Tên tác phẩm / danh hiệu</span><input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>
        <label><span>Lời nhận xét của cô</span><textarea rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></label>
        <label><span>Của em</span>
          <select value={student} onChange={(e) => setStudent(e.target.value)}>
            <option value="ca-lop">Cả lớp (tác phẩm chung)</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label><span>Treo ở tường</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as GalleryKind)}>
            {KINDS.map((k) => <option key={k} value={k}>{WALL_LABEL[k]}</option>)}
          </select>
        </label>
        <AudioRecorder value={audio} onChange={setAudio} label={item.audio_path ? 'Ghi âm lại lời giới thiệu' : 'Ghi âm lời giới thiệu (20 giây)'} />
        {item.audio_path && !audio && <label className="ed-check"><input type="checkbox" checked={clearAudio} onChange={(e) => setClearAudio(e.target.checked)} /> Xoá tiếng giới thiệu cũ</label>}
        {err && <p className="adm-alert is-error">{err}</p>}
        <div className="ed-act">
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}><Save aria-hidden="true" /> Lưu</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Thôi</button>
        </div>
      </form>
    </div>
  );
}
