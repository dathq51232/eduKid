'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorText } from '@/lib/admin/questions';
import { useAdminUser } from './AdminContext';

type Log = {
  id: number;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

const ACTION_LABEL: Record<string, string> = {
  create_question: 'Thêm câu hỏi',
  update_question: 'Sửa câu hỏi',
  delete_question: 'Xóa câu hỏi',
  publish_lesson: 'Xuất bản bài',
  set_lesson_status: 'Đổi trạng thái bài',
  delete_lesson: 'Xóa bài',
  create_child: 'Phụ huynh tạo hồ sơ con',
  create_class_invite: 'Tạo mã mời lớp',
  redeem_class_invite: 'Vào lớp bằng mã mời',
  class_invite_failed: 'Nhập sai mã mời',
  grant_role: 'Cấp vai trò',
  revoke_role: 'Gỡ vai trò',
};

export default function AuditLog() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<Log[]>([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let q = supabase
      .from('audit_logs')
      .select('id,action,target_type,target_id,reason,created_at,profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (action) q = q.eq('action', action);
    q.then(({ data, error: err }) => {
      if (err) setError(errorText(err));
      setLogs((data ?? []) as unknown as Log[]);
    });
  }, [supabase, action]);

  if (!me.isAdmin) return <p className="adm-alert is-error">Chỉ quản trị hệ thống mới xem được nhật ký.</p>;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Nhật ký thao tác</h1>
          <p>200 thao tác gần nhất: ai đã soạn, xuất bản, cấp quyền.</p>
        </div>
        <label className="adm-field is-inline">
          <span>Loại</span>
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="adm-alert is-error">{error}</p>}
      <section className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Thời gian</th>
                <th scope="col">Người thực hiện</th>
                <th scope="col">Thao tác</th>
                <th scope="col">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="adm-muted">{new Date(l.created_at).toLocaleString('vi-VN')}</td>
                  <td>{l.profiles?.display_name ?? '—'}</td>
                  <td>{ACTION_LABEL[l.action] ?? l.action}</td>
                  <td className="adm-muted">
                    {l.target_type === 'lesson' && l.target_id && l.action !== 'delete_lesson' ? (
                      <a className="adm-link" href={`/quan-tri/bai-hoc/${l.target_id}`}>Mở bài</a>
                    ) : (
                      l.target_type
                    )}
                    {l.reason ? ` · ${l.reason}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <p className="adm-muted">Chưa có thao tác nào.</p>}
      </section>
    </div>
  );
}
