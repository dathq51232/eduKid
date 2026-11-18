'use client';
/* eslint-disable @next/next/no-img-element -- hình 3D / Milo có sẵn trong public, kích thước tự do */
// "Bản đồ kiến thức" (Toán theo khối): mỗi trạm là một mắt xích kỹ năng, sáng dần theo mức L1–L5.
// Đường nối = kiến thức cần biết trước. Bấm trạm → kiến thức cần nhớ, mẹo của Milo, nút luyện bài.
// Trạm là thẻ HTML đặt trên lớp SVG tĩnh (không hoạt ảnh trong SVG) để chạy mượt trên máy tính bảng.
// Dùng ở trang của em (tiến độ thật) và trang demo (tiến độ mẫu).
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Lightbulb, Play, Volume2, X } from 'lucide-react';
import { LEVEL_NAMES, MAP_H, MAP_W, type MapDef, type MapNode, type MapState, type NodeState } from './knowledge-map-types';
import { MAPS } from './knowledge-maps';
import '@/styles/bdk.css';

const NONE: NodeState = { level: 0 };

/** đọc to câu của Milo (giọng tiếng Việt của trình duyệt, nếu có) */
function say(text: string) {
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = 0.95;
    s.speak(u);
  } catch { /* trình duyệt không hỗ trợ đọc */ }
}

function stateClass(s: NodeState) {
  if (s.weak) return 'is-weak';
  if (s.current) return 'is-current';
  if (s.level === 0) return 'is-new';
  return s.level >= 3 ? 'is-strong' : 'is-learning';
}

function goalText(level: number) {
  if (level === 0) return 'Làm bài đầu tiên để mở mắt xích này.';
  if (level < 3) return 'Làm đúng từ 8/10 câu (mức Cơ bản) để mắt xích sáng lên.';
  if (level === 3) return `Làm đúng từ 8/10 câu ở mức Khá để lên L4 · ${LEVEL_NAMES[4]}.`;
  if (level === 4) return `Làm đúng từ 8/10 câu ở mức Giỏi để lên L5 · ${LEVEL_NAMES[5]}.`;
  return 'Em đã đạt mức cao nhất. Thỉnh thoảng ôn lại cho nhớ lâu nhé!';
}

type Props = {
  /** khối lớp (1–5) */
  grade: number;
  state: MapState;
  /** đường dẫn luyện bài của từng trạm; không có thì nút luyện dẫn tới #luyen (demo) */
  hrefs?: Record<string, string>;
  /** bỏ hàng chọn môn khi đặt trong trang của em (đã có tiêu đề mục) */
  compact?: boolean;
};

export default function KnowledgeMap({ grade, state, hrefs, compact }: Props) {
  const def = MAPS[grade] ?? MAPS[4];
  const { nodes: NODES, links: LINKS, regions: REGIONS } = def;
  const byId = useMemo(() => new Map(NODES.map((n) => [n.id, n])), [NODES]);
  const [openId, setOpenId] = useState<string | null>(null);
  const st = (id: string) => state[id] ?? NONE;
  const open = openId ? byId.get(openId) ?? null : null;

  // gợi ý của Milo: bài đang học có mắt xích cần biết trước còn yếu → ôn mắt xích đó trước; rồi tới chỗ cần ôn; rồi bài tiếp theo
  const current = NODES.find((n) => st(n.id).current);
  const weakPrereq = current ? LINKS.filter((l) => l.to === current.id).map((l) => byId.get(l.from)!).find((n) => st(n.id).weak) : undefined;
  const firstWeak = NODES.find((n) => st(n.id).weak);
  const firstNew = NODES.find((n) => st(n.id).level < 3);
  const started = NODES.some((n) => st(n.id).level > 0);
  let suggest: MapNode | undefined;
  let miloLine: string;
  if (weakPrereq && current) { suggest = weakPrereq; miloLine = `Em đang học ${current.name}. Mình ôn ${weakPrereq.name} 5 phút trước nhé, sẽ dễ hơn nhiều!`; }
  else if (firstWeak) { suggest = firstWeak; miloLine = `Mấy lần gần đây em còn nhầm ở ${firstWeak.name}. Mình ôn lại 5 phút nhé!`; }
  else if (current) { suggest = current; miloLine = `Hôm nay mình học tiếp ${current.name} nhé!`; }
  else if (firstNew) { suggest = firstNew; miloLine = started ? `Mắt xích tiếp theo là ${firstNew.name}. Mình làm cho nó sáng lên nhé!` : `Bản đồ sẽ sáng dần khi em làm bài. Mình bắt đầu với ${firstNew.name} nhé!`; }
  else miloLine = 'Cả bản đồ đã sáng rồi! Em thử thêm bài mức Giỏi cho vui nhé!';

  const total = NODES.length;
  const lit = NODES.filter((n) => st(n.id).level >= 3).length;
  const weakCount = NODES.filter((n) => st(n.id).weak).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const paths = useMemo(() => LINKS.map((l) => {
    const a = byId.get(l.from)!, b = byId.get(l.to)!;
    const sa = state[a.id] ?? NONE, sb = state[b.id] ?? NONE;
    const d = l.c ? `M${a.x} ${a.y} Q${l.c[0]} ${l.c[1]} ${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x} ${b.y}`;
    return { key: `${l.from}-${l.to}`, d, on: sa.level >= 3 && sb.level >= 3, weak: !!sa.weak, focus: !!openId && (l.from === openId || l.to === openId) };
  }), [openId, state, LINKS, byId]);

  return (
    <div className={`bdk${compact ? ' is-compact' : ''}`}>
      <header className="bdk-head">
        {!compact && (
          <div className="bdk-subjects" role="tablist" aria-label="Chọn môn">
            <button type="button" role="tab" aria-selected="true" className="is-on"><img src="/emoji/f3d/abacus.webp" alt="" />{def.title}</button>
            <button type="button" role="tab" aria-selected="false" disabled><img src="/emoji/f3d/open-book.webp" alt="" />Tiếng Việt<small>Sắp có</small></button>
            <button type="button" role="tab" aria-selected="false" disabled><img src="/emoji/f3d/blue-book.webp" alt="" />Tiếng Anh<small>Sắp có</small></button>
          </div>
        )}
        <div className="bdk-stats">
          <span className="bdk-stat"><b>{lit}</b>/{total} mắt xích sáng</span>
          {weakCount > 0 && <span className="bdk-stat is-weak"><b>{weakCount}</b> chỗ cần ôn</span>}
        </div>
      </header>

      <section className="bdk-milo" aria-label="Milo gợi ý">
        <img src="/brand/milo-professor.webp" alt="" className="bdk-milo-img" />
        <div className="bdk-milo-bubble">
          <p>{miloLine}</p>
          <div className="bdk-milo-actions">
            <button type="button" className="bdk-speak" onClick={() => say(miloLine)} aria-label="Nghe Milo nói"><Volume2 aria-hidden="true" /></button>
            {suggest && (
              <button type="button" className="bdk-cta" onClick={() => setOpenId(suggest.id)}>
                <Play aria-hidden="true" /> {st(suggest.id).weak ? 'Ôn' : 'Mở'} {suggest.name}
              </button>
            )}
          </div>
        </div>
      </section>

      <ul className="bdk-legend" aria-label="Chú thích">
        <li><i className="is-strong" />Đã vững (từ L3)</li>
        <li><i className="is-learning" />Đang luyện</li>
        <li><i className="is-current" />Bài đang học</li>
        <li><i className="is-weak" />Cần ôn</li>
        <li><i className="is-new" />Chưa học</li>
        <li><span className="bdk-legend-line" />Cần biết trước</li>
      </ul>

      <div className="bdk-scroll">
        <div className="bdk-map" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
          {REGIONS.map((r) => (
            <div key={r.id} className={`bdk-region ${r.tone}`}
              style={{ left: `${(r.x / MAP_W) * 100}%`, top: `${(r.y / MAP_H) * 100}%`, width: `${(r.w / MAP_W) * 100}%`, height: `${(r.h / MAP_H) * 100}%` }}>
              <span>{r.name}</span>
            </div>
          ))}

          <svg className="bdk-lines" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="none" aria-hidden="true">
            {paths.map((p) => (
              <path key={p.key} d={p.d} className={`${p.on ? 'is-on' : ''} ${p.weak ? 'is-weak' : ''} ${p.focus ? 'is-focus' : ''}`} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>

          {NODES.map((n) => {
            const s = st(n.id);
            return (
              <div key={n.id} className="bdk-pos" style={{ left: `${(n.x / MAP_W) * 100}%`, top: `${(n.y / MAP_H) * 100}%` }}>
                <button type="button" className={`bdk-node ${stateClass(s)} ${openId === n.id ? 'is-open' : ''}`} onClick={() => setOpenId(n.id)}
                  aria-label={`${n.name}: ${s.level ? `mức L${s.level} ${LEVEL_NAMES[s.level]}` : 'chưa học'}${s.weak ? ', cần ôn' : ''}${s.current ? ', bài đang học' : ''}`}>
                  {s.weak && <em className="bdk-tag is-weak">Cần ôn</em>}
                  {!s.weak && s.current && <em className="bdk-tag is-current">Đang học</em>}
                  <img src={n.icon} alt="" />
                  <b>{n.name}</b>
                  <span className="bdk-dots" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((l) => <i key={l} className={l <= s.level ? 'is-on' : ''} />)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <p className="bdk-hint">Bấm vào một trạm để xem kiến thức và mẹo của Milo.</p>

      {open && <NodePanel def={def} byId={byId} node={open} state={state} href={hrefs?.[open.id]} onClose={() => setOpenId(null)} onGo={setOpenId} />}
    </div>
  );
}

function NodePanel({ def, byId, node, state, href, onClose, onGo }: { def: MapDef; byId: Map<string, MapNode>; node: MapNode; state: MapState; href?: string; onClose: () => void; onGo: (id: string) => void }) {
  const LINKS = def.links;
  const s = state[node.id] ?? NONE;
  const needs = LINKS.filter((l) => l.to === node.id).map((l) => byId.get(l.from)!);
  const opens = LINKS.filter((l) => l.from === node.id).map((l) => byId.get(l.to)!);
  const weakNeed = needs.find((n) => state[n.id]?.weak);
  const next = Math.min(s.level + 1, 5);
  const ctaLabel = s.level ? 'Luyện bài này' : 'Bắt đầu học';
  return (
    <>
      <button type="button" className="bdk-backdrop" aria-label="Đóng" onClick={onClose} />
      <aside className="bdk-panel" role="dialog" aria-modal="true" aria-labelledby="bdk-panel-title">
        <header className="bdk-panel-head">
          <img src={node.icon} alt="" />
          <div>
            <p className="bdk-muted">{def.title} · {s.level ? `Mức L${s.level} · ${LEVEL_NAMES[s.level]}` : 'Chưa học'}</p>
            <h2 id="bdk-panel-title">{node.name}</h2>
          </div>
          <button type="button" className="bdk-close" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        </header>

        <ol className="bdk-levels" aria-label="Các mức">
          {[1, 2, 3, 4, 5].map((l) => (
            <li key={l} className={l <= s.level ? 'is-on' : l === next && s.level < 5 ? 'is-next' : ''}>
              <b>L{l}</b><span>{LEVEL_NAMES[l]}</span>
            </li>
          ))}
        </ol>
        <p className="bdk-goal">{goalText(s.level)}</p>

        {weakNeed && (
          <div className="bdk-warn">
            <img src="/brand/milo-sm.webp" alt="" />
            <p>Bài này cần <b>{weakNeed.name}</b>. Milo thấy em còn hay nhầm ở đó. Mình ôn 5 phút trước nhé!</p>
            <button type="button" onClick={() => onGo(weakNeed.id)}>Ôn ngay <ChevronRight aria-hidden="true" /></button>
          </div>
        )}
        {s.weak && (
          <div className="bdk-warn">
            <img src="/brand/milo-sm.webp" alt="" />
            <p>Lần gần đây em còn nhầm ở đây. Thử mẹo bên dưới rồi luyện lại nhé!</p>
          </div>
        )}

        <section className="bdk-sec">
          <h3><BookOpen aria-hidden="true" /> Kiến thức cần nhớ</h3>
          <p className="bdk-know">{node.know}</p>
        </section>

        <section className="bdk-sec">
          <h3><Lightbulb aria-hidden="true" /> Mẹo của Milo</h3>
          <ul className="bdk-tips">
            {node.tips.map((t) => (
              <li key={t.name}>
                <b>{t.name}</b>
                <p>{t.how}</p>
                <code>{t.example}</code>
              </li>
            ))}
          </ul>
        </section>

        {(needs.length > 0 || opens.length > 0) && (
          <section className="bdk-sec">
            {needs.length > 0 && <><h3>Cần biết trước</h3><Chips list={needs} state={state} onGo={onGo} /></>}
            {opens.length > 0 && <><h3>Học xong sẽ mở</h3><Chips list={opens} state={state} onGo={onGo} /></>}
          </section>
        )}

        <footer className="bdk-panel-foot">
          {href
            ? <Link href={href} className="bdk-cta is-big"><Play aria-hidden="true" /> {ctaLabel}</Link>
            : <a href="#luyen" className="bdk-cta is-big"><Play aria-hidden="true" /> {ctaLabel}</a>}
        </footer>
      </aside>
    </>
  );
}

function Chips({ list, state, onGo }: { list: MapNode[]; state: MapState; onGo: (id: string) => void }) {
  return (
    <div className="bdk-chips">
      {list.map((n) => (
        <button key={n.id} type="button" className={`bdk-chip ${stateClass(state[n.id] ?? NONE)}`} onClick={() => onGo(n.id)}>
          <img src={n.icon} alt="" />{n.name}
        </button>
      ))}
    </div>
  );
}
