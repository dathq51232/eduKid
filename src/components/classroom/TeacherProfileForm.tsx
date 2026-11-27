'use client';

// Biểu mẫu THÔNG TIN CÁ NHÂN giáo viên (trang /giao-vien/ca-nhan): thêm / sửa / xoá.
// • Họ tên → profiles.display_name (RLS: chỉ sửa hồ sơ của mình)
// • Điện thoại, ngày sinh, công việc → user_metadata của tài khoản (gv_phone, gv_birthday, gv_position) — chỉ chính mình đọc được
// • Xưng hô → cookie gv-xung-ho (trang chủ đổi lời chào, hình minh hoạ)
// • Giới thiệu, môn dạy, khối, bộ sách, hiện tên trường → community_save_profile (Cộng đồng, migration 0079); chưa có thì ẩn phần này
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, KeyRound, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type TeacherProfile = {
  name: string; email: string; school: string; xh: 'thay' | 'co' | '';
  phone: string; birthday: string; position: string;
  community: { bio: string; subjects: string[]; grades: number[]; book: string; showSchool: boolean } | null;
};

const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên và Xã hội', 'Khoa học', 'Lịch sử và Địa lí', 'Đạo đức', 'Tin học', 'Công nghệ', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm'];
const BOOKS = ['Kết nối tri thức với cuộc sống', 'Chân trời sáng tạo', 'Cánh diều'];
const PHONE = /^\+?[0-9 .]{8,15}$/;

export default function TeacherProfileForm({ initial }: { initial: TeacherProfile }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof TeacherProfile>(k: K, v: TeacherProfile[K]) => { setF((o) => ({ ...o, [k]: v })); setMsg(null); };
  const setC = (patch: Partial<NonNullable<TeacherProfile['community']>>) => { setF((o) => (o.community ? { ...o, community: { ...o.community, ...patch } } : o)); setMsg(null); };
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  async function save(next: TeacherProfile = f) {
    const name = next.name.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 100) { setMsg({ ok: false, text: 'Họ tên cần từ 1 đến 100 ký tự.' }); return; }
    if (next.phone.trim() && !PHONE.test(next.phone.trim())) { setMsg({ ok: false, text: 'Số điện thoại chưa đúng (chỉ gồm số, 8–15 chữ số).' }); return; }
    if (next.community && next.community.bio.length > 500) { setMsg({ ok: false, text: 'Lời giới thiệu tối đa 500 ký tự.' }); return; }
    setBusy(true); setMsg(null);
    const sb = createClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) { setBusy(false); setMsg({ ok: false, text: 'Phiên đăng nhập đã hết — đăng nhập lại rồi lưu.' }); return; }
    const errs: string[] = [];
    const r1 = await sb.from('profiles').update({ display_name: name }).eq('id', u.user.id);
    if (r1.error) errs.push('họ tên');
    const r2 = await sb.auth.updateUser({ data: { gv_phone: next.phone.trim() || null, gv_birthday: next.birthday || null, gv_position: next.position.trim() || null } });
    if (r2.error) errs.push('điện thoại / ngày sinh / công việc');
    if (next.community) {
      const c = next.community;
      const r3 = await sb.rpc('community_save_profile', { p_bio: c.bio.trim(), p_subjects: c.subjects, p_grades: c.grades, p_book: c.book, p_show_school: c.showSchool });
      if (r3.error) errs.push('hồ sơ chuyên môn');
    }
    if (next.xh) document.cookie = `gv-xung-ho=${next.xh}; path=/; max-age=31536000; samesite=lax`;
    else document.cookie = 'gv-xung-ho=; path=/; max-age=0; samesite=lax';
    setBusy(false);
    if (errs.length) { setMsg({ ok: false, text: `Chưa lưu được: ${errs.join(', ')}. Thử lại sau ít phút.` }); return; }
    setF({ ...next, name });
    setMsg({ ok: true, text: 'Đã lưu thông tin.' });
    router.refresh();
  }

  async function clearExtra() {
    if (!window.confirm('Xoá số điện thoại, ngày sinh, công việc và hồ sơ chuyên môn? Họ tên và email vẫn giữ.')) return;
    const next: TeacherProfile = { ...f, phone: '', birthday: '', position: '', community: f.community ? { bio: '', subjects: [], grades: [], book: '', showSchool: true } : null };
    setF(next);
    await save(next);
  }

  const c = f.community;
  return (
    <form className="cn-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <section className="cn-card">
        <h2>Thông tin chung</h2>
        <label className="cn-field">
          <span>Họ và tên <b aria-hidden="true">*</b></span>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={100} required autoComplete="name" />
        </label>
        <div className="cn-field">
          <span>Xưng hô</span>
          <div className="cn-seg" role="radiogroup" aria-label="Xưng hô">
            {([['thay', 'Thầy'], ['co', 'Cô']] as const).map(([v, t]) => (
              <button key={v} type="button" role="radio" aria-checked={f.xh === v} className={f.xh === v ? 'is-on' : undefined} onClick={() => set('xh', f.xh === v ? '' : v)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="cn-row">
          <label className="cn-field">
            <span>Số điện thoại</span>
            <input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0912 345 678" autoComplete="tel" />
          </label>
          <label className="cn-field">
            <span>Ngày sinh</span>
            <input type="date" value={f.birthday} onChange={(e) => set('birthday', e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </label>
        </div>
        <label className="cn-field">
          <span>Công việc / chức vụ</span>
          <input value={f.position} onChange={(e) => set('position', e.target.value)} maxLength={80} placeholder="VD: Giáo viên chủ nhiệm lớp 3A, Tổ trưởng khối 3" />
        </label>
        <div className="cn-row">
          <div className="cn-field"><span>Email đăng nhập</span><p className="cn-ro">{f.email || '—'}</p></div>
          <div className="cn-field"><span>Trường</span><p className="cn-ro">{f.school || '—'}</p></div>
        </div>
        <Link href="/dat-lai-mat-khau" className="cn-link"><KeyRound aria-hidden="true" /> Đổi mật khẩu</Link>
      </section>

      {c && (
        <section className="cn-card">
          <h2>Hồ sơ chuyên môn <small>hiện ở Cộng đồng giáo viên</small></h2>
          <label className="cn-field">
            <span>Giới thiệu ngắn</span>
            <textarea value={c.bio} onChange={(e) => setC({ bio: e.target.value })} maxLength={500} rows={3} placeholder="VD: 10 năm dạy lớp 1, thích làm đồ dùng dạy học từ giấy màu." />
            <small className="cn-count">{c.bio.length}/500</small>
          </label>
          <div className="cn-field">
            <span>Môn dạy</span>
            <div className="cn-chips">
              {SUBJECTS.map((s) => <button key={s} type="button" aria-pressed={c.subjects.includes(s)} onClick={() => setC({ subjects: toggle(c.subjects, s).slice(0, 12) })}>{c.subjects.includes(s) && <Check aria-hidden="true" />}{s}</button>)}
            </div>
          </div>
          <div className="cn-field">
            <span>Khối dạy</span>
            <div className="cn-chips">
              {[1, 2, 3, 4, 5].map((g) => <button key={g} type="button" aria-pressed={c.grades.includes(g)} onClick={() => setC({ grades: toggle(c.grades, g).sort() })}>{c.grades.includes(g) && <Check aria-hidden="true" />}Lớp {g}</button>)}
            </div>
          </div>
          <label className="cn-field">
            <span>Bộ sách đang dạy</span>
            <select value={c.book} onChange={(e) => setC({ book: e.target.value })}>
              <option value="">— Chưa chọn —</option>
              {BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="cn-check">
            <input type="checkbox" checked={c.showSchool} onChange={(e) => setC({ showSchool: e.target.checked })} />
            Hiện tên trường trên bài chia sẻ ở Cộng đồng
          </label>
        </section>
      )}

      {msg && <p className={`cn-msg${msg.ok ? ' is-ok' : ' is-err'}`} role="status">{msg.ok && <Check aria-hidden="true" />}{msg.text}</p>}
      <div className="cn-actions">
        <button type="submit" className="cn-btn is-main" disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang lưu…' : 'Lưu thông tin'}</button>
        <button type="button" className="cn-btn is-danger" disabled={busy} onClick={() => void clearExtra()}><Trash2 aria-hidden="true" /> Xoá thông tin thêm</button>
      </div>
    </form>
  );
}
