'use client';

// Sổ lớp hằng ngày: điểm danh + ghi chú nhanh từng em, tin nhắn phụ huynh soạn sẵn (sao chép dán Zalo), tổng hợp tháng.
// Lưu lên Supabase qua các hàm teacher_diary_* (migration 0026); tự lưu sau mỗi thay đổi.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, MessageCircle, Pencil, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import { zaloHref } from '@/lib/classroom/class-tools';
import ZaloGroupLink from '@/components/classroom/ZaloGroupLink';
import {
  PRAISE_TAGS, REMIND_TAGS, STATUS_LABEL, alertsOf, dayLabel, emptyEntry, isMarked, isPraise, kindsOf, messageFor, monthSheet,
  shiftDay, summarize, todayIso, type Entry, type MessageKind, type Pronoun, type RangeData, type Status, type Student,
} from '@/lib/classroom/diary';

type Tab = 'day' | 'msg' | 'month';
type DayData = { saved_at: string | null; announcement: string | null; entries: { student_id: string; status: Status; tags: string[]; note: string | null; copied: boolean }[] };

const MISSING = 'Chưa bật Sổ lớp: hãy chạy supabase/migrations/0026_class_diary.sql trên Supabase.';
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
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | MessageKind>('all');
  const [flash, setFlash] = useState('');
  // số Zalo phụ huynh (Danh bạ phụ huynh, migration 0028) — chỉ tải khi mở thẻ Tin nhắn; chưa có migration thì bỏ qua
  const [phones, setPhones] = useState<Record<string, string> | null>(null);

  useEffect(() => { try { const p = localStorage.getItem('so-lop:xung-ho'); if (p === 'thay' || p === 'co') setPronoun(p); } catch { /* bỏ qua */ } }, []);
  const choosePronoun = (p: Pronoun) => { setPronoun(p); setEdited({}); try { localStorage.setItem('so-lop:xung-ho', p); } catch { /* bỏ qua */ } };

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
    setState('loading'); setError(''); setEdited({});
    const { data, error: e } = await supabase.rpc('teacher_diary_day', { p_class: classId, p_day: d });
    if (e) { setError(errText(e.message)); setEntries({}); setSavedAt(null); setAnnouncement(''); setState('idle'); return; }
    const v = data as DayData;
    setEntries(Object.fromEntries(v.entries.map((x) => [x.student_id, { status: x.status, tags: x.tags ?? [], note: x.note ?? '', copied: x.copied }])));
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

  const update = (id: string, f: (e: Entry) => Entry) => { setEntries((x) => ({ ...x, [id]: f(x[id] ?? emptyEntry()) })); setEdited((x) => { const n = { ...x }; delete n[id]; return n; }); touch(); };
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
  const messages = students.map((s) => ({ s, e: entries[s.id], text: edited[s.id] ?? messageFor(s, entries[s.id], day, pronoun), kinds: kindsOf(entries[s.id]) })).filter((m) => m.text);
  const shown = filter === 'all' ? messages : messages.filter((m) => m.kinds.includes(filter));
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
                <label className="diary-ann">Việc chung hôm nay (đưa vào thông báo cả lớp)
                  <textarea rows={4} maxLength={1500} value={announcement} placeholder={'Bài về nhà: Toán trang 34 bài 1, 2\nThứ Hai mang bút màu'} onChange={(e) => { setAnnouncement(e.target.value); touch(); }} />
                </label>
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
                {shown.map(({ s, e, text }) => (
                  <li key={s.id} className="diary-msg">
                    <div className="diary-msg-who"><b>{s.name}</b><span>{[e && e.status !== 'present' ? STATUS_LABEL[e.status] : '', ...(e?.tags ?? [])].filter(Boolean).join(' · ') || 'Ghi chú'}</span></div>
                    {editing === s.id ? (
                      <textarea className="diary-msg-edit" rows={4} value={text ?? ''} onChange={(ev) => setEdited((x) => ({ ...x, [s.id]: ev.target.value }))} aria-label={`Sửa tin nhắn cho phụ huynh ${s.name}`} />
                    ) : <p className="diary-bubble">{text}</p>}
                    <div className="diary-msg-act">
                      <button type="button" className={`mini-btn${e?.copied ? ' is-copied' : ''}`} onClick={() => void copyOne(s.id, text ?? '')}><Copy aria-hidden="true" /> {e?.copied ? 'Đã chép' : 'Sao chép'}</button>
                      {phones?.[s.id] && <a className="mini-btn is-zalo" href={zaloHref(phones[s.id])} target="_blank" rel="noopener noreferrer" onClick={() => void copyOne(s.id, text ?? '')} title="Chép tin nhắn rồi mở Zalo của phụ huynh"><MessageCircle aria-hidden="true" /> Chép & mở Zalo</a>}
                      <button type="button" className="mini-btn" onClick={() => setEditing(editing === s.id ? null : s.id)}><Pencil aria-hidden="true" /> {editing === s.id ? 'Xong' : 'Sửa'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <aside className="dash-card diary-side">
            <h2>Gửi cả lớp</h2>
            <p className="dash-muted">Thông báo chung cho nhóm Zalo lớp. Việc chung gõ ở ô dưới (mỗi dòng một ý).</p>
            <textarea className="diary-note" rows={3} maxLength={1500} value={announcement} placeholder={'Bài về nhà: Toán trang 34 bài 1, 2\nThứ Hai mang bút màu'} onChange={(e) => { setAnnouncement(e.target.value); touch(); }} aria-label="Việc chung hôm nay" />
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
