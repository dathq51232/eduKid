'use client';

// Phòng triển lãm: xem dạng phòng 3D (đi lại, bấm tranh để xem lớn) hoặc dạng lưới ảnh (máy yếu, điện thoại cũ).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Heart, LayoutGrid, Maximize2, Minimize2, Star } from 'lucide-react';
import ArtViewer from './ArtViewer';
import { THEMES, KIND_LABEL, WALL_LABEL, fmtDate, wallOrder, type GalleryItem, type GalleryKind, type HeartEmoji, type ThemeKey, type WallSizes } from '@/lib/gallery/types';
import type { GalleryScene, Layout, Pose, RoomItem } from '@/lib/gallery/room';

type Mode = '3d' | 'grid';
const KINDS: GalleryKind[] = ['praise', 'art', 'writing'];
const MODE_KEY = 'edukid:trien-lam-mode';

function preferGrid() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'grid' || saved === '3d') return saved === 'grid';
  } catch { /* bỏ qua */ }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (navigator.hardwareConcurrency || 4) <= 2;
}

export default function GalleryView({ items, className, theme, mine, canHeart, onHeart, banner, tools, sizes, selected, onSelect, editPanel }: {
  items: GalleryItem[]; className: string; theme: ThemeKey; mine: string[]; canHeart: boolean;
  onHeart?: (id: string, e: HeartEmoji) => Promise<void> | void; banner?: React.ReactNode; tools?: React.ReactNode;
  /** cỡ khung từng tường; chế độ sắp xếp: bấm tranh để chọn (onSelect) thay vì mở xem lớn */
  sizes?: WallSizes; selected?: string | null; onSelect?: (id: string | null) => void; editPanel?: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>('3d');
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => { if (preferGrid()) setMode('grid'); setReady(true); }, []);
  const pick = (m: Mode) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* bỏ qua */ } };

  const sorted = useMemo(() => KINDS.flatMap((k) => items.filter((i) => i.kind === k).sort(wallOrder)), [items]);
  const shown = useMemo(() => sorted.filter((i) => i.status === 'shown'), [sorted]);
  const pickItem = (id: string) => { if (onSelect) onSelect(id); else setOpen(id); };
  const isMine = (i: GalleryItem) => !!i.student_id && mine.includes(i.student_id);
  const myItems = useMemo(() => items.filter(isMine), [items, mine]); // eslint-disable-line react-hooks/exhaustive-deps
  // thứ tự xem lớn: theo tường
  const order = mode === 'grid' ? sorted : shown;
  const sceneRef = useRef<GalleryScene | null>(null);
  const [mineIdx, setMineIdx] = useState(0);
  const goMine = () => {
    const list = myItems.filter((i) => i.status === 'shown');
    if (!list.length) return;
    const it = list[mineIdx % list.length];
    setMineIdx((n) => n + 1);
    if (mode === '3d' && sceneRef.current) { sceneRef.current.focus(it.id); setTimeout(() => setOpen(it.id), 650); }
    else setOpen(it.id);
  };

  return (
    <section className={`gv${full ? ' is-full' : ''}${onSelect ? ' is-edit' : ''}`} aria-label={`Phòng triển lãm lớp ${className}`}>
      <div className="gv-bar">
        <div className="gv-seg" role="radiogroup" aria-label="Cách xem">
          <button type="button" role="radio" aria-checked={mode === '3d'} className={mode === '3d' ? 'is-on' : ''} onClick={() => pick('3d')} disabled={noGL}><Box aria-hidden="true" /> Phòng 3D</button>
          <button type="button" role="radio" aria-checked={mode === 'grid'} className={mode === 'grid' ? 'is-on' : ''} onClick={() => pick('grid')}><LayoutGrid aria-hidden="true" /> Dạng lưới</button>
        </div>
        {myItems.some((i) => i.status === 'shown') && (
          <button type="button" className="btn btn-primary btn-sm gv-mine" onClick={goMine}><Star aria-hidden="true" /> Đi tới tác phẩm của con ({myItems.filter((i) => i.status === 'shown').length})</button>
        )}
        {tools}
        {mode === '3d' && <button type="button" className="gv-icon" onClick={() => setFull((f) => !f)} aria-label={full ? 'Thu nhỏ' : 'Toàn màn hình'} title={full ? 'Thu nhỏ' : 'Toàn màn hình'}>{full ? <Minimize2 /> : <Maximize2 />}</button>}
      </div>
      {banner}
      {noGL && <p className="adm-alert is-info">Máy này chưa xem được phòng 3D, đang hiện dạng lưới.</p>}
      {ready && mode === '3d' && !noGL && (
        <Room3D items={shown} className={className} theme={theme} mine={mine} onOpen={pickItem} sceneRef={sceneRef} onFail={() => { setNoGL(true); setMode('grid'); }}
          sizes={sizes} selected={selected ?? null} editing={!!onSelect} />
      )}
      {ready && mode === 'grid' && <Grid items={sorted} mine={mine} onOpen={pickItem} selected={selected ?? null} />}
      {editPanel}
      {open && <ArtViewer list={order} id={open} onClose={() => setOpen(null)} onGo={(id) => { setOpen(id); if (mode === '3d') sceneRef.current?.focus(id); }} onHeart={onHeart} canHeart={canHeart} />}
    </section>
  );
}

/* ------------------------------------------------------------ phòng 3D */
function Room3D({ items, className, theme, mine, onOpen, sceneRef, onFail, sizes, selected, editing }: {
  items: GalleryItem[]; className: string; theme: ThemeKey; mine: string[]; onOpen: (id: string) => void;
  sceneRef: React.MutableRefObject<GalleryScene | null>; onFail: () => void; sizes?: WallSizes; selected: string | null; editing: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [hint, setHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHint(false), 8000); return () => clearTimeout(t); }, []);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const roomItems: RoomItem[] = useMemo(() => items.map((i) => ({
    id: i.id, kind: i.kind, url: i.url, w: i.w, h: i.h, name: i.student_name ?? '', title: i.title, mine: !!i.student_id && mine.includes(i.student_id), scale: i.scale,
  })), [items, mine]);
  const [built, setBuilt] = useState<GalleryScene | null>(null);

  useEffect(() => {
    let live = true;
    let sc: GalleryScene | null = null;
    void import('@/lib/gallery/room').then(({ GalleryScene: GS, hasWebGL }) => {
      if (!live || !host.current) return;
      if (!hasWebGL()) { onFail(); return; }
      try {
        sc = new GS(host.current, THEMES[theme], { onOpen: (id) => openRef.current(id), onPose: setPose });
        sceneRef.current = sc;
        setBuilt(sc);
      } catch { onFail(); }
    }).catch(onFail);
    return () => { live = false; sc?.dispose(); if (sceneRef.current === sc) sceneRef.current = null; setBuilt(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dựng lại sân khấu khi đổi chủ đề / lớp
  }, [theme, className]);
  // xếp lại tranh (đổi danh sách, cỡ khung): giữ nguyên chỗ đang đứng nếu đã dựng phòng
  const firstBuild = useRef(true);
  useEffect(() => {
    if (!built) { firstBuild.current = true; return; }
    built.setItems(roomItems, className, { sizes, keepCam: !firstBuild.current });
    firstBuild.current = false;
    setLayout(built.layoutInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi tranh / cỡ khung đổi
  }, [built, roomItems, sizes]);
  useEffect(() => { built?.setSelected(selected); }, [built, selected, layout]);

  const hold = (f: number, s: number, t = 0) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); sceneRef.current?.setMove(f, s, t); setHint(false); },
    onPointerUp: () => sceneRef.current?.setMove(0, 0, 0),
    onPointerLeave: () => sceneRef.current?.setMove(0, 0, 0),
    onPointerCancel: () => sceneRef.current?.setMove(0, 0, 0),
  });

  return (
    <div className="gr" >
      <div ref={host} className="gr-host" tabIndex={0} aria-label="Phòng triển lãm 3D. Dùng phím mũi tên để đi, kéo chuột để nhìn quanh, bấm vào tranh để xem lớn." onPointerDown={() => setHint(false)} />
      {hint && <p className="gr-hint">{editing ? 'Bấm vào một khung để chọn, rồi dùng bảng Sắp xếp để dời chỗ, phóng to / thu nhỏ, sửa, xoá' : 'Kéo để nhìn quanh · phím mũi tên / nút bên dưới để đi · bấm vào tranh để xem lớn'}</p>}
      {layout && pose && <MiniMap layout={layout} pose={pose} onGo={(x, z) => sceneRef.current?.goTo(x, z)} onPick={(id) => { sceneRef.current?.focus(id); }} />}
      <div className="gr-pad" aria-label="Nút di chuyển">
        <button type="button" className="p-up" aria-label="Đi tới" {...hold(1, 0)}><ArrowUp /></button>
        <button type="button" className="p-left" aria-label="Quay trái" {...hold(0, 0, 1)}><ArrowLeft /></button>
        <button type="button" className="p-down" aria-label="Lùi lại" {...hold(-1, 0)}><ArrowDown /></button>
        <button type="button" className="p-right" aria-label="Quay phải" {...hold(0, 0, -1)}><ArrowRight /></button>
      </div>
    </div>
  );
}

const KCOL: Record<GalleryKind, string> = { praise: '#f59e0b', art: '#ec4899', writing: '#2563eb' };
function MiniMap({ layout, pose, onGo, onPick }: { layout: Layout; pose: Pose; onGo: (x: number, z: number) => void; onPick: (id: string) => void }) {
  const S = 132;
  const k = S / Math.max(layout.W, layout.L);
  const w = layout.W * k, h = layout.L * k;
  const px = (x: number) => (x + layout.W / 2) * k, pz = (z: number) => (z + layout.L / 2) * k;
  return (
    <div className="gr-map" aria-label="Bản đồ phòng">
      <svg width={w + 8} height={h + 8} viewBox={`-4 -4 ${w + 8} ${h + 8}`} role="img" aria-label="Bản đồ nhỏ: bấm để đi tới chỗ đó"
        onClick={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * (w + 8) - 4, z = ((e.clientY - r.top) / r.height) * (h + 8) - 4;
          onGo(x / k - layout.W / 2, z / k - layout.L / 2);
        }}>
        <rect x={0} y={0} width={w} height={h} rx={3} className="gm-floor" />
        <line x1={0} y1={0} x2={w} y2={0} stroke={KCOL.praise} strokeWidth={3} />
        <line x1={0} y1={0} x2={0} y2={h} stroke={KCOL.art} strokeWidth={3} />
        <line x1={w} y1={0} x2={w} y2={h} stroke={KCOL.writing} strokeWidth={3} />
        <rect x={w / 2 - 8} y={h - 2} width={16} height={4} fill="#6b7280" />
        {layout.slots.map((s) => (
          <circle key={s.id} cx={px(s.x)} cy={pz(s.z)} r={s.mine ? 3.6 : 2.2} fill={s.mine ? '#facc15' : KCOL[s.kind]} stroke={s.mine ? '#92400e' : 'none'}
            onClick={(e) => { e.stopPropagation(); onPick(s.id); }} style={{ cursor: 'pointer' }} />
        ))}
        <g transform={`translate(${px(pose.x)} ${pz(pose.z)}) rotate(${(-pose.yaw * 180) / Math.PI})`}>
          <path d="M0 -7 L5 5 L0 2 L-5 5 Z" fill="#111827" stroke="#fff" strokeWidth={1.2} />
        </g>
      </svg>
      <div className="gm-key"><i style={{ background: KCOL.praise }} />Thư khen <i style={{ background: KCOL.art }} />Tranh <i style={{ background: KCOL.writing }} />Chữ</div>
    </div>
  );
}

/* ------------------------------------------------------------ dạng lưới */
function Grid({ items, mine, onOpen, selected }: { items: GalleryItem[]; mine: string[]; onOpen: (id: string) => void; selected: string | null }) {
  const [tab, setTab] = useState<GalleryKind | 'all'>('all');
  const list = items.filter((i) => tab === 'all' || i.kind === tab);
  return (
    <div className="gg">
      <div className="gg-tabs" role="tablist" aria-label="Loại tác phẩm">
        {(['all', ...KINDS] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>
            {k === 'all' ? 'Tất cả' : WALL_LABEL[k]} <span>{k === 'all' ? items.length : items.filter((i) => i.kind === k).length}</span>
          </button>
        ))}
      </div>
      {!list.length && <p className="dash-muted">Chưa có tác phẩm nào.</p>}
      <ul className="gg-list">
        {list.map((it) => {
          const my = !!it.student_id && mine.includes(it.student_id);
          return (
            <li key={it.id} className={`gg-card${my ? ' is-mine' : ''}${selected === it.id ? ' is-sel' : ''}`}>
              <button type="button" onClick={() => onOpen(it.id)} aria-label={`Xem ${KIND_LABEL[it.kind]} của ${it.student_name || 'cả lớp'}`}>
                <span className="gg-thumb" style={{ aspectRatio: `${Math.max(0.6, Math.min(1.8, it.w / it.h))}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.url && <img src={it.url} alt="" loading="lazy" />}
                  {it.status !== 'shown' && <em className="gg-badge">{it.status === 'pending' ? 'Chờ duyệt' : 'Đang ẩn'}</em>}
                  {my && <em className="gg-star" aria-label="Tác phẩm của con"><Star /></em>}
                </span>
                <b>{it.student_name || 'Cả lớp'}</b>
                <small>{it.title || KIND_LABEL[it.kind]} · {fmtDate(it.taken_on)}</small>
                {it.hearts > 0 && <small className="gg-h"><Heart aria-hidden="true" /> {it.hearts}</small>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
