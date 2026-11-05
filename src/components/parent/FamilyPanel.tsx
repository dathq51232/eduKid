'use client';

// Học tại nhà (11/2026): phụ huynh thêm con, xem mã gia đình + PIN, đổi khối, cấp PIN mới, in thẻ đăng nhập.
// Con đăng nhập như học sinh ở trường: Mã gia đình (giống mã lớp) → chọn tên → PIN 6 số.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Eye, EyeOff, KeyRound, Plus, Printer, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export type FamilyChild = { student_id: string; display_name: string; grade: number; own: boolean; pin: string | null; has_login: boolean; access_reason: string | null; access_until: string | null };
const AVATAR = ['#2563eb', '#22a447', '#f08a1c', '#7c4dd6', '#e2437f', '#0891b2'];
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');

function access(c: FamilyChild) {
  switch (c.access_reason) {
    case 'trial': return { cls: 'is-trial', text: `Học thử đến ${fmt(c.access_until)}` };
    case 'paid': return { cls: 'is-ok', text: `Đã đóng phí đến ${fmt(c.access_until)}` };
    case 'expired': return { cls: 'is-off', text: 'Hết hạn học — đóng phí để học tiếp' };
    default: return { cls: 'is-ok', text: 'Đang học miễn phí' };
  }
}

export default function FamilyPanel({ kids, code, origin }: { kids: FamilyChild[]; code: string | null; origin: string }) {
  const router = useRouter();
  const [list, setList] = useState(kids);
  const [famCode, setFamCode] = useState(code);
  const [open, setOpen] = useState(kids.length === 0);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const own = list.filter((k) => k.own);
  const loginUrl = `${origin}/dang-nhap`;

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setBusy('add');
    const r = await fetch('/api/hoc-sinh/gia-dinh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, grade, consent }) });
    const d = (await r.json().catch(() => ({}))) as { id?: string; pin?: string; code?: string; error?: string };
    setBusy('');
    if (!d.id) { setMsg({ ok: false, text: d.error ?? 'Không thêm được. Vui lòng thử lại.' }); return; }
    setList((l) => [...l, { student_id: d.id!, display_name: name.trim(), grade, own: true, pin: d.pin ?? null, has_login: !!d.pin, access_reason: 'trial', access_until: null }]);
    setShown((s) => ({ ...s, [d.id!]: true }));
    if (d.code) setFamCode(d.code);
    setMsg({ ok: !d.error, text: d.error ?? `Đã thêm ${name.trim()}. Con đăng nhập bằng mã gia đình ${d.code} và PIN ${d.pin}.` });
    setName(''); setConsent(false); setOpen(false);
    router.refresh();
  };
  const newPin = async (c: FamilyChild) => {
    if (!window.confirm(`Cấp PIN mới cho ${c.display_name}? PIN cũ sẽ không dùng được nữa.`)) return;
    setBusy(c.student_id); setMsg(null);
    const r = await fetch('/api/hoc-sinh/gia-dinh-pin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid: c.student_id }) });
    const d = (await r.json().catch(() => ({}))) as { pin?: string; error?: string };
    setBusy('');
    if (!d.pin) { setMsg({ ok: false, text: d.error ?? 'Không cấp được PIN.' }); return; }
    setList((l) => l.map((k) => (k.student_id === c.student_id ? { ...k, pin: d.pin!, has_login: true } : k)));
    setShown((s) => ({ ...s, [c.student_id]: true }));
    setMsg({ ok: true, text: `PIN mới của ${c.display_name}: ${d.pin}` });
  };
  const setChildGrade = async (c: FamilyChild, g: number) => {
    setBusy(c.student_id); setMsg(null);
    const { error } = await createClient().rpc('parent_update_child', { p_student: c.student_id, p_name: c.display_name, p_grade: g });
    setBusy('');
    if (error) { setMsg({ ok: false, text: 'Không đổi được khối lớp.' }); return; }
    setList((l) => l.map((k) => (k.student_id === c.student_id ? { ...k, grade: g } : k)));
    setMsg({ ok: true, text: `${c.display_name} sẽ học nội dung lớp ${g}.` });
  };
  const copyCode = async () => { try { await navigator.clipboard.writeText(famCode ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* bỏ qua */ } };

  return (
    <section className="fam" aria-labelledby="fam-title">
      <div className="fam-head">
        <div>
          <p className="fam-kicker">HỌC TẠI NHÀ</p>
          <h2 id="fam-title">Con của bạn</h2>
          <p className="fam-sub">Thêm con để con tự học Toán, Tiếng Việt, Tiếng Anh theo đúng khối lớp. Bạn theo dõi tiến độ ngay tại trang này.</p>
        </div>
        {famCode && (
          <div className="fam-code" aria-label="Mã gia đình">
            <small>Mã gia đình</small>
            <b>{famCode}</b>
            <button type="button" onClick={() => void copyCode()} aria-label="Sao chép mã gia đình">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button>
          </div>
        )}
      </div>

      {famCode && own.length > 0 && (
        <ol className="fam-how">
          <li><span>1</span>Mở <b>{loginUrl.replace(/^https?:\/\//, '')}</b> → chọn <b>Học sinh</b></li>
          <li><span>2</span>Nhập mã gia đình <b>{famCode}</b></li>
          <li><span>3</span>Bấm tên con và nhập <b>PIN 6 số</b></li>
        </ol>
      )}

      {list.length > 0 && (
        <div className="fam-kids">
          {list.map((c, i) => {
            const a = access(c);
            return (
              <article key={c.student_id} className="fam-kid">
                <span className="fam-av" style={{ background: AVATAR[i % AVATAR.length] }} aria-hidden="true">{c.display_name.trim().slice(0, 1).toUpperCase()}</span>
                <div className="fam-kid-main">
                  <h3>{c.display_name}</h3>
                  <span className={`fam-acc ${a.cls}`}>{a.text}</span>
                  {!c.own && <small className="fam-note">Con học ở lớp của thầy cô — PIN do thầy cô quản lý.</small>}
                </div>
                {c.own && <>
                  <label className="fam-grade">Khối
                    <select value={c.grade} disabled={busy === c.student_id} onChange={(e) => void setChildGrade(c, Number(e.target.value))} aria-label={`Khối lớp của ${c.display_name}`}>
                      {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                    </select>
                  </label>
                  <div className="fam-pin">
                    <small>PIN</small>
                    <b>{c.pin ? (shown[c.student_id] ? c.pin : '••••••') : '—'}</b>
                    {c.pin && <button type="button" onClick={() => setShown((s) => ({ ...s, [c.student_id]: !s[c.student_id] }))} aria-label={shown[c.student_id] ? 'Ẩn PIN' : 'Hiện PIN'}>{shown[c.student_id] ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>}
                  </div>
                  <div className="fam-acts">
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy === c.student_id} onClick={() => void newPin(c)}><KeyRound aria-hidden="true" /> {c.has_login ? 'Cấp PIN mới' : 'Tạo PIN'}</button>
                    {c.pin && famCode && <button type="button" className="btn btn-outline btn-sm" onClick={() => printCard(c.display_name, famCode, c.pin!, loginUrl)}><Printer aria-hidden="true" /> In thẻ</button>}
                  </div>
                </>}
              </article>
            );
          })}
        </div>
      )}

      {msg && <p className={`adm-alert ${msg.ok ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      {open ? (
        <form className="fam-form" onSubmit={add}>
          <h3><UserPlus aria-hidden="true" /> Thêm con</h3>
          <label className="adm-field"><span>Tên gọi của con (hiện khi đăng nhập)</span>
            <input required maxLength={60} placeholder="vd: Bé Na, Minh Khôi" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="adm-field"><span>Con đang học lớp</span>
            <div className="fam-grades" role="radiogroup" aria-label="Khối lớp">
              {[1, 2, 3, 4, 5].map((g) => <button key={g} type="button" role="radio" aria-checked={grade === g} className={grade === g ? 'is-on' : ''} onClick={() => setGrade(g)}>Lớp {g}</button>)}
            </div>
          </div>
          <label className="check-line">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Tôi là cha/mẹ hoặc người giám hộ của bé và đồng ý để EduChain Kids lưu tên gọi, khối lớp và kết quả học tập của bé để theo dõi tiến độ.</span>
          </label>
          <div className="fam-form-acts">
            <button type="submit" className="btn btn-primary" disabled={busy === 'add' || !name.trim() || !consent}><Plus aria-hidden="true" /> {busy === 'add' ? 'Đang tạo…' : 'Thêm và tạo PIN'}</button>
            {list.length > 0 && <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Huỷ</button>}
          </div>
          <p className="fam-free">Mỗi bé được học thử miễn phí 7 ngày. Tối đa 6 con / tài khoản.</p>
        </form>
      ) : list.length < 6 && (
        <button type="button" className="fam-add" onClick={() => { setOpen(true); setMsg(null); }}><Plus aria-hidden="true" /> Thêm con</button>
      )}
    </section>
  );
}

/** In thẻ đăng nhập của con (cửa sổ in riêng, khổ thẻ) */
function printCard(name: string, code: string, pin: string, url: string) {
  const w = window.open('', '_blank', 'width=480,height=360');
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Thẻ đăng nhập</title><style>
body{font-family:Arial,sans-serif;margin:24px}.c{width:86mm;border:2px solid #2563eb;border-radius:14px;padding:14px 16px}
h1{font-size:18px;margin:0 0 4px;color:#1e3a8a}p{margin:4px 0;font-size:13px}b{font-size:20px;letter-spacing:2px}.u{color:#555;font-size:11px}</style>
<div class="c"><h1>EduChain Kids · ${esc(name)}</h1><p>Mã gia đình: <b>${esc(code)}</b></p><p>PIN: <b>${esc(pin)}</b></p><p class="u">Đăng nhập tại ${esc(url)} → Học sinh</p></div>
<script>setTimeout(()=>print(),200)<\/script>`);
  w.document.close();
}
