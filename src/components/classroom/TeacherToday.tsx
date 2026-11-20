'use client';

// Các ô có tương tác của trang "Hôm nay": việc cần làm (tích được, nhớ trên máy) và "Dùng nhanh" (tự sắp theo số lần dùng).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Coffee, ListTodo, Undo2 } from 'lucide-react';
import { dayLabel, dueReminders, useCalendarNotes, type Occurrence } from '@/lib/calendar-notes';
import { TOOLS, quickTools, toolHref, type ToolKey } from '@/lib/classroom/teacher-nav';
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

export function QuickTools({ classId }: { classId: string }) {
  const [keys, setKeys] = useState<ToolKey[]>(() => quickTools({}));
  useEffect(() => { try { setKeys(quickTools(JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}'))); } catch { /* bỏ qua */ } }, []);
  return (
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
  );
}
