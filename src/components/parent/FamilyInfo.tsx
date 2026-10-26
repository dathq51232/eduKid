'use client';

// Góc phụ huynh: thông tin gia đình (Bố, Mẹ, người đón con khác, địa chỉ nhà).
// Lưu một lần qua parent_family_save (migration 0033) — cập nhật thẳng vào Danh bạ phụ huynh của cô chủ nhiệm.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Lock, MapPin, Pencil, Phone, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RELATIONS, formatPhone, normalizePhone, telHref, zaloHref, type Contact } from '@/lib/classroom/class-tools';

type Slot = { key: 'bo' | 'me' | 'khac'; id: string | null; relation: string; name: string; phone: string; zalo: string; mine: boolean };
const OTHER_RELATIONS = RELATIONS.filter((r) => r !== 'Bố' && r !== 'Mẹ');
const ICON: Record<string, string> = { 'Bố': '👨', 'Mẹ': '👩', 'Ông': '👴', 'Bà': '👵' };

/** Chia danh bạ thành 3 ô: Bố, Mẹ, người đón khác (số thừa giữ nguyên, không sửa ở đây) */
function slotsOf(contacts: Contact[]): Slot[] {
  const used = new Set<string>();
  const pick = (fn: (c: Contact) => boolean) => { const c = contacts.find((x) => !used.has(x.id) && fn(x)); if (c) used.add(c.id); return c; };
  const bo = pick((c) => c.relation === 'Bố');
  const me = pick((c) => c.relation === 'Mẹ');
  const khac = pick(() => true);
  const mk = (key: Slot['key'], relation: string, c?: Contact): Slot => ({
    key, id: c?.id ?? null, relation: c?.relation || relation, name: c?.name ?? '',
    phone: c ? formatPhone(c.phone) : '', zalo: c?.zalo ? formatPhone(c.zalo) : '', mine: c ? c.mine !== false : true,
  });
  return [mk('bo', 'Bố', bo), mk('me', 'Mẹ', me), mk('khac', 'Bà', khac)];
}

const errText = (m: string) => {
  const who = m.split(':')[1]?.trim();
  if (/invalid_phone/.test(m)) return `Số điện thoại${who ? ` của ${who}` : ''} chưa đúng (cần 10 số, ví dụ 0912 345 678).`;
  if (/invalid_zalo/.test(m)) return `Số Zalo${who ? ` của ${who}` : ''} chưa đúng. Để trống nếu Zalo trùng số điện thoại.`;
  if (/too_many/.test(m)) return 'Mỗi gia đình lưu tối đa 3 số. Nhờ cô xoá bớt số cũ trong danh bạ.';
  if (/invalid_address/.test(m)) return 'Địa chỉ dài quá (tối đa 200 ký tự).';
  if (/function|does not exist|schema cache/i.test(m)) return 'Chưa bật mục này: hãy chạy supabase/migrations/0033_parent_family.sql trên Supabase.';
  return 'Chưa lưu được. Kiểm tra mạng rồi thử lại.';
};

export default function FamilyInfo({ contacts, address, className }: { contacts: Contact[]; address: string | null; className?: string | null }) {
  const router = useRouter();
  const [data, setData] = useState({ contacts, address });
  const [edit, setEdit] = useState<{ slots: Slot[]; address: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const open = () => { setErr(''); setOk(''); setEdit({ slots: slotsOf(data.contacts), address: data.address ?? '' }); };
  const setSlot = (i: number, patch: Partial<Slot>) => setEdit((e) => e && { ...e, slots: e.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const people: object[] = [];
    for (const s of edit.slots) {
      const label = s.key === 'khac' ? s.relation : s.key === 'bo' ? 'Bố' : 'Mẹ';
      const blank = !s.name.trim() && !s.phone.trim() && !s.zalo.trim();
      if (blank) { if (s.id && s.mine) people.push({ id: s.id, remove: true }); continue; }
      const phone = normalizePhone(s.phone);
      if (!phone) { setErr(`Số điện thoại của ${label} chưa đúng (cần 10 số, ví dụ 0912 345 678).`); return; }
      const zalo = s.zalo.trim() ? normalizePhone(s.zalo) : null;
      if (s.zalo.trim() && !zalo) { setErr(`Số Zalo của ${label} chưa đúng. Để trống nếu Zalo trùng số điện thoại.`); return; }
      people.push({ id: s.id, relation: label, name: s.name.trim(), phone, zalo });
    }
    setBusy(true); setErr('');
    const { data: res, error } = await createClient().rpc('parent_family_save', { p_address: edit.address.trim(), p_people: people });
    setBusy(false);
    if (error) { setErr(errText(error.message)); return; }
    const r = res as { contacts?: Contact[]; address?: string | null } | null;
    setData({ contacts: r?.contacts ?? data.contacts, address: r?.address ?? null });
    setEdit(null);
    setOk('Đã lưu. Cô chủ nhiệm thấy ngay trong Danh bạ phụ huynh của lớp.');
    router.refresh();
  };

  const list = data.contacts;
  return (
    <section className="ph-card ph-family" aria-labelledby="ph-fam-title">
      <div className="ph-card-hd">
        <div>
          <h2 id="ph-fam-title"><Home aria-hidden="true" /> Thông tin gia đình</h2>
          <p className="ph-sub">Cô chủ nhiệm dùng để liên lạc khi cần</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={open}><Pencil aria-hidden="true" /> Cập nhật</button>
      </div>

      {list.length === 0 && !data.address ? (
        <button type="button" className="ph-empty" onClick={open}>
          <b>Chưa có thông tin gia đình</b>
          <span>Thêm họ tên, số điện thoại, Zalo của bố mẹ và địa chỉ nhà để cô dễ liên lạc.</span>
        </button>
      ) : (
        <div className="ph-people">
          {list.map((c) => (
            <div key={c.id} className="ph-person">
              <span className={`ph-person-ic is-${c.relation === 'Mẹ' ? 'me' : c.relation === 'Bố' ? 'bo' : 'khac'}`} aria-hidden="true">{ICON[c.relation] ?? '🧑'}</span>
              <div className="ph-person-txt">
                <small>{c.relation || 'Người thân'}{c.mine === false ? ' · cô nhập' : ''}</small>
                <b>{c.name || '—'}</b>
                <span className="ph-person-ph"><Phone aria-hidden="true" /> <b>{formatPhone(c.phone)}</b> · Zalo: {c.zalo && c.zalo !== c.phone ? <b>{formatPhone(c.zalo)}</b> : 'trùng số'}</span>
              </div>
              <span className="ph-person-act">
                <a href={telHref(c.phone)} className="ph-mini" aria-label={`Gọi ${formatPhone(c.phone)}`}><Phone aria-hidden="true" /></a>
                <a href={zaloHref(c.zalo || c.phone)} target="_blank" rel="noopener noreferrer" className="ph-mini is-zalo" aria-label="Mở Zalo">Zalo</a>
              </span>
            </div>
          ))}
          <div className="ph-addr"><small><MapPin aria-hidden="true" /> Địa chỉ</small>{data.address || <i className="dash-muted">Chưa có địa chỉ</i>}</div>
        </div>
      )}
      <p className="ph-priv"><Lock aria-hidden="true" /> Chỉ cô chủ nhiệm{className ? ` lớp ${className}` : ''} xem được. Phụ huynh khác không xem được.</p>
      {ok && <p className="adm-alert is-ok" role="status">{ok}</p>}

      {edit && (
        <div className="ct-modal-bg" onClick={() => !busy && setEdit(null)}>
          <form className="ct-modal ph-modal" role="dialog" aria-modal="true" aria-labelledby="ph-edit-title" onSubmit={save} onClick={(e) => e.stopPropagation()}>
            <div className="ct-modal-head">
              <div>
                <h2 id="ph-edit-title"><Pencil aria-hidden="true" /> Cập nhật thông tin gia đình</h2>
                <p className="ph-sub">Thông tin này cập nhật thẳng vào Danh bạ phụ huynh của cô chủ nhiệm.</p>
              </div>
              <button type="button" className="ct-x" onClick={() => setEdit(null)} aria-label="Đóng"><X aria-hidden="true" /></button>
            </div>
            {edit.slots.map((s, i) => (
              <fieldset key={s.key} className="ph-sec">
                <legend>{s.key === 'bo' ? '👨 Bố' : s.key === 'me' ? '👩 Mẹ' : <>🧑 Người đón con khác <small>(không bắt buộc)</small></>}</legend>
                <div className={`ph-row${s.key === 'khac' ? ' is-4' : ''}`}>
                  {s.key === 'khac' && (
                    <label>Quan hệ
                      <select value={s.relation} onChange={(e) => setSlot(i, { relation: e.target.value })}>
                        {OTHER_RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </label>
                  )}
                  <label>Họ và tên<input value={s.name} maxLength={80} autoComplete="name" placeholder={s.key === 'khac' ? 'Ví dụ: Lê Thị Mai' : 'Họ và tên'} onChange={(e) => setSlot(i, { name: e.target.value })} /></label>
                  <label>Số điện thoại<input value={s.phone} maxLength={16} inputMode="tel" autoComplete="tel" placeholder="0912 345 678" onChange={(e) => setSlot(i, { phone: e.target.value })} /></label>
                  <label>Số Zalo (nếu khác)<input value={s.zalo} maxLength={16} inputMode="tel" placeholder="Trùng số điện thoại" onChange={(e) => setSlot(i, { zalo: e.target.value })} /></label>
                </div>
                {s.id && !s.mine && <p className="ph-hint">Số này do cô nhập: sửa được, muốn xoá thì nhắn cô.</p>}
              </fieldset>
            ))}
            <fieldset className="ph-sec">
              <legend>📍 Địa chỉ nhà</legend>
              <input className="ph-full" value={edit.address} maxLength={200} autoComplete="street-address" placeholder="Số nhà, đường/thôn, phường/xã, tỉnh/thành" onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
            </fieldset>
            {err && <p className="adm-alert is-error" role="alert">{err}</p>}
            <div className="ct-modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setEdit(null)} disabled={busy}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang lưu…' : 'Lưu thông tin'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
