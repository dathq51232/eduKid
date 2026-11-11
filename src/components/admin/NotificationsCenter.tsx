'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { errorText } from '@/lib/admin/questions';
import { NOTI_GROUPS, type AdminNotification } from '@/lib/admin/insights';
import { NotificationList } from './NotificationBell';
import { useAdminUser } from './AdminContext';

/** Trang Thông báo: lọc theo loại / chưa đọc, gộp theo ngày, đánh dấu đã đọc. */
export default function NotificationsCenter() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [group, setGroup] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_notifications', { p_group: group || null, p_unread: unreadOnly, p_limit: 200 });
    if (error) { setErr(errorText(error)); setItems([]); return; }
    setErr(null);
    setItems((data ?? []) as AdminNotification[]);
  }, [supabase, group, unreadOnly]);
  useEffect(() => { void load(); }, [load]);

  const markAll = async () => {
    const { error } = await supabase.rpc('admin_mark_notifications_read', { p_ids: null });
    if (error) return setErr(errorText(error));
    void load();
  };
  const markOne = (n: AdminNotification) => { if (!n.read_at) void supabase.rpc('admin_mark_notifications_read', { p_ids: [n.id] }); };

  if (!me.isAdmin) return <p className="adm-alert is-error">Chỉ quản trị hệ thống mới xem được trang này.</p>;
  const unread = items?.filter((n) => !n.read_at).length ?? 0;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>🔔 Thông báo</h1>
          <p>Người dùng mới, giáo viên xin quyền, thanh toán, bài chờ duyệt và biến động truy cập. Thông báo cùng loại trong ngày được gộp lại.</p>
        </div>
        <button type="button" className="adm-btn" onClick={markAll} disabled={!unread}><CheckCheck size={18} aria-hidden="true" /> Đánh dấu tất cả đã đọc</button>
      </div>
      <div className="adm-chips">
        <button type="button" className="adm-chip" aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>Chưa đọc{unread ? ` (${unread})` : ''}</button>
        {NOTI_GROUPS.map((g) => <button key={g.k} type="button" className="adm-chip" aria-pressed={group === g.k} onClick={() => setGroup(g.k)}>{g.label}</button>)}
      </div>
      {err && <p className="adm-alert is-error">{err.includes('admin_list_notifications') || err.includes('function') ? 'Chưa chạy migration 0049_admin_insights.sql trên Supabase.' : err}</p>}
      <section className="adm-card"><NotificationList items={items} grouped onOpen={markOne} /></section>
    </div>
  );
}
