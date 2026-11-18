'use client';
/* eslint-disable @next/next/no-img-element -- hình 3D / Milo có sẵn trong public, kích thước tự do */
// Demo "Bản đồ kiến thức" (dữ liệu mẫu, Toán 4): mỗi trạm là một mắt xích kỹ năng, sáng dần theo mức L1–L5.
// Đường nối = kiến thức cần biết trước. Bấm trạm → kiến thức cần nhớ, mẹo của Milo, luyện 5 câu.
// Trạm là thẻ HTML đặt trên lớp SVG tĩnh (không hoạt ảnh trong SVG) để chạy mượt trên máy tính bảng.
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Lightbulb, Play, Volume2, X } from 'lucide-react';
import { LEVEL_NAMES, LINKS, MAP_H, MAP_W, NODES, REGIONS, type MapNode } from './knowledge-map-toan4';
import '@/styles/bdk.css';

const byId = new Map(NODES.map((n) => [n.id, n]));
const strong = (n: MapNode) => n.level >= 3;

/** đọc to câu của Milo (giọng tiếng Việt của trình duyệt, nếu có) */
function say(text: string) {
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = 0.95;
    s.speak(u);
  } catch { /* trình duyệt không hỗ trợ đọc */ }
}

function stateOf(n: MapNode) {
  if (n.weak) return 'is-weak';
  if (n.current) return 'is-current';
  if (n.level === 0) return 'is-new';
  return strong(n) ? 'is-strong' : 'is-learning';
}

export default function KnowledgeMapDemo() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? byId.get(openId) ?? null : null;

  // gợi ý của Milo: bài đang học có mắt xích cần biết trước còn yếu → ôn mắt xích đó trước
  const current = NODES.find((n) => n.current);
  const weakPrereq = current ? LINKS.filter((l) => l.to === current.id).map((l) => byId.get(l.from)!).find((n) => n.weak) : undefined;
  const suggest = weakPrereq ?? current;
  const miloLine = weakPrereq && current
    ? `Em đang học ${current.name}. Mình ôn ${weakPrereq.name} 5 phút trước nhé, sẽ dễ hơn nhiều!`
    : `Hôm nay mình học tiếp ${current?.name ?? 'bài mới'} nhé!`;

  const total = NODES.length;
  const lit = NODES.filter(strong).length;
  const weakCount = NODES.filter((n) => n.weak).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const paths = useMemo(() => LINKS.map((l) => {
    const a = byId.get(l.from)!, b = byId.get(l.to)!;
    const d = l.c ? `M${a.x} ${a.y} Q${l.c[0]} ${l.c[1]} ${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x} ${b.y}`;
    return { key: `${l.from}-${l.to}`, d, on: strong(a) && strong(b), weak: !!a.weak, focus: !!openId && (l.from === openId || l.to === openId) };
  }), [openId]);

  return (
    <div className="bdk">
      <header className="bdk-head">
        <div className="bdk-subjects" role="tablist" aria-label="Chọn môn">
          <button type="button" role="tab" aria-selected="true" className="is-on"><img src="/emoji/f3d/abacus.webp" alt="" />Toán 4</button>
          <button type="button" role="tab" aria-selected="false" disabled><img src="/emoji/f3d/open-book.webp" alt="" />Tiếng Việt<small>Sắp có</small></button>
          <button type="button" role="tab" aria-selected="false" disabled><img src="/emoji/f3d/blue-book.webp" alt="" />Tiếng Anh<small>Sắp có</small></button>
        </div>
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
                <Play aria-hidden="true" /> Ôn {suggest.name}
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

          {NODES.map((n) => (
            <div key={n.id} className="bdk-pos" style={{ left: `${(n.x / MAP_W) * 100}%`, top: `${(n.y / MAP_H) * 100}%` }}>
              <button type="button" className={`bdk-node ${stateOf(n)} ${openId === n.id ? 'is-open' : ''}`} onClick={() => setOpenId(n.id)}
                aria-label={`${n.name}: ${n.level ? `mức L${n.level} ${LEVEL_NAMES[n.level]}` : 'chưa học'}${n.weak ? ', cần ôn' : ''}${n.current ? ', bài đang học' : ''}`}>
                {n.weak && <em className="bdk-tag is-weak">Cần ôn</em>}
                {!n.weak && n.current && <em className="bdk-tag is-current">Đang học</em>}
                <img src={n.icon} alt="" />
                <b>{n.name}</b>
                <span className="bdk-dots" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((l) => <i key={l} className={l <= n.level ? 'is-on' : ''} />)}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="bdk-hint">Bấm vào một trạm để xem kiến thức và mẹo của Milo.</p>

      {open && <NodePanel node={open} onClose={() => setOpenId(null)} onGo={setOpenId} />}
    </div>
  );
}

function NodePanel({ node, onClose, onGo }: { node: MapNode; onClose: () => void; onGo: (id: string) => void }) {
  const needs = LINKS.filter((l) => l.to === node.id).map((l) => byId.get(l.from)!);
  const opens = LINKS.filter((l) => l.from === node.id).map((l) => byId.get(l.to)!);
  const weakNeed = needs.find((n) => n.weak);
  const next = Math.min(node.level + 1, 5);
  return (
    <>
      <button type="button" className="bdk-backdrop" aria-label="Đóng" onClick={onClose} />
      <aside className="bdk-panel" role="dialog" aria-modal="true" aria-labelledby="bdk-panel-title">
        <header className="bdk-panel-head">
          <img src={node.icon} alt="" />
          <div>
            <p className="bdk-muted">Toán 4 · {node.level ? `Mức L${node.level} · ${LEVEL_NAMES[node.level]}` : 'Chưa học'}</p>
            <h2 id="bdk-panel-title">{node.name}</h2>
          </div>
          <button type="button" className="bdk-close" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        </header>

        <ol className="bdk-levels" aria-label="Các mức">
          {[1, 2, 3, 4, 5].map((l) => (
            <li key={l} className={l <= node.level ? 'is-on' : l === next && node.level < 5 ? 'is-next' : ''}>
              <b>L{l}</b><span>{LEVEL_NAMES[l]}</span>
            </li>
          ))}
        </ol>
        {node.level < 5 && <p className="bdk-goal">Làm đúng 8/10 câu để lên <b>L{next} · {LEVEL_NAMES[next]}</b>.</p>}

        {weakNeed && (
          <div className="bdk-warn">
            <img src="/brand/milo-sm.webp" alt="" />
            <p>Bài này cần <b>{weakNeed.name}</b>. Milo thấy em còn hay nhầm ở đó. Mình ôn 5 phút trước nhé!</p>
            <button type="button" onClick={() => onGo(weakNeed.id)}>Ôn ngay <ChevronRight aria-hidden="true" /></button>
          </div>
        )}
        {node.weak && (
          <div className="bdk-warn">
            <img src="/brand/milo-sm.webp" alt="" />
            <p>Mấy lần gần đây em hay nhầm ở đây. Thử mẹo bên dưới rồi luyện lại 5 câu nhé!</p>
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
            {needs.length > 0 && <><h3>Cần biết trước</h3><Chips list={needs} onGo={onGo} /></>}
            {opens.length > 0 && <><h3>Học xong sẽ mở</h3><Chips list={opens} onGo={onGo} /></>}
          </section>
        )}

        <footer className="bdk-panel-foot">
          <a href="#luyen" className="bdk-cta is-big"><Play aria-hidden="true" /> {node.level ? 'Luyện 5 câu' : 'Bắt đầu học'}</a>
        </footer>
      </aside>
    </>
  );
}

function Chips({ list, onGo }: { list: MapNode[]; onGo: (id: string) => void }) {
  return (
    <div className="bdk-chips">
      {list.map((n) => (
        <button key={n.id} type="button" className={`bdk-chip ${stateOf(n)}`} onClick={() => onGo(n.id)}>
          <img src={n.icon} alt="" />{n.name}
        </button>
      ))}
    </div>
  );
}
