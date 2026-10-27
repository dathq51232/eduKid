'use client';

// Các ô có tương tác của trang "Hôm nay": việc cần làm (tích được, nhớ trên máy) và "Dùng nhanh" (tự sắp theo số lần dùng).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { TOOLS, quickTools, toolHref, type ToolKey } from '@/lib/classroom/teacher-nav';
import { TOOL_ICON, USAGE_KEY } from '@/components/classroom/TeacherShell';
import type { TodayItem } from '@/lib/classroom/today';

const TONE_TAG: Record<TodayItem['tone'], string | null> = { urgent: 'Gấp', soon: 'Nên làm', info: null, done: null };

export function TodoList({ items, day }: { items: TodayItem[]; day: string }) {
  const key = `gv-viec:${day}`;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(key) ?? '[]')); } catch { /* bỏ qua */ } }, [key]);
  const toggle = (title: string) => setDone((d) => {
    const n = d.includes(title) ? d.filter((x) => x !== title) : [...d, title];
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* bỏ qua */ }
    return n;
  });
  const [showDone, setShowDone] = useState(false);
  const isDone = (t: TodayItem) => t.tone === 'done' || done.includes(t.title);
  const rank = { urgent: 0, soon: 1, info: 2, done: 3 } as const;
  const pending = items.filter((t) => !isDone(t)).sort((a, b) => rank[a.tone] - rank[b.tone]);
  const finished = items.filter(isDone);
  const row = (t: TodayItem) => {
    const d = isDone(t); const tag = TONE_TAG[t.tone];
    return (
      <li key={t.title} className={`tdy-task is-${t.tone}${d ? ' is-done' : ''}`}>
        <button type="button" className="tdy-check" role="checkbox" aria-checked={d} aria-label={d ? `Bỏ đánh dấu xong: ${t.title}` : `Đánh dấu xong: ${t.title}`} onClick={() => t.tone !== 'done' && toggle(t.title)}>
          {d && <Check aria-hidden="true" />}
        </button>
        <div className="tdy-task-txt">
          <b>{t.title}{tag && !d && <span className={`tdy-tag is-${t.tone}`}>{tag}</span>}</b>
          <span>{t.detail}</span>
        </div>
        {!d && <Link href={t.href} className="tdy-go">{t.cta}</Link>}
      </li>
    );
  };
  return (
    <>
      {pending.length === 0
        ? <p className="dash-muted tdy-empty">Không còn việc gấp. Bài giao, giáo án và điểm danh đều ổn. 🎉</p>
        : <ul className="tdy-tasks">{pending.map(row)}</ul>}
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
