'use client';

// Phụ huynh nhắn cô giáo: xin phép nghỉ (chọn ngày), hỏi han, nhắn khác. Chọn người gửi từ danh bạ gia đình
// (Bố/Mẹ/…), tin hiện ngay trên trang "Hôm nay" của cô kèm tên con. Bên dưới là các tin đã gửi và lời trả lời của cô.
import { useMemo, useState } from 'react';
import { CalendarDays, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { KIND_ICON, KIND_LABEL, SEND_ERROR, STATUS_TEXT, ago, isMissing, leaveRange, senderLabel, type MsgKind, type ParentMsg } from '@/lib/classroom/messages';
import { RELATIONS } from '@/lib/classroom/class-tools';

type Person = { name: string; relation: string };
const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

export default function ParentMessages({ people, teacher, childName, initial }: { people: Person[]; teacher: string | null; childName: string; initial: ParentMsg[] | null }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [list, setList] = useState<ParentMsg[]>(initial ?? []);
  const [kind, setKind] = useState<MsgKind>('leave');
  const opts = people.filter((p) => p.name.trim());
  const [who, setWho] = useState<string>(opts.length ? '0' : 'other');
  const [otherName, setOtherName] = useState('');
  const [otherRel, setOtherRel] = useState('Mẹ');
  const today = vnToday();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(initial === null ? SEND_ERROR.missing : '');
  const [sent, setSent] = useState(false);
  const co = teacher ? `cô ${teacher.trim().split(/\s+/).slice(-1)[0]}` : 'cô';

  const send = async () => {
    if (!supabase) return;
    const p = who === 'other' ? { name: otherName.trim(), relation: otherRel } : opts[Number(who)];
    if (!p?.name) { setErr(SEND_ERROR.need_name); return; }
    if (!body.trim()) { setErr(SEND_ERROR.need_body); return; }
    setBusy(true); setErr(''); setSent(false);
    const { error } = await supabase.rpc('parent_message_send', {
      p_kind: kind, p_sender_name: p.name, p_sender_relation: p.relation || null, p_body: body.trim(),
      p_from: kind === 'leave' ? from : null, p_to: kind === 'leave' ? (to < from ? from : to) : null,
    });
    if (error) { setBusy(false); setErr(isMissing(error.message) ? SEND_ERROR.missing : SEND_ERROR[Object.keys(SEND_ERROR).find((k) => error.message.includes(k)) ?? ''] ?? 'Chưa gửi được, vui lòng thử lại.'); return; }
    const { data } = await supabase.rpc('parent_messages_mine', { p_limit: 20 });
    setList((data ?? []) as ParentMsg[]); setBody(''); setBusy(false); setSent(true);
  };

  const quick = kind === 'leave'
    ? [`Cháu bị ốm, gia đình xin phép cho cháu ${childName.split(' ').slice(-1)[0]} nghỉ học.`, 'Gia đình có việc riêng, xin phép cho cháu nghỉ học.', 'Cháu đi khám bệnh, xin phép cho cháu vào lớp muộn.']
    : kind === 'question'
      ? ['Cô ơi, dạo này cháu học trên lớp thế nào ạ?', 'Cô cho gia đình hỏi bài tập về nhà tuần này ạ.', 'Cô ơi, cháu cần chuẩn bị gì cho buổi học tới ạ?']
      : ['Cảm ơn cô đã quan tâm cháu ạ.'];

  return (
    <section className="ph-card pm" aria-labelledby="pm-title">
      <div className="ph-card-hd">
        <div><h2 id="pm-title"><Send aria-hidden="true" /> Nhắn {co}</h2><p className="ph-sub">Xin phép cho con nghỉ học, hoặc hỏi han {co}. Tin nhắn hiện ngay trên trang làm việc của {co}.</p></div>
      </div>

      <div className="pm-kinds" role="radiogroup" aria-label="Loại tin nhắn">
        {(['leave', 'question', 'other'] as MsgKind[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
            <span aria-hidden="true">{KIND_ICON[k]}</span> {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="pm-form">
        <label className="pm-field">
          <span>Người gửi</span>
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            {opts.map((p, i) => <option key={i} value={String(i)}>{p.relation ? `${p.relation} · ` : ''}{p.name}</option>)}
            <option value="other">Người khác…</option>
          </select>
        </label>
        {who === 'other' && (
          <div className="pm-row">
            <label className="pm-field is-sm"><span>Là</span><select value={otherRel} onChange={(e) => setOtherRel(e.target.value)}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
            <label className="pm-field"><span>Họ tên</span><input value={otherName} onChange={(e) => setOtherName(e.target.value)} maxLength={80} placeholder="VD: Nguyễn Thị Lan" /></label>
          </div>
        )}
        {kind === 'leave' && (
          <div className="pm-row">
            <label className="pm-field"><span><CalendarDays aria-hidden="true" /> Nghỉ từ ngày</span><input type="date" value={from} min={addDays(today, -7)} max={addDays(today, 60)} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} /></label>
            <label className="pm-field"><span>Đến hết ngày</span><input type="date" value={to} min={from} max={addDays(from, 14)} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        )}
        <label className="pm-field">
          <span>Nội dung</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} placeholder={kind === 'leave' ? 'Lý do xin nghỉ…' : 'Gia đình muốn hỏi cô…'} />
        </label>
        <div className="pm-quick">{quick.map((q) => <button key={q} type="button" onClick={() => setBody(q)}>{q}</button>)}</div>
        {err && <p className="adm-alert is-error" role="alert">{err}</p>}
        {sent && <p className="adm-alert is-ok" role="status">Đã gửi tin nhắn cho {co}. Lời trả lời sẽ hiện ngay bên dưới.</p>}
        <button type="button" className="btn btn-primary pm-send" onClick={() => void send()} disabled={busy || initial === null}><Send aria-hidden="true" /> {busy ? 'Đang gửi…' : kind === 'leave' ? 'Gửi xin phép' : 'Gửi tin nhắn'}</button>
      </div>

      {list.length > 0 && (
        <div className="pm-hist">
          <h3>Tin đã gửi</h3>
          <ul>{list.map((m) => (
            <li key={m.id} className={`is-${m.status}`}>
              <div className="pm-hd"><b>{KIND_ICON[m.kind]} {KIND_LABEL[m.kind]}{m.kind === 'leave' && ` · ${leaveRange(m)}`}</b><span className={`pm-st is-${m.status}`}>{STATUS_TEXT[m.status]}</span></div>
              <p>{m.body}</p>
              <small>{senderLabel(m)} · {ago(m.created_at)}</small>
              {m.reply && <div className="pm-reply"><b>Cô trả lời{m.replied_at ? ` · ${ago(m.replied_at)}` : ''}:</b> {m.reply}</div>}
            </li>
          ))}</ul>
        </div>
      )}
    </section>
  );
}
