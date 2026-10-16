'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { errorText } from '@/lib/admin/questions';
import { useAdminUser } from './AdminContext';
import ConfirmButton from './ConfirmButton';

type Role = 'parent' | 'teacher' | 'school_admin' | 'system_admin' | 'student';
type UserRow = {
  user_id: string;
  email: string | null;
  display_name: string;
  created_at: string;
  roles: { role: Role; school_id: string | null; school_name: string | null }[];
};
type School = { id: string; name: string };

const ROLE_LABEL: Record<Role, string> = {
  parent: 'Phụ huynh',
  teacher: 'Giáo viên',
  school_admin: 'Quản trị trường',
  system_admin: 'Quản trị hệ thống',
  student: 'Học sinh',
};

export default function UsersManager() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [granting, setGranting] = useState<string | null>(null);
  const [newSchool, setNewSchool] = useState('');

  const load = useCallback(async () => {
    const [{ data: u, error }, { data: s }] = await Promise.all([
      supabase.rpc('admin_list_users', { p_search: query || null }),
      supabase.from('schools').select('id,name').eq('status', 'active').order('name'),
    ]);
    if (error) setMsg({ kind: 'error', text: errorText(error) });
    setUsers((u ?? []) as UserRow[]);
    setSchools((s ?? []) as School[]);
  }, [supabase, query]);

  useEffect(() => {
    load();
  }, [load]);

  const setRole = async (userId: string, role: Role, schoolId: string | null, grant: boolean) => {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc('admin_set_role', { p_user: userId, p_role: role, p_school: schoolId, p_grant: grant });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: errorText(error) });
    setMsg({ kind: 'ok', text: grant ? `Đã cấp vai trò ${ROLE_LABEL[role]}.` : `Đã gỡ vai trò ${ROLE_LABEL[role]}.` });
    setGranting(null);
    load();
  };

  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSchool.trim().length < 2) return;
    setBusy(true);
    const { error } = await supabase.from('schools').insert({ name: newSchool.trim() });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: errorText(error) });
    setNewSchool('');
    setMsg({ kind: 'ok', text: 'Đã thêm trường.' });
    load();
  };

  if (!me.isAdmin) return <p className="adm-alert is-error">Chỉ quản trị hệ thống mới xem được trang này.</p>;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Người dùng</h1>
          <p>Cấp quyền giáo viên để soạn bài, quản trị trường để quản lý lớp. Mọi tài khoản mới mặc định là phụ huynh.</p>
        </div>
      </div>

      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Trường ({schools.length})</h2>
        </div>
        <div className="adm-chips">
          {schools.map((s) => <span key={s.id} className="adm-tag is-soft">{s.name}</span>)}
          {schools.length === 0 && <span className="adm-muted">Chưa có trường nào. Cần có trường trước khi cấp quyền giáo viên.</span>}
        </div>
        <form className="adm-search" onSubmit={addSchool}>
          <input value={newSchool} maxLength={180} onChange={(e) => setNewSchool(e.target.value)} placeholder="Tên trường mới, ví dụ Trường Tiểu học Thử nghiệm" aria-label="Tên trường mới" />
          <button type="submit" className="adm-btn" disabled={busy || newSchool.trim().length < 2}><Plus size={16} aria-hidden="true" /> Thêm trường</button>
        </form>
      </section>

      <section className="adm-card">
        <form className="adm-search" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo email hoặc tên" aria-label="Tìm người dùng" />
          <button type="submit" className="adm-btn" aria-label="Tìm"><Search size={18} aria-hidden="true" /></button>
        </form>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Người dùng</th>
                <th scope="col">Vai trò</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>
                    <div className="adm-row-title">{u.display_name}</div>
                    <div className="adm-muted">{u.email}</div>
                  </td>
                  <td>
                    <div className="adm-chips">
                      {u.roles.map((r) => (
                        <span key={`${r.role}-${r.school_id}`} className={`adm-role is-${r.role}`}>
                          {ROLE_LABEL[r.role]}{r.school_name ? ` · ${r.school_name}` : ''}
                          {!(r.role === 'system_admin' && u.user_id === me.userId) && (
                            <ConfirmButton className="adm-role-x" confirmLabel="Gỡ?" disabled={busy} onConfirm={() => setRole(u.user_id, r.role, r.school_id, false)}>
                              <X size={14} aria-label={`Gỡ vai trò ${ROLE_LABEL[r.role]}`} />
                            </ConfirmButton>
                          )}
                        </span>
                      ))}
                    </div>
                    {granting === u.user_id && <GrantForm schools={schools} busy={busy} onCancel={() => setGranting(null)} onGrant={(role, school) => setRole(u.user_id, role, school, true)} />}
                  </td>
                  <td>
                    {granting !== u.user_id && (
                      <button type="button" className="adm-btn is-ghost" onClick={() => setGranting(u.user_id)}>
                        <Plus size={16} aria-hidden="true" /> Cấp quyền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className="adm-muted">Không có người dùng nào.</p>}
      </section>
    </div>
  );
}

function GrantForm({ schools, busy, onGrant, onCancel }: { schools: School[]; busy: boolean; onGrant: (role: Role, school: string | null) => void; onCancel: () => void }) {
  const [role, setRole] = useState<Role>('teacher');
  const [school, setSchool] = useState(schools[0]?.id ?? '');
  const needsSchool = role === 'teacher' || role === 'school_admin';

  return (
    <div className="adm-grant">
      <select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Vai trò">
        <option value="teacher">Giáo viên</option>
        <option value="school_admin">Quản trị trường</option>
        <option value="system_admin">Quản trị hệ thống</option>
      </select>
      {needsSchool && (
        <select value={school} onChange={(e) => setSchool(e.target.value)} aria-label="Trường">
          {schools.length === 0 && <option value="">Chưa có trường</option>}
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
      <button type="button" className="adm-btn is-primary" disabled={busy || (needsSchool && !school)} onClick={() => onGrant(role, needsSchool ? school : null)}>Cấp</button>
      <button type="button" className="adm-btn is-ghost" onClick={onCancel}>Hủy</button>
    </div>
  );
}
