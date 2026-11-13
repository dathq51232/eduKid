'use client';

// Bản đồ phiêu lưu (trang Chọn bài): mỗi chủ đề là một chặng đường, mỗi bài là một hòn đảo.
// Bài đã học cắm cờ + sao, bài học tiếp có Milo đứng chờ. Bấm đảo là vào học ngay.
import Link from 'next/link';
import { Check, Flag, Star } from 'lucide-react';
import Sticker from './Sticker';
import { ThemedMilo } from './KidWorld';
import { lessonAnchor } from '@/components/LessonToc';
import type { MiloVariant } from '@/components/mascot/MiloMascot';
import type { StickerId } from '@/lib/stickers';

export type MapItem = { id: string; no: string; label: string; title: string; done: boolean; stars: number; next: boolean; href: string };
export type MapGroup = { key: string; title?: string; sticker: StickerId; items: MapItem[] };

const ROW = 122; // khoảng cách dọc giữa hai đảo (px)
const TOP = 46; // tâm đảo đầu tiên
const xAt = (i: number) => 50 + 27 * Math.sin(i * 1.15 + 0.4); // vị trí ngang (% bề rộng)

function road(n: number) {
  let d = `M${xAt(0)} ${TOP}`;
  for (let i = 1; i < n; i++) {
    const y0 = TOP + (i - 1) * ROW;
    const y1 = TOP + i * ROW;
    d += ` C${xAt(i - 1)} ${y0 + ROW / 2} ${xAt(i)} ${y1 - ROW / 2} ${xAt(i)} ${y1}`;
  }
  return d;
}

export default function LessonMap({ groups, milo }: { groups: MapGroup[]; milo: MiloVariant }) {
  return (
    <div className="lm">
      {groups.map((g) => {
        const done = g.items.filter((x) => x.done).length;
        const h = TOP + (g.items.length - 1) * ROW + 96;
        const full = done === g.items.length;
        return (
          <section key={g.key} className={`lm-group${full ? ' is-full' : ''}`} aria-label={g.title ?? 'Bài khác'}>
            <header className="lm-head">
              <span className="lm-head-art" aria-hidden="true"><Sticker id={g.sticker} size={48} /></span>
              <h3>{g.title ?? 'Bài khác'}</h3>
              <span className="lm-count">{full ? <><Flag aria-hidden="true" /> Xong chặng!</> : `${done}/${g.items.length} bài`}</span>
            </header>
            <div className="lm-path" style={{ height: h }}>
              <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden="true">
                <path d={road(g.items.length)} className="lm-road" vectorEffect="non-scaling-stroke" />
                <path d={road(g.items.length)} className="lm-dash" vectorEffect="non-scaling-stroke" />
              </svg>
              <ol>
                {g.items.map((it, i) => (
                  <li key={it.id} id={lessonAnchor(it.id)} tabIndex={-1} className={`lm-node${it.done ? ' is-done' : ''}${it.next ? ' is-next' : ''}${xAt(i) > 50 ? ' is-r' : ''}`}
                    style={{ left: `${xAt(i)}%`, top: TOP + i * ROW - 34 }}>
                    {it.next && <span className="lm-milo" aria-hidden="true"><ThemedMilo size={58} fallback={milo} /></span>}
                    <Link href={it.href} className="lm-island" aria-label={`${it.title}${it.done ? `, đã học, ${it.stars} sao` : ''}${it.next ? ', bài học tiếp theo' : ''}`}>
                      <span className="lm-disc">{it.done ? <Check strokeWidth={3.5} aria-hidden="true" /> : it.no}</span>
                      {it.done && <span className="lm-flag" aria-hidden="true"><Flag /></span>}
                    </Link>
                    {it.done && (
                      <span className="lm-stars" aria-hidden="true">
                        {[0, 1, 2].map((k) => <Star key={k} className={k < it.stars ? 'is-on' : ''} />)}
                      </span>
                    )}
                    <span className="lm-label" aria-hidden="true">{it.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      })}
    </div>
  );
}
