'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NOTI_GROUPS, NOTI_ICON, ago, type AdminNotification } from '@/lib/admin/insights';

const POLL_MS = 60_000;

/** Chuông thông báo trên thanh trên: số chưa đọc cập nhật mỗi 60 giây (chỉ khi tab đang mở), bấm mở danh sách mới nhất. */
export default function NotificationBell({ initial }: { initial: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [unread, setUnread] = useState(initial);
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState('');
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    const { data } = await supabase.rpc('admin_nav_counts');
    const n = (data as { unread?: number } | null)?.unread;
    if (typeof n === 'number') setUnread((old) => (old === n ? old : n));
  }, [supabase]);

  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshCount(); }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshCount]);

  const load = useCallback(async (g: string) => {
    const { data } = await supabase.rpc('admin_list_notifications', { p_group: g || null, p_unread: false, p_limit: 8 });
    setItems((data ?? []) as AdminNotification[]);
  }, [supabase]);

  useEffect(() => { if (open) void load(group); }, [open, group, load]);

  // Đóng khi bấm ra ngoài / phím Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markAll = async () => {
    await supabase.rpc('admin_mark_notifications_read', { p_ids: null });
    setUnread(0);
    void load(group);
  };
  const markOne = (n: AdminNotification) => {
    if (n.read_at) return;
    setUnread((u) => Math.max(0, u - 1));
    void supabase.rpc('admin_mark_notifications_read', { p_ids: [n.id] });
  };

  return (
    <div className="adm-bell" ref={box}>
      <button type="button" className="adm-bell-btn" aria-expanded={open} aria-haspopup="dialog" aria-label={unread ? `Thông báo: ${unread} chưa đọc` : 'Thông báo'} onClick={() => setOpen((o) => !o)}>
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className="adm-bell-dot">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="adm-bell-panel" role="dialog" aria-label="Thông báo">
          <div className="adm-bell-head">
            <b>Thông báo</b>
            {unread > 0 && <button type="button" className="adm-chip" onClick={markAll}>Đánh dấu đã đọc</button>}
          </div>
          <div className="adm-chips adm-bell-tabs">
            {NOTI_GROUPS.map((g) => <button key={g.k} type="button" className="adm-chip" aria-pressed={group === g.k} onClick={() => setGroup(g.k)}>{g.label}</button>)}
          </div>
          <NotificationList items={items} onOpen={(n) => { markOne(n); setOpen(false); }} />
          <Link href="/quan-tri/thong-bao" className="adm-bell-foot" onClick={() => setOpen(false)}>Xem tất cả thông báo →</Link>
        </div>
      )}
    </div>
  );
}

export function NotificationList({ items, onOpen, grouped = false }: { items: AdminNotification[] | null; onOpen?: (n: AdminNotification) => void; grouped?: boolean }) {
  if (items === null) return <p className="adm-muted" style={{ padding: 14 }}>Đang tải…</p>;
  if (!items.length) return <p className="adm-muted" style={{ padding: 14 }}>Chưa có thông báo nào.</p>;
  let lastDay = '';
  return (
    <ul className="adm-noti-list">
      {items.map((n) => {
        const day = dayLabel(n.updated_at);
        const head = grouped && day !== lastDay ? <li key={`d-${n.id}`} className="adm-noti-day">{day}</li> : null;
        lastDay = day;
        return [
          head,
          <li key={n.id} className={`adm-noti${n.read_at ? '' : ' is-unread'}`}>
            <span className="adm-noti-ic" aria-hidden="true">{NOTI_ICON[n.kind]}</span>
            <span className="adm-noti-body">
              {n.href ? <Link href={n.href} className="adm-noti-title" onClick={() => onOpen?.(n)}>{n.title}</Link> : <span className="adm-noti-title">{n.title}</span>}
              <span className="adm-noti-meta">{n.body ? `${n.body} · ` : ''}{ago(n.updated_at)}</span>
            </span>
            {!n.read_at && <span className="adm-noti-dot" aria-label="Chưa đọc" />}
          </li>,
        ];
      })}
    </ul>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(Date.now() - 86400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return same(d, today) ? 'Hôm nay' : same(d, y) ? 'Hôm qua' : d.toLocaleDateString('vi-VN');
}
