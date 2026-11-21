'use client';

// ĐẶC CÁCH HỌC PHÍ — phần của cô (migration 0074): gửi yêu cầu cho em có hoàn cảnh khó khăn, quản trị duyệt.
// Mỗi lớp có số suất tối đa (theo % sĩ số). Em được duyệt hiện như đã đóng — các bạn trong lớp không biết.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartHandshake, Send, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WAIVER_STATUS, billingError, fmtDay, type Waiver } from '@/lib/billing';
import '@/styles/adm.css';
import '@/styles/billing.css';

type Student = { id: string; name: string; paid: boolean };

export default function FeeWaivers({ classId, students }: { classId: string; students: Student[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Waiver[] | null>(null);
  const [quota, setQuota] = useState<{ quota: number; used: number } | null>(null);
  const [missing, setMissing] = useState(false);
  const [sid, setSid] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [{ data, error }, { data: q }] = await Promise.all([
      supabase.rpc('teacher_class_waivers', { p_class: classId }),
      supabase.rpc('teacher_waiver_quota', { p_class: classId }),
    ]);
    if (error) { setMissing(true); return; } // chưa chạy migration 0074 → ẩn khung
    setRows((data ?? []) as Waiver[]);
    setQuota(((q ?? []) as { quota: number; used: number }[])[0] ?? null);
  }, [supabase, classId]);
  useEffect(() => { void load(); }, [load]);

  const busyIds = new Set((rows ?? []).filter((w) => w.status === 'pending' || (w.status === 'approved' && w.period_to && Date.parse(w.period_to) > Date.now())).map((w) => w.student_id));
  const choices = students.filter((s) => !busyIds.has(s.id));
  const full = !!quota && quota.used >= quota.quota;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sid) return setMsg({ kind: 'error', text: 'Chọn em cần đặc cách.' });
    if (reason.trim().length < 5) return setMsg({ kind: 'error', text: billingError('bad_reason') });
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc('teacher_request_waiver', { p_class: classId, p_student: sid, p_reason: reason.trim() });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setMsg({ kind: 'ok', text: 'Đã gửi yêu cầu. Quản trị duyệt xong em học được ngay.' });
    setSid(''); setReason(''); void load();
  };
  const withdraw = async (w: Waiver) => {
    if (!window.confirm(`Rút yêu cầu đặc cách của ${w.student_name}?`)) return;
    const { error } = await supabase.rpc('teacher_cancel_waiver', { p_waiver: w.id });
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    void load();
  };

  if (missing || rows === null) return null;
  return (
    <section className="dash-section waiver-box no-print" aria-labelledby="waiver-h">
      <h2 id="waiver-h"><HeartHandshake aria-hidden="true" /> Đặc cách học phí</h2>
      <p className="dash-muted">
        Em có hoàn cảnh khó khăn: cô gửi yêu cầu, quản trị duyệt thì em học miễn phí hết học kỳ. Em được đặc cách hiện như đã đóng, các bạn không biết.
        {quota && <> Lớp dùng <strong>{quota.used}/{quota.quota}</strong> suất.</>}
      </p>
      {!full && choices.length > 0 && (
        <form className="waiver-form" onSubmit={send}>
          <label className="adm-field"><span>Em cần đặc cách</span>
            <select value={sid} onChange={(e) => setSid(e.target.value)}>
              <option value="">— Chọn em —</option>
              {choices.map((s) => <option key={s.id} value={s.id}>{s.name}{s.paid ? ' (đang còn hạn)' : ''}</option>)}
            </select>
          </label>
          <label className="adm-field waiver-why"><span>Lý do (chỉ quản trị xem)</span>
            <input maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: gia đình thuộc hộ nghèo, bố mẹ mất việc…" />
          </label>
          <button type="submit" className="btn btn-yellow" disabled={busy}><Send aria-hidden="true" /> {busy ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
        </form>
      )}
      {full && <p className="adm-alert is-info">Lớp đã dùng hết suất đặc cách. Cần thêm thì cô liên hệ quản trị.</p>}
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
      {rows.length > 0 && (
        <ul className="waiver-list">
          {rows.map((w) => (
            <li key={w.id} className={`is-${w.status}`}>
              <strong>{w.student_name}</strong>
              <span className={`waiver-st is-${w.status}`}>{WAIVER_STATUS[w.status]}{w.status === 'approved' && w.period_to ? ` · đến ${fmtDay(w.period_to)}` : ''}</span>
              <small>{fmtDay(w.created_at)} · {w.reason}{w.admin_note ? ` — Quản trị: ${w.admin_note}` : ''}</small>
              {w.status === 'pending' && <button type="button" className="mini-btn" onClick={() => void withdraw(w)}><Undo2 aria-hidden="true" /> Rút</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
