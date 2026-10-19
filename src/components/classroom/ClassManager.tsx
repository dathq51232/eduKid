'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Lock, LockOpen, Printer, RotateCcw, UserMinus, UserPlus, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parsePastedNames } from '@/lib/classroom/names';

export type RosterRow = {
  student_id: string;
  display_name: string;
  student_status: string;
  membership_status: string;
  has_account: boolean;
  failed_count: number;
  locked_until: string | null;
};
export type SummaryRow = {
  student_id: string;
  display_name: string;
  lessons_done: number;
  avg_percent: number;
  total_points: number;
  games_played: number;
  last_activity: string | null;
};
type Card = { id: string; name: string; pin: string };
type Cls = { id: string; name: string; grade: number; join_code: string; status: string };

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—');

export type BillingRow = { student_id: string; active: boolean; reason: 'free' | 'paid' | 'trial' | 'expired'; until: string | null };
const fmtDay = (s: string | null) => (s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/-/g, '/') : '');
function billingChip(b?: BillingRow) {
  if (!b) return <span className="dash-muted">—</span>;
  if (b.reason === 'paid') return <span className="status-chip tone-green" title={`Đã đóng, đến ${fmtDay(b.until)}`}>Đến {fmtDay(b.until)}</span>;
  if (b.reason === 'trial') return <span className="status-chip tone-blue" title="Đang học thử">Học thử · {fmtDay(b.until)}</span>;
  if (b.reason === 'expired') return <span className="status-chip tone-coral">Hết hạn</span>;
  return <span className="dash-muted">Miễn phí</span>;
}

export default function ClassManager({ cls, roster, summary, pins = {}, top, billing }: { cls: Cls; roster: RosterRow[]; summary: SummaryRow[]; pins?: Record<string, string>; /** khối hiện ngay dưới tiêu đề lớp */ top?: React.ReactNode; /** tình trạng học phí (migration 0018) */ billing?: BillingRow[] }) {
  const billMap = new Map((billing ?? []).map((b) => [b.student_id, b]));
  const showBilling = (billing ?? []).some((b) => b.reason !== 'free');
  const router = useRouter();
  const [names, setNames] = useState('');
  const [consent, setConsent] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const active = roster.filter((r) => r.membership_status === 'active');
  const pasted = useMemo(() => parsePastedNames(names), [names]);
  const dupNames = useMemo(() => {
    const have = new Set(active.map((r) => r.display_name.trim().toLowerCase()));
    return pasted.filter((n) => have.has(n.toLowerCase()));
  }, [pasted, active]);
  const left = roster.filter((r) => r.membership_status !== 'active');
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const loginUrl = `${origin}/dang-nhap?lop=${cls.join_code}`;
  const byId = useMemo(() => new Map(summary.map((s) => [s.student_id, s])), [summary]);

  const rpc = async (key: string, fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(key);
    setMsg(null);
    const { data, error } = await createClient().rpc(fn, args);
    setBusy(null);
    if (error) {
      setMsg({ kind: 'error', text: error.message.includes('not_allowed') ? 'Bạn không có quyền với học sinh này.' : 'Chưa thực hiện được. Vui lòng thử lại.' });
      return null;
    }
    setMsg({ kind: 'ok', text: ok });
    router.refresh();
    return data;
  };

  const addStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = parsePastedNames(names);
    if (!list.length) return;
    setBusy('add');
    setMsg(null);
    try {
      const res = await fetch(`/api/giao-vien/lop/${cls.id}/hoc-sinh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ names: list, consent }) });
      const data = await res.json();
      if (!res.ok) return setMsg({ kind: 'error', text: data.error ?? 'Chưa thêm được học sinh.' });
      const made = (data.created as (Card & { error?: string })[]).filter((c) => c.pin);
      setCards(made);
      setNames('');
      const failed = data.created.length - made.length;
      setMsg({ kind: failed ? 'error' : 'ok', text: `Đã thêm ${data.created.length} học sinh${failed ? `, ${failed} bạn chưa tạo được tài khoản (bấm "Đặt PIN" để thử lại)` : ''}. Có thể in thẻ đăng nhập ngay; PIN cũng xem lại được ở bảng Học sinh.` });
      router.refresh();
    } catch {
      setMsg({ kind: 'error', text: 'Không kết nối được máy chủ.' });
    } finally {
      setBusy(null);
    }
  };

  const resetPin = async (r: RosterRow) => {
    setBusy(`pin-${r.student_id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/giao-vien/lop/${cls.id}/hoc-sinh/${r.student_id}/pin`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) return setMsg({ kind: 'error', text: data.error ?? 'Chưa đặt được PIN.' });
      setCards([{ id: r.student_id, name: r.display_name, pin: data.pin }]);
      setMsg({ kind: 'ok', text: `PIN mới của ${r.display_name}: ${data.pin}. PIN cũ không dùng được nữa.` });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const statusOf = (r: RosterRow) => {
    if (r.student_status !== 'active') return { label: 'Đã khóa', tone: 'coral' };
    if (!r.has_account) return { label: 'Chưa có tài khoản', tone: 'yellow' };
    if (r.locked_until && Date.parse(r.locked_until) > Date.now()) return { label: 'Tạm khóa (nhập sai PIN)', tone: 'coral' };
    return { label: 'Hoạt động', tone: 'green' };
  };

  return (
    <div className="class-manager">
      <div className="dash-head">
        <div>
          <p className="dash-kicker">Quản lý lớp · Khối {cls.grade}</p>
          <h1>Lớp {cls.name}</h1>
        </div>
        <div className="join-code-box">
          <span>Mã lớp</span>
          <strong>{cls.join_code}</strong>
          <small>Lần đầu: <b>Đăng nhập</b> → mã lớp → chọn tên → PIN. Lần sau trên cùng máy: chỉ cần nhập PIN.</small>
        </div>
      </div>
      {top}

      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      {cards.length > 0 && (
        <section className="dash-card login-cards-wrap">
          <div className="dash-card-head">
            <h2>Thẻ đăng nhập ({cards.length})</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer aria-hidden="true" /> In thẻ</button>
          </div>
          <ul className="login-cards">
            {cards.map((c) => (
              <li key={c.id} className="login-card">
                <span className="login-card-brand">EduChain Kids</span>
                <span className="login-card-name">{c.name}</span>
                <span className="login-card-row">Mã lớp <b>{cls.join_code}</b></span>
                <span className="login-card-row">Mã PIN <b>{c.pin}</b></span>
                <span className="login-card-url">{loginUrl}</span>
              </li>
            ))}
          </ul>
          <p className="dash-muted no-print">PIN xem lại được ở bảng Học sinh (nút “Hiện PIN”). Muốn đổi PIN thì bấm “Đặt PIN mới”.</p>
        </section>
      )}

      <section className="dash-card no-print">
        <h2><UserPlus aria-hidden="true" /> Thêm học sinh <span className="dash-muted">({active.length}/40)</span></h2>
        {active.length >= 40 ? <p className="adm-alert is-info">Lớp đã đủ 40 học sinh — số tối đa của một lớp.</p> : (
        <form className="dash-form" onSubmit={addStudents}>
          <label className="adm-field"><span>Mỗi dòng một học sinh (tên gọi hoặc họ và tên). Có thể chép thẳng từ file vnEdu/Excel: chọn các dòng học sinh (từ cột STT đến cột họ tên hoặc hết dòng), Ctrl+C rồi dán vào đây — hệ thống chỉ lấy họ tên, bỏ qua số thứ tự, mã định danh, ngày sinh.</span>
            <textarea rows={6} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Nguyễn Văn An\nTrần Thị Bình\n(hoặc dán các dòng chép từ vnEdu)'} />
          </label>
          {pasted.length > 0 && (
            <p className="dash-muted" aria-live="polite">Nhận ra {pasted.length} học sinh: {pasted.slice(0, 4).join(', ')}{pasted.length > 4 ? `, … ${pasted[pasted.length - 1]}` : ''}.{dupNames.length ? ` Trùng tên đã có trong lớp: ${dupNames.join(', ')}.` : ''}</p>
          )}
          {names.trim() && pasted.length === 0 && <p className="adm-alert is-warn">Chưa nhận ra tên học sinh nào trong nội dung đã dán.</p>}
          <label className="check-line">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Tôi xác nhận nhà trường đã có sự đồng ý của cha mẹ (người giám hộ) cho các em dùng EduChain Kids để học tập.</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy === 'add' || !consent || !pasted.length || active.length + pasted.length > 40 || cls.status !== 'active'}>
            <UserPlus aria-hidden="true" /> {busy === 'add' ? 'Đang tạo tài khoản…' : 'Thêm và tạo PIN'}
          </button>
          {pasted.length > 0 && active.length + pasted.length > 40 && (
            <p className="adm-alert is-warn">Chỉ còn thêm được {40 - active.length} em (tối đa 40 học sinh / lớp).</p>
          )}
        </form>
        )}
      </section>

      <section className="dash-section no-print">
        <div className="dash-card-head">
          <h2><Users aria-hidden="true" /> Học sinh ({active.length})</h2>
          {active.length > 0 && (
            <div className="row-actions">
              <button type="button" className="mini-btn" onClick={() => setShowPins((v) => !v)} aria-pressed={showPins}>
                {showPins ? <><EyeOff aria-hidden="true" /> Ẩn PIN</> : <><Eye aria-hidden="true" /> Hiện PIN</>}
              </button>
              <button type="button" className="mini-btn" disabled={!active.some((r) => pins[r.student_id])}
                onClick={() => setCards(active.filter((r) => pins[r.student_id]).map((r) => ({ id: r.student_id, name: r.display_name, pin: pins[r.student_id] })))}>
                <Printer aria-hidden="true" /> Thẻ cả lớp
              </button>
            </div>
          )}
        </div>
        {active.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : (
          <div className="table-scroll">
            <table className="roster-table">
              <thead>
                <tr><th>Học sinh</th><th>PIN</th><th>Trạng thái</th>{showBilling && <th>Học phí</th>}<th>Bài đã làm</th><th>Đúng TB</th><th>Điểm</th><th>Gần nhất</th><th><span className="sr-only">Thao tác</span></th></tr>
              </thead>
              <tbody>
                {active.map((r) => {
                  const st = statusOf(r);
                  const s = byId.get(r.student_id);
                  const locked = r.locked_until && Date.parse(r.locked_until) > Date.now();
                  return (
                    <tr key={r.student_id}>
                      <th scope="row"><Link href={`/giao-vien/lop/${cls.id}/hoc-sinh/${r.student_id}`} className="student-link" title="Xem tiến độ chi tiết">{r.display_name}</Link></th>
                      <td className="pin-cell">{pins[r.student_id] ? (showPins ? <b className="pin-value">{pins[r.student_id]}</b> : <span aria-label="PIN đang ẩn">••••••</span>) : <span className="dash-muted" title="PIN tạo trước khi bật lưu PIN — bấm “Đặt PIN mới” để có PIN xem lại được">Chưa lưu</span>}</td>
                      <td><span className={`status-chip tone-${st.tone}`}>{st.label}</span></td>
                      {showBilling && <td>{billingChip(billMap.get(r.student_id))}</td>}
                      <td>{s?.lessons_done ? <Link href={`/giao-vien/lop/${cls.id}/hoc-sinh/${r.student_id}`} className="student-link">{s.lessons_done} bài</Link> : 0}</td>
                      <td>{s?.lessons_done ? `${s.avg_percent}%` : '—'}</td>
                      <td>{s?.total_points ?? 0}</td>
                      <td>{fmtDate(s?.last_activity ?? null)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="mini-btn" disabled={busy !== null} onClick={() => resetPin(r)}><KeyRound aria-hidden="true" /> {r.has_account ? 'Đặt PIN mới' : 'Đặt PIN'}</button>
                          {locked && <button type="button" className="mini-btn" disabled={busy !== null} onClick={() => rpc(`r-${r.student_id}`, 'teacher_manage_student', { p_class: cls.id, p_student: r.student_id, p_action: 'reset_attempts' }, `Đã mở khóa nhập sai cho ${r.display_name}.`)}><RotateCcw aria-hidden="true" /> Mở khóa</button>}
                          {r.student_status === 'active'
                            ? <button type="button" className="mini-btn" disabled={busy !== null} onClick={() => rpc(`l-${r.student_id}`, 'teacher_manage_student', { p_class: cls.id, p_student: r.student_id, p_action: 'lock' }, `Đã khóa tài khoản ${r.display_name}.`)}><Lock aria-hidden="true" /> Khóa</button>
                            : <button type="button" className="mini-btn" disabled={busy !== null} onClick={() => rpc(`u-${r.student_id}`, 'teacher_manage_student', { p_class: cls.id, p_student: r.student_id, p_action: 'unlock' }, `Đã mở tài khoản ${r.display_name}.`)}><LockOpen aria-hidden="true" /> Mở</button>}
                          {confirmRemove === r.student_id ? (
                            <>
                              <button type="button" className="mini-btn is-danger" onClick={() => { setConfirmRemove(null); void rpc(`x-${r.student_id}`, 'teacher_manage_student', { p_class: cls.id, p_student: r.student_id, p_action: 'remove' }, `${r.display_name} đã rời lớp.`); }}>Xác nhận</button>
                              <button type="button" className="mini-btn" onClick={() => setConfirmRemove(null)}>Thôi</button>
                            </>
                          ) : (
                            <button type="button" className="mini-btn" disabled={busy !== null} onClick={() => setConfirmRemove(r.student_id)}><UserMinus aria-hidden="true" /> Rời lớp</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {left.length > 0 && (
          <details className="left-list">
            <summary>Đã rời lớp ({left.length})</summary>
            <ul>
              {left.map((r) => (
                <li key={r.student_id}>{r.display_name}{' '}
                  <button type="button" className="mini-btn" onClick={() => rpc(`b-${r.student_id}`, 'teacher_manage_student', { p_class: cls.id, p_student: r.student_id, p_action: 'restore' }, `${r.display_name} đã trở lại lớp.`)}>Cho vào lại</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="dash-section no-print">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => rpc('arch', 'teacher_set_class_status', { p_class: cls.id, p_active: cls.status !== 'active' }, cls.status === 'active' ? 'Đã lưu trữ lớp.' : 'Đã mở lại lớp.')}>
          {cls.status === 'active' ? 'Lưu trữ lớp (cuối năm học)' : 'Mở lại lớp'}
        </button>
      </section>
    </div>
  );
}
