'use client';

// Họp phụ huynh: mỗi buổi có Thư mời (chép gửi Zalo / in phiếu cho từng em), Điểm danh phụ huynh, Biên bản (in / lưu PDF).
// Lưu trong class_tool_state (tool = 'hop-ph', migration 0077); chỉ giáo viên của lớp đọc/ghi.
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CalendarPlus, ClipboardCheck, Copy, FileText, Mail, Megaphone, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { saveLabel, schoolYear, uid, useClassTool } from '@/lib/classroom/use-class-tool';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/ct.css';
import '@/styles/hop.css';

type Meeting = {
  id: string; title: string; date: string; time: string; place: string; agenda: string;
  attended: string[]; chair: string; secretary: string; opinions: string; conclusion: string;
  /** thư mời giáo viên đã sửa tay; '' = tự ghép từ thông tin buổi họp */
  invite: string;
};
type State = { meetings: Meeting[] };
type Tab = 'moi' | 'diem-danh' | 'bien-ban';

const PRESETS = ['Họp phụ huynh đầu năm học', 'Họp phụ huynh cuối học kỳ I', 'Họp phụ huynh cuối năm học'];
const AGENDA: Record<string, string> = {
  'Họp phụ huynh đầu năm học': 'Giới thiệu giáo viên chủ nhiệm, nội quy lớp\nKế hoạch năm học và cách theo dõi việc học của con\nBầu Ban đại diện cha mẹ học sinh lớp\nCác khoản đóng góp tự nguyện (nếu có)\nÝ kiến phụ huynh',
  'Họp phụ huynh cuối học kỳ I': 'Kết quả học tập, rèn luyện học kỳ I của lớp\nNhững em tiến bộ, những em cần phối hợp kèm thêm\nKế hoạch học kỳ II\nÝ kiến phụ huynh',
  'Họp phụ huynh cuối năm học': 'Tổng kết năm học, khen thưởng\nHướng dẫn ôn tập, sinh hoạt hè\nChuẩn bị cho năm học mới\nÝ kiến phụ huynh',
};
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d: string) => (d ? d.split('-').reverse().join('/') : '…/…/……');
const blank = (title: string): Meeting => ({ id: uid(), title, date: today(), time: '07:30', place: '', agenda: AGENDA[title] ?? '', attended: [], chair: '', secretary: '', opinions: '', conclusion: '', invite: '' });
const norm = (raw: Partial<State> | null): State => ({ meetings: Array.isArray(raw?.meetings) ? raw.meetings.map((m) => ({ ...blank(''), ...m })) : [] });

export default function ParentMeetings({ classId, className, teacher, students }: { classId: string; className: string; teacher: string; students: { id: string; name: string }[] }) {
  const { data, update, loaded, missing, save } = useClassTool<State>(classId, 'hop-ph', { meetings: [] }, norm);
  const [curId, setCurId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('moi');
  const router = useRouter();
  const [flash, setFlash] = useState('');
  const [printing, setPrinting] = useState<'moi' | 'bien-ban' | null>(null);
  const cur = data.meetings.find((m) => m.id === curId) ?? data.meetings[0] ?? null;

  // patch dạng hàm đọc bản mới nhất → bấm nhanh nhiều tên khi điểm danh không bị mất lượt
  const set = (patch: Partial<Meeting> | ((m: Meeting) => Partial<Meeting>)) => cur && update((s) => ({ meetings: s.meetings.map((m) => (m.id === cur.id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) }));
  const add = (title: string) => { const m = blank(title); update((s) => ({ meetings: [m, ...s.meetings] })); setCurId(m.id); setTab('moi'); };
  const remove = () => { if (!cur || !window.confirm(`Xoá buổi "${cur.title}"? Không khôi phục được.`)) return; update((s) => ({ meetings: s.meetings.filter((m) => m.id !== cur.id) })); setCurId(null); };
  const copy = async (text: string, ok: string) => { try { await navigator.clipboard.writeText(text); setFlash(ok); } catch { setFlash('Máy chưa cho chép — bôi đen rồi chép tay.'); } };
  const print = (what: 'moi' | 'bien-ban') => { setPrinting(what); window.setTimeout(() => { window.print(); setPrinting(null); }, 60); };

  const present = useMemo(() => new Set(cur?.attended ?? []), [cur]);
  const absent = students.filter((s) => !present.has(s.id));
  const agendaLines = (cur?.agenda ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const autoInvite = cur ? [
    `THƯ MỜI ${cur.title.toUpperCase()}`,
    `Kính gửi: Quý phụ huynh học sinh lớp ${className}`,
    // tên buổi đã có "năm học" (vd "đầu năm học") thì không lặp "năm học" lần nữa
    `GVCN lớp ${className} trân trọng kính mời Quý phụ huynh đến dự ${cur.title.toLowerCase()}${/năm học$/i.test(cur.title.trim()) ? ' ' : ' năm học '}${schoolYear()}.`,
    `⏰ Thời gian: ${cur.time || '…'} ngày ${fmt(cur.date)}`,
    `📍 Địa điểm: ${cur.place || '…'}`,
    agendaLines.length ? `Nội dung:\n${agendaLines.map((l) => `- ${l}`).join('\n')}` : '',
    'Rất mong Quý phụ huynh sắp xếp thời gian đến dự đầy đủ, đúng giờ. Trân trọng!',
    teacher ? `GVCN: ${teacher}` : '',
  ].filter(Boolean).join('\n') : '';
  const invite = cur?.invite.trim() ? cur.invite : autoInvite;
  // Một dòng cho "Việc chung hôm nay" ở Sổ lớp → Tin nhắn phụ huynh → Gửi cả lớp
  const toNotice = () => {
    if (!cur) return;
    const line = `Mời phụ huynh dự ${cur.title.toLowerCase()} lúc ${cur.time || '…'} ngày ${fmt(cur.date)}${cur.place.trim() ? ` tại ${cur.place.trim()}` : ''}.`;
    try { sessionStorage.setItem(`so-lop:them-viec:${classId}`, line); } catch { setFlash('Trình duyệt chặn lưu tạm — hãy chép thư mời rồi dán vào Sổ lớp.'); return; }
    router.push(`/giao-vien/lop/${classId}/so-lop?tab=tin-nhan`);
  };

  return (
    <div className="ct hop">
      <div className="ct-head no-print">
        <div>
          <p className="ct-sub">Lớp {className} · năm học {schoolYear()} · {students.length} em</p>
          <h1>Họp phụ huynh</h1>
        </div>
        <span className={`ct-save is-${save}`} aria-live="polite">{saveLabel(save)}</span>
      </div>
      {missing && <p className="adm-alert is-warn no-print">Chưa chạy migration <code>0077_hop_ph_chu_nhiem_len_lop.sql</code> trên Supabase nên chưa lưu lại được.</p>}
      {flash && <p className="adm-alert is-ok no-print" role="status" onClick={() => setFlash('')}>{flash}</p>}

      <div className="hop-new no-print">
        <span><CalendarPlus aria-hidden="true" /> Thêm buổi họp:</span>
        {PRESETS.map((t) => <button key={t} type="button" className="mini-btn" onClick={() => add(t)}>{t.replace('Họp phụ huynh ', '')}</button>)}
        <button type="button" className="mini-btn" onClick={() => add('Họp phụ huynh')}>Buổi khác</button>
      </div>

      {!loaded ? <p className="dash-muted">Đang tải…</p> : !cur ? (
        <p className="dash-muted hop-empty">Chưa có buổi họp nào. Bấm “đầu năm học” để có sẵn thư mời và nội dung mẫu.</p>
      ) : (
        <>
          {data.meetings.length > 1 && (
            <div className="hop-list no-print" role="tablist" aria-label="Các buổi họp">
              {data.meetings.map((m) => (
                <button key={m.id} type="button" role="tab" aria-selected={m.id === cur.id} className={m.id === cur.id ? 'is-on' : ''} onClick={() => setCurId(m.id)}>
                  <b>{m.title.replace('Họp phụ huynh ', '') || 'Buổi họp'}</b><small>{fmt(m.date)} · {m.attended.length}/{students.length} PH</small>
                </button>
              ))}
            </div>
          )}

          <section className="dash-card hop-card no-print">
            <div className="hop-grid">
              <label className="hop-wide">Tên buổi họp<input value={cur.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /></label>
              <label>Ngày<input type="date" value={cur.date} onChange={(e) => set({ date: e.target.value })} /></label>
              <label>Giờ<input type="time" value={cur.time} onChange={(e) => set({ time: e.target.value })} /></label>
              <label className="hop-wide">Địa điểm<input value={cur.place} maxLength={120} placeholder={`Phòng học lớp ${className}`} onChange={(e) => set({ place: e.target.value })} /></label>
            </div>
            <div className="ct-seg hop-tabs" role="tablist" aria-label="Phần của buổi họp">
              <button type="button" role="tab" aria-selected={tab === 'moi'} className={tab === 'moi' ? 'is-on' : ''} onClick={() => setTab('moi')}><Mail aria-hidden="true" /> Thư mời</button>
              <button type="button" role="tab" aria-selected={tab === 'diem-danh'} className={tab === 'diem-danh' ? 'is-on' : ''} onClick={() => setTab('diem-danh')}><ClipboardCheck aria-hidden="true" /> Điểm danh {cur.attended.length}/{students.length}</button>
              <button type="button" role="tab" aria-selected={tab === 'bien-ban'} className={tab === 'bien-ban' ? 'is-on' : ''} onClick={() => setTab('bien-ban')}><FileText aria-hidden="true" /> Biên bản</button>
            </div>

            {tab === 'moi' && (
              <div className="hop-pane">
                <label>Nội dung họp (mỗi ý một dòng)<textarea rows={5} value={cur.agenda} maxLength={3000} onChange={(e) => set({ agenda: e.target.value })} /></label>
                <label>Thư mời (sửa thẳng ở đây được)
                  <textarea className="hop-preview" rows={Math.min(16, invite.split('\n').length + 1)} value={invite} maxLength={4000} onChange={(e) => set({ invite: e.target.value })} />
                </label>
                {cur.invite.trim() !== '' && cur.invite !== autoInvite && (
                  <p className="dash-muted hop-hint">Thư mời đã sửa tay — đổi ngày, giờ, nội dung ở trên sẽ không tự cập nhật. <button type="button" className="mini-btn" onClick={() => set({ invite: '' })}><RotateCcw aria-hidden="true" /> Tạo lại theo thông tin trên</button></p>
                )}
                <div className="hop-acts">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy(invite, 'Đã chép thư mời — dán vào nhóm Zalo lớp.')}><Copy aria-hidden="true" /> Chép gửi nhóm Zalo</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={toNotice}><Megaphone aria-hidden="true" /> Đưa vào thông báo chung (Sổ lớp)</button>
                  <button type="button" className="btn btn-outline btn-sm" disabled={!students.length} onClick={() => print('moi')}><Printer aria-hidden="true" /> In phiếu mời từng em ({students.length})</button>
                </div>
              </div>
            )}

            {tab === 'diem-danh' && (
              <div className="hop-pane">
                <p className="dash-muted">Chạm vào tên khi phụ huynh của em đến dự. Có mặt <b>{cur.attended.length}</b>/{students.length}.</p>
                <div className="hop-acts">
                  <button type="button" className="mini-btn" onClick={() => set({ attended: students.map((s) => s.id) })}>Đủ cả lớp</button>
                  <button type="button" className="mini-btn" onClick={() => set({ attended: [] })}>Bỏ chọn hết</button>
                  <button type="button" className="mini-btn" disabled={!absent.length} onClick={() => void copy(`PH chưa dự ${cur.title.toLowerCase()} (${fmt(cur.date)}): ${absent.map((s) => s.name).join(', ')}`, `Đã chép ${absent.length} em có phụ huynh vắng.`)}><Copy aria-hidden="true" /> Chép DS vắng ({absent.length})</button>
                </div>
                <ul className="hop-roll">
                  {students.map((s, i) => {
                    const on = present.has(s.id);
                    return (
                      <li key={s.id}>
                        <button type="button" aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => set((m) => ({ attended: m.attended.includes(s.id) ? m.attended.filter((x) => x !== s.id) : [...m.attended, s.id] }))}>
                          <span className="hop-no">{i + 1}</span>{s.name}<span className="hop-mark" aria-hidden="true">{on ? '✓' : ''}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {tab === 'bien-ban' && (
              <div className="hop-pane">
                <div className="hop-grid">
                  <label>Chủ trì<input value={cur.chair} maxLength={80} placeholder={teacher || 'GVCN'} onChange={(e) => set({ chair: e.target.value })} /></label>
                  <label>Thư ký<input value={cur.secretary} maxLength={80} placeholder="Đại diện cha mẹ học sinh" onChange={(e) => set({ secretary: e.target.value })} /></label>
                </div>
                <label>Ý kiến phụ huynh<textarea rows={5} value={cur.opinions} maxLength={6000} placeholder="Mỗi ý kiến một dòng, vd: PH em An đề nghị…" onChange={(e) => set({ opinions: e.target.value })} /></label>
                <label>Kết luận, thống nhất<textarea rows={4} value={cur.conclusion} maxLength={4000} onChange={(e) => set({ conclusion: e.target.value })} /></label>
                <div className="hop-acts">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => print('bien-ban')}><Printer aria-hidden="true" /> In / lưu PDF biên bản</button>
                </div>
              </div>
            )}
          </section>
          <p className="no-print hop-del"><button type="button" className="mini-btn is-danger" onClick={remove}><Trash2 aria-hidden="true" /> Xoá buổi họp này</button></p>

          {printing === 'moi' && createPortal(
            <div className="hop-print hop-slips">
              {students.map((s) => (
                <article key={s.id} className="hop-slip">
                  <h2>THƯ MỜI</h2>
                  <p>Kính gửi: Phụ huynh em <b>{s.name}</b> — lớp {className}</p>
                  <p>GVCN trân trọng kính mời Quý phụ huynh đến dự <b>{cur.title.toLowerCase()}</b>.</p>
                  <p>Thời gian: <b>{cur.time} ngày {fmt(cur.date)}</b> · Địa điểm: <b>{cur.place || '……………'}</b></p>
                  {agendaLines.length > 0 && <p>Nội dung: {agendaLines.join('; ')}.</p>}
                  <p className="hop-sign">GVCN{teacher ? `: ${teacher}` : ''}</p>
                </article>
              ))}
            </div>, document.body,
          )}
          {printing === 'bien-ban' && createPortal(
            <article className="hop-print hop-doc">
              <p className="hop-nation"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br /><b>Độc lập – Tự do – Hạnh phúc</b></p>
              <h2>BIÊN BẢN {cur.title.toUpperCase()}</h2>
              <p className="hop-c">Lớp {className} — Năm học {schoolYear()}</p>
              <p><b>1. Thời gian:</b> {cur.time} ngày {fmt(cur.date)}. <b>Địa điểm:</b> {cur.place || '……………'}</p>
              <p><b>2. Thành phần:</b> Chủ trì: {cur.chair || teacher || '……………'}. Thư ký: {cur.secretary || '……………'}.<br />
                Phụ huynh có mặt: {cur.attended.length}/{students.length}. {absent.length > 0 && <>Vắng: {absent.map((s) => s.name).join(', ')}.</>}</p>
              <p><b>3. Nội dung:</b></p>
              <ol>{agendaLines.map((l, i) => <li key={i}>{l}</li>)}</ol>
              <p><b>4. Ý kiến phụ huynh:</b></p>
              <p className="hop-pre">{cur.opinions || '……………………………………………'}</p>
              <p><b>5. Kết luận, thống nhất:</b></p>
              <p className="hop-pre">{cur.conclusion || '……………………………………………'}</p>
              <p>Buổi họp kết thúc lúc …… giờ …… cùng ngày. Biên bản đã được thông qua trước hội nghị.</p>
              <div className="hop-sigs"><div><b>THƯ KÝ</b><br /><br /><br />{cur.secretary}</div><div><b>CHỦ TRÌ</b><br /><br /><br />{cur.chair || teacher}</div></div>
            </article>, document.body,
          )}
        </>
      )}
    </div>
  );
}
