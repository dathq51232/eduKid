'use client';

// Các ô có tương tác của trang "Hôm nay": việc cần làm (tích được, nhớ trên máy) và "Công cụ ghim" (thầy cô tự ghim tối đa 6;
// chưa ghim thì tự sắp theo số lần dùng) kèm bảng Tuỳ chỉnh để ghim / ẩn công cụ.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Coffee, Eye, EyeOff, ListTodo, Pin, RotateCcw, Settings2, Undo2, Wrench } from 'lucide-react';
import { dayLabel, dueReminders, useCalendarNotes, type Occurrence } from '@/lib/calendar-notes';
import { KHU, TOOLS, groupsOfKhu, quickTools, toolHref, toolsOfGroup, type ToolKey } from '@/lib/classroom/teacher-nav';
import { MAX_PINS, UNHIDEABLE, resetToolPrefs, setKhuHidden, toggleHidden, togglePin, useToolPrefs } from '@/lib/classroom/tool-prefs';
import { TOOL_ICON, USAGE_KEY } from '@/components/classroom/TeacherShell';
import type { TodayItem } from '@/lib/classroom/today';
import '@/styles/ct.css';
import '@/styles/tdy.css';
import '@/styles/tsh.css';
import '@/styles/dash.css';

const TONE_TAG: Record<TodayItem['tone'], string | null> = { urgent: 'Gấp', soon: 'Nên làm', info: null, done: null };

type Row = TodayItem & { occ?: Occurrence; key: string };

/** Ghi chú trên lịch đã tới lúc nhắc → việc trong "Việc hôm nay" (hôm nay / ngày mai thì gắn nhãn gấp) */
function reminderRows(list: Occurrence[], calHref: string): Row[] {
  return list.map((o) => ({
    key: `note:${o.note.id}`, occ: o,
    tone: o.daysLeft === 0 ? 'urgent' : o.daysLeft === 1 ? 'soon' : 'info',
    title: `${o.daysLeft === 0 ? 'Hôm nay' : o.daysLeft === 1 ? 'Ngày mai' : `Còn ${o.daysLeft} ngày`}: ${o.note.title}`,
    detail: [dayLabel(o.day), o.note.at_time, o.note.note].filter(Boolean).join(' · '),
    href: `${calHref}?ngay=${o.day}`, cta: 'Xem lịch',
  }));
}

/** "Việc hôm nay": tiêu đề kèm tiến độ (x/y xong); mỗi việc một nút hành động, nút ✓ nhỏ để tự đánh dấu xong.
 *  calHref: có thì gộp thêm ghi chú nhắc hẹn trên lịch đã tới lúc nhắc (đánh dấu xong lưu theo ghi chú). */
export function TodoList({ items: base, day, headingId, calHref }: { items: TodayItem[]; day: string; headingId?: string; calHref?: string }) {
  const cal = useCalendarNotes();
  const items: Row[] = [
    ...(calHref && cal.ready ? reminderRows(dueReminders(cal.notes, day), calHref) : []),
    ...base.map((t) => ({ ...t, key: t.title })),
  ];
  const key = `gv-viec:${day}`;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(key) ?? '[]')); } catch { /* bỏ qua */ } }, [key]);
  const toggle = (title: string) => setDone((d) => {
    const n = d.includes(title) ? d.filter((x) => x !== title) : [...d, title];
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* bỏ qua */ }
    return n;
  });
  const [showDone, setShowDone] = useState(false);
  const isDone = (t: Row) => (t.occ ? t.occ.done : t.tone === 'done' || done.includes(t.title));
  const mark = (t: Row) => (t.occ ? void cal.setDone(t.occ, !t.occ.done) : toggle(t.title));
  const rank = { urgent: 0, soon: 1, info: 2, done: 3 } as const;
  const pending = items.filter((t) => !isDone(t)).sort((a, b) => rank[a.tone] - rank[b.tone]);
  const now = pending.filter((t) => !t.later), later = pending.filter((t) => t.later);
  const [showLater, setShowLater] = useState(false);
  const finished = items.filter(isDone);
  const row = (t: Row) => {
    const d = isDone(t); const tag = TONE_TAG[t.tone];
    return (
      <li key={t.key} className={`tdy-task is-${t.tone}${d ? ' is-done' : ''}`}>
        <div className="tdy-task-txt">
          <b>{d && <Check aria-hidden="true" className="tdy-task-ok" />}{t.title}{tag && !d && <span className={`tdy-tag is-${t.tone}`}>{tag}</span>}</b>
          <span>{t.detail}</span>
        </div>
        {!d && <Link href={t.href} className="tdy-go">{t.cta}</Link>}
        {t.tone !== 'done' && (
          <button type="button" className="tdy-mark" onClick={() => mark(t)} title={d ? 'Đưa lại vào việc cần làm' : 'Đánh dấu đã xong'} aria-label={d ? `Bỏ đánh dấu xong: ${t.title}` : `Đánh dấu xong: ${t.title}`}>
            {d ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
          </button>
        )}
      </li>
    );
  };
  return (
    <>
      <h2 id={headingId}>
        <ListTodo aria-hidden="true" /> Việc hôm nay
        {items.length > 0 && <span className={`tdy-prog${pending.length ? '' : ' is-all'}`}>{finished.length}/{items.length} xong</span>}
      </h2>
      {now.length === 0
        ? <p className="dash-muted tdy-empty">{later.length ? 'Không còn việc gấp hôm nay. 🎉' : 'Xong hết việc hôm nay. 🎉'}</p>
        : <ul className="tdy-tasks">{now.map(row)}</ul>}
      {later.length > 0 && (
        <div className="tdy-later">
          <button type="button" className="ct-link" onClick={() => setShowLater((v) => !v)} aria-expanded={showLater}>
            <Coffee aria-hidden="true" /> Khi rảnh ({later.length}) {showLater ? '· ẩn bớt' : `· ${later.map((t) => t.cta.toLowerCase()).join(', ')}`}
          </button>
          {showLater && <ul className="tdy-tasks">{later.map(row)}</ul>}
        </div>
      )}
      {finished.length > 0 && (
        <div className="tdy-done">
          <button type="button" className="ct-link" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
            <Check aria-hidden="true" /> Đã xong {finished.length} việc {showDone ? '· ẩn bớt' : '· xem'}
          </button>
          {showDone && <ul className="tdy-tasks">{finished.map(row)}</ul>}
        </div>
      )}
    </>
  );
}

/** "Công cụ ghim": công cụ thầy cô ghim (tối đa 6); chưa ghim thì 6 công cụ mở nhiều nhất trên máy này (bỏ công cụ đã ẩn) */
export function QuickTools({ classId }: { classId: string }) {
  const prefs = useToolPrefs();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState(false);
  useEffect(() => { try { setCounts(JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}') as Record<string, number>); } catch { /* bỏ qua */ } }, []);
  const auto = !prefs.pins.length;
  const keys = auto ? quickTools(counts, 30).filter((k) => !prefs.hidden.includes(k)).slice(0, MAX_PINS) : prefs.pins;
  return (
    <>
      <div className="tdy-quick-hd">
        <h2 id="tdy-quick-h" className="tdy-sect"><Wrench aria-hidden="true" /> Công cụ ghim <span>· {auto ? 'tự xếp theo số lần dùng' : `${prefs.pins.length}/${MAX_PINS} đã ghim`}</span></h2>
        <button type="button" className="ct-link tdy-quick-edit" aria-expanded={edit} onClick={() => setEdit((v) => !v)}><Settings2 aria-hidden="true" /> {edit ? 'Xong' : 'Tuỳ chỉnh'}</button>
      </div>
      <ul className="tdy-quick">
        {keys.map((k) => {
          const t = TOOLS.find((x) => x.key === k);
          if (!t) return null;
          const Icon = TOOL_ICON[k];
          return (
            <li key={k}>
              <Link href={toolHref(t, classId)} className="tdy-tool">
                <span className={`tsh-ic tone-${t.tone}`}><Icon aria-hidden="true" /></span>
                <span><b>{t.label}</b><small>{t.desc}</small></span>
              </Link>
            </li>
          );
        })}
      </ul>
      {edit && <ToolPrefsEditor />}
    </>
  );
}

/** Bảng tuỳ chỉnh: ghim (tối đa 6) và ẩn từng công cụ, ẩn cả khu "Lớp chủ nhiệm" (giáo viên bộ môn) */
function ToolPrefsEditor() {
  const prefs = useToolPrefs();
  const [msg, setMsg] = useState('');
  const pin = (k: ToolKey) => { setMsg(togglePin(k) ? '' : `Đã ghim đủ ${MAX_PINS} công cụ — bỏ ghim một công cụ trước.`); };
  return (
    <div className="tdy-prefs" role="region" aria-label="Tuỳ chỉnh công cụ">
      <p className="dash-muted">Ghim tối đa {MAX_PINS} công cụ hay dùng để hiện ở trang này. Công cụ đã ẩn không hiện trong menu nhưng vẫn mở được bằng ô tìm nhanh (Ctrl + K). Lưu trên máy này.</p>
      {msg && <p className="adm-alert" role="status">{msg}</p>}
      {KHU.map((khu) => {
        const groups = groupsOfKhu(khu.key);
        const all = groups.flatMap((g) => toolsOfGroup(g.key)).filter((t) => !UNHIDEABLE.includes(t.key));
        const allHidden = all.length > 0 && all.every((t) => prefs.hidden.includes(t.key));
        return (
          <section key={khu.key} className="tdy-prefs-khu">
            <div className="tdy-prefs-khu-hd">
              <h3>{khu.label}</h3>
              {khu.key !== 'day' && (
                <button type="button" className="ct-link" onClick={() => setKhuHidden(khu.key, !allHidden)}>
                  {allHidden ? <><Eye aria-hidden="true" /> Hiện cả khu</> : <><EyeOff aria-hidden="true" /> Ẩn cả khu</>}
                </button>
              )}
            </div>
            {groups.map((g) => (
              <div key={g.key} className="tdy-prefs-g">
                <h4>{g.label}</h4>
                <ul>
                  {toolsOfGroup(g.key).map((t) => {
                    const pinned = prefs.pins.includes(t.key);
                    const hidden = prefs.hidden.includes(t.key);
                    const Icon = TOOL_ICON[t.key];
                    return (
                      <li key={t.key} className={hidden ? 'is-hidden' : ''}>
                        <span className={`tsh-ic tone-${t.tone}`}><Icon aria-hidden="true" /></span>
                        <span className="tdy-prefs-name">{t.label}</span>
                        <button type="button" className={`tdy-prefs-btn${pinned ? ' is-on' : ''}`} aria-pressed={pinned} onClick={() => pin(t.key)}
                          aria-label={`${pinned ? 'Bỏ ghim' : 'Ghim'} ${t.label}`} title={pinned ? 'Bỏ ghim' : 'Ghim lên trang Hôm nay'}>
                          <Pin aria-hidden="true" />
                        </button>
                        {!UNHIDEABLE.includes(t.key) && (
                          <button type="button" className={`tdy-prefs-btn${hidden ? ' is-off' : ''}`} aria-pressed={hidden} onClick={() => toggleHidden(t.key)}
                            aria-label={`${hidden ? 'Hiện' : 'Ẩn'} ${t.label}`} title={hidden ? 'Hiện lại trong menu' : 'Ẩn khỏi menu'}>
                            {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
      <button type="button" className="ct-link" onClick={() => { if (window.confirm('Bỏ hết ghim và hiện lại mọi công cụ?')) resetToolPrefs(); }}><RotateCcw aria-hidden="true" /> Đặt lại như ban đầu</button>
    </div>
  );
}
