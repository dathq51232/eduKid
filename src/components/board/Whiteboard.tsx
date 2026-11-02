'use client';

// Bảng trắng cho giáo viên (11/2026): bút có đầu / đuôi nét thanh nhọn, hình phẳng có số đo, hình khối, chữ,
// đồ dùng Toán (tia số, phân số, đồng hồ, que tính, khối trăm-chục-đơn vị), hình dán, thước kẻ, êke, thước đo góc, compa.
// Nhiều trang, hoàn tác / làm lại, phóng to, toàn màn hình, xuất ảnh PNG / in. Bảng tự lưu trên máy này (theo lớp).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  ArrowDownToLine, ArrowUpToLine, Box, Calculator, ChevronLeft, ChevronRight, Copy, DraftingCompass, Download, Gauge, Hand, Magnet,
  Maximize, Minimize, MousePointer2, PenLine, Plus, Printer, Redo2, RotateCcw, Ruler, Shapes, Sticker, Trash2, Triangle, Type, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import PenSettings, { DEFAULT_PEN, PEN_COLORS, type PenState } from '@/components/writing/PenSettings';
import { BRUSH, type InkPt } from '@/lib/writing/ink';
import { loadPraiseFonts } from '@/lib/praise/render';
import {
  BG_LABEL, CM, PH, PW, SHAPES, SOLIDS, STICKERS, hit, isDark, keepRatio, newBoard, toLocal, toWorld, uid,
  type Bg, type Board, type InkItem, type Item, type MathData, type MathItem, type ShapeItem, type ShapeKind, type SolidKind, type TextItem,
} from '@/lib/board/types';
import { ItemView, ShapeIcon, TEXT_FONT, mathSize } from './BoardItems';
import InstrumentsLayer, { edgeSnap, type Instruments, type InstKey } from './Instruments';

type Tool = 'select' | 'hand' | 'pen' | 'text' | 'shape' | 'solid' | 'math' | 'sticker' | 'compass';
type Drag =
  | { t: 'pan'; sx: number; sy: number; cx: number; cy: number }
  | { t: 'ink'; pts: InkPt[]; snap: ((x: number, y: number) => [number, number]) | null }
  | { t: 'erase' }
  | { t: 'box'; x0: number; y0: number }
  | { t: 'move'; id: string; ox: number; oy: number; sx: number; sy: number; tap?: () => void }
  | { t: 'resize'; id: string; ax: number; ay: number; w0: number; h0: number }
  | { t: 'rotate'; id: string }
  | { t: 'inst'; k: InstKey; part: string; ox: number; oy: number }
  | { t: 'compass'; part: 'new' | 'move' | 'radius' | 'arc'; last: number; sweep: number; pts: InkPt[]; ox: number; oy: number }
  | { t: 'hand'; id: string; which: 'h' | 'm' };

// chỗ đặt dụng cụ khi mới bật (theo khung đang nhìn), không chồng lên nhau
const INST_AT: Record<InstKey, (x: number, y: number, w: number, h: number) => { x: number; y: number; rot: number }> = {
  ruler: (x, y, w, h) => ({ x: x + w * 0.08, y: y + h * 0.12, rot: 0 }),
  square: (x, y, w, h) => ({ x: x + w * 0.06, y: y + h * 0.42, rot: 0 }),
  protractor: (x, y, w, h) => ({ x: x + w * 0.7, y: y + h * 0.85, rot: 0 }),
};
const KEY = (classId: string) => `edukid:bang-trang:${classId}`;
const TOOL_LABEL: Record<Tool, string> = { select: 'Chọn', hand: 'Kéo bảng', pen: 'Bút', text: 'Chữ', shape: 'Hình', solid: 'Khối', math: 'Toán', sticker: 'Hình dán', compass: 'Compa' };
const FILL_COLORS = ['none', '#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe', '#fed7aa'];
const KIND_LABEL = (it: Item) => it.kind === 'ink' ? 'Nét bút' : it.kind === 'shape' ? SHAPES.find((s) => s.k === it.shape)?.label ?? 'Hình'
  : it.kind === 'solid' ? SOLIDS.find((s) => s.k === it.solid)?.label ?? 'Khối' : it.kind === 'text' ? 'Chữ' : it.kind === 'sticker' ? 'Hình dán'
    : ({ numberline: 'Tia số', fraction: 'Phân số', clock: 'Đồng hồ', sticks: 'Que tính', blocks: 'Khối trăm – chục – đơn vị' } as const)[it.tool];

function readBoard(classId: string): Board {
  try { const b = JSON.parse(localStorage.getItem(KEY(classId)) ?? 'null') as Board | null; if (b?.pages?.length) return { pages: b.pages, cur: Math.min(b.cur ?? 0, b.pages.length - 1) }; } catch { /* bỏ qua */ }
  return newBoard();
}

let measureCtx: CanvasRenderingContext2D | null = null;
function measureText(text: string, size: number, font: TextItem['font']): [number, number] {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  const c = measureCtx!;
  c.font = `${font === 'script' ? 600 : 700} ${size}px ${TEXT_FONT[font]}`;
  const lines = text.split('\n');
  return [Math.max(...lines.map((l) => c.measureText(l || ' ').width)) + 10, lines.length * size * 1.25 + size * 0.3];
}

export default function Whiteboard({ classId }: { classId: string }) {
  const [board, setBoard] = useState<Board>(() => newBoard());
  const [loaded, setLoaded] = useState(false);
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [pen, setPen] = useState<PenState>({ ...DEFAULT_PEN, size: 1.2 });
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rect');
  const [shapeStyle, setShapeStyle] = useState({ stroke: '#1e3a8a', fill: 'none', sw: 4, dash: false, measure: true });
  const [solidKind, setSolidKind] = useState<SolidKind>('cube');
  const [solidStyle, setSolidStyle] = useState({ color: '#2563eb', hidden: true });
  const [textStyle, setTextStyle] = useState<{ size: number; color: string; font: TextItem['font'] }>({ size: 40, color: '#1e3a8a', font: 'print' });
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [snapGrid, setSnapGrid] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [ins, setIns] = useState<Instruments>({});
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([PW / 2, PH / 2]);
  const [draft, setDraft] = useState<Item | null>(null);
  const [live, setLive] = useState<InkItem | null>(null);
  const [poly, setPoly] = useState<[number, number][]>([]);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [full, setFull] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [delAsk, setDelAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const drag = useRef<Drag | null>(null);
  const editStart = useRef<string | null>(null);
  const penSeen = useRef(false);
  const boardRef = useRef(board); boardRef.current = board;

  const page = board.pages[board.cur];
  const items = page.items;
  const dark = isDark(page.bg);
  const selItem = items.find((i) => i.id === sel) ?? null;

  // tải bảng đã lưu + phông chữ
  useEffect(() => { setBoard(readBoard(classId)); setLoaded(true); void loadPraiseFonts(); }, [classId]);
  // tự lưu (chậm 0,6 giây)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY(classId), JSON.stringify(board)); }
      catch { setMsg('Bảng quá đầy, máy không lưu thêm được. Hãy xuất ảnh rồi xoá bớt trang.'); }
    }, 600);
    return () => clearTimeout(t);
  }, [board, classId, loaded]);

  /* ---------- lịch sử ---------- */
  const snap = () => JSON.stringify(boardRef.current);
  const commit = useCallback((next: Board) => {
    setPast((p) => [...p.slice(-80), JSON.stringify(boardRef.current)]); setFuture([]);
    setBoard(next); boardRef.current = next;
  }, []);
  const setItems = useCallback((fn: (l: Item[]) => Item[], record = true) => {
    const b = boardRef.current;
    const next: Board = { ...b, pages: b.pages.map((p, i) => i === b.cur ? { ...p, items: fn(p.items) } : p) };
    if (record) commit(next); else { setBoard(next); boardRef.current = next; }
  }, [commit]);
  const patch = (id: string, p: Partial<Item>, record = true) => setItems((l) => l.map((it) => it.id === id ? ({ ...it, ...p } as Item) : it), record);
  const beginEdit = () => { editStart.current = snap(); };
  const endEdit = () => {
    const s = editStart.current; editStart.current = null;
    if (s && s !== snap()) { setPast((p) => [...p.slice(-80), s]); setFuture([]); }
  };
  const undo = () => { const p = past.at(-1); if (!p) return; setPast(past.slice(0, -1)); setFuture((f) => [snap(), ...f]); const b = JSON.parse(p) as Board; setBoard(b); boardRef.current = b; setSel(null); };
  const redo = () => { const f = future[0]; if (!f) return; setFuture(future.slice(1)); setPast((p) => [...p, snap()]); const b = JSON.parse(f) as Board; setBoard(b); boardRef.current = b; setSel(null); };

  /* ---------- toạ độ / khung nhìn ---------- */
  const vw = PW / zoom, vh = PH / zoom;
  const vx = Math.min(PW - vw, Math.max(0, center[0] - vw / 2)), vy = Math.min(PH - vh, Math.max(0, center[1] - vh / 2));
  const toBoard = (e: { clientX: number; clientY: number }): [number, number] => {
    const svg = svgRef.current!, m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  const gridStep = CM / 2;
  const sg = (v: number) => (snapGrid ? Math.round(v / gridStep) * gridStep : v);
  const zoomTo = (z: number, at?: [number, number]) => {
    const nz = Math.min(4, Math.max(1, Math.round(z * 100) / 100));
    if (at) { const k = zoom / nz; setCenter([at[0] + (center[0] - at[0]) * k, at[1] + (center[1] - at[1]) * k]); }
    if (nz === 1) setCenter([PW / 2, PH / 2]);
    setZoom(nz);
  };
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); const p = toBoard(e); zoomTo(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p); }
      else if (zoom > 1) { e.preventDefault(); setCenter(([cx, cy]) => [cx + (e.shiftKey ? e.deltaY : e.deltaX) / zoom, cy + (e.shiftKey ? 0 : e.deltaY) / zoom]); }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  });

  /* ---------- thêm vật ---------- */
  const add = (it: Item, select = true) => { setItems((l) => [...l, it]); if (select) setSel(it.id); };
  const addMath = (d: MathData) => {
    const tmp = { id: uid(), x: 0, y: 0, w: 0, h: 0, rot: 0, kind: 'math', ...d } as MathItem;
    const [W, H] = mathSize(tmp);
    const k = Math.min(1, (vw * 0.6) / W, (vh * 0.6) / H);
    add({ ...tmp, w: W * k, h: H * k, x: center[0] - (W * k) / 2, y: center[1] - (H * k) / 2 });
    setTool('select');
  };
  // đổi thông số đồ dùng Toán: giữ chiều cao, cập nhật bề rộng theo nội dung
  const patchMath = (it: MathItem, p: Partial<MathData>) => {
    const n = { ...it, ...p } as MathItem;
    const [W, H] = mathSize(n), [W0, H0] = mathSize(it);
    const k = it.h / H0 || 1;
    if (W !== W0 || H !== H0) { n.h = H * k; n.w = W * k; }
    patch(it.id, n);
  };
  const setText = (it: TextItem, p: Partial<TextItem>) => {
    const n = { ...it, ...p };
    const [ow, oh] = measureText(n.text, n.size, n.font);
    const k = it.w / (it.ow || 1);
    patch(it.id, { ...p, ow, oh, w: ow * k, h: oh * k } as Partial<Item>);
  };

  /* ---------- con trỏ ---------- */
  const eraseAt = (x: number, y: number) => {
    const l = boardRef.current.pages[boardRef.current.cur].items;
    for (let i = l.length - 1; i >= 0; i--) if (l[i].kind === 'ink' && hit(l[i], x, y, Math.max(8, pen.size * 8))) { const id = l[i].id; setItems((a) => a.filter((it) => it.id !== id), false); return; }
  };
  const topHit = (x: number, y: number) => { for (let i = items.length - 1; i >= 0; i--) if (hit(items[i], x, y, 10 / zoom)) return items[i]; return null; };

  const finishPoly = (pts: [number, number][]) => {
    setPoly([]);
    if (pts.length < 3) return;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(8, Math.max(...xs) - x), h = Math.max(8, Math.max(...ys) - y);
    add({ id: uid(), kind: 'shape', shape: 'poly', x, y, w, h, rot: 0, ...shapeStyle, pts: pts.map(([a, b]) => [(a - x) / w, (b - y) / h]) }, false);
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (penSeen.current && e.pointerType === 'touch' && tool === 'pen') return; // đang dùng bút cảm ứng: bỏ qua lòng bàn tay
    const [x, y] = toBoard(e);
    const target = e.target as Element;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDelAsk(false);
    if (tool === 'hand' || e.button === 1) { drag.current = { t: 'pan', sx: e.clientX, sy: e.clientY, cx: center[0], cy: center[1] }; return; }
    if (tool === 'pen') {
      if (pen.tool === 'erase' || e.button === 5) { beginEdit(); drag.current = { t: 'erase' }; eraseAt(x, y); return; }
      const s = edgeSnap(ins, x, y, 24 / Math.sqrt(zoom), (5 * BRUSH[pen.brush].mul * pen.size) / 2 + 1.5);
      const p0 = s ? s(x, y) : [x, y];
      drag.current = { t: 'ink', pts: [[p0[0], p0[1], e.pressure || 0.5]], snap: s };
      setLive(mkInk([[p0[0], p0[1], e.pressure || 0.5]], false));
      return;
    }
    if (tool === 'text') {
      const h = topHit(x, y);
      if (h?.kind === 'text') { setSel(h.id); setTool('select'); return; }
      const t = 'Chữ';
      const [ow, oh] = measureText(t, textStyle.size, textStyle.font);
      add({ id: uid(), kind: 'text', text: t, x, y: y - oh / 2, w: ow, h: oh, ow, oh, rot: 0, ...textStyle });
      setTool('select');
      setTimeout(() => { textRef.current?.focus(); textRef.current?.select(); }, 30);
      return;
    }
    if (tool === 'shape' && shapeKind === 'poly') {
      const p: [number, number] = [sg(x), sg(y)];
      if (poly.length >= 3 && Math.hypot(p[0] - poly[0][0], p[1] - poly[0][1]) < 16 / zoom) { finishPoly(poly); return; }
      setPoly([...poly, p]);
      return;
    }
    if (tool === 'shape' || tool === 'solid') { drag.current = { t: 'box', x0: tool === 'shape' ? sg(x) : x, y0: tool === 'shape' ? sg(y) : y }; return; }
    if (tool === 'sticker') { add({ id: uid(), kind: 'sticker', src: sticker, x: x - 55, y: y - 55, w: 110, h: 110, rot: 0 }, false); return; }
    if (tool === 'compass') {
      const c = ins.compass;
      if (!c) { setIns({ ...ins, compass: { cx: x, cy: y, r: 0, a: 0 } }); drag.current = { t: 'compass', part: 'new', last: 0, sweep: 0, pts: [], ox: 0, oy: 0 }; return; }
      const a0 = Math.atan2(y - c.cy, x - c.cx);
      const start: InkPt = [c.cx + Math.cos(a0) * c.r, c.cy + Math.sin(a0) * c.r, 0.5];
      setIns({ ...ins, compass: { ...c, a: a0 } });
      drag.current = { t: 'compass', part: 'arc', last: a0, sweep: 0, pts: [start], ox: 0, oy: 0 };
      return;
    }
    // chọn / bấm
    const selNow = selItem;
    if (selNow && selNow.kind === 'math' && hit(selNow, x, y)) {
      const part = target.closest('[data-part]'), tick = target.closest('[data-tick]'), hand = target.closest('[data-hand]');
      if (selNow.tool === 'clock' && hand) { beginEdit(); drag.current = { t: 'hand', id: selNow.id, which: hand.getAttribute('data-hand') as 'h' | 'm' }; return; }
      // bấm (không kéo) vào phần phân số / vạch tia số: tô / chấm điểm; kéo thì di chuyển cả hình
      let tap: (() => void) | undefined;
      if (selNow.tool === 'fraction' && part) { const i = Number(part.getAttribute('data-part')); tap = () => patchMath(selNow, { on: selNow.on.includes(i) ? selNow.on.filter((v) => v !== i) : [...selNow.on, i] }); }
      if (selNow.tool === 'numberline' && tick) { const v = Number(tick.getAttribute('data-tick')); tap = () => patchMath(selNow, { marks: [...selNow.marks, v] }); }
      if (tap) { beginEdit(); drag.current = { t: 'move', id: selNow.id, ox: x - selNow.x, oy: y - selNow.y, sx: e.clientX, sy: e.clientY, tap }; return; }
    }
    const h = topHit(x, y);
    if (!h) { setSel(null); if (zoom > 1) drag.current = { t: 'pan', sx: e.clientX, sy: e.clientY, cx: center[0], cy: center[1] }; return; }
    setSel(h.id); beginEdit();
    drag.current = { t: 'move', id: h.id, ox: x - h.x, oy: y - h.y, sx: e.clientX, sy: e.clientY };
  };

  const mkInk = (pts: InkPt[], done: boolean): InkItem => {
    const size = 5 * BRUSH[pen.brush].mul * pen.size;
    const taper: [number, number] = pen.brush === 'marker' ? [0, 0] : [pen.taperStart, pen.taperEnd];
    if (!done) return { id: 'live', kind: 'ink', pts, x: 0, y: 0, w: PW, h: PH, ow: PW, oh: PH, rot: 0, color: pen.color, size, brush: pen.brush, taper };
    const pad = size * 1.2;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad, w = Math.max(...xs) - x + pad, h = Math.max(...ys) - y + pad;
    return { id: uid(), kind: 'ink', pts: pts.map(([a, b, p]) => [Math.round((a - x) * 10) / 10, Math.round((b - y) * 10) / 10, p === undefined ? undefined : Math.round(p * 100) / 100]), x, y, w, h, ow: w, oh: h, rot: 0, color: pen.color, size, brush: pen.brush, taper };
  };

  const boxItem = (x0: number, y0: number, x1: number, y1: number, shift: boolean): Item | null => {
    if (tool === 'solid') {
      let w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
      if (solidKind === 'cube' || solidKind === 'sphere' || shift) { const m = Math.max(w, h); w = m; h = m; }
      return { id: 'draft', kind: 'solid', solid: solidKind, x: x1 < x0 ? x0 - w : x0, y: y1 < y0 ? y0 - h : y0, w, h, rot: 0, ...solidStyle };
    }
    if (shapeKind === 'line' || shapeKind === 'arrow') {
      let dx = x1 - x0, dy = y1 - y0;
      const a = Math.atan2(dy, dx), L = Math.hypot(dx, dy), step = Math.PI / 12, sa = Math.round(a / step) * step;
      if (shift || Math.abs(sa - a) < 0.07) { dx = Math.cos(sa) * L; dy = Math.sin(sa) * L; }
      if (snapGrid) { dx = sg(x0 + dx) - x0; dy = sg(y0 + dy) - y0; }
      const flip = (dx < 0) !== (dy < 0);
      return { id: 'draft', kind: 'shape', shape: shapeKind, x: Math.min(x0, x0 + dx), y: Math.min(y0, y0 + dy), w: Math.max(0.01, Math.abs(dx)), h: Math.max(0.01, Math.abs(dy)), rot: 0, flip, ...shapeStyle };
    }
    let w = Math.abs(sg(x1) - x0), h = Math.abs(sg(y1) - y0);
    if (shapeKind === 'square' || shapeKind === 'circle' || shift) { const m = Math.max(w, h); w = m; h = m; }
    return { id: 'draft', kind: 'shape', shape: shapeKind, x: x1 < x0 ? x0 - w : x0, y: y1 < y0 ? y0 - h : y0, w, h, rot: 0, ...shapeStyle };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const [x, y] = toBoard(e);
    if (tool === 'shape' && shapeKind === 'poly') setHover([sg(x), sg(y)]);
    if (!d) return;
    switch (d.t) {
      case 'pan': setCenter([d.cx - ((e.clientX - d.sx) / (svgRef.current!.clientWidth || 1)) * vw, d.cy - ((e.clientY - d.sy) / (svgRef.current!.clientHeight || 1)) * vh]); break;
      case 'ink': {
        const evs = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
        for (const ev of evs) { const [a, b] = toBoard(ev); const p = d.snap ? d.snap(a, b) : [a, b]; d.pts.push([p[0], p[1], ev.pressure || 0.5]); }
        setLive(mkInk(d.pts, false));
        break;
      }
      case 'erase': eraseAt(x, y); break;
      case 'box': setDraft(boxItem(d.x0, d.y0, x, y, e.shiftKey)); break;
      case 'move': {
        const it = items.find((i) => i.id === d.id); if (!it) break;
        let nx = x - d.ox, ny = y - d.oy;
        if (snapGrid && it.kind === 'shape') { nx = sg(nx); ny = sg(ny); }
        patch(d.id, { x: nx, y: ny }, false);
        break;
      }
      case 'resize': {
        const it = items.find((i) => i.id === d.id); if (!it) break;
        const a = (-it.rot * Math.PI) / 180, px = x - d.ax, py = y - d.ay;
        let w = Math.max(12, px * Math.cos(a) - py * Math.sin(a)), h = Math.max(12, px * Math.sin(a) + py * Math.cos(a));
        if (keepRatio(it) || e.shiftKey) { const k = Math.max(w / d.w0, h / d.h0); w = d.w0 * k; h = d.h0 * k; }
        const r = (it.rot * Math.PI) / 180;
        const cx = d.ax + (w / 2) * Math.cos(r) - (h / 2) * Math.sin(r), cy = d.ay + (w / 2) * Math.sin(r) + (h / 2) * Math.cos(r);
        patch(d.id, { w, h, x: cx - w / 2, y: cy - h / 2 }, false);
        break;
      }
      case 'rotate': {
        const it = items.find((i) => i.id === d.id); if (!it) break;
        let deg = (Math.atan2(y - (it.y + it.h / 2), x - (it.x + it.w / 2)) * 180) / Math.PI + 90;
        const s15 = Math.round(deg / 15) * 15; if (Math.abs(s15 - deg) < 4 || e.shiftKey) deg = s15;
        patch(d.id, { rot: Math.round(((deg % 360) + 360) % 360) }, false);
        break;
      }
      case 'inst': {
        const cur = ins[d.k]; if (!cur) break;
        if (d.part === 'move') setIns({ ...ins, [d.k]: { ...cur, x: x - d.ox, y: y - d.oy } });
        else {
          let deg = (Math.atan2(y - cur.y, x - cur.x) * 180) / Math.PI - d.ox;
          const s = Math.round(deg / 15) * 15; if (Math.abs(s - deg) < 3) deg = s;
          setIns({ ...ins, [d.k]: { ...cur, rot: Math.round(deg * 2) / 2 } });
        }
        break;
      }
      case 'compass': {
        const c = ins.compass; if (!c) break;
        if (d.part === 'new' || d.part === 'radius') {
          let r = Math.hypot(x - c.cx, y - c.cy);
          if (snapGrid) r = Math.max(gridStep / 2, Math.round(r / (CM / 4)) * (CM / 4));
          setIns({ ...ins, compass: { ...c, r, a: Math.atan2(y - c.cy, x - c.cx) } });
        } else if (d.part === 'move') setIns({ ...ins, compass: { ...c, cx: x - d.ox, cy: y - d.oy } });
        else {
          const a = Math.atan2(y - c.cy, x - c.cx);
          let da = a - d.last; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
          d.last = a; d.sweep += da;
          if (Math.abs(d.sweep) > Math.PI * 2) break;
          const n = Math.max(1, Math.ceil(Math.abs(da) / 0.03));
          const prev = Math.atan2(d.pts[d.pts.length - 1][1] - c.cy, d.pts[d.pts.length - 1][0] - c.cx);
          for (let i = 1; i <= n; i++) { const t = prev + (da * i) / n; d.pts.push([c.cx + Math.cos(t) * c.r, c.cy + Math.sin(t) * c.r, 0.5]); }
          setIns({ ...ins, compass: { ...c, a } });
          setLive({ ...mkInk(d.pts, false), size: 3.2, brush: 'ink', taper: [0, 0] });
        }
        break;
      }
      case 'hand': {
        const it = items.find((i) => i.id === d.id); if (!it || it.kind !== 'math' || it.tool !== 'clock') break;
        const [W, H] = mathSize(it), k = Math.min(it.w / W, it.h / H);
        const [lx, ly] = toLocal(it, x, y);
        const ox = (it.w - W * k) / 2, oy = (it.h - H * k) / 2;
        const deg = ((Math.atan2((ly - oy) / k - 150, (lx - ox) / k - 150) * 180) / Math.PI + 90 + 360) % 360;
        if (d.which === 'm') {
          const m = Math.round(deg / 6) % 60;
          let hour = it.hour;
          if (it.minute >= 45 && m < 15) hour = (hour % 12) + 1; else if (it.minute < 15 && m >= 45) hour = ((hour + 10) % 12) + 1;
          patch(it.id, { minute: m, hour } as Partial<Item>, false);
        } else {
          const total = Math.round(deg * 2) % 720; // phút trong 12 giờ
          const hour = Math.floor(total / 60) || 12, minute = (Math.round((total % 60) / 5) * 5) % 60;
          patch(it.id, { hour, minute } as Partial<Item>, false);
        }
        break;
      }
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    if (d.t === 'move' && d.tap && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) {
      const b = JSON.parse(editStart.current ?? 'null') as Board | null; // bỏ chút xê dịch khi bấm
      if (b) { setBoard(b); boardRef.current = b; }
      editStart.current = null; d.tap(); return;
    }
    if (d.t === 'ink') { setLive(null); if (d.pts.length) add(mkInk(d.pts, true), false); }
    else if (d.t === 'erase' || d.t === 'move' || d.t === 'resize' || d.t === 'rotate' || d.t === 'hand') endEdit();
    else if (d.t === 'box') {
      const it = draft; setDraft(null);
      if (it && (it.w > 6 || it.h > 6)) add({ ...it, id: uid() }, false);
      else if (tool === 'solid') { const s = 160; add({ ...(boxItem(d.x0, d.y0, d.x0 + s, d.y0 + s, false) as Item), id: uid() }, false); }
    } else if (d.t === 'compass') {
      setLive(null);
      if (d.part === 'arc' && d.pts.length > 2) {
        add({ ...mkInk(d.pts, true), size: 3.2, brush: 'ink', taper: [0, 0], color: pen.color }, false);
      }
    }
  };

  const grab = (k: InstKey | 'compass', part: string, e: React.PointerEvent) => {
    const [x, y] = toBoard(e);
    svgRef.current?.setPointerCapture?.(e.pointerId);
    if (k === 'compass') {
      const c = ins.compass!;
      drag.current = { t: 'compass', part: part as 'move' | 'radius', last: 0, sweep: 0, pts: [], ox: x - c.cx, oy: y - c.cy };
      return;
    }
    const cur = ins[k]!;
    if (part === 'move') drag.current = { t: 'inst', k, part, ox: x - cur.x, oy: y - cur.y };
    else drag.current = { t: 'inst', k, part, ox: (Math.atan2(y - cur.y, x - cur.x) * 180) / Math.PI - cur.rot, oy: 0 };
  };

  const startHandle = (kind: 'resize' | 'rotate', e: React.PointerEvent) => {
    if (!selItem) return;
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    beginEdit();
    if (kind === 'rotate') { drag.current = { t: 'rotate', id: selItem.id }; return; }
    const [ax, ay] = toWorld(selItem, 0, 0);
    drag.current = { t: 'resize', id: selItem.id, ax, ay, w0: selItem.w, h0: selItem.h };
  };

  /* ---------- bàn phím ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (tg.closest('input, textarea, select, [contenteditable]')) return;
      if (!wrapRef.current?.isConnected) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (e.key === 'Escape') { setSel(null); setPoly([]); return; }
      if (e.key === 'Enter' && poly.length >= 3) { finishPoly(poly); return; }
      if (!selItem) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
      const step = e.shiftKey ? 10 : 1;
      const mv: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (mv[e.key]) { e.preventDefault(); patch(selItem.id, { x: selItem.x + mv[e.key][0], y: selItem.y + mv[e.key][1] }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ---------- thao tác vật đang chọn ---------- */
  const removeSel = () => { if (!sel) return; setItems((l) => l.filter((i) => i.id !== sel)); setSel(null); };
  const dupSel = () => { if (!selItem) return; const c = { ...JSON.parse(JSON.stringify(selItem)), id: uid(), x: selItem.x + 30, y: selItem.y + 30 } as Item; add(c); };
  const order = (top: boolean) => { if (!selItem) return; setItems((l) => { const r = l.filter((i) => i.id !== selItem.id); return top ? [...r, selItem] : [selItem, ...r]; }); };

  /* ---------- trang ---------- */
  const goPage = (i: number) => { setSel(null); setPoly([]); setBoard((b) => { const n = { ...b, cur: Math.max(0, Math.min(b.pages.length - 1, i)) }; boardRef.current = n; return n; }); };
  const addPage = () => { const b = boardRef.current; commit({ pages: [...b.pages.slice(0, b.cur + 1), { id: uid(), bg: page.bg, items: [] }, ...b.pages.slice(b.cur + 1)], cur: b.cur + 1 }); setSel(null); };
  const delPage = () => {
    if (!delAsk) { setDelAsk(true); return; }
    setDelAsk(false); setSel(null);
    const b = boardRef.current;
    if (b.pages.length === 1) { commit({ pages: [{ ...b.pages[0], items: [] }], cur: 0 }); return; }
    commit({ pages: b.pages.filter((_, i) => i !== b.cur), cur: Math.max(0, b.cur - 1) });
  };
  const setBg = (bg: Bg) => {
    const b = boardRef.current;
    commit({ ...b, pages: b.pages.map((p, i) => i === b.cur ? { ...p, bg } : p) });
    const dk = isDark(bg);
    if (dk && pen.color !== '#ffffff' && pen.brush !== 'marker') setPen({ ...pen, color: '#ffffff' });
    if (!dk && pen.color === '#ffffff') setPen({ ...pen, color: PEN_COLORS[0] });
    setShapeStyle((s) => ({ ...s, stroke: dk ? '#fde047' : s.stroke === '#fde047' ? '#1e3a8a' : s.stroke }));
    setTextStyle((s) => ({ ...s, color: dk ? '#ffffff' : s.color === '#ffffff' ? '#1e3a8a' : s.color }));
  };

  /* ---------- toàn màn hình ---------- */
  useEffect(() => {
    const f = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void wrapRef.current?.requestFullscreen?.(); };

  /* ---------- xuất ảnh / in ---------- */
  const renderPng = async (): Promise<Blob> => {
    const svg = svgRef.current!.cloneNode(true) as SVGSVGElement;
    svg.querySelectorAll('.no-export').forEach((n) => n.remove());
    svg.setAttribute('viewBox', `0 0 ${PW} ${PH}`);
    svg.setAttribute('width', String(PW)); svg.setAttribute('height', String(PH));
    svg.removeAttribute('class'); svg.removeAttribute('style');
    const toData = async (url: string) => {
      const b = await (await fetch(url)).blob();
      return await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(b); });
    };
    for (const im of Array.from(svg.querySelectorAll('image'))) {
      const href = im.getAttribute('href'); if (href && !href.startsWith('data:')) im.setAttribute('href', await toData(href));
    }
    // nhúng phông chữ để chữ trên ảnh giống trên bảng
    try {
      const fonts = [['PraiseBaloo', 'baloo-2', '700'], ['PraiseScript', 'dancing-script', '600']] as const;
      let css = '';
      for (const [fam, file, wt] of fonts) for (const sub of ['latin', 'vietnamese']) css += `@font-face{font-family:${fam};font-weight:${wt};src:url(${await toData(`/fonts/praise/${file}-${sub}-${wt}-normal.woff2`)}) format('woff2');}`;
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style'); st.textContent = css; svg.insertBefore(st, svg.firstChild);
    } catch { /* thiếu phông thì dùng phông dự phòng */ }
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode();
    await new Promise((r) => setTimeout(r, 120));
    const c = document.createElement('canvas'); c.width = PW * 1.25; c.height = PH * 1.25;
    const x = c.getContext('2d')!; x.scale(1.25, 1.25); x.drawImage(img, 0, 0, PW, PH);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Không tạo được ảnh'))), 'image/png'));
  };
  const exportPng = async () => {
    setBusy(true); setMsg(null);
    try {
      const b = await renderPng(), url = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = url; a.download = `bang-trang-trang-${board.cur + 1}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { setMsg('Chưa xuất được ảnh, thử lại nhé.'); } finally { setBusy(false); }
  };
  const printPage = async () => {
    setBusy(true); setMsg(null);
    try {
      const url = URL.createObjectURL(await renderPng());
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
      document.body.appendChild(f);
      const d = f.contentDocument!;
      d.open(); d.write(`<!doctype html><title>Bảng trắng</title><style>@page{size:A4 landscape;margin:8mm}html,body{margin:0}img{width:100%;height:auto;display:block}</style><img src="${url}">`); d.close();
      const im = d.querySelector('img')!;
      await new Promise((r) => { if (im.complete) r(null); else im.onload = () => r(null); });
      f.contentWindow?.focus(); f.contentWindow?.print();
      setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 60000);
    } catch { setMsg('Chưa in được, thử xuất ảnh rồi in.'); } finally { setBusy(false); }
  };

  /* ---------- nền bảng ---------- */
  const bgFill = dark ? '#1f3b2d' : '#ffffff';
  const bgEl = useMemo(() => {
    const line = dark ? '#ffffff' : '#c7d2fe';
    switch (page.bg) {
      case 'oli4': case 'oli5': {
        const n = page.bg === 'oli4' ? 4 : 5, u = 11, cell = u * n;
        return (
          <pattern id="bg-pat" width={cell} height={cell} patternUnits="userSpaceOnUse">
            {Array.from({ length: n }, (_, i) => <line key={i} x1={0} y1={i * u} x2={cell} y2={i * u} stroke="#c4b5fd" strokeWidth={i ? 0.8 : 1.6} />)}
            <line x1={0} y1={0} x2={0} y2={cell} stroke="#c4b5fd" strokeWidth={1.2} />
          </pattern>
        );
      }
      case 'grid': case 'chalk-grid':
        return (
          <pattern id="bg-pat" width={CM} height={CM} patternUnits="userSpaceOnUse">
            <path d={`M${CM} 0H0V${CM}`} fill="none" stroke={line} strokeOpacity={dark ? 0.22 : 1} strokeWidth={1.2} />
            <path d={`M${CM / 2} 0V${CM}M0 ${CM / 2}H${CM}`} fill="none" stroke={line} strokeOpacity={dark ? 0.08 : 0.45} strokeWidth={0.8} />
          </pattern>
        );
      case 'dots':
        return <pattern id="bg-pat" width={CM} height={CM} patternUnits="userSpaceOnUse"><circle cx={0} cy={0} r={2.6} fill="#94a3b8" /><circle cx={CM} cy={0} r={2.6} fill="#94a3b8" /><circle cx={0} cy={CM} r={2.6} fill="#94a3b8" /><circle cx={CM} cy={CM} r={2.6} fill="#94a3b8" /></pattern>;
      default: return null;
    }
  }, [page.bg, dark]);

  /* ---------- khung chọn ---------- */
  const selBox = selItem && (
    <g className="no-export" transform={`translate(${selItem.x} ${selItem.y}) rotate(${selItem.rot} ${selItem.w / 2} ${selItem.h / 2})`}>
      <rect x={-6 / zoom} y={-6 / zoom} width={selItem.w + 12 / zoom} height={selItem.h + 12 / zoom} fill="none" stroke="#7c3aed" strokeWidth={2 / zoom} strokeDasharray={`${8 / zoom} ${6 / zoom}`} pointerEvents="none" />
      <line x1={selItem.w / 2} y1={-6 / zoom} x2={selItem.w / 2} y2={-34 / zoom} stroke="#7c3aed" strokeWidth={2 / zoom} pointerEvents="none" />
      <circle cx={selItem.w / 2} cy={-40 / zoom} r={11 / zoom} fill="#fff" stroke="#7c3aed" strokeWidth={3 / zoom} style={{ cursor: 'grab' }} onPointerDown={(e) => startHandle('rotate', e)} />
      <rect x={selItem.w - 5 / zoom} y={selItem.h - 5 / zoom} width={22 / zoom} height={22 / zoom} rx={5 / zoom} fill="#7c3aed" stroke="#fff" strokeWidth={2 / zoom} style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => startHandle('resize', e)} />
      {selItem.rot !== 0 && <text x={selItem.w / 2 + 20 / zoom} y={-36 / zoom} fontSize={15 / zoom} fontFamily="Arial" fontWeight={700} fill="#7c3aed" pointerEvents="none">{selItem.rot}°</text>}
    </g>
  );

  const cursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : tool === 'pen' && pen.tool === 'erase' ? 'cell' : 'crosshair';
  const toolBtn = (t: Tool, icon: React.ReactNode) => (
    <button type="button" className={`wb-tool${tool === t ? ' is-on' : ''}`} aria-pressed={tool === t} onClick={() => { setTool(t); if (t !== 'shape') setPoly([]); if (t !== 'select') setSel(null); }} title={TOOL_LABEL[t]}>
      {icon}<span>{TOOL_LABEL[t]}</span>
    </button>
  );
  const instBtn = (k: InstKey, icon: React.ReactNode, label: string) => (
    <button type="button" className={`wb-tool${ins[k] ? ' is-on' : ''}`} aria-pressed={!!ins[k]} onClick={() => setIns({ ...ins, [k]: ins[k] ? undefined : INST_AT[k](vx, vy, vw, vh) })} title={label}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className={`wb${full ? ' is-full' : ''}`} ref={wrapRef}>
      <div className="wb-bar" role="toolbar" aria-label="Công cụ bảng trắng">
        <div className="wb-group">
          {toolBtn('select', <MousePointer2 aria-hidden="true" />)}
          {toolBtn('hand', <Hand aria-hidden="true" />)}
          {toolBtn('pen', <PenLine aria-hidden="true" />)}
          {toolBtn('text', <Type aria-hidden="true" />)}
          {toolBtn('shape', <Shapes aria-hidden="true" />)}
          {toolBtn('solid', <Box aria-hidden="true" />)}
          {toolBtn('math', <Calculator aria-hidden="true" />)}
          {toolBtn('sticker', <Sticker aria-hidden="true" />)}
        </div>
        <div className="wb-group">
          {instBtn('ruler', <Ruler aria-hidden="true" />, 'Thước kẻ')}
          {instBtn('square', <Triangle aria-hidden="true" />, 'Êke')}
          {instBtn('protractor', <Gauge aria-hidden="true" />, 'Đo góc')}
          {toolBtn('compass', <DraftingCompass aria-hidden="true" />)}
        </div>
        <div className="wb-group">
          <button type="button" className="wb-tool" onClick={undo} disabled={!past.length} title="Hoàn tác (Ctrl+Z)"><Undo2 aria-hidden="true" /><span>Hoàn tác</span></button>
          <button type="button" className="wb-tool" onClick={redo} disabled={!future.length} title="Làm lại (Ctrl+Y)"><Redo2 aria-hidden="true" /><span>Làm lại</span></button>
          <button type="button" className="wb-tool" onClick={() => zoomTo(zoom / 1.25)} disabled={zoom <= 1} title="Thu nhỏ"><ZoomOut aria-hidden="true" /><span>{Math.round(zoom * 100)}%</span></button>
          <button type="button" className="wb-tool" onClick={() => zoomTo(zoom * 1.25)} disabled={zoom >= 4} title="Phóng to (Ctrl + cuộn chuột)"><ZoomIn aria-hidden="true" /><span>Phóng to</span></button>
          <button type="button" className={`wb-tool${snapGrid ? ' is-on' : ''}`} aria-pressed={snapGrid} onClick={() => setSnapGrid(!snapGrid)} title="Bắt điểm theo lưới 0,5 cm"><Magnet aria-hidden="true" /><span>Bắt lưới</span></button>
        </div>
        <div className="wb-group">
          <label className="wb-bg">Nền
            <select value={page.bg} onChange={(e) => setBg(e.target.value as Bg)}>
              {(Object.keys(BG_LABEL) as Bg[]).map((b) => <option key={b} value={b}>{BG_LABEL[b]}</option>)}
            </select>
          </label>
          <div className="wb-pages" aria-label="Trang bảng">
            <button type="button" onClick={() => goPage(board.cur - 1)} disabled={board.cur === 0} aria-label="Trang trước"><ChevronLeft aria-hidden="true" /></button>
            <b>{board.cur + 1}/{board.pages.length}</b>
            <button type="button" onClick={() => goPage(board.cur + 1)} disabled={board.cur >= board.pages.length - 1} aria-label="Trang sau"><ChevronRight aria-hidden="true" /></button>
            <button type="button" onClick={addPage} title="Thêm trang mới"><Plus aria-hidden="true" /></button>
            <button type="button" onClick={delPage} className={delAsk ? 'is-danger' : ''} title="Xoá trang này">{delAsk ? 'Bấm lần nữa để xoá' : <Trash2 aria-hidden="true" />}</button>
          </div>
          <button type="button" className="wb-tool" onClick={() => void exportPng()} disabled={busy} title="Tải ảnh trang này"><Download aria-hidden="true" /><span>Ảnh PNG</span></button>
          <button type="button" className="wb-tool" onClick={() => void printPage()} disabled={busy} title="In trang này"><Printer aria-hidden="true" /><span>In</span></button>
          <button type="button" className="wb-tool" onClick={toggleFull} title="Toàn màn hình">{full ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}<span>{full ? 'Thu lại' : 'Toàn màn hình'}</span></button>
        </div>
      </div>

      <div className="wb-main">
        <div className="wb-stage" style={{ background: bgFill }}>
          <svg ref={svgRef} className="wb-svg" viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ cursor, touchAction: 'none' }}
            role="img" aria-label={`Bảng trắng, trang ${board.cur + 1}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onPointerLeave={() => setHover(null)} onDoubleClick={() => { if (poly.length >= 3) finishPoly(poly); }}>
            <defs>{bgEl}</defs>
            <rect x={0} y={0} width={PW} height={PH} fill={bgFill} />
            {bgEl && <rect x={0} y={0} width={PW} height={PH} fill="url(#bg-pat)" />}
            {(page.bg === 'oli4' || page.bg === 'oli5') && <line x1={70} y1={0} x2={70} y2={PH} stroke="#f87171" strokeWidth={1.6} />}
            {items.map((it) => <ItemView key={it.id} it={it} dark={dark} />)}
            {draft && <g opacity={0.75}><ItemView it={draft} dark={dark} /></g>}
            {live && <ItemView it={live} dark={dark} />}
            {poly.length > 0 && (
              <g className="no-export" pointerEvents="none">
                <polyline points={[...poly, ...(hover ? [hover] : [])].map((p) => p.join(',')).join(' ')} fill="none" stroke={shapeStyle.stroke} strokeWidth={shapeStyle.sw} strokeDasharray="10 7" />
                {poly.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={(i ? 5 : 9) / zoom} fill={i ? shapeStyle.stroke : '#22c55e'} />)}
              </g>
            )}
            {selBox}
            <InstrumentsLayer ins={ins} grab={grab} zoom={zoom} canDraw={(e) => tool === 'pen' && pen.tool === 'pen' && (e.pointerType === 'pen' || !!edgeSnap(ins, ...toBoard(e), 24 / Math.sqrt(zoom)))} />
          </svg>
          {msg && <p className="wb-msg" role="status">{msg} <button type="button" onClick={() => setMsg(null)} aria-label="Đóng">×</button></p>}
        </div>

        <aside className="wb-side" aria-label="Tuỳ chọn">
          {selItem ? (
            <section className="wb-card">
              <h3>Đang chọn: {KIND_LABEL(selItem)}</h3>
              <div className="wb-actions">
                <button type="button" onClick={dupSel}><Copy aria-hidden="true" /> Nhân bản</button>
                <button type="button" onClick={() => order(true)}><ArrowUpToLine aria-hidden="true" /> Lên trên</button>
                <button type="button" onClick={() => order(false)}><ArrowDownToLine aria-hidden="true" /> Xuống dưới</button>
                {selItem.rot !== 0 && <button type="button" onClick={() => patch(selItem.id, { rot: 0 })}><RotateCcw aria-hidden="true" /> Bỏ xoay</button>}
                <button type="button" className="is-danger" onClick={removeSel}><Trash2 aria-hidden="true" /> Xoá</button>
              </div>
              <SelProps it={selItem} patch={patch} patchMath={patchMath} setText={setText} textRef={textRef} dark={dark} />
              <p className="wb-hint">Kéo để di chuyển · núm tròn để xoay · ô vuông góc dưới để đổi cỡ · phím Delete để xoá.</p>
            </section>
          ) : (
            <section className="wb-card">
              <h3>{TOOL_LABEL[tool]}</h3>
              {tool === 'pen' && <PenSettings value={pen} onChange={setPen} brushes={['fountain', 'ink', 'brush', 'pencil', 'marker']} eraser base={5} dark={dark} />}
              {tool === 'pen' && <p className="wb-hint">Bật <b>Thước kẻ</b> hoặc <b>Êke</b> rồi vẽ sát mép để được nét thẳng. Tẩy nét chỉ xoá nét bút; hình, chữ thì bấm Chọn rồi Xoá.</p>}
              {tool === 'shape' && <>
                <div className="wb-grid">
                  {SHAPES.map((s) => <button key={s.k} type="button" className={shapeKind === s.k ? 'is-on' : ''} aria-pressed={shapeKind === s.k} onClick={() => { setShapeKind(s.k); setPoly([]); }} title={s.label}><ShapeIcon k={s.k} /><small>{s.label}</small></button>)}
                </div>
                <ShapeStyleEdit v={shapeStyle} set={(p) => setShapeStyle({ ...shapeStyle, ...p })} />
                <p className="wb-hint">{shapeKind === 'poly' ? 'Bấm từng đỉnh, bấm lại đỉnh đầu (chấm xanh) hoặc nháy đúp / Enter để khép hình.' : 'Kéo trên bảng để vẽ. Giữ Shift để vẽ hình đều (vuông, tròn) hoặc góc tròn 15°.'}</p>
              </>}
              {tool === 'solid' && <>
                <div className="wb-grid">
                  {SOLIDS.map((s) => <button key={s.k} type="button" className={solidKind === s.k ? 'is-on' : ''} aria-pressed={solidKind === s.k} onClick={() => setSolidKind(s.k)}><ShapeIcon k={s.k} /><small>{s.label}</small></button>)}
                </div>
                <ColorRow label="Màu khối" colors={['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', dark ? '#ffffff' : '#111827']} value={solidStyle.color} set={(c) => setSolidStyle({ ...solidStyle, color: c })} />
                <label className="wb-check"><input type="checkbox" checked={solidStyle.hidden} onChange={(e) => setSolidStyle({ ...solidStyle, hidden: e.target.checked })} /> Vẽ nét khuất (nét đứt)</label>
                <p className="wb-hint">Kéo trên bảng để vẽ khối, hoặc bấm một lần để đặt khối cỡ vừa.</p>
              </>}
              {tool === 'math' && (
                <div className="wb-math">
                  <button type="button" onClick={() => addMath({ tool: 'numberline', from: 0, to: 10, step: 1, marks: [], hops: true })}><b>Tia số</b><small>Bấm vạch để chấm điểm, hiện bước nhảy +/−</small></button>
                  <button type="button" onClick={() => addMath({ tool: 'fraction', shape: 'circle', n: 4, on: [0], label: true })}><b>Phân số – hình tròn</b><small>Bấm từng phần để tô</small></button>
                  <button type="button" onClick={() => addMath({ tool: 'fraction', shape: 'rect', n: 5, on: [0, 1], label: true })}><b>Phân số – băng giấy</b><small>Chia 2 đến 12 phần</small></button>
                  <button type="button" onClick={() => addMath({ tool: 'clock', hour: 9, minute: 0, digital: true })}><b>Đồng hồ</b><small>Kéo kim giờ, kim phút</small></button>
                  <button type="button" onClick={() => addMath({ tool: 'sticks', tens: 2, ones: 3 })}><b>Que tính</b><small>Bó chục và que lẻ</small></button>
                  <button type="button" onClick={() => addMath({ tool: 'blocks', hundreds: 1, tens: 2, ones: 4 })}><b>Khối trăm – chục – đơn vị</b><small>Học cấu tạo số</small></button>
                </div>
              )}
              {tool === 'sticker' && <>
                <div className="wb-stickers">
                  {STICKERS.map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element -- hình dán nhỏ có sẵn trong dự án
                    <button key={s} type="button" className={sticker === s ? 'is-on' : ''} aria-pressed={sticker === s} onClick={() => setSticker(s)}><img src={s} alt="" width={44} height={44} /></button>
                  ))}
                </div>
                <p className="wb-hint">Chọn hình rồi bấm lên bảng để dán (bấm nhiều lần để dán nhiều hình, dùng để đếm).</p>
              </>}
              {tool === 'text' && <>
                <div className="wb-seg">
                  <button type="button" className={textStyle.font === 'print' ? 'is-on' : ''} onClick={() => setTextStyle({ ...textStyle, font: 'print' })}>Chữ in</button>
                  <button type="button" className={textStyle.font === 'script' ? 'is-on' : ''} onClick={() => setTextStyle({ ...textStyle, font: 'script' })} style={{ fontFamily: TEXT_FONT.script }}>Chữ viết</button>
                </div>
                <label className="pen-range">Cỡ chữ <b>{textStyle.size}</b><input type="range" min="18" max="120" value={textStyle.size} onChange={(e) => setTextStyle({ ...textStyle, size: Number(e.target.value) })} /></label>
                <ColorRow label="Màu chữ" colors={PEN_COLORS} value={textStyle.color} set={(c) => setTextStyle({ ...textStyle, color: c })} />
                <p className="wb-hint">Bấm lên bảng để đặt ô chữ rồi gõ nội dung ở khung bên phải.</p>
              </>}
              {tool === 'compass' && <p className="wb-hint">{ins.compass ? <>Kéo quanh tâm để vẽ cung / đường tròn. Kéo <b>chấm vàng</b> để đổi bán kính, kéo <b>tâm</b> để dời compa.</> : 'Đặt mũi nhọn: bấm giữ ở tâm rồi kéo ra để mở compa (bán kính).'}</p>}
              {tool === 'compass' && ins.compass && <button type="button" className="btn btn-outline btn-sm" onClick={() => setIns({ ...ins, compass: undefined })}>Cất compa</button>}
              {(tool === 'select' || tool === 'hand') && <p className="wb-hint">Bấm vào hình, chữ, nét bút để chọn rồi kéo, xoay, đổi cỡ. Đồ dùng Toán: chọn trước rồi bấm vào phần / vạch / kim để tương tác. Ctrl + cuộn chuột để phóng to.</p>}
            </section>
          )}
          <p className="wb-save">Bảng tự lưu trên máy này theo lớp.</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- các khung chỉnh ---------- */
function ColorRow({ label, colors, value, set }: { label: string; colors: string[]; value: string; set: (c: string) => void }) {
  return (
    <div className="wb-colors" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div>
        {colors.map((c) => <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c === 'none' ? 'Không tô' : `Màu ${c}`} className={`${value === c ? 'is-on' : ''}${c === 'none' ? ' is-none' : ''}`} style={c === 'none' ? undefined : { background: c }} onClick={() => set(c)} />)}
        <label className="pen-custom" title="Màu khác"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1e3a8a'} onChange={(e) => set(e.target.value)} aria-label={`${label}: màu khác`} /></label>
      </div>
    </div>
  );
}

type ShapeStyle = { stroke: string; fill: string; sw: number; dash: boolean; measure: boolean };
function ShapeStyleEdit({ v, set }: { v: ShapeStyle; set: (p: Partial<ShapeStyle>) => void }) {
  return (
    <>
      <ColorRow label="Màu viền" colors={PEN_COLORS} value={v.stroke} set={(c) => set({ stroke: c })} />
      <ColorRow label="Tô màu" colors={FILL_COLORS} value={v.fill} set={(c) => set({ fill: c })} />
      <label className="pen-range">Độ dày viền <b>{v.sw}</b><input type="range" min="1" max="14" value={v.sw} onChange={(e) => set({ sw: Number(e.target.value) })} /></label>
      <label className="wb-check"><input type="checkbox" checked={v.dash} onChange={(e) => set({ dash: e.target.checked })} /> Nét đứt</label>
      <label className="wb-check"><input type="checkbox" checked={v.measure} onChange={(e) => set({ measure: e.target.checked })} /> Hiện số đo cạnh (1 ô = 1 cm)</label>
    </>
  );
}

function Num({ label, value, set, min, max, step = 1 }: { label: string; value: number; set: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="wb-num">{label}
      <span>
        <button type="button" onClick={() => set(Math.max(min, Math.round((value - step) * 1000) / 1000))} aria-label={`Giảm ${label}`}>−</button>
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) set(Math.min(max, Math.max(min, n))); }} />
        <button type="button" onClick={() => set(Math.min(max, Math.round((value + step) * 1000) / 1000))} aria-label={`Tăng ${label}`}>+</button>
      </span>
    </label>
  );
}

function SelProps({ it, patch, patchMath, setText, textRef, dark }: {
  it: Item; patch: (id: string, p: Partial<Item>, record?: boolean) => void; patchMath: (it: MathItem, p: Partial<MathData>) => void;
  setText: (it: TextItem, p: Partial<TextItem>) => void; textRef: React.RefObject<HTMLTextAreaElement | null>; dark: boolean;
}) {
  switch (it.kind) {
    case 'ink': return <ColorRow label="Màu nét" colors={PEN_COLORS} value={it.color} set={(c) => patch(it.id, { color: c })} />;
    case 'shape': return <ShapeStyleEdit v={{ stroke: it.stroke, fill: it.fill, sw: it.sw, dash: !!it.dash, measure: !!it.measure }} set={(p) => patch(it.id, p as Partial<ShapeItem>)} />;
    case 'solid': return <>
      <ColorRow label="Màu khối" colors={['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', dark ? '#ffffff' : '#111827']} value={it.color} set={(c) => patch(it.id, { color: c })} />
      <label className="wb-check"><input type="checkbox" checked={it.hidden} onChange={(e) => patch(it.id, { hidden: e.target.checked })} /> Vẽ nét khuất (nét đứt)</label>
    </>;
    case 'text': return <>
      <label className="wb-text">Nội dung<textarea ref={textRef} rows={3} value={it.text} onChange={(e) => setText(it, { text: e.target.value })} /></label>
      <div className="wb-seg">
        <button type="button" className={it.font === 'print' ? 'is-on' : ''} onClick={() => setText(it, { font: 'print' })}>Chữ in</button>
        <button type="button" className={it.font === 'script' ? 'is-on' : ''} onClick={() => setText(it, { font: 'script' })} style={{ fontFamily: TEXT_FONT.script }}>Chữ viết</button>
      </div>
      <ColorRow label="Màu chữ" colors={PEN_COLORS} value={it.color} set={(c) => patch(it.id, { color: c })} />
    </>;
    case 'sticker': return null;
    case 'math':
      switch (it.tool) {
        case 'numberline': return <>
          <Num label="Từ" value={it.from} min={-1000} max={100000} set={(v) => patchMath(it, { from: Math.min(v, it.to - it.step), marks: [] })} />
          <Num label="Đến" value={it.to} min={-1000} max={100000} set={(v) => patchMath(it, { to: Math.max(v, it.from + it.step), marks: [] })} />
          <Num label="Mỗi vạch" value={it.step} min={0.1} max={10000} step={it.step < 1 ? 0.1 : 1} set={(v) => patchMath(it, { step: v, marks: [] })} />
          <label className="wb-check"><input type="checkbox" checked={it.hops} onChange={(e) => patchMath(it, { hops: e.target.checked })} /> Hiện bước nhảy giữa các điểm</label>
          <button type="button" className="btn btn-outline btn-sm" disabled={!it.marks.length} onClick={() => patchMath(it, { marks: it.marks.slice(0, -1) })}>Bỏ điểm cuối</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={!it.marks.length} onClick={() => patchMath(it, { marks: [] })}>Xoá các điểm</button>
        </>;
        case 'fraction': return <>
          <Num label="Chia thành (phần)" value={it.n} min={1} max={12} set={(v) => patchMath(it, { n: v, on: it.on.filter((i) => i < v) })} />
          <div className="wb-seg">
            <button type="button" className={it.shape === 'circle' ? 'is-on' : ''} onClick={() => patchMath(it, { shape: 'circle' })}>Hình tròn</button>
            <button type="button" className={it.shape === 'rect' ? 'is-on' : ''} onClick={() => patchMath(it, { shape: 'rect' })}>Băng giấy</button>
          </div>
          <label className="wb-check"><input type="checkbox" checked={it.label} onChange={(e) => patchMath(it, { label: e.target.checked })} /> Hiện phân số</label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => patchMath(it, { on: [] })}>Bỏ tô hết</button>
        </>;
        case 'clock': return <>
          <Num label="Giờ" value={it.hour} min={1} max={12} set={(v) => patchMath(it, { hour: v })} />
          <Num label="Phút" value={it.minute} min={0} max={59} step={5} set={(v) => patchMath(it, { minute: v })} />
          <label className="wb-check"><input type="checkbox" checked={it.digital} onChange={(e) => patchMath(it, { digital: e.target.checked })} /> Hiện giờ số</label>
        </>;
        case 'sticks': return <>
          <Num label="Số bó chục" value={it.tens} min={0} max={9} set={(v) => patchMath(it, { tens: v })} />
          <Num label="Số que lẻ" value={it.ones} min={0} max={9} set={(v) => patchMath(it, { ones: v })} />
        </>;
        case 'blocks': return <>
          <Num label="Trăm" value={it.hundreds} min={0} max={9} set={(v) => patchMath(it, { hundreds: v })} />
          <Num label="Chục" value={it.tens} min={0} max={9} set={(v) => patchMath(it, { tens: v })} />
          <Num label="Đơn vị" value={it.ones} min={0} max={9} set={(v) => patchMath(it, { ones: v })} />
        </>;
      }
  }
}
