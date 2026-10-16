'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ListOrdered, X } from 'lucide-react';

export type TocItem = { id: string; no: string; label: string; title: string; done: boolean; next: boolean };
export type TocGroup = { key: string; title?: string; items: TocItem[] };

export const lessonAnchor = (id: string) => `bai-${id}`;

/**
 * Số hiệu ngắn của bài theo sách + tên bài rút gọn: "Bài 27. Đo độ dài" → ["27", "Đo độ dài"],
 * "Tuần 3: …" → ["3", …], "Unit 2. …" → ["2", …], "Review 1. …" → ["R1", …], "Đề ôn 2 · …" → ["Ô2", …].
 */
export function lessonBadge(title: string, fallback: number): [string, string] {
  let m = title.match(/^(?:Bài|Tuần|Unit)\s+(\d+)[.:]\s*(.*)$/);
  if (m) return [m[1], m[2]];
  m = title.match(/^Review\s+(\d+)\.\s*(.*)$/);
  if (m) return [`R${m[1]}`, m[2]];
  m = title.match(/^Đề ôn\s+(\d+)/);
  if (m) return [`Ô${m[1]}`, title];
  return [String(fallback), title];
}

/** Đi đến một bài trong danh sách (cuộn mượt nếu máy cho phép), rồi đưa con trỏ bàn phím vào bài đó */
function jumpTo(id: string) {
  const el = document.getElementById(lessonAnchor(id));
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
  try {
    window.history.replaceState(window.history.state, '', `#${lessonAnchor(id)}`);
  } catch {
    // bỏ qua
  }
}

function TocList({ groups, activeId, onPick }: { groups: TocGroup[]; activeId: string | null; onPick: (id: string) => void }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.key} className="toc-group">
          {g.title && <p className="toc-group-title">{g.title}</p>}
          <ul>
            {g.items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${lessonAnchor(it.id)}`}
                  className={`toc-link${it.done ? ' is-done' : ''}${it.next ? ' is-next' : ''}`}
                  aria-current={activeId === it.id ? 'location' : undefined}
                  data-toc={it.id}
                  aria-label={`${it.title}${it.done ? ' (đã học)' : ''}${it.next ? ' (học tiếp)' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onPick(it.id);
                  }}
                >
                  <span className="toc-no" aria-hidden="true">{it.done ? <Check size={14} strokeWidth={3} /> : it.no}</span>
                  <span className="toc-label">{it.label}</span>
                  {it.next && <span className="toc-next">Học tiếp</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/**
 * Mục lục bài học:
 *  - Màn hình rộng: cột bên trái, luôn hiện khi cuộn, tô sáng bài đang xem.
 *  - Điện thoại / máy tính bảng: nút "Mục lục" nổi ở góc dưới, bấm mở bảng chọn bài.
 */
export default function LessonToc({ groups, subjectName }: { groups: TocGroup[]; subjectName: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Vừa bấm vào mục lục: tô sáng đúng bài đã chọn (kể cả bài cuối trang không cuộn lên đầu được)
  const pickedRef = useRef<{ id: string; until: number } | null>(null);
  const pick = (id: string) => {
    pickedRef.current = { id, until: Date.now() + 1500 };
    setActiveId(id);
    jumpTo(id);
  };
  const ids = groups.flatMap((g) => g.items.map((i) => i.id)).join('|');

  // Bài đang ở vùng nhìn thấy → tô sáng trong mục lục
  useEffect(() => {
    const els = ids.split('|').map((id) => document.getElementById(lessonAnchor(id))).filter((x): x is HTMLElement => !!x);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.replace(/^bai-/, '');
          if (e.isIntersecting) visible.set(id, e.boundingClientRect.top);
          else visible.delete(id);
        }
        const p = pickedRef.current;
        if (p && Date.now() < p.until) return;
        if (visible.size) setActiveId([...visible.entries()].sort((a, b) => a[1] - b[1])[0][0]);
      },
      { rootMargin: '-140px 0px -45% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  // Giữ bài đang xem luôn nằm trong khung mục lục bên trái (chỉ cuộn khung mục lục, không cuộn trang)
  useEffect(() => {
    const box = asideRef.current;
    const link = box?.querySelector<HTMLElement>(`[data-toc="${activeId}"]`);
    if (!box || !link) return;
    const lr = link.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    if (lr.top < br.top + 30 || lr.bottom > br.bottom - 30) box.scrollTop += lr.top - br.top - box.clientHeight / 3;
  }, [activeId]);

  // Bảng chọn bài trên điện thoại: Esc để đóng, đưa con trỏ về nút khi đóng
  useEffect(() => {
    if (!open) return;
    const first = sheetRef.current?.querySelector<HTMLElement>('[aria-current="location"], .toc-link');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const total = groups.reduce((s, g) => s + g.items.length, 0);
  if (!total) return null;

  return (
    <>
      <nav className="lesson-toc" aria-label={`Mục lục bài học ${subjectName}`}>
        <p className="toc-title"><ListOrdered size={18} aria-hidden="true" /> Mục lục · {total} bài</p>
        <div className="toc-scroll" ref={asideRef}>
          <TocList groups={groups} activeId={activeId} onPick={pick} />
        </div>
      </nav>

      <button
        ref={buttonRef}
        type="button"
        className="toc-fab"
        aria-expanded={open}
        aria-controls="toc-sheet"
        onClick={() => setOpen((v) => !v)}
      >
        <ListOrdered size={20} aria-hidden="true" /> Mục lục
      </button>
      {open && (
        <div className="toc-sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            id="toc-sheet"
            ref={sheetRef}
            className="toc-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Mục lục bài học ${subjectName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="toc-sheet-head">
              <p className="toc-title"><ListOrdered size={18} aria-hidden="true" /> Mục lục · {total} bài</p>
              <button type="button" className="toc-close" aria-label="Đóng mục lục" onClick={() => { setOpen(false); buttonRef.current?.focus(); }}>
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="toc-sheet-body">
              <TocList
                groups={groups}
                activeId={activeId}
                onPick={(id) => {
                  setOpen(false);
                  pick(id);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
