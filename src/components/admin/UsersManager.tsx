'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ago, isOnline } from '@/lib/admin/insights';
import ExportCsv from './ExportCsv';
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
  // có từ migration 0049 (admin_list_users_v2)
  last_seen?: string | null;
  grade?: number | null;
  pending_teacher?: boolean;
};
const ROLE_FILTERS: { v: string; label: string }[] = [
  { v: '', label: 'Tất cả vai trò' }, { v: 'student', label: 'Học sinh' }, { v: 'teacher', label: 'Giáo viên' },
  { v: 'parent', label: 'Phụ huynh / người lớn' }, { v: 'system_admin', label: 'Quản trị hệ thống' },
];
const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 7 * 86400_000;
const fmtDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
type School = { id: string; name: string };

const ROLE_LABEL: Record<Role, string> = {
  parent: 'Người lớn (chưa phân quyền)',
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
  const sp = useSearchParams();
  const [search, setSearch] = useState(sp.get('q') ?? '');
  const [query, setQuery] = useState(sp.get('q') ?? '');
  const [roleFilter, setRoleFilter] = useState(sp.get('vai') ?? '');
  const [newDays, setNewDays] = useState<number | null>(sp.get('moi') ? Number(sp.get('moi')) || 7 : null);
  const [picked, setPicked] = useState<string | null>(null);
  const [v2, setV2] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [granting, setGranting] = useState<string | null>(null);
  const [newSchool, setNewSchool] = useState('');

  const load = useCallback(async () => {
    const [first, { data: s }] = await Promise.all([
      supabase.rpc('admin_list_users_v2', { p_search: query || null, p_role: roleFilter || null, p_new_days: newDays }),
      supabase.from('schools').select('id,name').eq('status', 'active').order('name'),
    ]);
    let { data: u, error } = first;
    // Chưa chạy migration 0049: dùng hàm cũ (không có lọc vai trò / lần cuối truy cập)
    if (error) {
      setV2(false);
      ({ data: u, error } = await supabase.rpc('admin_list_users', { p_search: query || null }));
    } else setV2(true);
    if (error) setMsg({ kind: 'error', text: errorText(error) });
    setUsers((u ?? []) as UserRow[]);
    setSchools((s ?? []) as School[]);
  }, [supabase, query, roleFilter, newDays]);

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
          <h1>👥 Người dùng ({users.length}{users.length >= 300 ? '+' : ''})</h1>
          <p>Cấp quyền giáo viên để soạn bài, quản trị trường để quản lý lớp. Tài khoản mới chưa có quyền gì cho tới khi được cấp vai trò giáo viên.</p>
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

      <div className="adm-users-layout">
      <section className="adm-card">
        <div className="adm-filters">
          <form className="adm-search" style={{ flex: '1 1 260px' }} onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo email hoặc tên" aria-label="Tìm người dùng" />
            <button type="submit" className="adm-btn" aria-label="Tìm"><Search size={18} aria-hidden="true" /></button>
          </form>
          {v2 && (
            <>
              <label className="adm-field is-inline">
                <span>Vai trò</span>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  {ROLE_FILTERS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
                </select>
              </label>
              <button type="button" className="adm-chip" aria-pressed={newDays !== null} onClick={() => setNewDays((d) => (d === null ? 7 : null))}>🆕 Mới 7 ngày</button>
            </>
          )}
          <ExportCsv name="nguoi-dung" rows={[['Tên', 'Email', 'Vai trò', 'Lớp', 'Đăng ký', 'Lần cuối truy cập'], ...users.map((u) => [u.display_name, u.email ?? '', u.roles.map((r) => ROLE_LABEL[r.role]).join(' / '), u.grade ?? '', fmtDate(u.created_at), u.last_seen ? fmtDate(u.last_seen) : ''])]} />
        </div>
        {!v2 && <p className="adm-muted">Chạy migration 0049_admin_insights.sql để có lọc theo vai trò, “Mới 7 ngày” và cột “Lần cuối truy cập”.</p>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Người dùng</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Lớp</th>
                <th scope="col">Đăng ký</th>
                <th scope="col">Lần cuối</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className={`is-clickable${picked === u.user_id ? ' is-picked' : ''}`} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, select, a')) setPicked(u.user_id); }}>
                  <td>
                    <div className="adm-row-title">{isNew(u.created_at) && <span className="adm-pill is-new">🆕</span>} {u.display_name}</div>
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
                    {u.pending_teacher && <span className="adm-pill is-wait">⏳ xin quyền giáo viên</span>}
                    {granting === u.user_id && <GrantForm schools={schools} busy={busy} onCancel={() => setGranting(null)} onGrant={(role, school) => setRole(u.user_id, role, school, true)} />}
                  </td>
                  <td>{u.grade ?? '—'}</td>
                  <td className="adm-muted" title={fmtDate(u.created_at)}>{ago(u.created_at)}</td>
                  <td>{isOnline(u.last_seen ?? null) ? <span className="adm-pill is-online">● online</span> : <span className="adm-muted">{ago(u.last_seen ?? null)}</span>}</td>
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
      <UserDetail u={users.find((x) => x.user_id === picked) ?? null} onGrant={(id) => setGranting(id)} />
      </div>
    </div>
  );
}

/** Khung chi tiết bên phải khi bấm một dòng */
function UserDetail({ u, onGrant }: { u: UserRow | null; onGrant: (id: string) => void }) {
  if (!u) return <aside className="adm-card adm-detail"><p className="adm-muted">Bấm một người dùng để xem chi tiết.</p></aside>;
  return (
    <aside className="adm-card adm-detail" aria-label={`Chi tiết ${u.display_name}`}>
      <div className="adm-people-main">
        <b style={{ fontSize: 18 }}>{u.display_name}</b>
        <span className="adm-muted">{u.email}</span>
      </div>
      <dl>
        <dt>Vai trò</dt><dd>{u.roles.length ? u.roles.map((r) => ROLE_LABEL[r.role]).join(', ') : 'Chưa có'}</dd>
        {u.roles.some((r) => r.school_name) && (<><dt>Trường</dt><dd>{u.roles.map((r) => r.school_name).filter(Boolean).join(', ')}</dd></>)}
        {u.grade ? (<><dt>Lớp</dt><dd>{u.grade}</dd></>) : null}
        <dt>Đăng ký</dt><dd>{fmtDate(u.created_at)}</dd>
        <dt>Lần cuối</dt><dd>{u.last_seen ? `${fmtDate(u.last_seen)} (${ago(u.last_seen)})` : 'Chưa ghi nhận'}</dd>
        {u.pending_teacher && (<><dt>Đơn GV</dt><dd><a className="adm-link" href="/quan-tri/duyet-giao-vien">Đang chờ duyệt →</a></dd></>)}
      </dl>
      <button type="button" className="adm-btn" onClick={() => onGrant(u.user_id)}><Plus size={16} aria-hidden="true" /> Cấp quyền</button>
    </aside>
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
