'use client';

// Danh bạ phụ huynh: số điện thoại từng em (tối đa 3 người), bấm Gọi / Zalo / Chép, dán cả danh sách từ Excel,
// ẩn số khi chiếu màn hình. DỮ LIỆU CÁ NHÂN: chỉ giáo viên của lớp xem được, mọi lần xem/sửa có nhật ký (migration 0028).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardPaste, Copy, Eye, EyeOff, MessageCircle, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ZaloGroupLink from '@/components/classroom/ZaloGroupLink';
import { fold } from '@/lib/classroom/teacher-nav';
import {
  RELATIONS, formatPhone, maskPhone, normalizePhone, parseContactPaste, telHref, zaloHref, type Contact, type ToolStudent,
} from '@/lib/classroom/class-tools';

type Props = { classId: string; className: string; students: ToolStudent[] };
type Draft = { id: string | null; student_id: string; name: string; relation: string; phone: string; zalo: string; note: string; top?: boolean };
const HIDE_KEY = 'gv-an-so-ph';

export default function ParentContacts({ classId, className, students }: Props) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [q, setQ] = useState('');
  const [hide, setHide] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [paste, setPaste] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => { try { setHide(localStorage.getItem(HIDE_KEY) === '1'); } catch { /* bỏ qua */ } }, []);
  const toggleHide = () => setHide((h) => { try { localStorage.setItem(HIDE_KEY, h ? '0' : '1'); } catch { /* bỏ qua */ } return !h; });

  const load = useCallback(async () => {
    if (!supabase) { setLoaded(true); return; }
    const { data, error } = await supabase.rpc('teacher_contacts', { p_class: classId });
    if (error) setMissing(true); else setContacts((data ?? []) as Contact[]);
    setLoaded(true);
  }, [supabase, classId]);
  useEffect(() => { void load(); }, [load]);

  const byStudent = useMemo(() => {
    const m: Record<string, Contact[]> = {};
    contacts.forEach((c) => { (m[c.student_id] ??= []).push(c); });
    return m;
  }, [contacts]);
  const withPhone = students.filter((s) => byStudent[s.id]?.length).length;
  const f = fold(q);
  const digits = q.replace(/\D/g, '');
  const shown = students.filter((s) => !f || fold(s.name).includes(f)
    || (byStudent[s.id] ?? []).some((c) => fold(c.name).includes(f) || (digits.length >= 3 && c.phone.includes(digits))));

  const save = async () => {
    if (!draft || !supabase) return;
    const phone = normalizePhone(draft.phone);
    if (!draft.student_id) { setErr('Chọn em trước.'); return; }
    if (!phone) { setErr('Số điện thoại chưa đúng (cần 10 số, ví dụ 0912 345 678).'); return; }
    const zalo = draft.zalo.trim() ? normalizePhone(draft.zalo) : null;
    if (draft.zalo.trim() && !zalo) { setErr('Số Zalo chưa đúng. Để trống nếu Zalo trùng số điện thoại.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('teacher_contact_save', {
      p_class: classId, p_student: draft.student_id, p_id: draft.id, p_name: draft.name, p_relation: draft.relation, p_phone: phone, p_note: draft.note || null,
      // Chỉ gửi p_zalo khi có (0031): chưa chạy 0031 thì vẫn lưu được như cũ
      ...(zalo ? { p_zalo: zalo } : draft.id && contacts.find((c) => c.id === draft.id)?.zalo ? { p_zalo: null } : {}),
    });
    setBusy(false);
    if (error) { setErr(/too_many/.test(error.message) ? 'Mỗi em lưu tối đa 3 số.' : /invalid_phone/.test(error.message) ? 'Số điện thoại chưa đúng.' : /invalid_zalo/.test(error.message) ? 'Số Zalo chưa đúng.' : /p_zalo|function/i.test(error.message) ? 'Muốn lưu số Zalo riêng: chạy supabase/migrations/0031_parent_hub.sql trên Supabase.' : 'Chưa lưu được. Thử lại nhé.'); return; }
    setDraft(null); setOk('Đã lưu số điện thoại.'); void load();
  };
  const remove = async (c: Contact) => {
    if (!supabase || !window.confirm(`Xóa số ${formatPhone(c.phone)}${c.name ? ` (${c.name})` : ''}?`)) return;
    const { error } = await supabase.rpc('teacher_contact_delete', { p_class: classId, p_id: c.id });
    if (error) { setErr('Chưa xóa được.'); return; }
    setDraft(null); void load();
  };
  const copy = (p: string) => { void navigator.clipboard?.writeText(p).then(() => { setCopied(p); window.setTimeout(() => setCopied(''), 1500); }); };
  const newDraft = (student_id = ''): Draft => ({ id: null, student_id, name: '', relation: 'Mẹ', phone: '', zalo: '', note: '', top: !student_id });

  const form = (d: Draft) => (
    <form className="pc-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      {d.top && (
        <select value={d.student_id} onChange={(e) => setDraft({ ...d, student_id: e.target.value })} aria-label="Học sinh" required>
          <option value="">Chọn em…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
      <input value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} placeholder="Tên phụ huynh" maxLength={80} aria-label="Tên phụ huynh" />
      <input value={d.relation} onChange={(e) => setDraft({ ...d, relation: e.target.value })} list="pc-rel" placeholder="Quan hệ" maxLength={30} aria-label="Quan hệ" className="pc-rel" />
      <input value={d.phone} onChange={(e) => setDraft({ ...d, phone: e.target.value })} placeholder="Số điện thoại" inputMode="tel" autoFocus aria-label="Số điện thoại" className="pc-phone-in" />
      <input value={d.zalo} onChange={(e) => setDraft({ ...d, zalo: e.target.value })} placeholder="Số Zalo (nếu khác)" inputMode="tel" aria-label="Số Zalo nếu khác số điện thoại" className="pc-phone-in" />
      <input value={d.note} onChange={(e) => setDraft({ ...d, note: e.target.value })} placeholder="Ghi chú (vd: gọi sau 17h)" maxLength={200} aria-label="Ghi chú" />
      <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setDraft(null); setErr(''); }}>Hủy</button>
    </form>
  );

  return (
    <div className="ct pc">
      <datalist id="pc-rel">{RELATIONS.map((r) => <option key={r} value={r} />)}</datalist>
      <div className="ct-head">
        <div>
          <p className="ct-sub">Lớp {className} · {withPhone}/{students.length} em có số phụ huynh</p>
          <h1>Danh bạ phụ huynh</h1>
        </div>
        <div className="ct-actions">
          <label className="pc-search"><Search aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên em, phụ huynh hoặc số…" aria-label="Tìm" /></label>
          <button type="button" className="btn btn-outline" onClick={() => setPaste(true)} disabled={missing}><ClipboardPaste aria-hidden="true" /> Dán từ Excel</button>
          <button type="button" className="btn btn-outline" onClick={toggleHide} aria-pressed={hide}>{hide ? <><Eye aria-hidden="true" /> Hiện số</> : <><EyeOff aria-hidden="true" /> Ẩn số khi chiếu</>}</button>
          <button type="button" className="btn btn-primary" onClick={() => setDraft(newDraft())} disabled={missing}><Plus aria-hidden="true" /> Thêm số</button>
        </div>
      </div>
      <p className="pc-note">🔒 Chỉ giáo viên được phân công lớp này xem được. Học sinh, phụ huynh khác và giáo viên lớp khác không xem được; mỗi lần xem / sửa đều được ghi nhật ký. Bật “Ẩn số khi chiếu” trước khi chiếu màn hình lên bảng.</p>
      {!missing && <ZaloGroupLink classId={classId} className={className} variant="contacts" />}
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0028_class_tools.sql</code> trên Supabase nên chưa lưu được số phụ huynh.</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {ok && !err && <p className="adm-alert is-ok" role="status">{ok} <button type="button" className="ct-x" onClick={() => setOk('')} aria-label="Đóng"><X aria-hidden="true" /></button></p>}
      {draft?.top && <section className="card pc-new"><h2>Thêm số phụ huynh</h2>{form(draft)}</section>}

      {!loaded ? <p className="dash-muted">Đang tải…</p> : (
        <section className="card pc-list" aria-label="Danh bạ">
          <div className="pc-row pc-th" aria-hidden="true"><span>#</span><span>Học sinh</span><span>Phụ huynh</span><span>Điện thoại</span><span>Liên hệ</span><span>Ghi chú</span><span /></div>
          {shown.map((s) => {
            const list = byStudent[s.id] ?? [];
            const editingHere = draft && !draft.top && draft.student_id === s.id;
            return (
              <div key={s.id} className={`pc-st${list.length ? '' : ' is-missing'}`}>
                <span className="pc-no">{students.indexOf(s) + 1}</span>
                <b className="pc-name">{s.name}</b>
                <div className="pc-cs">
                  {list.map((c) => draft?.id === c.id ? <div key={c.id} className="pc-c is-edit">{form(draft)}<button type="button" className="ct-link pc-del" onClick={() => void remove(c)}><Trash2 aria-hidden="true" /> Xóa số này</button></div> : (
                    <div key={c.id} className="pc-c">
                      <span className="pc-pn">{c.name || <i className="dash-muted">—</i>}<small>{c.relation}</small></span>
                      <span className="pc-phone">{hide ? maskPhone(c.phone) : formatPhone(c.phone)}{c.zalo && c.zalo !== c.phone && <small className="pc-zalo-no">Zalo: {hide ? maskPhone(c.zalo) : formatPhone(c.zalo)}</small>}</span>
                      <span className="pc-act">
                        <a href={telHref(c.phone)} className="pc-btn"><Phone aria-hidden="true" /> Gọi</a>
                        <a href={zaloHref(c.zalo || c.phone)} target="_blank" rel="noopener noreferrer" className="pc-btn is-zalo"><MessageCircle aria-hidden="true" /> Zalo</a>
                        <button type="button" className="pc-btn" onClick={() => copy(c.phone)}><Copy aria-hidden="true" /> {copied === c.phone ? 'Đã chép' : 'Chép'}</button>
                      </span>
                      <span className="pc-memo">{c.note}</span>
                      <button type="button" className="ct-x" onClick={() => { setErr(''); setDraft({ id: c.id, student_id: s.id, name: c.name, relation: c.relation, phone: formatPhone(c.phone), zalo: c.zalo ? formatPhone(c.zalo) : '', note: c.note ?? '' }); }} aria-label={`Sửa số của ${s.name}`}><Pencil aria-hidden="true" /></button>
                    </div>
                  ))}
                  {editingHere && !draft.id ? <div className="pc-c is-edit">{form(draft)}</div>
                    : list.length === 0 ? <div className="pc-c is-empty"><span className="pc-miss">⚠ Chưa có số phụ huynh</span><button type="button" className="btn btn-outline btn-sm" onClick={() => { setErr(''); setDraft(newDraft(s.id)); }} disabled={missing}><Plus aria-hidden="true" /> Nhập số</button></div>
                    : list.length < 3 && <button type="button" className="ct-link pc-more" onClick={() => { setErr(''); setDraft(newDraft(s.id)); }}><Plus aria-hidden="true" /> Thêm người liên hệ</button>}
                </div>
              </div>
            );
          })}
          {!shown.length && <p className="dash-muted">Không tìm thấy “{q}”.</p>}
        </section>
      )}
      <p className="ct-hint">💡 Bấm “Zalo” mở Zalo đúng số phụ huynh (trên máy tính cần cài Zalo PC). Tin nhắn soạn sẵn trong Sổ lớp cũng có nút Zalo cho từng em.</p>
      {paste && <PasteDialog students={students} onClose={() => setPaste(false)} onSave={async (rows) => {
        if (!supabase) return 'Chưa kết nối.';
        const { data, error } = await supabase.rpc('teacher_contacts_import', { p_class: classId, p_rows: rows });
        if (error) return 'Chưa lưu được. Thử lại nhé.';
        const r = data as { saved: number; skipped: number };
        setPaste(false); setOk(`Đã lưu ${r.saved} số${r.skipped ? `, bỏ qua ${r.skipped} dòng (em đã đủ 3 số hoặc số sai)` : ''}.`); void load();
        return null;
      }} />}
    </div>
  );
}

function PasteDialog({ students, onClose, onSave }: { students: ToolStudent[]; onClose: () => void; onSave: (rows: object[]) => Promise<string | null> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const rows = useMemo(() => parseContactPaste(text, students), [text, students]);
  const good = rows.filter((r) => !r.problem);
  return (
    <div className="ct-modal-bg" onClick={onClose}>
      <div className="ct-modal pc-paste" role="dialog" aria-modal="true" aria-label="Dán danh bạ từ Excel" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-head"><h2>Dán danh bạ từ Excel</h2><button type="button" className="ct-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        <p className="dash-muted">Chép các cột từ Excel (hoặc danh sách Zalo): <b>Tên em · Tên phụ huynh · Quan hệ · Số điện thoại · Ghi chú</b>. Thứ tự cột không quan trọng, chỉ cần cột đầu là tên em. Tên em gõ không dấu hoặc chỉ tên gọi cũng được.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={'Lê Gia Huy\tLê Thị Hoa\tBà\t0903 556 778\nKhánh Linh\tPhạm Quốc Tuấn\tBố\t0935220991'} aria-label="Nội dung dán" autoFocus />
        {rows.length > 0 && (
          <div className="pc-preview">
            <p><b>{good.length}</b> dòng sẵn sàng{rows.length - good.length ? <> · <span className="pc-miss">{rows.length - good.length} dòng cần sửa</span></> : ''}</p>
            <ul>{rows.slice(0, 60).map((r) => (
              <li key={r.line} className={r.problem ? 'is-bad' : ''}>
                {r.problem ? <>Dòng {r.line}: {r.problem}</> : <><b>{r.student!.name}</b> · {r.name || '—'} {r.relation && `(${r.relation})`} · {formatPhone(r.phone!)}{r.note && ` · ${r.note}`}</>}
              </li>
            ))}</ul>
          </div>
        )}
        {err && <p className="adm-alert is-error">{err}</p>}
        <div className="ct-modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" disabled={!good.length || busy} onClick={() => {
            setBusy(true);
            void onSave(good.map((r) => ({ student_id: r.student!.id, name: r.name, relation: r.relation, phone: r.phone, note: r.note }))).then((e) => { setBusy(false); if (e) setErr(e); });
          }}>{busy ? 'Đang lưu…' : `Lưu ${good.length} số`}</button>
        </div>
      </div>
    </div>
  );
}
