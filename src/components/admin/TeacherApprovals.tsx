'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAdminUser } from './AdminContext';

type App = { id: string; user_id: string; display_name: string; email: string | null; school_name: string; note: string | null; created_at: string };
type School = { id: string; name: string };

// Quản trị hệ thống duyệt yêu cầu làm giáo viên. Quyền do hàm review_teacher_application kiểm tra lại trong database.
export default function TeacherApprovals() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [apps, setApps] = useState<App[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data, error }, { data: sc }] = await Promise.all([
      supabase.rpc('admin_list_teacher_applications', { p_status: 'pending' }),
      supabase.from('schools').select('id, name').order('name'),
    ]);
    if (error) setMsg({ kind: 'error', text: 'Không tải được danh sách (chỉ quản trị hệ thống xem được).' });
    setApps((data ?? []) as App[]);
    setSchools((sc ?? []) as School[]);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);

  const review = async (a: App, approve: boolean) => {
    setBusy(true);
    setMsg(null);
    const school = pick[a.id] || null;
    const { error } = await supabase.rpc('review_teacher_application', { p_application: a.id, p_approve: approve, p_school: approve ? school : null });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: 'Chưa thực hiện được.' });
    setMsg({ kind: 'ok', text: approve ? `Đã duyệt ${a.display_name} làm giáo viên.` : `Đã từ chối yêu cầu của ${a.display_name}.` });
    void load();
  };

  if (!me.isAdmin) return <p className="adm-alert is-warn">Chỉ quản trị hệ thống duyệt được giáo viên.</p>;

  return (
    <section className="adm-card">
      <div className="adm-card-head"><h1>Duyệt giáo viên</h1></div>
      <p className="adm-muted">Giáo viên được duyệt mới tạo được lớp và tài khoản học sinh. Hãy xác minh với nhà trường trước khi duyệt.</p>
      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}
      {apps.length === 0 ? <p className="adm-muted">Không có yêu cầu nào đang chờ.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Người gửi</th><th>Trường khai báo</th><th>Ghi chú</th><th>Gán vào trường</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.display_name}</strong><br /><small>{a.email}</small></td>
                  <td>{a.school_name}</td>
                  <td>{a.note ?? '—'}</td>
                  <td>
                    <select value={pick[a.id] ?? ''} onChange={(e) => setPick({ ...pick, [a.id]: e.target.value })} aria-label="Trường">
                      <option value="">Tạo trường mới theo tên khai báo</option>
                      {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="adm-row-actions">
                    <button type="button" className="button button-blue" disabled={busy} onClick={() => review(a, true)}><Check size={16} aria-hidden="true" /> Duyệt</button>
                    <button type="button" className="button button-white" disabled={busy} onClick={() => review(a, false)}><X size={16} aria-hidden="true" /> Từ chối</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
