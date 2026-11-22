'use client';

// Sổ lớp hằng ngày: điểm danh + ghi chú nhanh từng em, tin nhắn phụ huynh soạn sẵn (sao chép dán Zalo), tổng hợp tháng.
// Lưu lên Supabase qua các hàm teacher_diary_* (migration 0026); tự lưu sau mỗi thay đổi.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, MessageCircle, Pencil, RefreshCw, RotateCcw, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import { zaloHref } from '@/lib/classroom/class-tools';
import ZaloGroupLink from '@/components/classroom/ZaloGroupLink';
import {
  PRAISE_TAGS, REMIND_TAGS, STATUS_LABEL, alertsOf, dayLabel, emptyEntry, isMarked, isPraise, kindsOf, messageFor, monthSheet,
  shiftDay, summarize, todayIso, type Entry, type MessageKind, type Pronoun, type RangeData, type Status, type Student,
} from '@/lib/classroom/diary';
import '@/styles/adm.css';
import '@/styles/callon.css';
import '@/styles/diary.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';

type Tab = 'day' | 'msg' | 'month';
type DayData = { saved_at: string | null; announcement: string | null; entries: { student_id: string; status: Status; tags: string[]; note: string | null; copied: boolean; msg_text?: string | null; hidden?: boolean }[] };

const MISSING = 'Chưa bật Sổ lớp: hãy chạy supabase/migrations/0026_class_diary.sql trên Supabase.';
const MISSING_MSG = 'Chưa lưu được tin nhắn đã sửa / xoá: hãy chạy supabase/migrations/0057_diary_msg_edit.sql trên Supabase.';
const errText = (m: string) => (/function|schema cache/i.test(m) ? MISSING : /invalid_day/.test(m) ? 'Không lưu được ngày này (chỉ lưu đến ngày mai).' : 'Chưa lưu được. Kiểm tra mạng rồi thử lại.');
const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    } catch { return false; }
  }
}

export default function ClassDiary({ classId, className, students, initialTab = 'day', initialSelected }: { classId: string; className: string; students: Student[]; initialTab?: Tab; /** mở sẵn ghi chú của em này (từ ô tìm nhanh) */ initialSelected?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [day, setDay] = useState(todayIso());
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [announcement, setAnnouncement] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'idle' | 'dirty' | 'saving'>('loading');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(initialSelected && students.some((x) => x.id === initialSelected) ? initialSelected : null);
  const [pronoun, setPronoun] = useState<Pronoun>('co');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<'all' | MessageKind>('all');
  const [flash, setFlash] = useState('');
  // số Zalo phụ huynh (Danh bạ phụ huynh, migration 0028) — chỉ tải khi mở thẻ Tin nhắn; chưa có migration thì bỏ qua
  const [phones, setPhones] = useState<Record<string, string> | null>(null);

  useEffect(() => { try { const p = localStorage.getItem('so-lop:xung-ho'); if (p === 'thay' || p === 'co') setPronoun(p); } catch { /* bỏ qua */ } }, []);
  const choosePronoun = (p: Pronoun) => { setPronoun(p); try { localStorage.setItem('so-lop:xung-ho', p); } catch { /* bỏ qua */ } };

  useEffect(() => {
    if (tab !== 'msg' || phones) return;
    void supabase.rpc('teacher_contacts', { p_class: classId }).then(({ data, error: e }) => {
      const m: Record<string, string> = {};
      // Ưu tiên số Zalo phụ huynh khai (migration 0031), không có thì dùng số điện thoại
      if (!e) ((data ?? []) as { student_id: string; phone: string; zalo?: string | null }[]).forEach((c) => { m[c.student_id] ??= c.zalo || c.phone; });
      setPhones(m);
    });
  }, [tab, phones, supabase, classId]);

  /* ---------------------------------------------------------- đọc một ngày */
  const load = useCallback(async (d: string) => {
    setState('loading'); setError(''); setEditing(null);
    const { data, error: e } = await supabase.rpc('teacher_diary_day', { p_class: classId, p_day: d });
    if (e) { setError(errText(e.message)); setEntries({}); setSavedAt(null); setAnnouncement(''); setState('idle'); return; }
    const v = data as DayData;
    setEntries(Object.fromEntries(v.entries.map((x) => [x.student_id, { status: x.status, tags: x.tags ?? [], note: x.note ?? '', copied: x.copied, msgText: x.msg_text ?? null, hidden: !!x.hidden }])));
    setAnnouncement(v.announcement ?? '');
    setSavedAt(v.saved_at);
    setState('idle');
  }, [supabase, classId]);
  useEffect(() => { void load(day); }, [day, load]);

  /* ---------------------------------------------------------- tự lưu */
  const latest = useRef({ entries, announcement, day });
  latest.current = { entries, announcement, day };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const { entries: en, announcement: an, day: d } = latest.current;
    setState('saving');
    const payload = Object.entries(en).filter(([, e]) => isMarked(e)).map(([id, e]) => ({ student_id: id, status: e.status, tags: e.tags, note: e.note }));
    const { data, error: e } = await supabase.rpc('teacher_diary_save', { p_class: classId, p_day: d, p_entries: payload, p_announcement: an });
    if (e) { setError(errText(e.message)); setState('dirty'); return; }
    setError(''); setSavedAt(data as string); setState((s) => (s === 'saving' ? 'idle' : s));
  }, [supabase, classId]);
  const touch = () => { setState('dirty'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void save(); }, 700); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const goDay = async (d: string) => { if (state === 'dirty') await save(); setSelected(null); setDay(d); };

  const changeAnnouncement = (v: string) => { setAnnouncement(v); touch(); };

  // Việc chung chuyển từ trang khác (vd Họp phụ huynh → "Đưa vào thông báo chung"): thêm vào hôm nay sau khi sổ đã tải xong
  // Giữ trong ref tới khi bản đã lưu có dòng này: nếu sổ tải lại (ghi đè announcement) thì thêm lại, không mất.
  const pending = useRef<string | null>(null);
  const pendingNoted = useRef(false);
  useEffect(() => {
    // chỉ ghi khi có giá trị: effect chạy 2 lần (StrictMode) thì lần sau không xoá mất dòng đã đọc
    try { const k = `so-lop:them-viec:${classId}`; const v = (sessionStorage.getItem(k) ?? '').trim(); if (v) { pending.current = v; sessionStorage.removeItem(k); } } catch { /* bỏ qua */ }
  }, [classId]);
  useEffect(() => {
    const t = pending.current;
    if (!t || state !== 'idle' || day !== todayIso()) return;
    if (announcement.split('\n').some((x) => x.trim() === t)) {
      if (!pendingNoted.current) setFlash('Lời mời này đã có trong thông báo chung hôm nay.');
      pending.current = null; // đã nằm trong bản đã lưu
      return;
    }
    if (announcement.length + t.length + 1 > 1500) { pending.current = null; setFlash('Thông báo chung đã quá dài — xoá bớt việc cũ rồi thêm lại.'); return; }
    setAnnouncement(announcement ? `${announcement}\n${t}` : t); touch();
    if (!pendingNoted.current) setFlash('Đã thêm vào “Việc chung hôm nay” — bấm Sao chép thông báo để gửi nhóm Zalo.');
    pendingNoted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy lại mỗi khi sổ hôm nay tải/lưu xong
  }, [state, day, announcement]);
  const update = (id: string, f: (e: Entry) => Entry) => { setEntries((x) => ({ ...x, [id]: f(x[id] ?? emptyEntry()) })); touch(); };
  const setStatus = (id: string, status: Status) => update(id, (e) => ({ ...e, status }));
  const toggleTag = (id: string, t: string) => update(id, (e) => ({ ...e, tags: e.tags.includes(t) ? e.tags.filter((x) => x !== t) : [...e.tags, t] }));

  /* ---------------------------------------------------------- số liệu hôm nay */
  const absent = students.filter((s) => (entries[s.id]?.status ?? 'present') !== 'present');
  const unexcused = absent.filter((s) => entries[s.id]?.status === 'unexcused').length;
  const notes = students.filter((s) => (entries[s.id]?.tags.length ?? 0) > 0 || (entries[s.id]?.note.trim() ?? '') !== '').length;
  const sel = students.find((s) => s.id === selected) ?? null;
  const selIndex = sel ? students.indexOf(sel) : -1;
  const selEntry = sel ? entries[sel.id] ?? emptyEntry() : null;

  /* ---------------------------------------------------------- tin nhắn */
  // Tin nhắn = bản thầy cô đã sửa (nếu có), không thì bản app tự viết. Em không có điểm danh / ghi chú thì không có tin.
  const allMsgs = students.map((s) => {
    const e = entries[s.id];
    const auto = messageFor(s, e, day, pronoun);
    return { s, e, auto, text: auto ? e?.msgText || auto : null, custom: !!(auto && e?.msgText), kinds: kindsOf(e) };
  }).filter((m) => m.text);
  const messages = allMsgs.filter((m) => !m.e?.hidden);
  const hiddenMsgs = allMsgs.filter((m) => m.e?.hidden);
  const shown = filter === 'all' ? messages : messages.filter((m) => m.kinds.includes(filter));
  /** Lưu tin đã sửa / xoá / khôi phục của một em (migration 0057). Cập nhật giao diện trước, lỗi thì báo. */
  const setMsg = async (id: string, text: string | null, hidden: boolean, ok: string) => {
    const prev = entries[id];
    const clean = text?.trim() || null;
    setEntries((x) => {
      const cur = x[id] ?? emptyEntry();
      return { ...x, [id]: { ...cur, msgText: clean, hidden, copied: (cur.msgText ?? null) !== clean ? false : cur.copied } };
    });
    setFlash(ok);
    const { error: e } = await supabase.rpc('teacher_diary_msg', { p_class: classId, p_day: day, p_student: id, p_text: clean, p_hidden: hidden });
    if (e) {
      setEntries((x) => ({ ...x, [id]: prev ?? emptyEntry() }));
      setFlash('');
      setError(/function|schema cache|column/i.test(e.message) ? MISSING_MSG : errText(e.message));
    }
  };
  const startEdit = (id: string, text: string) => { setEditing(id); setDraft(text); };
  const saveEdit = (id: string, auto: string) => { setEditing(null); void setMsg(id, draft.trim() === auto.trim() ? null : draft, false, 'Đã lưu tin nhắn đã sửa.'); };
  const count = (k: MessageKind) => messages.filter((m) => m.kinds.includes(k)).length;
  const copyOne = async (id: string, text: string) => {
    if (!(await copyText(text))) { setFlash('Trình duyệt chặn sao chép — bôi đen tin nhắn rồi bấm Ctrl+C.'); return; }
    setEntries((x) => ({ ...x, [id]: { ...(x[id] ?? emptyEntry()), copied: true } }));
    setFlash('Đã sao chép — dán vào Zalo của phụ huynh.');
    const { error: e } = await supabase.rpc('teacher_diary_copied', { p_class: classId, p_day: day, p_student: id });
    if (e) setError(errText(e.message));
  };
  const me = pronoun === 'thay' ? 'Thầy' : 'Cô';
  const classNotice = [
    `Thông báo lớp ${className} – ${dayLabel(day).replace(/^[^,]+, /, '').slice(0, 5)}`,
    `• Hôm nay lớp có ${students.length - absent.length}/${students.length} em đi học.`,
    ...announcement.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => (l.startsWith('•') ? l : `• ${l}`)),
    `${me} cảm ơn phụ huynh ạ.`,
  ].join('\n');

  /* ---------------------------------------------------------- tổng hợp tháng */
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [range, setRange] = useState<RangeData | null>(null);
  const [rangeErr, setRangeErr] = useState('');
  useEffect(() => {
    if (tab !== 'month') return;
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    void supabase.rpc('teacher_diary_range', { p_class: classId, p_from: `${month}-01`, p_to: `${month}-${String(last).padStart(2, '0')}` }).then(({ data, error: e }) => {
      if (e) { setRangeErr(errText(e.message)); setRange(null); return; }
      setRangeErr(''); setRange(data as RangeData);
    });
  }, [tab, month, supabase, classId, savedAt]);
  const sum = useMemo(() => (range ? summarize(students, range) : null), [range, students]);
  const alerts = useMemo(() => (sum ? alertsOf(sum.rows) : []), [sum]);
  const monthLabel = `Tháng ${Number(month.slice(5))}/${month.slice(0, 4)}`;
  const shiftMonth = (n: number) => { const [y, m] = month.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const totalSessions = sum ? sum.days.length * students.length : 0;
  const totalAbs = sum ? sum.rows.reduce((a, r) => a + r.excused + r.unexcused, 0) : 0;
  const totalUnex = sum ? sum.rows.reduce((a, r) => a + r.unexcused, 0) : 0;

  const saveLabel = state === 'saving' ? 'Đang lưu…' : state === 'dirty' ? 'Chưa lưu' : savedAt ? `✓ Đã lưu lúc ${hhmm(savedAt)}` : state === 'loading' ? 'Đang tải…' : 'Chưa điểm danh ngày này';

  if (!students.length) return <section className="dash-card"><h1>Sổ lớp hằng ngày</h1><p className="dash-muted">Lớp {className} chưa có học sinh. Thêm học sinh ở trang quản lý lớp trước nhé.</p></section>;

  return (
    <div className="diary">
      <div className="diary-head">
        <div><h1>Sổ lớp hằng ngày</h1><p>Lớp {className} · {students.length} học sinh</p></div>
        <nav className="diary-tabs" aria-label="Sổ lớp">
          {([['day', '✅ Điểm danh & ghi chú'], ['msg', `💬 Tin nhắn phụ huynh${messages.length ? ` (${messages.length})` : ''}`], ['month', '📊 Tổng hợp tháng']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </nav>
      </div>

      {tab !== 'month' && (
        <div className="diary-bar">
          <div className="diary-date">
            <button type="button" aria-label="Ngày trước" onClick={() => void goDay(shiftDay(day, -1))}><ChevronLeft aria-hidden="true" /></button>
            <label><span className="sr-only">Chọn ngày</span><input type="date" value={day} max={shiftDay(todayIso(), 1)} onChange={(e) => e.target.value && void goDay(e.target.value)} /></label>
            <b>{dayLabel(day)}</b>
            <button type="button" aria-label="Ngày sau" disabled={day >= shiftDay(todayIso(), 1)} onClick={() => void goDay(shiftDay(day, 1))}><ChevronRight aria-hidden="true" /></button>
          </div>
          {day !== todayIso() && <button type="button" className="diary-pill" onClick={() => void goDay(todayIso())}>Hôm nay</button>}
          <span className="diary-pill is-green">Có mặt {students.length - absent.length}</span>
          <span className={`diary-pill${absent.length ? ' is-red' : ''}`}>Vắng {absent.length}{unexcused ? ` · ${unexcused} không phép` : ''}</span>
          <span className={`diary-pill${notes ? ' is-amber' : ''}`}>{notes} ghi chú</span>
          <span className={`diary-saved${state === 'dirty' ? ' is-dirty' : ''}`} role="status">{saveLabel}</span>
        </div>
      )}
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}

      {/* ====================================================== ĐIỂM DANH */}
      {tab === 'day' && (
        <div className="diary-grid">
          <section className="dash-card diary-roster-card">
            <h2>Điểm danh</h2>
            <p className="dash-muted">Mặc định cả lớp có mặt. Bấm vào tên em vắng hoặc em cần ghi chú.{!savedAt && state === 'idle' ? ' Bấm "Lưu: cả lớp có mặt" nếu hôm nay không em nào vắng.' : ''}</p>
            {!savedAt && state === 'idle' && <button type="button" className="btn btn-yellow btn-sm diary-allin" onClick={() => void save()}>✓ Lưu: cả lớp có mặt</button>}
            <ol className="diary-roster">
              {students.map((s, i) => {
                const e = entries[s.id];
                const st = e?.status ?? 'present';
                return (
                  <li key={s.id} className={`diary-st${st !== 'present' ? ` is-${st}` : ''}${selected === s.id ? ' is-sel' : ''}`}>
                    <button type="button" className="diary-st-main" onClick={() => setSelected(s.id)} aria-label={`${s.name}: ${STATUS_LABEL[st]}${e?.tags.length ? `, ${e.tags.join(', ')}` : ''}`}>
                      <span className="diary-st-name"><em>{i + 1}</em>{s.name}</span>
                      <span className="diary-st-tags">
                        {st !== 'present' && <span className={`diary-ab is-${st}`}>{STATUS_LABEL[st]}</span>}
                        {e?.tags.map((t) => <span key={t} className={`diary-tag${isPraise(t) ? ' is-praise' : ' is-remind'}`}>{t}</span>)}
                        {e?.note.trim() ? <span className="diary-tag is-note">✎ ghi chú</span> : null}
                      </span>
                    </button>
                    <span className="diary-quick" role="group" aria-label={`Điểm danh ${s.name}`}>
                      {(['present', 'excused', 'unexcused'] as Status[]).map((k) => (
                        <button key={k} type="button" className={`q-${k}`} aria-pressed={st === k} aria-label={STATUS_LABEL[k]} onClick={() => setStatus(s.id, k)}>{k === 'present' ? '✓' : k === 'excused' ? 'P' : 'K'}</button>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="dash-muted diary-legend">Trên điện thoại: ✓ có mặt · P vắng có phép · K vắng không phép · bấm tên để ghi chú.</p>
          </section>

          <aside className={`dash-card diary-panel${sel ? ' is-open' : ''}`} aria-label="Ghi chú cho em đang chọn">
            {!sel || !selEntry ? (
              <div className="diary-panel-empty">
                <p className="dash-muted">Bấm tên một em để điểm danh và ghi chú.</p>
                <AnnouncementList value={announcement} onChange={changeAnnouncement} />
                <AnnouncementHistory supabase={supabase} classId={classId} day={day} />
              </div>
            ) : (
              <>
                <div className="diary-panel-top">
                  <div><p className="dash-muted">Đang chọn · số {selIndex + 1}</p><h3>{sel.name}</h3></div>
                  <button type="button" className="callon-close" aria-label="Đóng" onClick={() => setSelected(null)}><X aria-hidden="true" /></button>
                </div>
                <div className="diary-seg" role="group" aria-label="Điểm danh">
                  {(['present', 'excused', 'unexcused'] as Status[]).map((k) => (
                    <button key={k} type="button" className={`q-${k}`} aria-pressed={selEntry.status === k} onClick={() => setStatus(sel.id, k)}>{k === 'present' ? '✓ Có mặt' : STATUS_LABEL[k]}</button>
                  ))}
                </div>
                <p className="diary-sec">Khen</p>
                <div className="diary-chips">{PRAISE_TAGS.map((t) => <button key={t} type="button" className="diary-chip is-praise" aria-pressed={selEntry.tags.includes(t)} onClick={() => toggleTag(sel.id, t)}>{t}</button>)}</div>
                <p className="diary-sec">Cần nhắc</p>
                <div className="diary-chips">{REMIND_TAGS.map((t) => <button key={t} type="button" className="diary-chip is-remind" aria-pressed={selEntry.tags.includes(t)} onClick={() => toggleTag(sel.id, t)}>{t}</button>)}</div>
                <label className="diary-sec" htmlFor="diary-note">Ghi thêm (không bắt buộc)</label>
                <textarea id="diary-note" className="diary-note" rows={3} maxLength={500} value={selEntry.note} placeholder={selEntry.status === 'present' ? 'Vd: Đọc trơn cả đoạn văn bài 8' : 'Vd: Ốm, mẹ đã xin phép'} onChange={(e) => update(sel.id, (x) => ({ ...x, note: e.target.value }))} />
                <div className="diary-nav">
                  <button type="button" className="btn btn-outline" disabled={selIndex <= 0} onClick={() => setSelected(students[selIndex - 1]?.id ?? null)}>‹ Em trước</button>
                  <button type="button" className="btn btn-yellow" onClick={() => setSelected(students[selIndex + 1]?.id ?? null)}>{selIndex < students.length - 1 ? 'Em sau ›' : 'Xong'}</button>
                </div>
              </>
            )}
          </aside>
          <div className="diary-mobile-bar">
            <button type="button" className="btn btn-outline" onClick={() => setTab('msg')}>💬 Tin nhắn ({messages.length})</button>
            <button type="button" className="btn btn-yellow" onClick={() => void save()}>{savedAt && state === 'idle' ? '✓ Đã lưu' : '✓ Lưu'}</button>
          </div>
        </div>
      )}

      {/* ====================================================== TIN NHẮN */}
      {tab === 'msg' && (
        <div className="diary-grid">
          <section className="dash-card">
            <h2>Tin nhắn soạn sẵn {day === todayIso() ? 'hôm nay' : `ngày ${dayLabel(day).replace(/^[^,]+, /, '')}`}</h2>
            <p className="dash-muted">App viết từ điểm danh và ghi chú. Thầy cô sửa nếu cần, bấm <b>Sao chép</b> rồi dán vào Zalo. App không tự gửi tin nhắn.</p>
            {flash && <p className="adm-alert is-ok" role="status">{flash}</p>}
            <div className="diary-filters" role="group" aria-label="Lọc tin nhắn">
              {([['all', `Tất cả ${messages.length}`], ['absent', `Vắng ${count('absent')}`], ['praise', `Khen ${count('praise')}`], ['remind', `Cần nhắc ${count('remind')}`]] as ['all' | MessageKind, string][]).map(([k, l]) => (
                <button key={k} type="button" className={`diary-pill is-${k}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            {shown.length === 0 ? <p className="dash-muted diary-empty">Chưa có tin nhắn nào. Điểm danh và ghi chú ở thẻ đầu, tin nhắn sẽ hiện ở đây.</p> : (
              <ul className="diary-msgs">
                {shown.map(({ s, e, text, auto, custom }) => (
                  <li key={s.id} className="diary-msg">
                    <div className="diary-msg-who"><b>{s.name}</b><span>{[e && e.status !== 'present' ? STATUS_LABEL[e.status] : '', ...(e?.tags ?? [])].filter(Boolean).join(' · ') || 'Ghi chú'}</span>{custom && <span className="diary-msg-badge">✎ Đã sửa</span>}</div>
                    {editing === s.id ? (
                      <>
                        <textarea className="diary-msg-edit" rows={5} maxLength={1500} value={draft} autoFocus onChange={(ev) => setDraft(ev.target.value)} aria-label={`Sửa tin nhắn cho phụ huynh ${s.name}`} />
                        <div className="diary-msg-act">
                          <button type="button" className="mini-btn is-primary" disabled={!draft.trim()} onClick={() => saveEdit(s.id, auto ?? '')}>✓ Lưu</button>
                          <button type="button" className="mini-btn" onClick={() => setEditing(null)}>Huỷ</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="diary-bubble">{text}</p>
                        <div className="diary-msg-act">
                          <button type="button" className={`mini-btn${e?.copied ? ' is-copied' : ''}`} onClick={() => void copyOne(s.id, text ?? '')}><Copy aria-hidden="true" /> {e?.copied ? 'Đã chép' : 'Sao chép'}</button>
                          {phones?.[s.id] && <a className="mini-btn is-zalo" href={zaloHref(phones[s.id])} target="_blank" rel="noopener noreferrer" onClick={() => void copyOne(s.id, text ?? '')} title="Chép tin nhắn rồi mở Zalo của phụ huynh"><MessageCircle aria-hidden="true" /> Chép & mở Zalo</a>}
                          <button type="button" className="mini-btn" onClick={() => startEdit(s.id, text ?? '')}><Pencil aria-hidden="true" /> Sửa</button>
                          {custom && <button type="button" className="mini-btn" title="Viết lại tin nhắn theo điểm danh & ghi chú mới nhất (bỏ bản đã sửa)" onClick={() => void setMsg(s.id, null, false, 'Đã cập nhật tin nhắn theo ghi chú mới nhất.')}><RefreshCw aria-hidden="true" /> Cập nhật lại</button>}
                          <button type="button" className="mini-btn is-danger" onClick={() => void setMsg(s.id, e?.msgText ?? null, true, `Đã xoá tin nhắn của ${s.name}. Khôi phục ở cuối danh sách.`)}><Trash2 aria-hidden="true" /> Xoá</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {hiddenMsgs.length > 0 && (
              <details className="diary-hidden">
                <summary>Đã xoá {hiddenMsgs.length} tin nhắn</summary>
                <ul>
                  {hiddenMsgs.map(({ s, e }) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      <button type="button" className="mini-btn" onClick={() => void setMsg(s.id, e?.msgText ?? null, false, `Đã khôi phục tin nhắn của ${s.name}.`)}><RotateCcw aria-hidden="true" /> Khôi phục</button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <aside className="dash-card diary-side">
            <h2>Gửi cả lớp</h2>
            <p className="dash-muted">Thông báo chung cho nhóm Zalo lớp. Mỗi việc một dòng; việc hết hạn bấm 🗑 để xoá.</p>
            <AnnouncementList value={announcement} onChange={changeAnnouncement} />
            <AnnouncementHistory supabase={supabase} classId={classId} day={day} />
            <pre className="diary-sample">{classNotice}</pre>
            <button type="button" className="btn btn-primary diary-wide" onClick={() => void copyText(classNotice).then((ok) => setFlash(ok ? 'Đã sao chép thông báo cả lớp.' : 'Trình duyệt chặn sao chép.'))}><Copy aria-hidden="true" /> Sao chép thông báo</button>
            <ZaloGroupLink classId={classId} className={className} notice={classNotice} onCopied={(ok) => setFlash(ok ? 'Đã chép thông báo — dán (Ctrl+V) vào nhóm Zalo vừa mở rồi gửi.' : 'Trình duyệt chặn sao chép.')} />
            <div className="diary-tone" role="group" aria-label="Cách xưng hô">
              <span>Xưng hô:</span>
              <button type="button" className="diary-chip is-praise" aria-pressed={pronoun === 'co'} onClick={() => choosePronoun('co')}>Cô – con</button>
              <button type="button" className="diary-chip is-praise" aria-pressed={pronoun === 'thay'} onClick={() => choosePronoun('thay')}>Thầy – con</button>
            </div>
            <p className="dash-muted">Tin nhắn không chứa điểm số. Tin đã sao chép được đánh dấu để không nhắn trùng.</p>
          </aside>
        </div>
      )}

      {/* ====================================================== TỔNG HỢP THÁNG */}
      {tab === 'month' && (
        <>
          <div className="diary-bar">
            <div className="diary-date">
              <button type="button" aria-label="Tháng trước" onClick={() => shiftMonth(-1)}><ChevronLeft aria-hidden="true" /></button>
              <b>{monthLabel}{sum ? ` · ${sum.days.length} buổi học` : ''}</b>
              <button type="button" aria-label="Tháng sau" disabled={month >= todayIso().slice(0, 7)} onClick={() => shiftMonth(1)}><ChevronRight aria-hidden="true" /></button>
            </div>
            {sum && sum.days.length > 0 && <>
              <span className="diary-pill is-green">Chuyên cần {Math.round(((totalSessions - totalAbs) / Math.max(1, totalSessions)) * 100)}%</span>
              <span className={`diary-pill${totalAbs ? ' is-red' : ''}`}>{totalAbs} buổi vắng · {totalUnex} không phép</span>
            </>}
            <button type="button" className="btn btn-primary btn-sm diary-xlsx" disabled={!sum || !sum.days.length} onClick={() => sum && downloadXlsx(`chuyen-can-lop-${className}-${month}.xlsx`, [monthSheet(className, monthLabel, sum.days, sum.rows)])}><Download aria-hidden="true" /> Tải Excel</button>
          </div>
          {rangeErr && <p className="adm-alert is-error" role="alert">{rangeErr}</p>}
          <div className="diary-grid">
            <section className="dash-card diary-month">
              <h2>Chuyên cần và ghi chú theo tháng</h2>
              {!sum ? <p className="dash-muted">Đang tải…</p> : sum.days.length === 0 ? <p className="dash-muted diary-empty">{monthLabel} chưa có buổi nào được điểm danh.</p> : (
                <>
                  <p className="diary-legend-row"><span><i className="is-present" />Có mặt</span><span><i className="is-excused" />Vắng có phép</span><span><i className="is-unexcused" />Vắng không phép</span></p>
                  <div className="diary-table-wrap">
                    <table className="roster-table diary-table">
                      <thead><tr><th>Học sinh</th><th>Từng buổi</th><th>Có mặt</th><th>Có phép</th><th>Không phép</th><th>★ Khen</th><th>Cần nhắc</th></tr></thead>
                      <tbody>
                        {sum.rows.map((r, i) => (
                          <tr key={r.student.id}>
                            <th scope="row">{i + 1}. {r.student.name}</th>
                            <td><span className="diary-dots" aria-label={`${r.excused + r.unexcused} buổi vắng`}>{sum.days.map((d) => <i key={d} className={`is-${r.byDay[d] ?? 'present'}`} title={`${d.slice(8)}/${d.slice(5, 7)}: ${STATUS_LABEL[r.byDay[d] ?? 'present']}`} />)}</span></td>
                            <td>{r.present}</td><td>{r.excused || '–'}</td><td className={r.unexcused ? 'is-bad' : ''}>{r.unexcused || '–'}</td>
                            <td className={r.praise ? 'is-good' : ''}>{r.praise || '–'}</td><td>{r.remind || '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
            <aside className="dash-card diary-side">
              <h2>Cần chú ý</h2>
              {alerts.length === 0 ? <p className="dash-muted">Chưa có gì cần chú ý trong {monthLabel.toLowerCase()}.</p> : (
                <ul className="diary-alerts">{alerts.map((a, i) => <li key={i} className={`is-${a.tone}`}>{a.tone === 'good' ? '🌟' : '⚠️'} <span><b>{a.strong}</b> {a.text}</span></li>)}</ul>
              )}
              <p className="dash-muted">Dùng số liệu này khi soạn Nhận xét học sinh, Phiếu báo tiến bộ và Thư khen.</p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- Việc chung hôm nay (thông báo cả lớp) */
// Mỗi việc một dòng (lưu chung trong cột announcement, ngăn bằng xuống dòng). Sửa thẳng trên dòng, 🗑 xoá việc đã hết hạn,
// "Xoá hết" khi cả thông báo đã hết hạn; có Hoàn tác cho lần xoá gần nhất.
const ANN_MAX = 1500;
function AnnouncementList({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = value ? value.split('\n') : [];
  const [draft, setDraft] = useState('');
  const [undo, setUndo] = useState<{ value: string; label: string } | null>(null);
  const set = (next: string[]) => onChange(next.join('\n'));
  const add = () => {
    const t = draft.trim();
    if (!t || value.length + t.length + 1 > ANN_MAX) return;
    set([...items.filter((x) => x.trim()), t]); setDraft(''); setUndo(null);
  };
  const remove = (i: number) => { setUndo({ value, label: 'Đã xoá 1 việc.' }); set(items.filter((_, k) => k !== i)); };
  const clearAll = () => { setUndo({ value, label: 'Đã xoá toàn bộ thông báo.' }); onChange(''); };
  const filled = items.filter((x) => x.trim()).length;

  return (
    <div className="diary-ann">
      <div className="diary-ann-head">
        <span>Việc chung hôm nay <small>(đưa vào thông báo cả lớp)</small></span>
        {filled > 1 && <button type="button" className="mini-btn is-danger" onClick={clearAll}><Trash2 aria-hidden="true" /> Xoá hết</button>}
      </div>
      {items.length > 0 && (
        <ol className="diary-ann-list">
          {items.map((t, i) => (
            <li key={i}>
              <input value={t} maxLength={ANN_MAX} aria-label={`Việc ${i + 1}`}
                onChange={(e) => set(items.map((x, k) => (k === i ? e.target.value.replace(/\n/g, ' ') : x)))}
                onBlur={() => { if (!t.trim()) set(items.filter((_, k) => k !== i)); }} />
              <button type="button" className="diary-ann-del" aria-label={`Xoá việc: ${t || 'dòng trống'}`} title="Xoá việc này (đã hết hạn)" onClick={() => remove(i)}><Trash2 aria-hidden="true" /></button>
            </li>
          ))}
        </ol>
      )}
      <div className="diary-ann-add">
        <input value={draft} maxLength={300} placeholder={filled ? 'Thêm việc khác…' : 'Vd: Bài về nhà: Toán trang 34 bài 1, 2'} aria-label="Thêm việc chung"
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="mini-btn is-primary" disabled={!draft.trim()} onClick={add}>+ Thêm</button>
      </div>
      {undo && (
        <p className="diary-ann-undo" role="status">{undo.label} <button type="button" className="mini-btn" onClick={() => { onChange(undo.value); setUndo(null); }}><RotateCcw aria-hidden="true" /> Hoàn tác</button></p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- Thông báo đã gửi (những ngày trước) */
// Liệt kê thông báo cả lớp của 60 ngày gần nhất (trừ ngày đang xem). Việc nào hết hạn bấm 🗑 xoá từng dòng,
// hoặc "Xoá cả ngày". Lưu qua teacher_diary_set_announcement (migration 0058) — không đụng điểm danh.
type OldNotice = { day: string; announcement: string };
function AnnouncementHistory({ supabase, classId, day }: { supabase: ReturnType<typeof createClient>; classId: string; day: string }) {
  const [list, setList] = useState<OldNotice[] | null>(null);
  const [err, setErr] = useState('');
  const [undo, setUndo] = useState<OldNotice | null>(null);

  useEffect(() => {
    let alive = true;
    const today = todayIso();
    void supabase.rpc('teacher_diary_range', { p_class: classId, p_from: shiftDay(today, -60), p_to: shiftDay(today, 1) }).then(({ data, error: e }) => {
      if (!alive) return;
      if (e) { setList([]); return; }
      const days = ((data as RangeData | null)?.days ?? []) as { day: string; announcement: string | null }[];
      setList(days.filter((d) => d.day !== day && d.announcement?.trim()).map((d) => ({ day: d.day, announcement: d.announcement ?? '' })).reverse());
    });
    return () => { alive = false; };
  }, [supabase, classId, day]);

  const write = async (d: string, text: string, before: OldNotice) => {
    setErr('');
    setList((l) => (l ?? []).map((x) => (x.day === d ? { ...x, announcement: text } : x)).filter((x) => x.announcement.trim()));
    setUndo(before);
    const { error: e } = await supabase.rpc('teacher_diary_set_announcement', { p_class: classId, p_day: d, p_text: text });
    if (e) {
      setList((l) => [...(l ?? []).filter((x) => x.day !== d), before].sort((a, b) => b.day.localeCompare(a.day)));
      setUndo(null);
      setErr(/function|schema cache/i.test(e.message) ? 'Chưa xoá được: hãy chạy supabase/migrations/0058_diary_announcement_edit.sql trên Supabase.' : 'Chưa xoá được. Kiểm tra mạng rồi thử lại.');
    }
  };
  const restore = async () => {
    if (!undo) return;
    const u = undo; setUndo(null);
    setList((l) => [...(l ?? []).filter((x) => x.day !== u.day), u].sort((a, b) => b.day.localeCompare(a.day)));
    const { error: e } = await supabase.rpc('teacher_diary_set_announcement', { p_class: classId, p_day: u.day, p_text: u.announcement });
    if (e) setErr('Chưa hoàn tác được. Kiểm tra mạng rồi thử lại.');
  };

  if (!list) return null;
  return (
    <details className="diary-hist">
      <summary>Thông báo đã gửi <span>({list.length})</span></summary>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {undo && <p className="diary-ann-undo" role="status">Đã xoá. <button type="button" className="mini-btn" onClick={() => void restore()}><RotateCcw aria-hidden="true" /> Hoàn tác</button></p>}
      {list.length === 0 ? <p className="dash-muted">Chưa có thông báo nào trong 60 ngày qua.</p> : (
        <ul className="diary-hist-list">
          {list.map((n) => {
            const lines = n.announcement.split('\n').filter((l) => l.trim());
            return (
              <li key={n.day}>
                <div className="diary-hist-day">
                  <b>{dayLabel(n.day)}</b>
                  <button type="button" className="mini-btn is-danger" title="Xoá toàn bộ thông báo ngày này (đã hết hạn)" onClick={() => void write(n.day, '', n)}><Trash2 aria-hidden="true" /> Xoá cả ngày</button>
                </div>
                <ul>
                  {lines.map((l, i) => (
                    <li key={i}>
                      <span>{l}</span>
                      {lines.length > 1 && <button type="button" className="diary-ann-del" aria-label={`Xoá việc: ${l}`} title="Xoá việc này (đã hết hạn)" onClick={() => void write(n.day, lines.filter((_, k) => k !== i).join('\n'), n)}><Trash2 aria-hidden="true" /></button>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
