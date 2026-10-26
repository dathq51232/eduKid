'use client';

// Góc phụ huynh: gia đình tự cập nhật số điện thoại, số Zalo, người đón con… (tối đa 3 số).
// Lưu qua hàm parent_contact_save/delete (migration 0031) — phiên đăng nhập là phiên của con (PIN dùng chung),
// hàm tự giới hạn chỉ sửa được liên lạc của chính em. Thầy cô thấy ngay trong Danh bạ phụ huynh.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Pencil, Phone, Plus, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RELATIONS, formatPhone, normalizePhone, type Contact } from '@/lib/classroom/class-tools';

type Draft = { id: string | null; name: string; relation: string; phone: string; zalo: string; note: string };
const newDraft: Draft = { id: null, name: '', relation: 'Mẹ', phone: '', zalo: '', note: '' };

const errText = (m: string) =>
  /invalid_phone/.test(m) ? 'Số điện thoại chưa đúng (cần 10 số, ví dụ 0912 345 678).'
  : /invalid_zalo/.test(m) ? 'Số Zalo chưa đúng. Để trống nếu Zalo trùng số điện thoại.'
  : /too_many/.test(m) ? 'Mỗi gia đình lưu tối đa 3 số.'
  : /function|does not exist|schema cache/i.test(m) ? 'Chưa bật mục cập nhật liên hệ: hãy chạy supabase/migrations/0031_parent_hub.sql trên Supabase.'
  : 'Chưa lưu được. Kiểm tra mạng rồi thử lại.';

export default function ParentContactForm({ initial }: { initial: Contact[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!normalizePhone(draft.phone)) { setMsg({ ok: false, text: 'Số điện thoại chưa đúng (cần 10 số, ví dụ 0912 345 678).' }); return; }
    setBusy(true); setMsg(null);
    const { error } = await createClient().rpc('parent_contact_save', {
      p_id: draft.id, p_name: draft.name, p_relation: draft.relation,
      p_phone: normalizePhone(draft.phone), p_zalo: draft.zalo.trim() || null, p_note: draft.note.trim() || null,
    });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: errText(error.message) }); return; }
    setDraft(null);
    setMsg({ ok: true, text: 'Đã lưu. Cô giáo sẽ thấy số này trong danh bạ của lớp.' });
    router.refresh();
  };

  const remove = async (c: Contact) => {
    if (!window.confirm(`Xóa số ${formatPhone(c.phone)}${c.name ? ` (${c.name})` : ''}?`)) return;
    setBusy(true); setMsg(null);
    const { error } = await createClient().rpc('parent_contact_delete', { p_id: c.id });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: errText(error.message) }); return; }
    setDraft(null);
    router.refresh();
  };

  return (
    <div className="parent-contacts-self">
      {initial.length === 0 && !draft && (
        <p className="dash-muted">Chưa có số nào. Thêm số điện thoại và Zalo để cô dễ liên hệ khi cần.</p>
      )}
      {initial.length > 0 && (
        <ul className="pcs-list">
          {initial.map((c) => (
            <li key={c.id} className="pcs-item">
              <div className="pcs-info">
                <strong>{c.name || 'Người thân'}{c.relation ? <span className="dash-muted"> · {c.relation}</span> : null}</strong>
                <span className="pcs-phones">
                  <a href={`tel:${c.phone}`}><Phone size={14} aria-hidden="true" /> {formatPhone(c.phone)}</a>
                  {c.zalo && <a href={`https://zalo.me/${c.zalo.replace(/^\+84/, '0')}`} target="_blank" rel="noopener noreferrer" className="is-zalo"><MessageCircle size={14} aria-hidden="true" /> Zalo {formatPhone(c.zalo)}</a>}
                </span>
                {c.note && <span className="pcs-note">{c.note}</span>}
              </div>
              <span className="pcs-actions">
                <button type="button" className="pc-btn" onClick={() => setDraft({ id: c.id, name: c.name, relation: c.relation || 'Mẹ', phone: c.phone, zalo: c.zalo ?? '', note: c.note ?? '' })} disabled={busy}><Pencil size={14} aria-hidden="true" /> Sửa</button>
                {c.mine === false
                  ? <span className="dash-muted pcs-by-teacher">Số do cô nhập</span>
                  : <button type="button" className="pc-btn is-del" onClick={() => void remove(c)} disabled={busy}><Trash2 size={14} aria-hidden="true" /> Xóa</button>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <form className="dash-form pcs-form" onSubmit={save}>
          <label className="adm-field"><span>Người liên hệ</span>
            <input required maxLength={80} placeholder="Ví dụ: Nguyễn Thu Hà" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="adm-field"><span>Quan hệ với con</span>
            <select value={draft.relation} onChange={(e) => setDraft({ ...draft, relation: e.target.value })}>
              {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Số điện thoại</span>
            <input required inputMode="tel" autoComplete="tel" placeholder="0912 345 678" maxLength={16} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </label>
          <label className="adm-field"><span>Số Zalo (nếu khác số điện thoại)</span>
            <input inputMode="tel" placeholder="Bỏ trống nếu Zalo trùng số trên" maxLength={16} value={draft.zalo} onChange={(e) => setDraft({ ...draft, zalo: e.target.value })} />
          </label>
          <label className="adm-field"><span>Ghi chú cho cô (không bắt buộc)</span>
            <input maxLength={200} placeholder="Ví dụ: phụ đón con giờ..." value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </label>
          <div className="pcs-form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setDraft(null)} disabled={busy}><X aria-hidden="true" /> Huỷ</button>
          </div>
        </form>
      ) : (
        initial.length < 3 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDraft({ ...newDraft })} disabled={busy}>
            <Plus aria-hidden="true" /> Thêm số liên lạc
          </button>
        )
      )}
      {msg && <p className={`adm-alert ${msg.ok ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}
    </div>
  );
}
