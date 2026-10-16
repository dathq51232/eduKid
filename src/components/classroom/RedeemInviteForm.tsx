'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RedeemInviteForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } = await createClient().rpc('redeem_parent_invite', { p_code: code.trim() });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message.includes('too_many') ? 'Nhập sai quá nhiều lần. Vui lòng đợi 10 phút.' : 'Tài khoản này không dùng được mã mời.' });
      return;
    }
    if (!data) return setMsg({ ok: false, text: 'Mã không đúng, đã hết hạn hoặc đã dùng hết lượt. Hãy hỏi thầy cô mã mới.' });
    setCode('');
    setMsg({ ok: true, text: 'Đã liên kết với con.' });
    router.refresh();
  };
  return (
    <form className="dash-form is-row" onSubmit={submit}>
      <label className="adm-field"><span>Mã mời từ thầy cô</span>
        <input required maxLength={20} autoComplete="off" placeholder="PH-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}><Link2 aria-hidden="true" /> Liên kết</button>
      {msg && <p className={`adm-alert ${msg.ok ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}
    </form>
  );
}
