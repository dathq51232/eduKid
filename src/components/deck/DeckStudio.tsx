'use client';

// Soạn bài giảng / thao giảng (11/2026) — giao diện kiểu Canva: cột biểu tượng + bảng công cụ bên trái (Mẫu, Thành phần, Chữ,
// Tương tác, Nền, Âm thanh, Tải lên, Hiệu ứng, Lớp), thanh công cụ theo vật đang chọn, thanh nổi trên vật (khoá · nhân bản · xoá · ẩn),
// dải trang + Thời lượng · Ghi chú · Hẹn giờ · thu phóng · xem lưới ở đáy. Bài tự lưu vào bảng slide_decks (0046).
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { ArrowDown, ArrowDownToLine, ArrowLeft, ArrowUp, ArrowUpToLine, Blend, Clock, Copy, Eye, EyeOff, FlipHorizontal, Grid2x2, Italic, Layers as LayersIcon, LayoutTemplate, Lock, Maximize, Mic, Minus, MonitorPlay, MoreHorizontal, MousePointerClick, Music, Paintbrush, Palette, Play, Plus, Redo2, Shapes, Sparkles, Square, StickyNote, Timer, Trash2, Type, Undo2, Unlock, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { assetError, listAssets, uploadAsset, type TeacherAsset } from '@/lib/assets/client';
import { baseName, IMAGE_ACCEPT, prepareBoard } from '@/lib/assets/image';
import {
  BGS, EASE_LABEL, FONTS, FX, FX_BY_ID, MAX_ELS, MAX_SLIDES, SH, START_LABEL, SW, TRANS_LABEL, darkBg, elLabel, newSlide, uid,
  type Anim, type Deck, type Ease, type El, type FontKey, type Fx, type SceneKind, type ShapeKind, type Slide, type Start, type Trans,
} from '@/lib/deck/types';
import { loadPraiseFonts } from '@/lib/praise/render';
import { playSound, soundLabel, SOUNDS } from '@/lib/deck/sounds';
import { SLIDE_TEMPLATES, STICKER_SETS } from '@/lib/deck/templates';
import { LAYOUTS, relayout, relayoutBlocker } from '@/lib/deck/relayout';
import { SCENES, SCENES_SORTED, SCENE_VARIANTS, accentOf, sceneGroups } from '@/lib/deck/scenes';
import { WORK_MODES, applyTheme, badgeEl, cardEl, dividerSlide, modeEl, type WorkMode } from '@/lib/deck/fromLesson';
import SlideView, { ShapeSvg, SlideFrame, type PlayApi } from './SlideView';
import AnimTimeline from './AnimTimeline';
import { TEXT_STYLES, stickerName } from '@/lib/deck/sticker-names';
import { F3D_CATS, F3D_VI, f3dSrc } from '@/lib/deck/f3d-catalog';
import { ALL_FLUENT_CDN_ITEMS, FLUENT_CDN_GROUPS, fluentCdnFallbackUrl, fluentCdnUrl } from '@/lib/deck/fluent-cdn';
import { STEP_COLOR, THEME_SETS, applySet, isBlankDeck, makeSet, type SetId } from '@/lib/deck/theme-sets';
import { fold } from '@/lib/classroom/teacher-nav';

/** bảng bên trái (kiểu Canva): mở từ cột biểu tượng hoặc từ thanh công cụ ngữ cảnh */
type Panel = 'tpl' | 'el' | 'text' | 'act' | 'bg' | 'sound' | 'up' | 'anim' | 'pos' | 'edit';
const RAIL: [Panel, string, React.ComponentType<{ 'aria-hidden'?: boolean }>][] = [
  ['tpl', 'Mẫu', LayoutTemplate], ['el', 'Thành phần', Shapes], ['text', 'Chữ', Type], ['act', 'Tương tác', MousePointerClick],
  ['bg', 'Nền', Palette], ['sound', 'Âm thanh', Music], ['up', 'Tải lên', Upload], ['anim', 'Hiệu ứng', Sparkles], ['pos', 'Lớp', LayersIcon],
];
/** hình 3D hay dùng (bộ Fluent 3D trong public/emoji/f3d) */
const F3D = ['red-apple', 'banana', 'strawberry', 'cherries', 'grapes', 'watermelon', 'carrot', 'pencil', 'books', 'open-book', 'notebook', 'backpack', 'scissors', 'straight-ruler', 'abacus', 'star',
  'balloon', 'wrapped-gift', 'party-popper', 'sports-medal', 'light-bulb', 'microscope', 'alarm-clock', 'game-die', 'puzzle-piece', 'soccer-ball', 'kite', 'teddy-bear', 'cat', 'dog', 'rabbit', 'bird',
  'butterfly', 'fish', 'turtle', 'frog', 'sunflower', 'tulip', 'seedling', 'deciduous-tree', 'sun', 'rainbow', 'cloud', 'crescent-moon', 'house', 'school', 'bus', 'bicycle'].map(f3dSrc);
const MILO = ['professor', 'artist', 'doctor', 'astronaut', 'robot', ''].map((n) => `/brand/milo${n ? `-${n}` : ''}.webp`);
const COLORS = ['#1d4ed8', '#111827', '#ffffff', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#db2777', '#7c2d12', '#065f46'];
const FILLS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa', '#ffffff', '#f87171', '#60a5fa', '#34d399', '#fbbf24', 'transparent'];
const SHAPES: { k: ShapeKind; label: string }[] = [
  { k: 'round', label: 'Thẻ bo góc' }, { k: 'rect', label: 'Chữ nhật' }, { k: 'circle', label: 'Hình tròn' }, { k: 'star', label: 'Ngôi sao' },
  { k: 'heart', label: 'Trái tim' }, { k: 'arrow', label: 'Mũi tên' }, { k: 'cloud', label: 'Đám mây' }, { k: 'bubble', label: 'Bong bóng lời' },
  { k: 'wheel', label: 'Vòng quay' }, { k: 'mystery', label: 'Thẻ bí ẩn' }, { k: 'tray', label: 'Khay đếm' }, { k: 'banner', label: 'Băng rôn' },
  { k: 'sticky', label: 'Giấy note' }, { k: 'plaid-card', label: 'Thẻ bước' }, { k: 'badge-card', label: 'Thẻ mặt trời' }, { k: 'flower-bullet', label: 'Hoa đầu dòng' },
];
/** hình khối phong cách sổ tay (Canva Scrapbook) — tách thành danh mục riêng */
const SCRAP_SHAPES: ShapeKind[] = ['sticky', 'plaid-card', 'badge-card', 'flower-bullet'];
/** Danh mục của bảng Thành phần (kiểu “Browse categories” của Canva): id 'f3d:i' = nhóm hình 3D thứ i, 'st:i' = bộ hình dán thứ i */
const F3D_ICON = ['cat', 'red-apple', 'pencil', 'girl', 'sun', 'bus', 'balloon', 'blue-circle'];
const F3D_TILE = ['#fdba74,#f97316', '#fca5a5,#ef4444', '#93c5fd,#3b82f6', '#f9a8d4,#ec4899', '#86efac,#16a34a', '#a5b4fc,#6366f1', '#fde68a,#f59e0b', '#c4b5fd,#8b5cf6'];
const CDN_TILE = ['#f472b6,#db2777', '#fb923c,#ea580c', '#4ade80,#16a34a', '#38bdf8,#0284c7', '#a78bfa,#7c3aed', '#facc15,#ca8a04', '#60a5fa,#2563eb', '#94a3b8,#475569'];
const EL_CATS: { id: string; label: string; icon: string; bg: string }[] = [
  { id: 'milo', label: 'Linh vật Milo', icon: '/brand/milo-professor-sm.webp', bg: 'linear-gradient(140deg,#ddd6fe,#8b5cf6)' },
  { id: 'scene', label: 'Cảnh nền', icon: f3dSrc('rainbow'), bg: 'linear-gradient(140deg,#a5f3fc,#0ea5e9)' },
  { id: 'shape', label: 'Hình khối', icon: f3dSrc('star'), bg: 'linear-gradient(140deg,#99f6e4,#14b8a6)' },
  { id: 'scrap', label: 'Sổ tay', icon: f3dSrc('notebook'), bg: 'linear-gradient(140deg,#fde68a,#e8a33d)' },
  ...FLUENT_CDN_GROUPS.map((g, i) => ({
    id: `cdn:${i}`,
    label: `${g.label} (CDN)`,
    icon: fluentCdnUrl(g.items[0]?.[0] || '1f34e'),
    bg: `linear-gradient(140deg,${CDN_TILE[i % CDN_TILE.length]})`,
  })),
  ...F3D_CATS.map((c, i) => ({ id: `f3d:${i}`, label: c.label, icon: f3dSrc(F3D_ICON[i] ?? c.items[0]), bg: `linear-gradient(140deg,${F3D_TILE[i % F3D_TILE.length]})` })),
  ...STICKER_SETS.map((s, i) => ({ id: `st:${i}`, label: `Hình dán · ${s.label}`, icon: s.items[0], bg: 'linear-gradient(140deg,#e2e8f0,#64748b)' })),
];
type Lesson3DRow = { id: string; title: string };
/** hình chưa có trên máy chủ (thiếu file): ẩn ô thay vì hiện ảnh lỗi */
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => { const b = e.currentTarget.closest('button'); if (b) b.style.display = 'none'; };

export default function DeckStudio({ classId, deckId, initial }: { classId: string; deckId: string; initial: Deck }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [deck, setDeck] = useState<Deck>(initial);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  // chọn nhiều vật (Shift + bấm, kéo khung chọn, nhóm)
  const [multi, setMulti] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [styleCopy, setStyleCopy] = useState<Partial<El> | null>(null);
  const [q, setQ] = useState('');
  const clip = useRef<El[]>([]);
  const [panel, setPanel] = useState<Panel | null>(() => (isBlankDeck(initial.slides) ? 'tpl' : 'el'));
  const setPane = (p: 'props' | 'anim' | 'layers') => { if (p === 'anim') setPanel('anim'); else if (p === 'layers') setPanel('pos'); };
  const [foot, setFoot] = useState<'dur' | 'note' | 'timer' | null>(null);
  const [grid, setGrid] = useState(false);
  const [snapGrid, setSnapGrid] = useState(false);
  const [tplTab, setTplTab] = useState<'set' | 'page'>('set');
  const [replace, setReplace] = useState(false);
  /** danh mục đang mở trong bảng Thành phần (null = trang chủ “Duyệt danh mục”) */
  const [elCat, setElCat] = useState<string | null>(null);
  // chữ đang sửa trực tiếp trên trang
  const [inline, setInline] = useState<string | null>(null);
  useEffect(() => { if (inline && inline !== sel) setInline(null); }, [sel, inline]);
  const [drag, setDrag] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // trình soạn nằm trong khung trang giáo viên: cao vừa phần còn lại của màn hình
  useEffect(() => {
    const fit = () => { const el = rootRef.current; if (!el || document.fullscreenElement) return; const top = el.getBoundingClientRect().top + window.scrollY; el.style.height = `${Math.max(560, window.innerHeight - top)}px`; };
    fit(); window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', fit);
    return () => { window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', fit); };
  }, []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 560 });
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, [grid]);
  const [past, setPast] = useState<Deck[]>([]);
  const [future, setFuture] = useState<Deck[]>([]);
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved');
  const [startMode, setStartMode] = useState<Start>('click');
  const [trigMode, setTrigMode] = useState<string>('');
  const [mine, setMine] = useState<TeacherAsset[] | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [lessons, setLessons] = useState<Lesson3DRow[] | null>(null);
  const [preview, setPreview] = useState(false);
  const [animSel, setAnimSel] = useState<string | null>(null);
  const deckRef = useRef(deck); deckRef.current = deck;
  const editStart = useRef<Deck | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const audInput = useRef<HTMLInputElement>(null);

  const slide = deck.slides[Math.min(cur, deck.slides.length - 1)];
  useEffect(() => { void loadPraiseFonts(); }, []); // phông chữ tròn / chữ viết tay dùng trên trang
  const selEl = slide.els.find((e) => e.id === sel) ?? null;
  /** các vật đang chọn: nhóm / chọn nhiều, không thì vật đang chọn */
  const selIds = multi.length > 1 && sel && multi.includes(sel) ? multi : sel ? [sel] : [];
  const selEls = slide.els.filter((e) => selIds.includes(e.id));
  const pick = (id: string | null, add = false) => {
    if (!id) { setSel(null); setMulti([]); return; }
    if (add) {
      const base = selIds.length ? selIds : [];
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      setMulti(next); setSel(next.includes(id) ? id : next[0] ?? null); return;
    }
    const e = slide.els.find((x) => x.id === id);
    // dán kiểu đang sao chép
    if (styleCopy && e) { patchEl(id, styleOf(styleCopy, e)); setStyleCopy(null); setMsg({ kind: 'ok', text: 'Đã dán kiểu.' }); }
    const g = e?.group ? slide.els.filter((x) => x.group === e.group).map((x) => x.id) : [id];
    setMulti(g); setSel(id);
    const a = slide.anims.find((x) => x.el === id); if (a) setAnimSel(a.id);
  };

  /* ---------- lưu ---------- */
  useEffect(() => {
    if (deck === initial) return;
    setSaved('saving');
    const t = setTimeout(async () => {
      if (!supabase) return;
      const { error } = await supabase.from('slide_decks').update({ title: deck.title.slice(0, 120) || 'Bài thao giảng', grade: deck.grade, data: deck }).eq('id', deckId);
      setSaved(error ? 'error' : 'saved');
    }, 900);
    return () => clearTimeout(t);
  }, [deck, deckId, initial, supabase]);

  /* ---------- lịch sử ---------- */
  const commit = useCallback((next: Deck) => { setPast((p) => [...p.slice(-60), deckRef.current]); setFuture([]); deckRef.current = next; setDeck(next); }, []);
  const setSlide = useCallback((fn: (s: Slide) => Slide, record = true) => {
    const d = deckRef.current, i = Math.min(cur, d.slides.length - 1);
    const next = { ...d, slides: d.slides.map((s, k) => (k === i ? fn(s) : s)) };
    if (record) commit(next); else { deckRef.current = next; setDeck(next); }
  }, [commit, cur]);
  const patchEl = useCallback((id: string, p: Partial<El>, record = true) => setSlide((s) => ({ ...s, els: s.els.map((e) => (e.id === id ? ({ ...e, ...p } as El) : e)) }), record), [setSlide]);
  /** "Bố cục khác": mỗi lần bấm xoay sang bố cục chuẩn tiếp theo (giữ nội dung, hiệu ứng) */
  const layoutTurn = useRef<Record<string, number>>({});
  const nextLayout = () => {
    const s = deckRef.current.slides[Math.min(cur, deckRef.current.slides.length - 1)];
    const why = relayoutBlocker(s);
    if (why) { setMsg({ kind: 'info', text: `Chưa đổi bố cục tự động được: ${why}` }); return; }
    const k = layoutTurn.current[s.id] ?? 0;
    const r = relayout(s, k);
    if (!r) { setMsg({ kind: 'info', text: 'Trang này đã chật: không có bố cục khác giữ được cỡ chữ. Hãy bớt chữ hoặc tách trang.' }); return; }
    layoutTurn.current[s.id] = r.used + 1;
    setSlide(() => r.slide);
    setMsg({ kind: 'ok', text: `Bố cục: ${r.layout.label} (${(r.used % LAYOUTS.length) + 1}/${LAYOUTS.length}) — bấm lần nữa để xem kiểu khác, Ctrl+Z để quay lại.` });
  };
  const undo = () => { const p = past.at(-1); if (!p) return; setPast(past.slice(0, -1)); setFuture((f) => [deckRef.current, ...f]); deckRef.current = p; setDeck(p); };
  const redo = () => { const f = future[0]; if (!f) return; setFuture(future.slice(1)); setPast((p) => [...p, deckRef.current]); deckRef.current = f; setDeck(f); };
  // kéo / đổi cỡ trên trang: lưu lịch sử một lần khi thả chuột
  const onChange = useCallback((id: string, p: Partial<El>, record: boolean) => {
    if (!record) { if (!editStart.current) editStart.current = deckRef.current; patchEl(id, p, false); return; }
    const s = editStart.current; editStart.current = null;
    if (s) { setPast((h) => [...h.slice(-60), s]); setFuture([]); }
  }, [patchEl]);

  /* ---------- kho của tôi (ảnh, âm thanh) ---------- */
  useEffect(() => {
    let live = true;
    void listAssets(['image', 'audio']).then((l) => { if (live) setMine(l); }, (e) => { if (live) { setMine([]); setMsg({ kind: 'info', text: assetError(e) }); } });
    return () => { live = false; };
  }, []);
  const urls = useMemo(() => new Map((mine ?? []).filter((a) => a.url).map((a) => [a.path, a.url!])), [mine]);
  const assetUrl = useCallback((p: string) => urls.get(p), [urls]);
  const myImages = (mine ?? []).filter((a) => a.kind === 'image');
  const myAudio = (mine ?? []).filter((a) => a.kind === 'audio');

  /* ---------- thêm vật ---------- */
  const addEl = (e: El, anim?: Fx) => {
    if (slide.els.length >= MAX_ELS) { setMsg({ kind: 'error', text: `Mỗi trang tối đa ${MAX_ELS} vật.` }); return; }
    setSlide((s) => ({ ...s, els: [...s.els, e], anims: anim ? [...s.anims, { id: uid(), el: e.id, fx: anim, start: 'click', delay: 0, dur: 0.6 }] : s.anims }));
    setSel(e.id); setPane('props');
  };
  const dark = darkBg(slide.bg);
  const center = (w: number, h: number) => ({ x: Math.round((SW - w) / 2 + (Math.random() - 0.5) * 120), y: Math.round((SH - h) / 2 + (Math.random() - 0.5) * 80) });
  const addText = (title: boolean) => addEl({ id: uid(), kind: 'text', ...center(title ? 1100 : 760, title ? 140 : 120), w: title ? 1100 : 760, h: title ? 140 : 120, rot: 0, text: title ? 'Tiêu đề' : 'Chữ của cô', size: title ? 84 : 48, color: dark ? '#ffffff' : title ? '#1d4ed8' : '#1f2937', font: title ? 'baloo' : 'quick', align: 'center', bg: '' });
  const addSticker = (src: string) => (replace && selEl?.kind === 'img' ? (patchEl(selEl.id, { src, asset: false, name: stickerName(src) || selEl.name }), setReplace(false), setMsg({ kind: 'ok', text: 'Đã thay hình.' })) : addEl({ id: uid(), kind: 'img', ...center(220, 220), w: 220, h: 220, rot: 0, src, name: src.split('/').pop()?.replace(/\.(webp|png)$/, '').replace(/-/g, ' ') }));
  const addShape = (shape: ShapeKind) => {
    const sq = shape === 'circle' || shape === 'star' || shape === 'heart' || shape === 'wheel';
    const w = sq ? 280 : shape === 'tray' ? 520 : shape === 'banner' ? 480 : 360;
    const h = sq ? 280 : shape === 'tray' ? 240 : shape === 'banner' ? 120 : 200;
    const text = shape === 'mystery' || shape === 'wheel' ? '?' : '';
    addEl({ id: uid(), kind: 'shape', ...center(w, h), w, h, rot: 0, shape, fill: '#fde68a', stroke: '#f59e0b', sw: 5, text, color: '#1f2937', size: 54 });
  };
  const addQuiz = () => addEl({ id: uid(), kind: 'quiz', x: 220, y: 170, w: 1160, h: 620, rot: 0, q: 'Câu hỏi?', opts: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'], a: 0, cols: 2 }, 'pop');
  const addSort = () => addEl({ id: uid(), kind: 'sort', x: 180, y: 160, w: 1240, h: 600, rot: 0, prompt: 'Sắp xếp theo thứ tự đúng', items: ['1', '2', '3', '4'] }, 'fade');
  const addDrop = () => addEl({ id: uid(), kind: 'drop', ...center(300, 220), w: 300, h: 220, rot: 0, label: 'Thả vào đây', accept: [], color: '#2563eb' });
  const addScene = () => { addEl({ id: uid(), kind: 'scene3d', x: 200, y: 150, w: 1200, h: 680, rot: 0, lesson: '', title: 'Chọn bài 3D' }); void loadLessons(); };
  const loadLessons = async () => {
    if (lessons || !supabase) return;
    const { data } = await supabase.from('lessons3d').select('id, title').order('updated_at', { ascending: false }).limit(200);
    setLessons((data ?? []) as Lesson3DRow[]);
  };
  useEffect(() => { if (selEl?.kind === 'scene3d') void loadLessons(); });

  const onImage = async (f: File) => {
    setBusy('Đang tải ảnh lên Kho của tôi…'); setMsg(null);
    try {
      const r = await prepareBoard(f);
      const row = await uploadAsset('image', baseName(f), r.blob, { thumb: r.thumb, meta: { w: r.w, h: r.h } });
      setMine((m) => [row, ...(m ?? [])]);
      const k = Math.min(1, 600 / Math.max(r.w, r.h));
      addEl({ id: uid(), kind: 'img', ...center(r.w * k, r.h * k), w: Math.round(r.w * k), h: Math.round(r.h * k), rot: 0, src: row.path, asset: true, name: row.name });
    } catch (e) { setMsg({ kind: 'error', text: assetError(e) }); } finally { setBusy(''); }
  };
  const onAudio = async (blob: Blob, name: string) => {
    setBusy('Đang lưu âm thanh vào Kho của tôi…'); setMsg(null);
    try {
      if (blob.size > 8 * 1024 * 1024) throw new Error('File âm thanh tối đa 8 MB.');
      const row = await uploadAsset('audio', name, blob);
      setMine((m) => [row, ...(m ?? [])]);
      attachSound(`asset:${row.path}`);
      setMsg({ kind: 'ok', text: `Đã lưu “${row.name}”.` });
    } catch (e) { setMsg({ kind: 'error', text: assetError(e) }); } finally { setBusy(''); }
  };
  const toggleRec = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setRec(null); void onAudio(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }), `Ghi âm ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`); };
      mr.start(); setRec(mr);
      setTimeout(() => { if (mr.state === 'recording') mr.stop(); }, 60000);
    } catch { setMsg({ kind: 'error', text: 'Trình duyệt chưa cho dùng micro. Cô bấm cho phép micro rồi thử lại.' }); }
  };

  /* ---------- hiệu ứng ---------- */
  const addAnim = (fx: Fx) => {
    if (!selEl) { setMsg({ kind: 'info', text: 'Chọn một vật trên trang trước, rồi bấm hiệu ứng.' }); return; }
    const a: Anim = { id: uid(), el: selEl.id, fx, start: trigMode ? 'click' : startMode, delay: 0, dur: fx === 'spin' ? 1.2 : 0.6, trigger: trigMode || undefined };
    setSlide((s) => ({ ...s, anims: [...s.anims, a] }));
    setAnimSel(a.id); setPane('anim');
  };
  const patchAnim = (id: string, p: Partial<Anim>) => setSlide((s) => ({ ...s, anims: s.anims.map((a) => (a.id === id ? { ...a, ...p } : a)) }));
  // kéo trên dòng thời gian: sửa tạm, thả chuột mới ghi một bước hoàn tác
  const patchAnimSoft = (id: string, p: Partial<Anim>) => { if (!editStart.current) editStart.current = deckRef.current; setSlide((s) => ({ ...s, anims: s.anims.map((a) => (a.id === id ? { ...a, ...p } : a)) }), false); };
  const commitSoft = () => { const st = editStart.current; editStart.current = null; if (st) { setPast((h) => [...h.slice(-60), st]); setFuture([]); } };
  /** hiệu ứng cả trang: mọi vật chưa có hiệu ứng xuất hiện lần lượt hiện ra khi vào trang (trên xuống, trái sang) */
  const animateAll = (fx: Fx) => setSlide((s) => {
    const have = new Set(s.anims.filter((a) => FX_BY_ID[a.fx].group === 'in').map((a) => a.el));
    const els = s.els.filter((e) => !have.has(e.id) && e.role !== 'card').sort((a, b) => a.y - b.y || a.x - b.x);
    if (!els.length) { setMsg({ kind: 'info', text: 'Mọi vật trên trang đã có hiệu ứng xuất hiện.' }); return s; }
    const add: Anim[] = els.map((e, i) => ({ id: uid(), el: e.id, fx, start: 'after', delay: i ? 0.1 : 0.3, dur: 0.6 }));
    setMsg({ kind: 'ok', text: `Đã thêm hiệu ứng cho ${els.length} vật: tự hiện lần lượt khi vào trang. Chỉnh thời gian ở dòng thời gian dưới trang.` });
    return { ...s, anims: [...add, ...s.anims] };
  });
  const moveAnim = (id: string, d: -1 | 1) => setSlide((s) => { const i = s.anims.findIndex((a) => a.id === id), j = i + d; if (i < 0 || j < 0 || j >= s.anims.length) return s; const l = [...s.anims]; [l[i], l[j]] = [l[j], l[i]]; return { ...s, anims: l }; });
  const attachSound = (snd: string) => {
    const a = slide.anims.find((x) => x.id === animSel);
    if (a) patchAnim(a.id, { sound: snd });
    else setSlide((s) => ({ ...s, sound: snd }));
  };

  /* ---------- trang ---------- */
  const addSlides = (list: Slide[]) => {
    const d = deckRef.current;
    if (d.slides.length + list.length > MAX_SLIDES) { setMsg({ kind: 'error', text: `Mỗi bài tối đa ${MAX_SLIDES} trang.` }); return; }
    const i = Math.min(cur, d.slides.length - 1) + 1;
    commit({ ...d, slides: [...d.slides.slice(0, i), ...list, ...d.slides.slice(i)] });
    setCur(i); setSel(null);
  };
  const dupSlide = () => { const s: Slide = JSON.parse(JSON.stringify(slide)); const map = new Map<string, string>(); s.id = uid(); s.els.forEach((e) => { const n = uid(); map.set(e.id, n); e.id = n; }); s.els.forEach((e) => { if (e.kind === 'drop') e.accept = e.accept.map((x) => map.get(x) ?? x); }); s.anims = s.anims.map((a) => ({ ...a, id: uid(), el: map.get(a.el) ?? a.el, trigger: a.trigger ? map.get(a.trigger) : undefined })); addSlides([s]); };
  const delSlide = () => {
    const d = deckRef.current; if (d.slides.length <= 1) { commit({ ...d, slides: [newSlide()] }); return; }
    const i = Math.min(cur, d.slides.length - 1);
    commit({ ...d, slides: d.slides.filter((_, k) => k !== i) }); setCur(Math.max(0, i - 1)); setSel(null);
  };
  const moveSlide = (dlt: -1 | 1) => { const d = deckRef.current, i = cur, j = i + dlt; if (j < 0 || j >= d.slides.length) return; const l = [...d.slides]; [l[i], l[j]] = [l[j], l[i]]; commit({ ...d, slides: l }); setCur(j); };

  /* ---------- vật đang chọn ---------- */
  const delEl = () => {
    const ids = selIds; if (!ids.length) return;
    setSlide((s) => ({ ...s, els: s.els.filter((e) => !ids.includes(e.id)).map((e) => (e.kind === 'drop' ? { ...e, accept: e.accept.filter((x) => !ids.includes(x)) } : e)), anims: s.anims.filter((a) => !ids.includes(a.el) && !(a.trigger && ids.includes(a.trigger))) }));
    setSel(null); setMulti([]);
  };
  /** dán các vật (nhân bản / dán từ trang khác): id mới, lệch 40 điểm, nhóm mới */
  const pasteEls = (list: El[], off = 40) => {
    if (!list.length) return;
    if (slide.els.length + list.length > MAX_ELS) { setMsg({ kind: 'error', text: `Mỗi trang tối đa ${MAX_ELS} vật.` }); return; }
    const gmap = new Map<string, string>();
    const add = list.map((e) => { const c = JSON.parse(JSON.stringify(e)) as El; c.id = uid(); c.x += off; c.y += off; if (c.group) { if (!gmap.has(c.group)) gmap.set(c.group, uid()); c.group = gmap.get(c.group); } return c; });
    setSlide((s) => ({ ...s, els: [...s.els, ...add] }));
    setMulti(add.map((e) => e.id)); setSel(add[0].id); setPane('props');
  };
  const dupEl = () => pasteEls(selEls);
  const copyEls = () => { if (!selEls.length) return; clip.current = JSON.parse(JSON.stringify(selEls)); try { localStorage.setItem('edukid:deck-clip', JSON.stringify(clip.current)); } catch { /* bỏ qua */ } setMsg({ kind: 'info', text: `Đã sao chép ${selEls.length} vật — Ctrl+V để dán (cả ở trang khác).` }); };
  const pasteClip = () => { let l = clip.current; if (!l.length) { try { l = JSON.parse(localStorage.getItem('edukid:deck-clip') ?? '[]') as El[]; } catch { l = []; } } pasteEls(l, 30); };
  const groupSel = () => { if (selIds.length < 2) return; const g = uid(); setSlide((s) => ({ ...s, els: s.els.map((e) => (selIds.includes(e.id) ? { ...e, group: g } : e)) })); setMsg({ kind: 'ok', text: `Đã nhóm ${selIds.length} vật.` }); };
  const ungroupSel = () => setSlide((s) => ({ ...s, els: s.els.map((e) => (selIds.includes(e.id) ? { ...e, group: undefined } : e)) }));
  /** căn các vật đang chọn (1 vật: căn theo trang) */
  const alignSel = (how: 'l' | 'c' | 'r' | 't' | 'm' | 'b' | 'dh' | 'dv') => {
    const list = selEls.filter((e) => !e.lock); if (!list.length) return;
    const one = list.length === 1;
    const L = one ? 0 : Math.min(...list.map((e) => e.x)), Rr = one ? SW : Math.max(...list.map((e) => e.x + e.w));
    const T = one ? 0 : Math.min(...list.map((e) => e.y)), B = one ? SH : Math.max(...list.map((e) => e.y + e.h));
    const pos = new Map<string, Partial<El>>();
    if (how === 'dh' || how === 'dv') {
      if (list.length < 3) return;
      const h = how === 'dh', srt = [...list].sort((a, b) => (h ? a.x - b.x : a.y - b.y));
      const total = srt.reduce((n, e) => n + (h ? e.w : e.h), 0), gap = ((h ? Rr - L : B - T) - total) / (srt.length - 1);
      let cur = h ? L : T;
      for (const e of srt) { pos.set(e.id, h ? { x: Math.round(cur) } : { y: Math.round(cur) }); cur += (h ? e.w : e.h) + gap; }
    } else for (const e of list) pos.set(e.id, how === 'l' ? { x: L } : how === 'c' ? { x: Math.round((L + Rr - e.w) / 2) } : how === 'r' ? { x: Rr - e.w } : how === 't' ? { y: T } : how === 'm' ? { y: Math.round((T + B - e.h) / 2) } : { y: B - e.h });
    setSlide((s) => ({ ...s, els: s.els.map((e) => (pos.has(e.id) ? ({ ...e, ...pos.get(e.id) } as El) : e)) }));
  };
  const moveLayer = (id: string, d: -1 | 1) => setSlide((s) => { const i = s.els.findIndex((e) => e.id === id), j = i + d; if (i < 0 || j < 0 || j >= s.els.length) return s; const l = [...s.els]; [l[i], l[j]] = [l[j], l[i]]; return { ...s, els: l }; });
  const order = (top: boolean) => { if (!selEls.length) return; setSlide((s) => { const m = s.els.filter((e) => selIds.includes(e.id)), r = s.els.filter((e) => !selIds.includes(e.id)); return { ...s, els: top ? [...r, ...m] : [...m, ...r] }; }); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (preview) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'd') { e.preventDefault(); dupEl(); return; }
      if (mod && k === 'c') { e.preventDefault(); copyEls(); return; }
      if (mod && k === 'v') { e.preventDefault(); pasteClip(); return; }
      if (mod && k === 'a') { e.preventDefault(); setMulti(slide.els.map((x) => x.id)); setSel(slide.els[0]?.id ?? null); return; }
      if (mod && k === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); return; }
      if (e.key === 'Escape') { setSel(null); setMulti([]); setCtx(null); setStyleCopy(null); return; }
      if (!selEls.length) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delEl(); return; }
      const st = e.shiftKey ? 20 : 4, mv: Record<string, [number, number]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
      if (mv[e.key]) { e.preventDefault(); const [mx, my] = mv[e.key]; setSlide((s) => ({ ...s, els: s.els.map((x) => (selIds.includes(x.id) && !x.lock ? { ...x, x: x.x + mx, y: x.y + my } : x)) })); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const editText = (id: string) => {
    if (!id) { setInline(null); return; }
    const k = slide.els.find((e) => e.id === id)?.kind;
    if (k === 'text' || k === 'shape') { setSel(id); setMulti([id]); setInline(id); return; }
    setSel(id); setPanel('edit'); setTimeout(() => { textRef.current?.focus(); textRef.current?.select(); }, 30); };
  const showHref = (from: number) => `/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${deckId}/trinh-chieu?trang=${from + 1}`;
  const flush = async () => { if (supabase) await supabase.from('slide_decks').update({ title: deck.title.slice(0, 120) || 'Bài thao giảng', grade: deck.grade, data: deckRef.current }).eq('id', deckId); };

  /* ---------- giao diện kiểu Canva ---------- */
  const info = { title: deck.title, sub: `Lớp ${deck.grade} · Tiết …` };
  // xem trước bộ mẫu: chỉ dựng khi mở bảng Mẫu; tên bài cập nhật trễ để gõ tên không bị giật
  const lazyTitle = useDeferredValue(deck.title);
  const tplOpen = panel === 'tpl';
  const setPreviews = useMemo(() => (tplOpen ? Object.fromEntries(THEME_SETS.map((t) => [t.id, makeSet(t.id, { title: lazyTitle, sub: `Lớp ${deck.grade} · Tiết …` })])) : {}) as Record<SetId, Slide[]>, [tplOpen, lazyTitle, deck.grade]);
  const chooseSet = (id: SetId) => {
    const list = makeSet(id, info);
    if (isBlankDeck(deckRef.current.slides)) { commit({ ...deckRef.current, slides: list }); setCur(0); setSel(null); setMsg({ kind: 'ok', text: 'Đã dùng bộ mẫu 7 trang. Bấm đúp vào chữ để sửa.' }); }
    else { addSlides(list); setMsg({ kind: 'ok', text: 'Đã thêm 7 trang của bộ mẫu sau trang đang soạn.' }); }
  };
  const restyle = (id: SetId) => { commit({ ...deckRef.current, slides: applySet(deckRef.current.slides, id) }); setMsg({ kind: 'ok', text: `Đã đổi cả bài sang chủ đề “${THEME_SETS.find((t) => t.id === id)?.name}”.` }); };
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);
  const W = Math.max(320, Math.min(box.w - 56, ((box.h - 40) * 16) / 9) * zoom);
  // thanh nổi trên vật đang chọn
  const bb = selEls.length ? { l: Math.min(...selEls.map((e) => e.x)), r: Math.max(...selEls.map((e) => e.x + e.w)), t: Math.min(...selEls.map((e) => e.y)), b: Math.max(...selEls.map((e) => e.y + e.h)) } : null;
  const allLock = selEls.length > 0 && selEls.every((e) => e.lock);
  const setMany = (p: Partial<El>) => setSlide((s) => ({ ...s, els: s.els.map((e) => (selIds.includes(e.id) ? ({ ...e, ...p } as El) : e)) }));
  const totalMins = deck.slides.reduce((n, s) => n + (s.mins ?? 0), 0);
  const fullscreen = () => { const el = rootRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.(); };
  const pageTitle = (s: Slide) => { const t = s.els.find((e) => e.kind === 'text' && (e.role === 'title' || e.role === 'divider')) ?? s.els.find((e) => e.kind === 'text'); return t && t.kind === 'text' ? t.text.split('\n')[0].slice(0, 40) : 'Trang trống'; };
  const reorder = (from: number, to: number) => {
    const d = deckRef.current; if (from === to || from < 0 || to < 0 || to >= d.slides.length) return;
    const l = [...d.slides]; const [m] = l.splice(from, 1); l.splice(to, 0, m); commit({ ...d, slides: l }); setCur(to);
  };
  const ctxTools = (() => {
    const e = selEls.length === 1 ? selEls[0] : null;
    const rotate = e && !e.lock ? <span className="cv-num cv-rotg" title="Xoay (hoặc kéo nút ⟳ trên vật)">
      <button type="button" aria-label="Xoay trái 15 độ" onClick={() => patchEl(e.id, { rot: ((e.rot - 15 + 540) % 360) - 180 })}>↺</button>
      <input type="number" min={-180} max={180} value={Math.round(e.rot)} onChange={(v) => patchEl(e.id, { rot: ((Number(v.target.value) || 0) + 540) % 360 - 180 })} aria-label="Góc xoay (độ)" /><i>°</i>
      <button type="button" aria-label="Xoay phải 15 độ" onClick={() => patchEl(e.id, { rot: ((e.rot + 15 + 540) % 360) - 180 })}>↻</button></span> : null;
    const radius = (v: number | undefined, id: string) => (
      <label className="cv-c cv-op" title="Bo góc">◜<input type="range" min={0} max={100} value={v ?? 0} onChange={(x) => patchEl(id, { rad: Number(x.target.value) || undefined }, false)} onPointerUp={() => commit(deckRef.current)} aria-label="Bo góc" /></label>
    );
    const common = <>
      {rotate}
      <span className="cv-d" />
      <button type="button" className={`cv-c${panel === 'anim' ? ' is-on' : ''}`} onClick={() => toggle('anim')}><Sparkles aria-hidden="true" /> Hiệu ứng</button>
      <button type="button" className={`cv-c${panel === 'pos' ? ' is-on' : ''}`} onClick={() => toggle('pos')}>Vị trí</button>
      {e && <button type="button" className={`cv-c${panel === 'edit' ? ' is-on' : ''}`} onClick={() => toggle('edit')}>Sửa thêm</button>}
      {e && (e.kind === 'text' || e.kind === 'shape') && <button type="button" className={`cv-c${styleCopy ? ' is-on' : ''}`} title="Chép kiểu: bấm rồi bấm vào vật khác" aria-label="Chép kiểu" onClick={() => { setStyleCopy(styleCopy ? null : e); setMsg(styleCopy ? null : { kind: 'info', text: '🖌 Bấm vào vật khác để dán kiểu (Esc để huỷ).' }); }}><Paintbrush aria-hidden="true" /></button>}
    </>;
    const opacity = (v: number | undefined) => (
      <label className="cv-c cv-op" title="Độ trong suốt"><Blend aria-hidden="true" /><input type="range" min={10} max={100} value={Math.round((v ?? 1) * 100)} onChange={(x) => { const o = Number(x.target.value) / 100; setSlide((s) => ({ ...s, els: s.els.map((y) => (selIds.includes(y.id) ? { ...y, op: o >= 1 ? undefined : o } : y)) }), false); }} onPointerUp={() => commit(deckRef.current)} aria-label="Độ trong suốt" /></label>
    );
    if (!selEls.length) return <>
      <button type="button" className="cv-c" onClick={() => toggle('bg')}>Nền: <i className="cv-sw" style={{ background: BGS.find((b) => b.id === slide.bg)?.css ?? slide.bg }} /> {BGS.find((b) => b.id === slide.bg)?.label ?? 'Màu'}</button>
      <span className="cv-d" />
      <label className="cv-c">Chuyển trang <select value={slide.trans} onChange={(e) => setSlide((s) => ({ ...s, trans: e.target.value as Trans }))} aria-label="Chuyển trang">{(Object.keys(TRANS_LABEL) as Trans[]).map((t) => <option key={t} value={t}>{TRANS_LABEL[t]}</option>)}</select></label>
      <span className="cv-d" />
      <button type="button" className="cv-c" onClick={nextLayout} title="Sắp xếp lại trang theo bố cục chuẩn tiếp theo"><LayoutTemplate aria-hidden="true" /> Bố cục khác</button>
      <button type="button" className="cv-c" onClick={() => setPanel('anim')}><Sparkles aria-hidden="true" /> Hiệu ứng cả trang</button>
      <button type="button" className="cv-c is-hl" onClick={() => { setPanel('tpl'); setTplTab('set'); }}>✨ Đổi chủ đề cả bộ</button>
    </>;
    if (!e) return <>
      <span className="cv-c is-txt">Đang chọn {selEls.length} vật</span>
      <button type="button" className="cv-c" onClick={() => (selEls.every((x) => x.group && x.group === selEls[0].group) ? ungroupSel() : groupSel())}>{selEls.every((x) => x.group && x.group === selEls[0].group) ? 'Bỏ nhóm' : 'Nhóm'}</button>
      {opacity(selEls[0].op)}{common}
    </>;
    if (e.kind === 'text') return <>
      <select className="cv-font" value={e.font} onChange={(v) => patchEl(e.id, { font: v.target.value as FontKey })} aria-label="Phông chữ">{(Object.keys(FONTS) as FontKey[]).map((k) => <option key={k} value={k}>{FONTS[k].label.replace(/ \(.*\)/, '')}</option>)}</select>
      <span className="cv-num"><button type="button" aria-label="Giảm cỡ chữ" onClick={() => patchEl(e.id, { size: Math.max(18, e.size - 4) })}><Minus aria-hidden="true" /></button>
        <input type="number" list="cv-sizes" min={10} max={300} value={e.size} onChange={(v) => { const n = Number(v.target.value); if (n >= 10) patchEl(e.id, { size: Math.min(300, n) }); }} aria-label="Cỡ chữ" />
        <button type="button" aria-label="Tăng cỡ chữ" onClick={() => patchEl(e.id, { size: Math.min(200, e.size + 4) })}><Plus aria-hidden="true" /></button></span>
      <label className="cv-c cv-color" title="Màu chữ"><b style={{ borderColor: e.color }}>A</b><input type="color" value={/^#[0-9a-f]{6}$/i.test(e.color) ? e.color : '#1d4ed8'} onChange={(v) => patchEl(e.id, { color: v.target.value })} aria-label="Màu chữ" /></label>
      <button type="button" className={`cv-c${inline === e.id ? ' is-on' : ''}`} title="Sửa chữ ngay trên trang (hoặc bấm đúp / bấm lần hai vào chữ)" onClick={() => setInline(inline === e.id ? null : e.id)}>✏️ Sửa chữ</button>
      <button type="button" className={`cv-c${e.italic ? ' is-on' : ''}`} aria-label="Chữ nghiêng" aria-pressed={!!e.italic} onClick={() => patchEl(e.id, { italic: !e.italic })}><Italic aria-hidden="true" /></button>
      <button type="button" className="cv-c" title="Căn chữ" onClick={() => patchEl(e.id, { align: e.align === 'left' ? 'center' : e.align === 'center' ? 'right' : 'left' })}>{e.align === 'left' ? '⇤ Trái' : e.align === 'center' ? '↔ Giữa' : '⇥ Phải'}</button>
      <label className="cv-c cv-color" title="Nền ô chữ"><i className="cv-sw" style={{ background: e.bg || 'linear-gradient(135deg,#fff 45%,#ef4444 45% 55%,#fff 55%)' }} /><input type="color" value={/^#[0-9a-f]{6}$/i.test(e.bg) ? e.bg : '#fef3c7'} onChange={(v) => patchEl(e.id, { bg: v.target.value })} aria-label="Nền ô chữ" /></label>
      <button type="button" className={`cv-c${e.stroke ? ' is-on' : ''}`} title="Chữ trang trí (viền trắng, đổ bóng)" onClick={() => patchEl(e.id, { stroke: e.stroke ? undefined : '#ffffff', strokeW: 12, shadow: !e.stroke })}>Viền</button>
      {opacity(e.op)}{common}
    </>;
    if (e.kind === 'img') return <>
      <button type="button" className={`cv-c${replace ? ' is-on' : ''}`} onClick={() => { setReplace(!replace); setPanel('el'); }}>Thay hình</button>
      <button type="button" className={`cv-c${e.flip ? ' is-on' : ''}`} onClick={() => patchEl(e.id, { flip: !e.flip })}><FlipHorizontal aria-hidden="true" /> Lật</button>
      {radius(e.rad, e.id)}
      <button type="button" className={`cv-c${e.shadow ? ' is-on' : ''}`} title="Đổ bóng mềm" onClick={() => patchEl(e.id, { shadow: !e.shadow })}>Bóng</button>
      {opacity(e.op)}
      <button type="button" className={`cv-c${e.drag ? ' is-on' : ''}`} title="Học sinh kéo được khi trình chiếu" onClick={() => patchEl(e.id, { drag: !e.drag })}>✋ Kéo được</button>
      {common}
    </>;
    if (e.kind === 'shape') return <>
      <label className="cv-c cv-color" title="Màu nền"><i className="cv-sw" style={{ background: e.fill }} /><input type="color" value={/^#[0-9a-f]{6}$/i.test(e.fill) ? e.fill : '#fde68a'} onChange={(v) => patchEl(e.id, { fill: v.target.value })} aria-label="Màu nền hình" /></label>
      <label className="cv-c cv-color" title="Màu viền"><i className="cv-sw is-ring" style={{ borderColor: e.stroke }} /><input type="color" value={/^#[0-9a-f]{6}$/i.test(e.stroke) ? e.stroke : '#f59e0b'} onChange={(v) => patchEl(e.id, { stroke: v.target.value })} aria-label="Màu viền hình" /></label>
      <label className="cv-c" title="Độ dày viền">Viền <input className="cv-mini" type="number" min={0} max={30} value={e.sw} onChange={(v) => patchEl(e.id, { sw: Math.min(30, Math.max(0, Number(v.target.value) || 0)) })} aria-label="Độ dày viền" /></label>
      <select className="cv-c cv-dash" value={e.dash ?? 'solid'} onChange={(v) => patchEl(e.id, { dash: v.target.value === 'solid' ? undefined : v.target.value as 'dash' | 'dot' })} aria-label="Kiểu nét viền"><option value="solid">━ Liền</option><option value="dash">╍ Nét đứt</option><option value="dot">┈ Chấm</option></select>
      {(e.shape === 'rect' || e.shape === 'round') && radius(e.rad ?? (e.shape === 'round' ? 30 : 0), e.id)}
      <button type="button" className={`cv-c${e.shadow ? ' is-on' : ''}`} title="Đổ bóng mềm" onClick={() => patchEl(e.id, { shadow: !e.shadow })}>Bóng</button>
      <button type="button" className={`cv-c${inline === e.id ? ' is-on' : ''}`} title="Gõ chữ trên hình" onClick={() => setInline(inline === e.id ? null : e.id)}>✏️ Chữ</button>
      {e.text && <span className="cv-num"><button type="button" aria-label="Giảm cỡ chữ" onClick={() => patchEl(e.id, { size: Math.max(12, (e.size ?? 40) - 4) })}><Minus aria-hidden="true" /></button>
        <input type="number" list="cv-sizes" min={10} max={300} value={e.size ?? 40} onChange={(v) => { const n = Number(v.target.value); if (n >= 10) patchEl(e.id, { size: Math.min(300, n) }); }} aria-label="Cỡ chữ trên hình" />
        <button type="button" aria-label="Tăng cỡ chữ" onClick={() => patchEl(e.id, { size: Math.min(300, (e.size ?? 40) + 4) })}><Plus aria-hidden="true" /></button></span>}
      {opacity(e.op)}{common}
    </>;
    return <><button type="button" className="cv-c is-hl" onClick={() => setPanel('edit')}>✏️ Sửa nội dung</button>{common}</>;
  })();

  return (
    <div className="dk cv" ref={rootRef}>
      <header className="cv-top">
        <Link href={`/giao-vien/lop/${classId}/ke-hoach?tab=bai-giang&sub=tg`} className="cv-tb" aria-label="Về danh sách bài"><ArrowLeft aria-hidden="true" /></Link>
        <div className="cv-title">
          <input value={deck.title} maxLength={120} onFocus={() => { editStart.current = deckRef.current; }} onChange={(e) => { const n = { ...deckRef.current, title: e.target.value }; deckRef.current = n; setDeck(n); }}
            onBlur={() => { const st = editStart.current; editStart.current = null; if (st && st.title !== deckRef.current.title) { setPast((h) => [...h.slice(-60), st]); setFuture([]); } }} aria-label="Tên bài" />
          <select value={deck.grade} onChange={(e) => commit({ ...deckRef.current, grade: Number(e.target.value) })} aria-label="Lớp">{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
        </div>
        <span className="cv-sep" />
        <button type="button" className="cv-tb" onClick={undo} disabled={!past.length} title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác"><Undo2 aria-hidden="true" /></button>
        <button type="button" className="cv-tb" onClick={redo} disabled={!future.length} title="Làm lại (Ctrl+Y)" aria-label="Làm lại"><Redo2 aria-hidden="true" /></button>
        <span className="cv-sep" />
        <span className={`cv-saved is-${saved}`}>{saved === 'saved' ? '✓ Đã lưu' : saved === 'saving' ? 'Đang lưu…' : '⚠ Chưa lưu được'}</span>
        <span className="cv-grow" />
        <button type="button" className="cv-btn" onClick={() => setPreview(true)}><Play aria-hidden="true" /> Xem thử trang</button>
        <a className="cv-btn" href={showHref(cur)} onClick={() => { void flush(); }}><Play aria-hidden="true" /> Chiếu từ trang này</a>
        <a className="cv-btn is-w" href={showHref(0)} onClick={() => { void flush(); }}><MonitorPlay aria-hidden="true" /> Trình chiếu</a>
      </header>

      <div className="cv-main">
        <nav className="cv-rail" aria-label="Công cụ">
          {RAIL.map(([k, l, Ic]) => <button key={k} type="button" className={panel === k ? 'is-on' : ''} aria-pressed={panel === k} onClick={() => toggle(k)}><Ic aria-hidden={true} />{l}</button>)}
        </nav>

        {panel && (
          <aside className="cv-panel" aria-label="Bảng công cụ">
            <button type="button" className="cv-pclose" aria-label="Đóng bảng" onClick={() => setPanel(null)}><X aria-hidden="true" /></button>
            {panel === 'tpl' && <>
              <div className="cv-chips"><button type="button" className={tplTab === 'set' ? 'is-on' : ''} onClick={() => setTplTab('set')}>Bộ bài giảng 5 bước</button><button type="button" className={tplTab === 'page' ? 'is-on' : ''} onClick={() => setTplTab('page')}>Một trang</button></div>
              {tplTab === 'set' ? <>
                <p className="cv-ph">Bộ mẫu theo khung bài dạy <small>7 trang · {isBlankDeck(deck.slides) ? 'thay trang trống' : 'thêm sau trang này'}</small></p>
                {THEME_SETS.map((t) => (
                  <div key={t.id} className="cv-set">
                    <button type="button" className="cv-set-pv" onClick={() => chooseSet(t.id)} aria-label={`Dùng bộ ${t.name}`}>
                      {[0, 1, 3].map((i) => <SlideFrame key={i} className={`cv-set-t${i === 0 ? ' is-big' : ''}`}>{(k) => <SlideView slide={setPreviews[t.id][i]} mode="thumb" scale={k} />}</SlideFrame>)}
                    </button>
                    <div className="cv-set-nm"><b>{t.name}</b><small>{t.sub}</small></div>
                    <div className="cv-set-act"><button type="button" className="is-pri" onClick={() => chooseSet(t.id)}>{isBlankDeck(deck.slides) ? 'Dùng bộ này' : 'Thêm cả bộ'}</button>
                      <button type="button" onClick={() => restyle(t.id)} title="Giữ nội dung, đổi nền / khung / màu / Milo">Đổi chủ đề cả bài</button></div>
                  </div>
                ))}
                <p className="cv-ph">Chủ đề cảnh minh hoạ</p>
                <select className="cv-sel" aria-label="Chủ đề cảnh cả bài" value="" onChange={(e) => { const v = e.target.value as SceneKind; if (v) commit({ ...deckRef.current, slides: applyTheme(deckRef.current.slides, v) }); }}>
                  <option value="">🎨 Đổi cảnh minh hoạ cả bài…</option>{SCENES_SORTED.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </> : <>
                <p className="cv-ph">Trang của bộ mẫu <small>bấm để thêm một trang</small></p>
                {THEME_SETS.map((t) => (
                  <div key={t.id} className="cv-pages"><small>{t.name}</small><div>{setPreviews[t.id].map((s, i) => (
                    <button key={s.id} type="button" title={s.phase ?? (i ? 'Trang cuối' : 'Trang bìa')} onClick={() => addSlides([makeSet(t.id, info)[i]])}>
                      <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} />}</SlideFrame></button>))}</div></div>
                ))}
                <p className="cv-ph">Trang mẫu theo hoạt động</p>
                <div className="dk-tpls cv-tpls">{SLIDE_TEMPLATES.map((t) => (
                  <button key={t.id} type="button" onClick={() => addSlides(t.make())}>
                    <span className="dk-tpl-pv" style={{ background: BGS.find((b) => b.id === t.bg)?.css }}>{t.preview.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element -- xem trước mẫu
                      <img key={p} src={p} alt="" />))}</span>
                    <b>{t.title}</b><small>{t.desc}</small>
                  </button>))}</div>
                <select className="cv-sel" aria-label="Thêm trang chia hoạt động" value="" onChange={(e) => { const v = e.target.value; if (v) addSlides([dividerSlide(v, slide.scene)]); }}>
                  <option value="">＋ Trang chia hoạt động…</option>{['Khởi động', 'Khám phá', 'Luyện tập', 'Thực hành', 'Vận dụng', 'Trò chơi', 'Củng cố', 'Dặn dò', 'Thảo luận nhóm', 'Cùng chia sẻ'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </>}
            </>}
            {panel === 'el' && <>
              <input className="cv-search is-sticky" type="search" value={q} placeholder="🔎 Tìm hình, cảnh, âm thanh… (táo, thỏ, vỗ tay)" onChange={(e) => setQ(e.target.value)} aria-label="Tìm thành phần" />
              {replace && <p className="dk-msg is-info">Bấm một hình bên dưới để <b>thay</b> hình đang chọn. <button type="button" onClick={() => setReplace(false)}>Huỷ</button></p>}
              {q.trim().length > 0 ? (() => {
                const f = fold(q.trim());
                const localImgs = [...Object.keys(F3D_VI).map(f3dSrc), ...STICKER_SETS.flatMap((x) => x.items)].filter((src) => fold(stickerName(src)).includes(f) || (src.split('/').pop() ?? '').replace(/\.(webp|png)$/, '').split('-').some((w) => w.startsWith(f)));
                const cdnMatches = ALL_FLUENT_CDN_ITEMS.filter((it) => fold(it.name).includes(f) || fold(it.slug).includes(f)).map((it) => it.url);
                const imgs = [...new Set([...localImgs, ...cdnMatches])].slice(0, 100);
                const scenes = SCENES.filter((c) => fold(c.label).includes(f));
                const sounds = SOUNDS.filter((x) => fold(x.label).includes(f));
                return <>
                  {!imgs.length && !scenes.length && !sounds.length && <p className="dk-hint">Không thấy “{q}”. Thử từ khác (thỏ, cây, sách, vỗ tay…).</p>}
                  {imgs.length > 0 && <p className="cv-ph">Hình <small>{imgs.length}{imgs.length >= 100 ? '+' : ''} kết quả (gồm cả kho CDN 1600+)</small></p>}
                  {imgs.length > 0 && <div className="dk-sgrid cv-grid4">{imgs.map((src) => <button key={src} type="button" title={stickerName(src)} onClick={() => addSticker(src)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- hình có sẵn */}
                    <img src={src} alt={stickerName(src)} loading="lazy" onError={(e) => {
                      if (src.includes('@lobehub/fluent-emoji-3d')) {
                        const code = src.split('/').pop()?.replace(/\.(webp|png)$/, '') ?? '';
                        e.currentTarget.src = fluentCdnFallbackUrl(code);
                      } else {
                        hideBroken(e);
                      }
                    }} /></button>)}</div>}
                  {scenes.length > 0 && <div className="dk-row dk-scenes"><b>Cảnh:</b>{scenes.map((c) => <button key={c.id} type="button" onClick={() => setSlide((x) => ({ ...x, scene: c.id }))}>{c.icon} {c.label}</button>)}</div>}
                  {sounds.length > 0 && <div className="dk-row dk-snds"><b>Âm thanh:</b>{sounds.map((x) => <span key={x.id} className="dk-snd"><button type="button" onClick={() => playSound(x.id)}>{x.icon}</button><button type="button" onClick={() => { playSound(x.id); attachSound(x.id); }}>{x.label}</button></span>)}</div>}
                </>;
              })() : elCat === null ? <>
                {/* Trang chủ Thành phần kiểu Canva: Gợi ý cho bạn + Duyệt danh mục */}
                <p className="cv-ph">Gợi ý cho bạn <button type="button" className="cv-link cv-seeall" onClick={() => setElCat('f3d:-1')}>Xem tất cả</button></p>
                <div className="cv-reco">{F3D.slice(0, 12).map((src) => <button key={src} type="button" title={stickerName(src)} onClick={() => addSticker(src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- hình 3D gợi ý */}
                  <img src={src} alt={stickerName(src)} loading="lazy" onError={hideBroken} /></button>)}</div>
                <p className="cv-ph">Duyệt danh mục</p>
                <div className="cv-cattiles">{EL_CATS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setElCat(c.id)}>
                    <span className="cv-cattile-ic" style={{ '--tile': c.bg } as React.CSSProperties}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- biểu tượng danh mục */}
                      <img src={c.icon} alt="" loading="lazy" />
                    </span>
                    <span className="cv-cattile-lb">{c.label}</span>
                  </button>
                ))}</div>
              </> : (() => {
                // Trang chi tiết một danh mục (có nút quay lại như Canva)
                const cat = EL_CATS.find((c) => c.id === elCat);
                const cdnIdx = elCat.startsWith('cdn:') ? Number(elCat.slice(4)) : null;
                const f3dIdx = elCat.startsWith('f3d:') ? Number(elCat.slice(4)) : null;
                const stIdx = elCat.startsWith('st:') ? Number(elCat.slice(3)) : null;
                const grid = (list: string[]) => <div className="dk-sgrid cv-grid4">{list.map((src) => <button key={src} type="button" title={stickerName(src)} onClick={() => addSticker(src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- hình có sẵn */}
                  <img src={src} alt={stickerName(src)} loading="lazy" onError={(e) => {
                    const fallback = e.currentTarget.getAttribute('data-fallback');
                    if (src.includes('@lobehub/fluent-emoji-3d') && !fallback) {
                      const code = src.split('/').pop()?.replace(/\.(webp|png)$/, '') ?? '';
                      e.currentTarget.setAttribute('data-fallback', '1');
                      e.currentTarget.src = fluentCdnFallbackUrl(code);
                    } else {
                      hideBroken(e);
                    }
                  }} /></button>)}</div>;
                const shapeBtns = (list: typeof SHAPES) => <div className="cv-shapes">{list.map((s) => (
                  <button key={s.k} type="button" title={s.label} aria-label={s.label} onClick={() => addShape(s.k)}><span className="dk-shape-ic"><ShapeSvg e={{ id: '', kind: 'shape', shape: s.k, x: 0, y: 0, w: 1, h: 1, rot: 0, fill: s.k === 'sticky' ? '#f5c76b' : s.k === 'plaid-card' || s.k === 'badge-card' ? '#faeedb' : s.k === 'flower-bullet' ? '#eebfb8' : '#fde68a', stroke: '#d97706', sw: 1.5 }} /></span><small>{s.label}</small></button>))}</div>;
                return <>
                  <button type="button" className="cv-catback" onClick={() => setElCat(null)}><ArrowLeft aria-hidden="true" /> {cat?.label ?? (f3dIdx === -1 ? 'Hình 3D gợi ý' : 'Danh mục')}</button>
                  {elCat === 'milo' && <div className="cv-milo">{MILO.map((src) => <button key={src} type="button" onClick={() => (replace && selEl?.kind === 'img' ? addSticker(src) : addEl({ id: uid(), kind: 'img', ...center(300, 400), w: 300, h: 400, rot: 0, src, name: 'Bạn cú Milo', role: 'mascot' }, 'pop'))}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- linh vật */}
                    <img src={src.replace('.webp', '-sm.webp')} alt="Bạn cú Milo" loading="lazy" onError={hideBroken} /></button>)}</div>}
                  {elCat === 'shape' && shapeBtns(SHAPES.filter((s) => !SCRAP_SHAPES.includes(s.k)))}
                  {elCat === 'scrap' && <>
                    <p className="dk-hint">Giấy note dán băng dính, thẻ bước kẻ caro, thẻ mặt trời, hoa cúc đầu dòng — phong cách sổ tay Canva.</p>
                    {shapeBtns(SHAPES.filter((s) => SCRAP_SHAPES.includes(s.k)))}
                  </>}
                  {elCat === 'scene' && <>
                    <p className="dk-hint">Bấm để đặt cảnh nền cho trang này (đổi góc máy ở bảng Nền).</p>
                    {sceneGroups().map((g) => (
                      <div key={g.label} className="cv-scenegroup">
                        <p className="cv-ph">{g.label}</p>
                        <div className="cv-scenetiles">{g.scenes.map((c) => <button key={c.id} type="button" aria-pressed={slide.scene === c.id} className={slide.scene === c.id ? 'is-on' : ''} style={{ background: c.bg }} onClick={() => setSlide((x) => ({ ...x, scene: c.id }))}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- hình có sẵn */}
                          <img src={c.art} alt="" loading="lazy" draggable={false} /><b>{c.label}</b>
                        </button>)}</div>
                      </div>
                    ))}
                  </>}
                  {f3dIdx !== null && grid(f3dIdx < 0 ? F3D : (F3D_CATS[f3dIdx]?.items ?? []).map(f3dSrc))}
                  {cdnIdx !== null && grid((FLUENT_CDN_GROUPS[cdnIdx]?.items ?? []).map(([code]) => fluentCdnUrl(code)))}
                  {stIdx !== null && grid(STICKER_SETS[stIdx]?.items ?? [])}
                </>;
              })()}
            </>}
            {panel === 'text' && <>
              <button type="button" className="cv-big is-h" onClick={() => addText(true)}>Thêm tiêu đề</button>
              <button type="button" className="cv-big" onClick={() => addText(false)}>Thêm đoạn chữ</button>
              <p className="cv-ph">Kiểu chữ có sẵn</p>
              <div className="cv-tstyles">{TEXT_STYLES.map((t) => (
                <button key={t.id} type="button" style={{ fontFamily: FONTS[t.font].css, color: t.stroke ? t.color : t.color, background: t.bg || undefined, WebkitTextStroke: t.stroke ? '1px #fff' : undefined }}
                  onClick={() => addEl({ id: uid(), kind: 'text', ...center(t.w, t.h), w: t.w, h: t.h, rot: 0, text: t.label, size: t.size, color: dark && !t.bg ? '#ffffff' : t.color, font: t.font, align: 'center', bg: t.bg, ...(t.stroke ? { stroke: '#ffffff', strokeW: 12, shadow: true } : {}) })}>{t.label}</button>))}</div>
            </>}
            {panel === 'act' && <>
              <p className="cv-ph">Hoạt động cho học sinh</p>
              <div className="cv-acts">
                <button type="button" onClick={addQuiz}><span>❓</span>Câu hỏi trắc nghiệm</button>
                <button type="button" onClick={addDrop}><span>🎯</span>Ô thả (kéo thả)</button>
                <button type="button" onClick={addSort}><span>🔢</span>Sắp xếp thứ tự</button>
                <button type="button" onClick={addScene}><span>🧊</span>Cảnh 3D</button>
                <button type="button" onClick={() => addEl({ id: uid(), kind: 'teams', x: 200, y: 160, w: 1200, h: 680, rot: 0, title: '' }, 'fade')}><span>🏆</span>Bảng thi đua tổ</button>
              </div>
              <p className="cv-ph">Bố cục</p>
              <div className="cv-acts">
                <button type="button" onClick={() => { const n = slide.els.filter((e) => e.role === 'badge').length; addEl({ ...badgeEl(n + 1, 'Số ?', accentOf(slide.scene)) }); }}><span>①</span>Nhãn bài</button>
                <button type="button" onClick={() => setSlide((s) => (s.els.some((e) => e.role === 'card') ? s : { ...s, els: [cardEl(accentOf(s.scene)), ...s.els] }))}><span>🔲</span>Khung nội dung</button>
                {Object.entries(STEP_COLOR).slice(0, 5).map(([l, c]) => <button key={l} type="button" onClick={() => addEl({ id: uid(), kind: 'text', x: 64, y: 46, w: 40 + l.length * 26, h: 78, rot: 0, text: l, size: 40, color: '#ffffff', font: 'baloo', align: 'center', bg: c, role: 'step' })}><span style={{ color: c }}>●</span>Nhãn “{l}”</button>)}
              </div>
              <select className="cv-sel" aria-label="Hình thức làm bài" value="" onChange={(e) => { const v = e.target.value as WorkMode; if (v) addEl({ ...modeEl(v, accentOf(slide.scene)) }); }}>
                <option value="">👥 Hình thức làm bài…</option>{WORK_MODES.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </>}
            {panel === 'bg' && <>
              <p className="cv-ph">Nền trang</p>
              <div className="dk-bgs cv-bgs">{BGS.map((b) => <button key={b.id} type="button" title={b.label} aria-label={`Nền ${b.label}`} className={slide.bg === b.id ? 'is-on' : ''} style={{ background: b.css }} onClick={() => setSlide((s) => ({ ...s, bg: b.id }))} />)}
                <label className="cv-bgc" title="Màu khác"><input type="color" value={/^#[0-9a-f]{6}$/i.test(slide.bg) ? slide.bg : '#ffffff'} onChange={(e) => setSlide((s) => ({ ...s, bg: e.target.value }))} aria-label="Màu nền khác" /></label></div>
              <button type="button" className="cv-link" onClick={() => commit({ ...deckRef.current, slides: deckRef.current.slides.map((x) => ({ ...x, bg: slide.bg })) })}>Áp dụng nền này cho mọi trang</button>
              <p className="cv-ph">Cảnh minh hoạ (trang này)</p>
              <div className="dk-row dk-scenes cv-wrap">
                <button type="button" className={!slide.scene ? 'is-on' : ''} onClick={() => setSlide((s) => ({ ...s, scene: undefined }))}>Không</button>
                {SCENES_SORTED.map((c) => <button key={c.id} type="button" title={c.label} className={slide.scene === c.id ? 'is-on' : ''} onClick={() => setSlide((s) => ({ ...s, scene: c.id }))}><span aria-hidden="true">{c.icon}</span>{c.label}</button>)}
              </div>
              {slide.scene && <>
                <p className="cv-ph">Bố cục cảnh (góc máy)</p>
                <div className="dk-row dk-scenes cv-wrap">
                  {SCENE_VARIANTS.map((v) => <button key={v.id} type="button" title={v.label} className={(slide.sceneVariant ?? 'bottom') === v.id ? 'is-on' : ''} onClick={() => setSlide((s) => ({ ...s, sceneVariant: v.id }))}>{v.short}</button>)}
                </div>
              </>}
              <p className="cv-ph">Âm thanh khi vào trang</p>
              <select className="cv-sel" value={slide.sound ?? ''} onChange={(e) => setSlide((s) => ({ ...s, sound: e.target.value || undefined }))} aria-label="Âm thanh khi vào trang">
                <option value="">Không có</option>{SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                {myAudio.map((a) => <option key={a.id} value={`asset:${a.path}`}>🎙 {a.name}</option>)}
              </select>
            </>}
            {panel === 'sound' && <>
              <p className="cv-ph">Thư viện âm thanh <small>bấm tên để gắn vào {animSel && slide.anims.some((a) => a.id === animSel) ? 'hiệu ứng đang chọn' : 'trang'}</small></p>
              <div className="dk-row dk-snds cv-wrap">{SOUNDS.map((s) => (
                <span key={s.id} className="dk-snd"><button type="button" title="Nghe thử" onClick={() => playSound(s.id)}>{s.icon}</button><button type="button" onClick={() => { playSound(s.id); attachSound(s.id); }}>{s.label}</button></span>))}</div>
              <p className="cv-ph">Âm thanh của cô</p>
              <div className="cv-acts">
                <button type="button" className={rec ? 'is-rec' : ''} onClick={() => void toggleRec()} disabled={!!busy && !rec}><span>{rec ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}</span>{rec ? 'Dừng ghi' : 'Ghi âm giọng cô'}</button>
                <button type="button" onClick={() => audInput.current?.click()} disabled={!!busy}><span><Upload aria-hidden="true" /></span>Tải lên .mp3</button>
              </div>
              <div className="dk-row dk-snds cv-wrap">{myAudio.map((a) => <span key={a.id} className="dk-snd"><button type="button" onClick={() => playSound(`asset:${a.path}`)}>🎙</button><button type="button" onClick={() => attachSound(`asset:${a.path}`)}>{a.name}</button></span>)}</div>
            </>}
            {panel === 'up' && <>
              <button type="button" className="cv-big is-h" onClick={() => imgInput.current?.click()} disabled={!!busy}><Upload aria-hidden="true" /> Tải ảnh lên</button>
              <p className="cv-ph">Ảnh của tôi <small>{myImages.length} ảnh</small></p>
              {mine === null ? <p className="dk-hint">Đang tải…</p> : !myImages.length ? <p className="dk-hint">Chưa có ảnh. Ảnh tải lên được lưu trong Kho của tôi.</p> : (
                <div className="dk-sgrid cv-grid3">{myImages.map((a) => <button key={a.id} type="button" title={a.name} onClick={() => (replace && selEl?.kind === 'img' ? (patchEl(selEl.id, { src: a.path, asset: true, name: a.name }), setReplace(false)) : addEl({ id: uid(), kind: 'img', ...center(360, 260), w: 360, h: Math.round(360 * ((a.meta.h as number) || 3) / ((a.meta.w as number) || 4)), rot: 0, src: a.path, asset: true, name: a.name }))}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trong kho */}
                  <img src={a.thumb ?? a.url ?? ''} alt={a.name} /></button>)}</div>
              )}
            </>}
            {panel === 'anim' && <>
              <p className="cv-ph">{selEl ? <>Hiệu ứng cho <b>{elLabel(selEl)}</b></> : 'Chọn một vật trên trang rồi bấm hiệu ứng'}</p>
              {(['in', 'em', 'out'] as const).map((g) => (
                <div key={g}><small className="cv-sub">{g === 'in' ? 'Xuất hiện' : g === 'em' ? 'Nhấn mạnh' : 'Biến mất'}</small>
                  <div className="cv-fx">{FX.filter((f) => f.group === g).map((f) => <button key={f.id} type="button" onClick={() => addAnim(f.id)} disabled={!selEl}><span>{f.icon}</span>{f.label}</button>)}</div></div>
              ))}
              <div className="cv-row2">
                <select value={startMode} onChange={(e) => setStartMode(e.target.value as Start)} disabled={!!trigMode} aria-label="Bắt đầu">{(Object.keys(START_LABEL) as Start[]).map((s) => <option key={s} value={s}>{START_LABEL[s]}</option>)}</select>
                <select value={trigMode} onChange={(e) => setTrigMode(e.target.value)} aria-label="Kích hoạt" className={trigMode ? 'is-trg' : ''}>
                  <option value="">Theo thứ tự (bấm Tiếp)</option>{slide.els.map((e) => <option key={e.id} value={e.id}>🎯 Khi bấm vào: {elLabel(e)}</option>)}
                </select>
              </div>
              <select className="cv-sel" aria-label="Hiệu ứng cả trang" value="" onChange={(e) => { const v = e.target.value as Fx; if (v) animateAll(v); }}>
                <option value="">✨ Hiệu ứng cả trang (tự hiện lần lượt)…</option>{FX.filter((f) => f.group === 'in').map((f) => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
              </select>
              <p className="cv-ph">Hiệu ứng trên trang <small>{slide.anims.length}</small></p>
              <AnimList slide={slide} sel={animSel} setSel={(id) => { setAnimSel(id); const a = slide.anims.find((x) => x.id === id); if (a) setSel(a.el); }}
                patch={patchAnim} move={moveAnim} del={(id) => setSlide((s) => ({ ...s, anims: s.anims.filter((a) => a.id !== id) }))} myAudio={myAudio} />
            </>}
            {panel === 'pos' && <>
              {selEls.length > 0 && <>
                <p className="cv-ph">Sắp xếp</p>
                <div className="cv-grid2">
                  <button type="button" onClick={() => selEl && moveLayer(selEl.id, 1)} disabled={!selEl}>Đưa lên trên</button>
                  <button type="button" onClick={() => selEl && moveLayer(selEl.id, -1)} disabled={!selEl}>Đưa xuống dưới</button>
                  <button type="button" onClick={() => order(true)}>Lên trên cùng</button>
                  <button type="button" onClick={() => order(false)}>Xuống dưới cùng</button>
                </div>
                <AlignBar n={selEls.length} grouped={selEls.length > 1 && selEls.every((e) => e.group && e.group === selEls[0].group)} align={alignSel} onGroup={groupSel} onUngroup={ungroupSel} />
                {selEl && <div className="dk-xy">
                  <label>X<input type="number" value={Math.round(selEl.x)} onChange={(v) => patchEl(selEl.id, { x: Number(v.target.value) })} /></label>
                  <label>Y<input type="number" value={Math.round(selEl.y)} onChange={(v) => patchEl(selEl.id, { y: Number(v.target.value) })} /></label>
                  <label>Rộng<input type="number" value={Math.round(selEl.w)} onChange={(v) => patchEl(selEl.id, { w: Math.max(20, Number(v.target.value)) })} /></label>
                  <label>Cao<input type="number" value={Math.round(selEl.h)} onChange={(v) => patchEl(selEl.id, { h: Math.max(20, Number(v.target.value)) })} /></label>
                  <label>Xoay<input type="number" value={selEl.rot} onChange={(v) => patchEl(selEl.id, { rot: Number(v.target.value) % 360 })} /></label>
                </div>}
              </>}
              <p className="cv-ph">Lớp trên trang <small>kéo thứ tự bằng mũi tên</small></p>
              <Layers slide={slide} selIds={selIds} pick={pick} move={moveLayer}
                lock={(id) => setSlide((s) => ({ ...s, els: s.els.map((e) => (e.id === id ? { ...e, lock: !e.lock } : e)) }))}
                hide={(id) => setSlide((s) => ({ ...s, els: s.els.map((e) => (e.id === id ? { ...e, hide: !e.hide } : e)) }))} />
            </>}
            {panel === 'edit' && (selEl ? (
              <Props e={selEl} slide={slide} deck={deck} images={myImages} patch={(p) => patchEl(selEl.id, p)} patchSoft={(p) => patchEl(selEl.id, p, false)} commitSoft={() => commit(deckRef.current)}
                textRef={textRef} lessons={lessons} onDup={dupEl} onDel={delEl} onOrder={order} onAnimate={() => setPanel('anim')}
                onCopyStyle={() => { setStyleCopy(selEl); setMsg({ kind: 'info', text: '🖌 Bấm vào vật khác để dán kiểu (Esc để huỷ).' }); }} />
            ) : <div className="dk-empty"><p>Bấm vào một vật trên trang để sửa. Bấm đúp vào chữ để gõ.</p>
              <p className="dk-kbd">Phím tắt: Delete xoá · Ctrl+C / Ctrl+V sao chép, dán (cả sang trang khác) · Ctrl+D nhân bản · Ctrl+A chọn hết · Shift+bấm chọn thêm · kéo trên nền để chọn vùng · Ctrl+G nhóm · mũi tên dịch chuyển · Ctrl+Z hoàn tác · chuột phải: menu nhanh · giữ Alt khi kéo để tắt đường gióng.</p></div>)}
          </aside>
        )}
        <input ref={imgInput} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onImage(f); }} />
        <input ref={audInput} type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onAudio(f, f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60)); }} />

        <section className={`cv-work${styleCopy ? ' is-paint' : ''}`}>
          {grid ? (
            <div className="cv-gridv" aria-label="Tất cả các trang">
              {deck.slides.map((s, i) => (
                <div key={s.id} className={`cv-g${i === cur ? ' is-on' : ''}${drag === i ? ' is-drag' : ''}`} draggable
                  onDragStart={(ev) => { setDrag(i); ev.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDrag(null)}
                  onDragOver={(ev) => { ev.preventDefault(); }} onDrop={(ev) => { ev.preventDefault(); if (drag != null) reorder(drag, i); setDrag(null); }}>
                  <button type="button" className="cv-g-t" onClick={() => setCur(i)} onDoubleClick={() => { setCur(i); setGrid(false); }} aria-label={`Trang ${i + 1}`}>
                    <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame>
                    {s.phase && !s.els.some((e) => e.role === 'step') && <i className="cv-tag" style={{ background: STEP_COLOR[s.phase] ?? '#7c3aed' }}>{s.phase}</i>}
                  </button>
                  <div className="cv-g-cap"><b>{i + 1}. {pageTitle(s)}</b><span>{s.mins ? `${s.mins} phút` : ''}</span></div>
                </div>
              ))}
              <div><button type="button" className="cv-g-add" onClick={() => addSlides([newSlide(slide.bg)])}><Plus aria-hidden="true" /> Thêm trang</button>
                <p className="cv-g-hint">Kéo thả để đổi thứ tự · bấm đúp để mở trang{totalMins ? ` · Tổng ${totalMins} phút` : ''}</p></div>
            </div>
          ) : <>
            <div className="cv-ctx" role="toolbar" aria-label="Công cụ cho vật đang chọn">{ctxTools}</div>
            <datalist id="cv-sizes">{[12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144, 180, 220].map((n) => <option key={n} value={n} />)}</datalist>
            {(busy || msg) && <div className="cv-toast">{busy && <p className="dk-busy" role="status">{busy}</p>}{msg && <p className={`dk-msg is-${msg.kind}`} role="status">{msg.text} <button type="button" onClick={() => setMsg(null)} aria-label="Đóng">×</button></p>}</div>}
            <div className="cv-canvas" ref={canvasRef} onContextMenu={(ev) => {
              const id = (ev.target as HTMLElement).closest<HTMLElement>('.dk-el')?.dataset.id;
              if (!id) return;
              ev.preventDefault(); if (!selIds.includes(id)) pick(id);
              setCtx({ x: ev.clientX, y: ev.clientY });
            }} onClick={() => setCtx(null)}>
              <SlideFrame className="dk-main cv-slide" style={{ width: W, maxWidth: 'none' }}>{(k) => <>
                <SlideView key={slide.id} slide={slide} mode="edit" scale={k} assetUrl={assetUrl} speechSubject={deck.src?.subject ?? (/\benglish\b|tiếng anh/i.test(`${deck.title} ${deck.src?.lesson ?? ''}`) ? 'tieng-anh' : 'tieng-viet')} sel={sel} multi={selIds} onSelect={pick}
                  onSelectMany={(ids) => { setMulti(ids); setSel(ids[0] ?? null); }} onChange={onChange} onEditText={editText} editing={inline} snapGrid={snapGrid} />
                {bb && (
                  <div className={`cv-quick${bb.t * k < 56 ? ' is-below' : ''}`} style={{ left: ((bb.l + bb.r) / 2) * k, top: (bb.t * k < 56 ? bb.b : bb.t) * k }} onPointerDown={(ev) => ev.stopPropagation()}>
                    <button type="button" className={allLock ? 'is-on' : ''} title={allLock ? 'Mở khoá' : 'Khoá (không kéo nhầm)'} aria-label={allLock ? 'Mở khoá' : 'Khoá'} onClick={() => setMany({ lock: !allLock })}>{allLock ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}</button>
                    <button type="button" title="Nhân bản (Ctrl+D)" aria-label="Nhân bản" onClick={dupEl}><Copy aria-hidden="true" /></button>
                    <button type="button" title="Xoá (Delete)" aria-label="Xoá" onClick={delEl}><Trash2 aria-hidden="true" /></button>
                    <button type="button" title="Ẩn khi trình chiếu" aria-label="Ẩn hoặc hiện" onClick={() => setMany({ hide: !selEls.every((e) => e.hide) })}>{selEls.every((e) => e.hide) ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
                    <button type="button" title="Thêm" aria-label="Thêm lựa chọn" onClick={(ev) => { const r = (ev.currentTarget as HTMLElement).getBoundingClientRect(); setCtx({ x: r.left, y: r.bottom + 6 }); }}><MoreHorizontal aria-hidden="true" /></button>
                  </div>
                )}
              </>}</SlideFrame>
              {styleCopy && <span className="dk-paint cv-paint">🖌 Bấm vào vật để dán kiểu · Esc để huỷ</span>}
            </div>
            {panel === 'anim' && <AnimTimeline slide={slide} sel={animSel} onSelect={(a) => { setAnimSel(a.id); setSel(a.el); }}
              onPatch={patchAnimSoft} onCommit={commitSoft} stage={() => document.querySelector('.cv-slide')} />}
            <div className="cv-strip" aria-label="Các trang">
              {deck.slides.map((s, i) => (
                <button key={s.id} type="button" className={`cv-th${i === cur ? ' is-on' : ''}${drag === i ? ' is-drag' : ''}`} draggable
                  onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)} onDragOver={(ev) => ev.preventDefault()} onDrop={(ev) => { ev.preventDefault(); if (drag != null) reorder(drag, i); setDrag(null); }}
                  onClick={() => { setCur(i); setSel(null); setMulti([]); setAnimSel(null); }} aria-label={`Trang ${i + 1}`} aria-current={i === cur}>
                  <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame>
                  <span className="cv-th-n">{i + 1}</span>
                  {s.phase && !s.els.some((e) => e.role === 'step') && <i className="cv-tag" style={{ background: STEP_COLOR[s.phase] ?? '#7c3aed' }}>{s.phase}</i>}
                  <span className="cv-th-ic">{s.anims.length > 0 && '✨'}{s.anims.some((a) => a.trigger) && '🎯'}{(s.sound || s.anims.some((a) => a.sound)) && '🔊'}</span>
                </button>
              ))}
              <button type="button" className="cv-th-add" onClick={() => addSlides([newSlide(slide.bg)])} aria-label="Thêm trang"><Plus aria-hidden="true" /></button>
              <span className="cv-th-tools">
                <button type="button" onClick={dupSlide} title="Nhân bản trang" aria-label="Nhân bản trang"><Copy aria-hidden="true" /></button>
                <button type="button" onClick={() => moveSlide(-1)} disabled={cur === 0} title="Đưa trang lên trước" aria-label="Đưa trang lên trước"><ArrowLeft aria-hidden="true" /></button>
                <button type="button" onClick={delSlide} title="Xoá trang" aria-label="Xoá trang" className="is-danger"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
          </>}
          {foot && (
            <div className="cv-pop" role="dialog" aria-label={foot === 'dur' ? 'Thời lượng' : foot === 'note' ? 'Ghi chú' : 'Hẹn giờ'}>
              <button type="button" className="cv-pclose" aria-label="Đóng" onClick={() => setFoot(null)}><X aria-hidden="true" /></button>
              {foot === 'dur' && <>
                <b>Thời lượng trang {cur + 1}</b>
                <label className="cv-pl">Dự kiến dạy <input type="number" min={0} max={90} step={0.5} value={slide.mins ?? ''} placeholder="—" onChange={(e) => setSlide((s) => ({ ...s, mins: Number(e.target.value) > 0 ? Math.min(90, Number(e.target.value)) : undefined }))} aria-label="Số phút dự kiến" /> phút</label>
                <label className="cv-pl"><input type="checkbox" checked={!!slide.autoNext} onChange={(e) => setSlide((s) => ({ ...s, autoNext: e.target.checked ? 5 : undefined }))} /> Tự sang bước / trang sau</label>
                {!!slide.autoNext && <label className="cv-pl"><input type="range" min={1} max={60} value={slide.autoNext} onChange={(e) => setSlide((s) => ({ ...s, autoNext: Number(e.target.value) }), false)} onPointerUp={() => commit(deckRef.current)} aria-label="Số giây tự sang" /> <b>{slide.autoNext} giây</b></label>}
                <label className="cv-pl">Chuyển trang <select value={slide.trans} onChange={(e) => setSlide((s) => ({ ...s, trans: e.target.value as Trans }))}>{(Object.keys(TRANS_LABEL) as Trans[]).map((t) => <option key={t} value={t}>{TRANS_LABEL[t]}</option>)}</select>
                  <input type="number" min={0.1} max={3} step={0.1} value={slide.transDur ?? 0.55} onChange={(e) => setSlide((s) => ({ ...s, transDur: Math.min(3, Math.max(0.1, Number(e.target.value) || 0.55)) }))} aria-label="Thời gian chuyển trang (giây)" /> s</label>
                <button type="button" className="cv-link" onClick={() => commit({ ...deckRef.current, slides: deckRef.current.slides.map((x) => ({ ...x, trans: slide.trans, transDur: slide.transDur, autoNext: slide.autoNext })) })}>Áp dụng chuyển trang &amp; tự sang cho mọi trang</button>
              </>}
              {foot === 'note' && <>
                <b>Ghi chú cho cô · trang {cur + 1} <small>— chỉ hiện ở màn hình của cô khi trình chiếu</small></b>
                <textarea rows={4} value={slide.notes} placeholder="vd: Hỏi lớp “Có mấy bạn thỏ?”, rồi bấm vào cà rốt để hiện đáp án." onChange={(e) => setSlide((s) => ({ ...s, notes: e.target.value }), false)} onBlur={() => commit(deckRef.current)} autoFocus />
              </>}
              {foot === 'timer' && <>
                <b>Hẹn giờ cả tiết</b>
                <label className="cv-pl">Thời gian tiết học <input type="number" min={0} max={180} value={deck.mins ?? ''} placeholder="35" onChange={(e) => commit({ ...deckRef.current, mins: Number(e.target.value) > 0 ? Math.min(180, Math.round(Number(e.target.value))) : undefined })} aria-label="Số phút cả tiết" /> phút</label>
                <div className="cv-row2">{[35, 40, 45].map((m) => <button key={m} type="button" className={deck.mins === m ? 'is-on' : ''} onClick={() => commit({ ...deckRef.current, mins: m })}>{m} phút</button>)}</div>
                <small className="dk-hint">Khi trình chiếu, màn hình của cô đếm ngược thời gian còn lại của tiết và thời gian đã dùng ở từng trang. Các trang đã đặt dự kiến: {totalMins} phút.</small>
              </>}
            </div>
          )}
          <footer className="cv-foot">
            <button type="button" className={foot === 'dur' ? 'is-on' : ''} onClick={() => setFoot(foot === 'dur' ? null : 'dur')}><Clock aria-hidden="true" /> Thời lượng{slide.mins ? ` · ${slide.mins}′` : ''}</button>
            <button type="button" className={foot === 'note' ? 'is-on' : ''} onClick={() => setFoot(foot === 'note' ? null : 'note')}><StickyNote aria-hidden="true" /> Ghi chú{slide.notes ? ' ●' : ''}</button>
            <button type="button" className={foot === 'timer' ? 'is-on' : ''} onClick={() => setFoot(foot === 'timer' ? null : 'timer')}><Timer aria-hidden="true" /> Hẹn giờ{deck.mins ? ` · ${deck.mins}′` : ''}</button>
            <span className="cv-grow" />
            <label className="cv-zoom"><input type="range" min={50} max={200} step={10} value={Math.round(zoom * 100)} onChange={(e) => setZoom(Number(e.target.value) / 100)} aria-label="Thu phóng" disabled={grid} /><b>{Math.round(zoom * 100)}%</b></label>
            <span className="cv-pg">{cur + 1} / {deck.slides.length}</span>
            <button type="button" className={`cv-snap${snapGrid ? ' is-on' : ''}`} onClick={() => setSnapGrid((v) => !v)} title={snapGrid ? 'Đang bật Thước thông minh & Lưới 20px (Alt khi kéo để tắt tạm)' : 'Thước căn chỉnh thông minh & Hút tâm (X: 800, Y: 450) luôn sẵn sàng. Bấm để bật thêm lưới 20px'} aria-label="Thước căn chỉnh thông minh và hút" aria-pressed={snapGrid}><Grid2x2 aria-hidden="true" /><span>{snapGrid ? 'Lưới 20 + Tâm' : 'Căn thông minh'}</span></button>
            <button type="button" className={grid ? 'is-on' : ''} onClick={() => setGrid(!grid)} title="Xem lưới tất cả trang" aria-label="Xem lưới" aria-pressed={grid}><Grid2x2 aria-hidden="true" /></button>
            <button type="button" onClick={fullscreen} title="Toàn màn hình" aria-label="Toàn màn hình"><Maximize aria-hidden="true" /></button>
          </footer>
        </section>
      </div>

      {ctx && selEls.length > 0 && (
        <div className="dk-ctx" style={{ left: ctx.x, top: ctx.y }} role="menu" onClick={() => setCtx(null)}>
          <button type="button" role="menuitem" onClick={copyEls}>Sao chép <kbd>Ctrl C</kbd></button>
          <button type="button" role="menuitem" onClick={pasteClip}>Dán <kbd>Ctrl V</kbd></button>
          <button type="button" role="menuitem" onClick={dupEl}>Nhân bản <kbd>Ctrl D</kbd></button>
          {selEls.length === 1 && <button type="button" role="menuitem" onClick={() => setStyleCopy(selEls[0])}>🖌 Sao chép kiểu</button>}
          <hr />
          <button type="button" role="menuitem" onClick={() => order(true)}>Lên trên cùng</button>
          <button type="button" role="menuitem" onClick={() => order(false)}>Xuống dưới cùng</button>
          {selIds.length > 1 && (selEls.every((e) => e.group && e.group === selEls[0].group) ? <button type="button" role="menuitem" onClick={ungroupSel}>Bỏ nhóm <kbd>Ctrl⇧G</kbd></button> : <button type="button" role="menuitem" onClick={groupSel}>Nhóm <kbd>Ctrl G</kbd></button>)}
          <button type="button" role="menuitem" onClick={() => setMany({ lock: !allLock })}>{allLock ? 'Mở khoá' : 'Khoá'}</button>
          <button type="button" role="menuitem" onClick={() => setMany({ hide: !selEls.every((e) => e.hide) })}>{selEls.every((e) => e.hide) ? 'Hiện khi trình chiếu' : 'Ẩn khi trình chiếu'}</button>
          <button type="button" role="menuitem" onClick={() => setPanel('anim')}>✨ Thêm hiệu ứng</button>
          <hr />
          <button type="button" role="menuitem" className="is-danger" onClick={delEl}>Xoá <kbd>Del</kbd></button>
        </div>
      )}
      {preview && <Preview slide={slide} assetUrl={assetUrl} speechSubject={deck.src?.subject ?? (/\benglish\b|tiếng anh/i.test(`${deck.title} ${deck.src?.lesson ?? ''}`) ? 'tieng-anh' : 'tieng-viet')} onClose={() => setPreview(false)} />}
    </div>
  );
}

/* ---------- thuộc tính vật ---------- */
function Swatches({ colors, value, set, label }: { colors: string[]; value: string; set: (c: string) => void; label: string }) {
  return (
    <div className="dk-sw" role="radiogroup" aria-label={label}>
      {colors.map((c) => <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c === 'transparent' ? 'Không màu' : c} className={`${value === c ? 'is-on' : ''}${c === 'transparent' ? ' is-none' : ''}`} style={c === 'transparent' ? undefined : { background: c }} onClick={() => set(c)} />)}
      <label className="pen-custom" title="Màu khác"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1d4ed8'} onChange={(e) => set(e.target.value)} aria-label={`${label}: màu khác`} /></label>
    </div>
  );
}

function Props({ e, slide, deck, images, patch, patchSoft, commitSoft, textRef, lessons, onDup, onDel, onOrder, onAnimate, onCopyStyle }: {
  e: El; slide: Slide; deck: Deck; images: TeacherAsset[]; patch: (p: Partial<El>) => void; patchSoft: (p: Partial<El>) => void; commitSoft: () => void;
  textRef: React.RefObject<HTMLTextAreaElement | null>; lessons: Lesson3DRow[] | null;
  onDup: () => void; onDel: () => void; onOrder: (top: boolean) => void; onAnimate: () => void; onCopyStyle: () => void;
}) {
  const draggables = slide.els.filter((x) => x.drag && x.id !== e.id);
  return (
    <div className="dk-props">
      <h3>{elLabel(e)}</h3>
      <div className="dk-acts">
        <button type="button" onClick={onDup}><Copy aria-hidden="true" /> Nhân bản</button>
        <button type="button" onClick={() => onOrder(true)}><ArrowUpToLine aria-hidden="true" /> Lên trên</button>
        <button type="button" onClick={() => onOrder(false)}><ArrowDownToLine aria-hidden="true" /> Xuống dưới</button>
        <button type="button" onClick={() => patch({ lock: !e.lock })}>{e.lock ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" />} {e.lock ? 'Mở khoá' : 'Khoá'}</button>
        {(e.kind === 'text' || e.kind === 'shape') && <button type="button" onClick={onCopyStyle} title="Sao chép kiểu rồi bấm vào vật khác để dán">🖌 Sao chép kiểu</button>}
        <button type="button" className="is-danger" onClick={onDel}><Trash2 aria-hidden="true" /> Xoá</button>
      </div>
      {e.kind === 'text' && <>
        <div className="dk-f">Kiểu chữ có sẵn<div className="dk-seg dk-tstyles">{TEXT_STYLES.map((t) => <button key={t.id} type="button" onClick={() => patch({ size: t.size, font: t.font, color: t.color, bg: t.bg, stroke: t.stroke ? '#ffffff' : undefined, strokeW: t.stroke ? 12 : undefined, shadow: !!t.stroke })}>{t.label}</button>)}</div></div>
        <label className="dk-f">Nội dung<textarea ref={textRef} rows={3} value={e.text} onChange={(v) => patchSoft({ text: v.target.value })} onBlur={commitSoft} /></label>
        <label className="dk-f">Phông chữ<select value={e.font} onChange={(v) => patch({ font: v.target.value as FontKey })}>{(Object.keys(FONTS) as FontKey[]).map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}</select></label>
        <label className="dk-f">Cỡ chữ: {e.size}<input type="range" min={18} max={200} value={e.size} onChange={(v) => patchSoft({ size: Number(v.target.value) })} onPointerUp={commitSoft} /></label>
        <div className="dk-f">Căn chữ<div className="dk-seg">{(['left', 'center', 'right'] as const).map((a) => <button key={a} type="button" className={e.align === a ? 'is-on' : ''} onClick={() => patch({ align: a })}>{a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}</button>)}</div></div>
        <div className="dk-f">Màu chữ<Swatches colors={COLORS} value={e.color} set={(c) => patch({ color: c })} label="Màu chữ" /></div>
        <label className="dk-chk dk-f"><input type="checkbox" checked={!!e.stroke} onChange={(v) => patch({ stroke: v.target.checked ? '#ffffff' : undefined, strokeW: 12, shadow: v.target.checked })} /> Chữ trang trí (viền trắng, đổ bóng)</label>
        <div className="dk-f">Nền ô chữ<Swatches colors={['transparent', '#ffffffcc', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#1e293b']} value={e.bg || 'transparent'} set={(c) => patch({ bg: c === 'transparent' ? '' : c })} label="Nền ô chữ" /></div>
      </>}
      {e.kind === 'shape' && <>
        <label className="dk-f">Chữ trên hình<textarea ref={textRef} rows={2} value={e.text ?? ''} onChange={(v) => patchSoft({ text: v.target.value })} onBlur={commitSoft} /></label>
        <div className="dk-f">Kiểu hình<div className="dk-shape-pick">{SHAPES.map((s) => <button key={s.k} type="button" title={s.label} className={e.shape === s.k ? 'is-on' : ''} onClick={() => patch({ shape: s.k })}><ShapeSvg e={{ ...e, shape: s.k, sw: 1.5 }} /></button>)}</div></div>
        <div className="dk-f">Màu nền<Swatches colors={FILLS} value={e.fill} set={(c) => patch({ fill: c })} label="Màu nền" /></div>
        <div className="dk-f">Màu viền<Swatches colors={['#ffffff', '#f59e0b', '#ef4444', '#2563eb', '#16a34a', '#7c3aed', '#111827', 'transparent']} value={e.stroke} set={(c) => patch({ stroke: c })} label="Màu viền" /></div>
        <label className="dk-f">Độ dày viền: {e.sw}<input type="range" min={0} max={16} value={e.sw} onChange={(v) => patchSoft({ sw: Number(v.target.value) })} onPointerUp={commitSoft} /></label>
        {e.text && <label className="dk-f">Cỡ chữ: {e.size ?? 40}<input type="range" min={18} max={200} value={e.size ?? 40} onChange={(v) => patchSoft({ size: Number(v.target.value) })} onPointerUp={commitSoft} /></label>}
        {e.text && <div className="dk-f">Màu chữ<Swatches colors={COLORS} value={e.color ?? '#1f2937'} set={(c) => patch({ color: c })} label="Màu chữ trên hình" /></div>}
      </>}
      {e.kind === 'img' && <label className="dk-f">Tên hình (hiện trong danh sách hiệu ứng)<input value={e.name ?? ''} maxLength={40} onChange={(v) => patchSoft({ name: v.target.value })} onBlur={commitSoft} /></label>}
      {e.kind === 'quiz' && <>
        <label className="dk-f">Câu hỏi<textarea ref={textRef} rows={2} value={e.q} onChange={(v) => patchSoft({ q: v.target.value })} onBlur={commitSoft} /></label>
        <div className="dk-f">Đáp án (chọn ô tròn = đáp án đúng)
          {e.opts.map((o, i) => {
            const text = typeof o === 'string' ? o : o.text;
            const image = typeof o === 'string' ? undefined : o.img;
            const isAsset = typeof o !== 'string' && o.imageAsset;
            const imageSelection = isAsset ? image ?? '' : image ? '__current__' : '';
            return (
              <div key={i} className="dk-quiz-option-edit">
                <div className="dk-opt-row">
                  <input type="radio" name={`ans-${e.id}`} checked={e.a === i} onChange={() => patch({ a: i })} aria-label={`Đáp án đúng là ${String.fromCharCode(65 + i)}`} />
                  <b>{String.fromCharCode(65 + i)}</b>
                  <input value={text} maxLength={60} onChange={(v) => patchSoft({ opts: e.opts.map((x, k) => (k === i ? (typeof x === 'string' ? v.target.value : { ...x, text: v.target.value }) : x)) })} onBlur={commitSoft} />
                  <button type="button" aria-label="Bỏ đáp án" disabled={e.opts.length <= 2} onClick={() => patch({ opts: e.opts.filter((_, k) => k !== i), a: e.a === i ? 0 : e.a > i ? e.a - 1 : e.a })}><X aria-hidden="true" /></button>
                </div>
                <label className="dk-f dk-quiz-image-pick">Ảnh đáp án
                  <select value={imageSelection} onChange={(v) => {
                    if (v.target.value === '__current__') return;
                    patch({ opts: e.opts.map((x, k) => k === i ? { ...(typeof x === 'string' ? { text: x } : x), img: v.target.value || undefined, imageAsset: v.target.value ? true : undefined } : x) });
                  }}>
                    <option value="">Không dùng ảnh</option>
                    {image && !isAsset && <option value="__current__">Dùng hình minh hoạ hiện tại</option>}
                    {images.map((asset) => <option key={asset.id} value={asset.path}>{asset.name}</option>)}
                  </select>
                </label>
              </div>
            );
          })}
          {e.opts.length < 6 && <button type="button" className="btn btn-outline btn-sm" onClick={() => patch({ opts: [...e.opts, `Đáp án ${String.fromCharCode(65 + e.opts.length)}`] })}><Plus aria-hidden="true" /> Thêm đáp án</button>}
        </div>
        <div className="dk-f">Xếp đáp án<div className="dk-seg"><button type="button" className={e.cols === 2 ? 'is-on' : ''} onClick={() => patch({ cols: 2 })}>2 cột</button><button type="button" className={e.cols === 1 ? 'is-on' : ''} onClick={() => patch({ cols: 1 })}>1 cột</button></div></div>
      </>}
      {e.kind === 'teams' && <>
        <label className="dk-f">Tiêu đề trên bảng (để trống nếu trang đã có tiêu đề)<input value={e.title} maxLength={60} onChange={(v) => patchSoft({ title: v.target.value })} onBlur={commitSoft} /></label>
        <small className="dk-hint">Khi trình chiếu, bảng lấy điểm tuần này của các tổ ở trang Thi đua tổ (gồm cả điểm cô cộng trong bài thao giảng). Khi soạn bảng hiện điểm mẫu.</small>
      </>}
      {e.kind === 'sort' && <>
        <label className="dk-f">Đề bài<textarea ref={textRef} rows={2} value={e.prompt} maxLength={200} onChange={(v) => patchSoft({ prompt: v.target.value })} onBlur={commitSoft} /></label>
        <div className="dk-f">Các thẻ theo THỨ TỰ ĐÚNG (khi chiếu sẽ tự xáo)
          {e.items.map((o, i) => (
            <div key={i} className="dk-opt-row">
              <b>{i + 1}</b>
              <input value={o} maxLength={40} onChange={(v) => patchSoft({ items: e.items.map((x, k) => (k === i ? v.target.value : x)) })} onBlur={commitSoft} />
              <button type="button" aria-label="Lên" disabled={i === 0} onClick={() => { const a = [...e.items]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; patch({ items: a }); }}><ArrowUp aria-hidden="true" /></button>
              <button type="button" aria-label="Bỏ thẻ" disabled={e.items.length <= 2} onClick={() => patch({ items: e.items.filter((_, k) => k !== i) })}><X aria-hidden="true" /></button>
            </div>
          ))}
          {e.items.length < 10 && <button type="button" className="btn btn-outline btn-sm" onClick={() => patch({ items: [...e.items, `Thẻ ${e.items.length + 1}`] })}><Plus aria-hidden="true" /> Thêm thẻ</button>}
          <small className="dk-hint">Mẹo: chữ → câu (“Em / đi / học”), số bé → lớn, các bước làm, tranh theo truyện (dùng biểu tượng 🐣🐥🐔).</small>
        </div>
      </>}
      {e.kind === 'drop' && <>
        <label className="dk-f">Chữ trong ô<input value={e.label} maxLength={40} onChange={(v) => patchSoft({ label: v.target.value })} onBlur={commitSoft} /></label>
        <div className="dk-f">Vật kéo vào đúng ô này
          {draggables.length ? draggables.map((d) => (
            <label key={d.id} className="dk-chk"><input type="checkbox" checked={e.accept.includes(d.id)} onChange={(v) => patch({ accept: v.target.checked ? [...e.accept, d.id] : e.accept.filter((x) => x !== d.id) })} /> {elLabel(d)}</label>
          )) : <small className="dk-hint">Chưa có vật kéo được. Chọn một hình / thẻ chữ rồi bật “Kéo được khi trình chiếu”.</small>}
        </div>
        <div className="dk-f">Màu ô<Swatches colors={['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#0891b2']} value={e.color} set={(c) => patch({ color: c })} label="Màu ô thả" /></div>
      </>}
      {e.kind === 'scene3d' && (
        <label className="dk-f">Bài 3D hiện trong ô
          <select value={e.lesson} onChange={(v) => { const l = lessons?.find((x) => x.id === v.target.value); patch({ lesson: v.target.value, title: l?.title ?? 'Cảnh 3D' }); }}>
            <option value="">— Chọn bài trong “Bài 3D của tôi” —</option>
            {(lessons ?? []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          {lessons && !lessons.length && <small className="dk-hint">Cô chưa có bài 3D nào. Tạo ở tab “Bài 3D của tôi” hoặc “Bài STEM lớp 1–5”.</small>}
        </label>
      )}
      {e.kind !== 'quiz' && e.kind !== 'drop' && e.kind !== 'scene3d' && e.kind !== 'sort' && e.kind !== 'teams' && <label className="dk-chk dk-f"><input type="checkbox" checked={!!e.drag} onChange={(v) => patch({ drag: v.target.checked })} /> Kéo được khi trình chiếu (bài kéo thả)</label>}
      <label className="dk-f">Bấm vào thì sang trang
        <select value={e.link ?? 0} onChange={(v) => patch({ link: Number(v.target.value) || undefined })}>
          <option value={0}>Không</option>{deck.slides.map((s, i) => <option key={s.id} value={i + 1}>Trang {i + 1}</option>)}
        </select>
      </label>
      <div className="dk-f dk-xy">
        <label>X<input type="number" value={Math.round(e.x)} onChange={(v) => patch({ x: Number(v.target.value) })} /></label>
        <label>Y<input type="number" value={Math.round(e.y)} onChange={(v) => patch({ y: Number(v.target.value) })} /></label>
        <label>Rộng<input type="number" value={Math.round(e.w)} onChange={(v) => patch({ w: Math.max(20, Number(v.target.value)) })} /></label>
        <label>Cao<input type="number" value={Math.round(e.h)} onChange={(v) => patch({ h: Math.max(20, Number(v.target.value)) })} /></label>
        <label>Xoay<input type="number" value={e.rot} onChange={(v) => patch({ rot: Number(v.target.value) % 360 })} /></label>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={onAnimate}>✨ Thêm hiệu ứng cho vật này</button>
    </div>
  );
}

/* ---------- danh sách hiệu ứng ---------- */
function AnimList({ slide, sel, setSel, patch, move, del, myAudio }: {
  slide: Slide; sel: string | null; setSel: (id: string) => void; patch: (id: string, p: Partial<Anim>) => void; move: (id: string, d: -1 | 1) => void; del: (id: string) => void; myAudio: TeacherAsset[];
}) {
  const byId = new Map(slide.els.map((e) => [e.id, e]));
  if (!slide.anims.length) return <div className="dk-empty"><p>Trang này chưa có hiệu ứng.</p><p>Chọn một vật trên trang rồi bấm hiệu ứng ở thẻ <b>Hiệu ứng</b>. Muốn bấm vào một vật mới chạy hiệu ứng: chọn “🎯 Khi bấm vào…” ở mục <b>Bắt đầu</b> trước khi bấm hiệu ứng.</p></div>;
  const main = slide.anims.filter((a) => !a.trigger);
  const trig = [...new Set(slide.anims.filter((a) => a.trigger).map((a) => a.trigger!))];
  const row = (a: Anim) => {
    const n = slide.anims.indexOf(a) + 1, e = byId.get(a.el), on = sel === a.id;
    return (
      <div key={a.id} className={`dk-an${on ? ' is-on' : ''}`} onClick={() => setSel(a.id)}>
        <div className="dk-an-hd">
          <span className={`dk-num${a.trigger ? ' is-trg' : ''}`}>{n}</span>
          <span className="dk-an-ic">{FX_BY_ID[a.fx].icon}</span>
          <span className="dk-an-t"><b>{e ? elLabel(e) : '?'}</b><small>{FX_BY_ID[a.fx].label} · {a.trigger ? 'khi bấm vào' : START_LABEL[a.start].toLowerCase()} · {a.dur} s{a.sound ? ` · 🔊 ${soundLabel(a.sound)}` : ''}</small></span>
          <button type="button" aria-label="Lên" onClick={(ev) => { ev.stopPropagation(); move(a.id, -1); }}><ArrowUp aria-hidden="true" /></button>
          <button type="button" aria-label="Xuống" onClick={(ev) => { ev.stopPropagation(); move(a.id, 1); }}><ArrowDown aria-hidden="true" /></button>
          <button type="button" aria-label="Xoá hiệu ứng" onClick={(ev) => { ev.stopPropagation(); del(a.id); }}><Trash2 aria-hidden="true" /></button>
        </div>
        {on && (
          <div className="dk-an-ed" onClick={(ev) => ev.stopPropagation()}>
            <label>Hiệu ứng<select value={a.fx} onChange={(v) => patch(a.id, { fx: v.target.value as Fx })}>
              {(['in', 'em', 'out'] as const).map((g) => <optgroup key={g} label={g === 'in' ? 'Xuất hiện' : g === 'em' ? 'Nhấn mạnh' : 'Biến mất'}>{FX.filter((f) => f.group === g).map((f) => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</optgroup>)}
            </select></label>
            <label>Kích hoạt<select value={a.trigger ?? ''} onChange={(v) => patch(a.id, { trigger: v.target.value || undefined })}>
              <option value="">Chạy theo thứ tự (bấm Tiếp)</option>{slide.els.map((x) => <option key={x.id} value={x.id}>🎯 Khi bấm vào: {elLabel(x)}</option>)}
            </select></label>
            <label>Bắt đầu<select value={a.start} onChange={(v) => patch(a.id, { start: v.target.value as Start })}>{(Object.keys(START_LABEL) as Start[]).map((s) => <option key={s} value={s}>{START_LABEL[s]}</option>)}</select></label>
            <div className="dk-xy">
              <label>Thời lượng (giây)<input type="number" min={0.2} max={10} step={0.1} value={a.dur} onChange={(v) => patch(a.id, { dur: Math.min(10, Math.max(0.2, Number(v.target.value) || 0.6)) })} /></label>
              <label>Chờ trước (giây)<input type="number" min={0} max={30} step={0.1} value={a.delay} onChange={(v) => patch(a.id, { delay: Math.min(30, Math.max(0, Number(v.target.value) || 0)) })} /></label>
            </div>
            <div className="dk-xy">
              <label>Chuyển động<select value={a.ease ?? 'auto'} onChange={(v) => patch(a.id, { ease: v.target.value === 'auto' ? undefined : (v.target.value as Ease) })}>{(Object.keys(EASE_LABEL) as Ease[]).map((k) => <option key={k} value={k}>{EASE_LABEL[k]}</option>)}</select></label>
              <label>Lặp lại<select value={a.rep ?? 1} onChange={(v) => patch(a.id, { rep: Number(v.target.value) === 1 ? undefined : Number(v.target.value) })}>
                {[1, 2, 3, 5].map((k) => <option key={k} value={k}>{k} lần</option>)}{FX_BY_ID[a.fx].group === 'em' && <option value={0}>Lặp mãi</option>}
              </select></label>
            </div>
            <label>Âm thanh<select value={a.sound ?? ''} onChange={(v) => { patch(a.id, { sound: v.target.value || undefined }); playSound(v.target.value); }}>
              <option value="">Không có</option>{SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              {myAudio.map((x) => <option key={x.id} value={`asset:${x.path}`}>🎙 {x.name}</option>)}
            </select></label>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="dk-anims">
      {main.length > 0 && <p className="dk-an-g">Theo thứ tự (mỗi lần bấm Tiếp)</p>}
      {main.map(row)}
      {trig.map((t) => (
        <div key={t} className="dk-trg">
          <p className="dk-an-g">🎯 Khi bấm vào <b>{byId.get(t) ? elLabel(byId.get(t)!) : '?'}</b></p>
          {slide.anims.filter((a) => a.trigger === t).map(row)}
        </div>
      ))}
    </div>
  );
}

/* ---------- xem thử trang ---------- */
function Preview({ slide, assetUrl, speechSubject, onClose }: { slide: Slide; assetUrl: (p: string) => string | undefined; speechSubject: 'toan' | 'tieng-viet' | 'tieng-anh'; onClose: () => void }) {
  const api = useRef<PlayApi>(null);
  const [, setN] = useState(0);
  const next = () => { if (api.current?.apply({ t: 'step' })) setN((x) => x + 1); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  return (
    <div className="dk-pv" role="dialog" aria-modal="true" aria-label="Xem thử trang">
      <div className="dk-pv-bar"><b>Xem thử trang</b><span>Bấm “Tiếp” (phím cách) để chạy hiệu ứng · bấm vào vật có 🎯 để kích hoạt</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={next}>Tiếp ▶ ({api.current ? api.current.stepsLeft() : '…'} bước)</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}><X aria-hidden="true" /> Đóng</button></div>
      <SlideFrame className="dk-pv-frame">{(k) => <SlideView key={slide.id} ref={api} slide={slide} mode="play" scale={k} assetUrl={assetUrl} speechSubject={speechSubject} />}</SlideFrame>
    </div>
  );
}

/* ---------- sao chép kiểu (cọ dán kiểu) ---------- */
/** các thuộc tính kiểu dáng của vật nguồn áp được lên vật đích (chữ ↔ chữ, hình ↔ hình; màu chữ / cỡ chữ dùng chung) */
function styleOf(src: Partial<El>, dst: El): Partial<El> {
  const s = src as Record<string, unknown>, out: Record<string, unknown> = {};
  const keys = dst.kind === 'text' ? ['font', 'size', 'color', 'align', 'bg', 'stroke', 'strokeW', 'shadow']
    : dst.kind === 'shape' ? ['fill', 'stroke', 'sw', 'color', 'size'] : [];
  for (const k of keys) if (k in s && (src.kind === dst.kind || k === 'color' || k === 'size')) out[k] = s[k];
  return out as Partial<El>;
}

/* ---------- căn, chia đều, nhóm ---------- */
function AlignBar({ n, grouped, align, onGroup, onUngroup }: {
  n: number; grouped: boolean; align: (h: 'l' | 'c' | 'r' | 't' | 'm' | 'b' | 'dh' | 'dv') => void; onGroup: () => void; onUngroup: () => void;
}) {
  const B = (h: Parameters<typeof align>[0], ic: string, t: string, dis = false) => <button key={h} type="button" title={t} aria-label={t} disabled={dis} onClick={() => align(h)}>{ic}</button>;
  return (
    <div className="dk-align" role="toolbar" aria-label="Căn chỉnh">
      <span>{n === 1 ? 'Căn theo trang' : `Căn ${n} vật`}</span>
      <div>{B('l', '⇤', 'Căn trái')}{B('c', '↔', 'Căn giữa ngang')}{B('r', '⇥', 'Căn phải')}{B('t', '⤒', 'Căn trên')}{B('m', '↕', 'Căn giữa dọc')}{B('b', '⤓', 'Căn dưới')}
        {n > 2 && <>{B('dh', '⋯', 'Chia đều ngang')}{B('dv', '⋮', 'Chia đều dọc')}</>}
        {n > 1 && (grouped ? <button type="button" onClick={onUngroup}>Bỏ nhóm</button> : <button type="button" onClick={onGroup}>Nhóm</button>)}
      </div>
    </div>
  );
}

/* ---------- lớp (thứ tự trên / dưới) ---------- */
function Layers({ slide, selIds, pick, move, lock, hide }: { slide: Slide; selIds: string[]; pick: (id: string, add?: boolean) => void; move: (id: string, d: -1 | 1) => void; lock: (id: string) => void; hide: (id: string) => void }) {
  const list = [...slide.els].reverse();
  if (!list.length) return <div className="dk-empty"><p>Trang chưa có vật nào.</p></div>;
  return (
    <div className="dk-layers">
      <p className="dk-an-g">Trên cùng</p>
      {list.map((e) => (
        <div key={e.id} className={`dk-layer${selIds.includes(e.id) ? ' is-on' : ''}${e.hide ? ' is-hide' : ''}`}>
          <button type="button" className="dk-layer-n" onClick={(ev) => pick(e.id, ev.shiftKey)} title="Bấm để chọn · Shift+bấm chọn thêm">{e.group ? '🔗 ' : ''}{elLabel(e)}</button>
          <button type="button" aria-label="Lên một lớp" onClick={() => move(e.id, 1)}><ArrowUp aria-hidden="true" /></button>
          <button type="button" aria-label="Xuống một lớp" onClick={() => move(e.id, -1)}><ArrowDown aria-hidden="true" /></button>
          <button type="button" aria-label={e.hide ? 'Hiện' : 'Ẩn khi trình chiếu'} title={e.hide ? 'Đang ẩn — bấm để hiện' : 'Ẩn khi trình chiếu'} onClick={() => hide(e.id)}>{e.hide ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
          <button type="button" aria-label={e.lock ? 'Mở khoá' : 'Khoá'} className={e.lock ? 'is-lock' : ''} onClick={() => lock(e.id)}>{e.lock ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}</button>
        </div>
      ))}
      <p className="dk-an-g">Dưới cùng</p>
    </div>
  );
}
