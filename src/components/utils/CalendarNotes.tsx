'use client';

// Ô "Ghi chú & nhắc hẹn" của ngày đang chọn trên trang Lịch (giáo viên + phụ huynh):
// xem / thêm / sửa / xoá việc của ngày, chọn nhắc trước mấy ngày và lặp lại. Đến lúc nhắc, việc hiện ở "Việc hôm nay".
import { useEffect, useRef, useState } from 'react';
import { BellRing, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import {
  REMIND_OPTIONS, REPEAT_LABEL, dayLabel, fallsOn, remindLabel, type CalendarNote, type NoteInput, type Repeat, type useCalendarNotes,
} from '@/lib/calendar-notes';
import '@/styles/lg.css';

type Api = ReturnType<typeof useCalendarNotes>;

/** Việc hay gặp — bấm để điền nhanh tên việc + mức nhắc hợp lý */
const TEMPLATES: Record<'gv' | 'ph', { title: string; remind: number; repeat?: Repeat }[]> = {
  gv: [
    { title: 'Họp tổ chuyên môn', remind: 1 },
    { title: 'Họp phụ huynh', remind: 3 },
    { title: 'Nộp hồ sơ / sổ điểm', remind: 3 },
    { title: 'Dự giờ / thao giảng', remind: 2 },
    { title: 'Họp hội đồng sư phạm', remind: 1 },
    { title: 'Báo cáo cho nhà trường', remind: 2 },
  ],
  ph: [
    { title: 'Họp phụ huynh', remind: 2 },
    { title: 'Đóng học phí', remind: 3 },
    { title: 'Khám sức khoẻ / tiêm chủng', remind: 2 },
    { title: 'Con kiểm tra', remind: 2 },
    { title: 'Sinh nhật', remind: 3, repeat: 'yearly' },
  ],
};

const blank = (day: string): NoteInput => ({ day, at_time: null, title: '', note: '', remind_days: 1, repeat: 'none' });

/** openNew: mở sẵn ô thêm ghi chú (từ nút "+ Ghi chú" trên trang chủ) */
export default function CalendarNotes({ day, api, who, openNew = false }: { day: string; api: Api; who: 'gv' | 'ph'; openNew?: boolean }) {
  const [form, setForm] = useState<(NoteInput & { id?: string }) | null>(null);
  const opened = useRef(false); // chỉ mở sẵn một lần, đổi ngày sau đó không bật lại
  useEffect(() => { if (openNew && !opened.current) { opened.current = true; setForm((f) => f ?? blank(day)); } }, [openNew, day]);
  const [busy, setBusy] = useState(false);
  const list = api.notes.filter((n) => fallsOn(n, day)).sort((a, b) => (a.at_time ?? '99').localeCompare(b.at_time ?? '99'));

  const save = async () => {
    if (!form || !form.title.trim()) return;
    setBusy(true);
    const { id, ...rest } = form;
    const input = { ...rest, title: rest.title.trim().slice(0, 120), note: rest.note.trim().slice(0, 500), at_time: rest.at_time || null };
    const ok = id ? await api.update(id, input) : await api.add(input);
    setBusy(false);
    if (ok) setForm(null);
  };
  const del = async (n: CalendarNote) => {
    if (!window.confirm(`Xoá ghi chú “${n.title}”${n.repeat !== 'none' ? ' (cả các lần lặp lại)' : ''}?`)) return;
    await api.remove(n.id);
  };
  const edit = (n: CalendarNote) => setForm({ id: n.id, day: n.day, at_time: n.at_time, title: n.title, note: n.note, remind_days: n.remind_days, repeat: n.repeat });
  const meta = (n: CalendarNote) => [remindLabel(n.remind_days), n.repeat !== 'none' && REPEAT_LABEL[n.repeat]].filter(Boolean).join(' · ');

  return (
    <section className="lg-glass lg-notes" aria-labelledby="lg-notes-h">
      <div className="lg-notes-hd">
        <h2 id="lg-notes-h"><StickyNote aria-hidden="true" /> Ghi chú · {dayLabel(day)}</h2>
        {!form && <button type="button" className="lg-nadd" onClick={() => setForm(blank(day))}><Plus aria-hidden="true" /> Thêm</button>}
      </div>

      {list.length === 0 && !form && <p className="lg-muted">Chưa có việc nào ngày này. Ghi lại việc quan trọng để app nhắc trước.</p>}
      {list.length > 0 && (
        <ul className="lg-nlist">
          {list.map((n) => (
            <li key={n.id}>
              <div>
                <b>{n.at_time && <time>{n.at_time}</time>}{n.title}</b>
                {n.note && <p>{n.note}</p>}
                <small><BellRing aria-hidden="true" /> {meta(n)}</small>
              </div>
              <span className="lg-nact">
                <button type="button" onClick={() => edit(n)} aria-label={`Sửa: ${n.title}`} title="Sửa"><Pencil aria-hidden="true" /></button>
                <button type="button" onClick={() => del(n)} aria-label={`Xoá: ${n.title}`} title="Xoá"><Trash2 aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <form className="lg-nform" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          {!form.id && (
            <div className="lg-nchips" aria-label="Việc hay gặp">
              {TEMPLATES[who].map((t) => (
                <button key={t.title} type="button" className={form.title === t.title ? 'is-on' : ''}
                  onClick={() => setForm({ ...form, title: t.title, remind_days: t.remind, repeat: t.repeat ?? form.repeat })}>{t.title}</button>
              ))}
            </div>
          )}
          <label>Việc cần nhớ
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required autoFocus placeholder="VD: Họp phụ huynh cuối kì I" />
          </label>
          <div className="lg-nrow">
            <label>Ngày<input type="date" value={form.day} onChange={(e) => e.target.value && setForm({ ...form, day: e.target.value })} required /></label>
            <label>Giờ (nếu có)<input type="time" value={form.at_time ?? ''} onChange={(e) => setForm({ ...form, at_time: e.target.value || null })} /></label>
          </div>
          <div className="lg-nrow">
            <label>Nhắc
              <select value={form.remind_days} onChange={(e) => setForm({ ...form, remind_days: Number(e.target.value) })}>
                {REMIND_OPTIONS.map((n) => <option key={n} value={n}>{remindLabel(n)}</option>)}
              </select>
            </label>
            <label>Lặp lại
              <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value as Repeat })}>
                {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => <option key={r} value={r}>{REPEAT_LABEL[r]}</option>)}
              </select>
            </label>
          </div>
          <label>Ghi chú thêm
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} rows={2} placeholder="Địa điểm, cần mang gì, chuẩn bị gì…" />
          </label>
          {api.error && <p className="lg-nerr" role="alert">{api.error}</p>}
          <div className="lg-nbtns">
            <button type="button" className="lg-nghost" onClick={() => setForm(null)}>Huỷ</button>
            <button type="submit" className="lg-nsave" disabled={busy || !form.title.trim()}>{busy ? 'Đang lưu…' : form.id ? 'Lưu thay đổi' : 'Lưu ghi chú'}</button>
          </div>
        </form>
      )}
      {api.local && <p className="lg-muted lg-nlocal">Ghi chú đang lưu trên máy này (chưa đồng bộ sang máy khác).</p>}
    </section>
  );
}
