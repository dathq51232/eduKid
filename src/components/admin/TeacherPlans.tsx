'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Search } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import { FREE_STUDENT_LIMIT, TEACHER_TRIAL_DAYS } from '@/lib/contact';
import { useAdminUser } from './AdminContext';

type Row = { teacher_id: string; display_name: string; email: string | null; school_name: string | null; classes: number; students_used: number; student_limit: number; note: string | null; joined_at: string; trial_until?: string | null };
const PRESETS = [3, 10, 20, 40];
const fmtDay = (s: string) => { const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

// Quản trị: giáo viên đăng ký miễn phí (gói 3 học sinh). Giáo viên liên hệ xin thêm -> nâng giới hạn ở đây.
export default function TeacherPlans() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Record<string, { limit: number; note: string }>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // sửa tên giáo viên và tên trường (migration 0025)
  const [info, setInfo] = useState<Record<string, { name: string; school: string }>>({});

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_teacher_plans', { p_search: q.trim() || null });
    if (error) return setMsg({ kind: 'error', text: /function|schema cache/i.test(error.message) ? 'Chưa bật gói giáo viên: hãy chạy supabase/migrations/0019_teacher_free_plan.sql trên Supabase.' : 'Không tải được danh sách (chỉ quản trị hệ thống xem được).' });
    setRows((data ?? []) as Row[]);
  }, [supabase, q]);
  useEffect(() => { const t = setTimeout(() => { void load(); }, 250); return () => clearTimeout(t); }, [load]);

  const save = async (r: Row) => {
    const e = edit[r.teacher_id];
    if (!e) return;
    if (e.limit < r.students_used && !window.confirm(`${r.display_name} đang có ${r.students_used} học sinh. Đặt giới hạn ${e.limit} thì (khi hết dùng thử) chỉ ${e.limit} em vào lớp sớm nhất học được, các em còn lại tạm khoá phần học (bài đã làm vẫn giữ). Tiếp tục?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_teacher_limit', { p_teacher: r.teacher_id, p_limit: e.limit, p_note: e.note });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: 'Chưa lưu được (giới hạn từ 1 đến 200).' });
    setMsg({ kind: 'ok', text: `Đã đặt giới hạn ${e.limit} học sinh cho ${r.display_name}.` });
    setEdit((x) => { const n = { ...x }; delete n[r.teacher_id]; return n; });
    void load();
  };

  // dùng thử đủ lớp (migration 0045): gia hạn thêm / kết thúc
  const setTrial = async (r: Row, days: number) => {
    if (days === 0 && !window.confirm(`Kết thúc dùng thử của ${r.display_name}? Các em ngoài ${r.student_limit} chỗ của gói sẽ tạm khoá phần học.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_teacher_trial', { p_teacher: r.teacher_id, p_days: days });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: /function|schema cache/i.test(error.message) ? 'Chưa bật dùng thử: hãy chạy supabase/migrations/0045_teacher_trial.sql trên Supabase.' : 'Chưa lưu được.' });
    setMsg({ kind: 'ok', text: days ? `${r.display_name}: dùng thử đủ lớp thêm ${days} ngày (tính từ hôm nay).` : `Đã kết thúc dùng thử của ${r.display_name}.` });
    void load();
  };

  const saveInfo = async (r: Row) => {
    const e = info[r.teacher_id];
    if (!e) return;
    const name = e.name.trim(), school = e.school.trim();
    if (!name) return setMsg({ kind: 'error', text: 'Tên giáo viên không được để trống.' });
    if (school.length < 2) return setMsg({ kind: 'error', text: 'Tên trường cần ít nhất 2 ký tự.' });
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_update_teacher', { p_teacher: r.teacher_id, p_display_name: name, p_school_name: school });
    setBusy(false);
    if (error) {
      return setMsg({ kind: 'error', text: /function|schema cache/i.test(error.message) ? 'Chưa bật sửa thông tin giáo viên: hãy chạy supabase/migrations/0025_admin_edit_teacher.sql trên Supabase.' : 'Chưa lưu được (tên 1–100 ký tự, trường 2–180 ký tự).' });
    }
    const shared = Number(data ?? 1);
    setMsg({ kind: 'ok', text: `Đã lưu: ${name} · ${school}.${shared > 1 ? ` Trường này có ${shared} giáo viên, tên trường mới áp dụng cho cả ${shared} người.` : ''}` });
    setInfo((x) => { const n = { ...x }; delete n[r.teacher_id]; return n; });
    void load();
  };

  if (!me.isAdmin) return <p className="adm-alert is-warn">Chỉ quản trị hệ thống quản lý giáo viên.</p>;
  const full = rows.filter((r) => r.students_used >= r.student_limit).length;
  const csvRows = rows.map((r) => [r.display_name, r.email ?? '', r.school_name ?? '', r.classes, r.students_used, r.student_limit, r.note ?? '', fmtDay(r.joined_at)]);

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h1>Giáo viên</h1>
        <CsvButton filename="giao-vien.csv" header={['Họ tên', 'Email', 'Trường', 'Số lớp', 'Học sinh đang có', 'Giới hạn', 'Ghi chú', 'Ngày đăng ký']} rows={csvRows} />
      </div>
      <p className="adm-muted">Giáo viên đăng ký miễn phí và dùng ngay: 1 lớp, <strong>dùng thử đủ 40 học sinh trong {TEACHER_TRIAL_DAYS} ngày</strong>, sau đó gói {FREE_STUDENT_LIMIT} học sinh (các em ngoài số chỗ tạm khoá phần học). Khi thầy cô liên hệ, đặt giới hạn mới ở đây (tối đa 40 em / lớp) hoặc gia hạn dùng thử. Bấm <strong>Sửa tên, trường</strong> để đổi tên giáo viên hoặc tên trường hiện trên trang của thầy cô. {rows.length ? `${rows.length} giáo viên, ${full} người đã dùng hết chỗ.` : ''}</p>
      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}
      <label className="billing-search"><Search aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email hoặc trường" aria-label="Tìm giáo viên" /></label>
      {rows.length === 0 ? <p className="adm-muted">Không có giáo viên nào.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Giáo viên</th><th>Trường</th><th>Học sinh / giới hạn</th><th>Đổi giới hạn</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const e = edit[r.teacher_id];
                const f = info[r.teacher_id];
                return (
                  <tr key={r.teacher_id}>
                    {f ? (
                      <td colSpan={2}>
                        <div className="teacher-info-edit">
                          <label>Tên giáo viên<input value={f.name} maxLength={100} onChange={(ev) => setInfo((x) => ({ ...x, [r.teacher_id]: { ...x[r.teacher_id], name: ev.target.value } }))} /></label>
                          <label>Trường<input value={f.school} maxLength={180} onChange={(ev) => setInfo((x) => ({ ...x, [r.teacher_id]: { ...x[r.teacher_id], school: ev.target.value } }))} /></label>
                          <div className="teacher-info-actions">
                            <button type="button" className="button button-blue" disabled={busy} onClick={() => void saveInfo(r)}>Lưu</button>
                            <button type="button" className="mini-btn" onClick={() => setInfo((x) => { const n = { ...x }; delete n[r.teacher_id]; return n; })}>Huỷ</button>
                          </div>
                          <small>{r.email} · {r.classes} lớp</small>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td>
                          <strong>{r.display_name}</strong><br /><small>{r.email}</small><br /><small>Đăng ký {fmtDay(r.joined_at)}</small><br />
                          <button type="button" className="mini-btn teacher-info-open" onClick={() => setInfo((x) => ({ ...x, [r.teacher_id]: { name: r.display_name, school: r.school_name ?? '' } }))}><Pencil aria-hidden="true" /> Sửa tên, trường</button>
                        </td>
                        <td>{r.school_name ?? '—'}<br /><small>{r.classes} lớp</small></td>
                      </>
                    )}
                    <td><span className={`status-chip ${r.students_used >= r.student_limit ? 'tone-coral' : 'tone-green'}`}>{r.students_used}/{r.student_limit}</span>{r.note && <><br /><small>{r.note}</small></>}
                      {(() => {
                        const on = r.trial_until && Date.parse(r.trial_until) > Date.now();
                        return (
                          <div className="plan-trial">
                            <small>{on ? <>Dùng thử đủ lớp đến <b>{fmtDay(r.trial_until as string)}</b></> : r.trial_until ? `Hết dùng thử ${fmtDay(r.trial_until)}` : 'Không dùng thử'}</small>
                            <button type="button" className="mini-btn" disabled={busy} onClick={() => void setTrial(r, TEACHER_TRIAL_DAYS)}>+{TEACHER_TRIAL_DAYS} ngày thử</button>
                            {on && <button type="button" className="mini-btn" disabled={busy} onClick={() => void setTrial(r, 0)}>Kết thúc thử</button>}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="plan-edit">
                        {PRESETS.map((n) => <button key={n} type="button" className={`mini-btn${(e?.limit ?? r.student_limit) === n ? ' is-on' : ''}`} onClick={() => setEdit((x) => ({ ...x, [r.teacher_id]: { limit: n, note: x[r.teacher_id]?.note ?? r.note ?? '' } }))}>{n}</button>)}
                        <input type="number" min={1} max={200} aria-label={`Giới hạn của ${r.display_name}`} value={e?.limit ?? r.student_limit}
                          onChange={(ev) => setEdit((x) => ({ ...x, [r.teacher_id]: { limit: Math.max(1, Math.min(200, Number(ev.target.value) || 1)), note: x[r.teacher_id]?.note ?? r.note ?? '' } }))} />
                        {e && <>
                          <input className="plan-note" maxLength={300} placeholder="Ghi chú (vd: đã liên hệ Zalo 19/10)" value={e.note} onChange={(ev) => setEdit((x) => ({ ...x, [r.teacher_id]: { ...x[r.teacher_id], note: ev.target.value } }))} />
                          <button type="button" className="button button-blue" disabled={busy} onClick={() => void save(r)}>Lưu</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="adm-muted"><Link href="/quan-tri/duyet-giao-vien">Yêu cầu duyệt giáo viên (cách cũ)</Link> — từ migration 0019 giáo viên được cấp quyền ngay khi đăng ký.</p>
    </section>
  );
}
