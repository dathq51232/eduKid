'use client';

// Soạn bài thao giảng (11/2026): danh sách trang | trang đang soạn | thuộc tính & hiệu ứng.
// Thanh công cụ kiểu PowerPoint: Trang · Chèn · Hiệu ứng · Âm thanh · Trình chiếu. Bài tự lưu vào bảng slide_decks (0046).
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { ArrowDown, ArrowDownToLine, ArrowLeft, ArrowUp, ArrowUpToLine, Copy, Lock, Mic, MonitorPlay, Play, Plus, Redo2, Square, Trash2, Undo2, Unlock, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { assetError, listAssets, uploadAsset, type TeacherAsset } from '@/lib/assets/client';
import { baseName, IMAGE_ACCEPT, prepareBoard } from '@/lib/assets/image';
import {
  BGS, FONTS, FX, FX_BY_ID, MAX_ELS, MAX_SLIDES, SH, START_LABEL, SW, TRANS_LABEL, darkBg, elLabel, newSlide, uid,
  type Anim, type Deck, type El, type FontKey, type Fx, type ShapeKind, type Slide, type Start, type Trans,
} from '@/lib/deck/types';
import { loadPraiseFonts } from '@/lib/praise/render';
import { playSound, soundLabel, SOUNDS } from '@/lib/deck/sounds';
import { SLIDE_TEMPLATES, STICKER_SETS } from '@/lib/deck/templates';
import SlideView, { ShapeSvg, SlideFrame, type PlayApi } from './SlideView';

type Ribbon = 'page' | 'insert' | 'fx' | 'sound' | 'show';
const RIBBON: [Ribbon, string][] = [['page', 'Trang'], ['insert', 'Chèn'], ['fx', 'Hiệu ứng'], ['sound', 'Âm thanh'], ['show', 'Trình chiếu']];
const COLORS = ['#1d4ed8', '#111827', '#ffffff', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#db2777', '#7c2d12', '#065f46'];
const FILLS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa', '#ffffff', '#f87171', '#60a5fa', '#34d399', '#fbbf24', 'transparent'];
const SHAPES: { k: ShapeKind; label: string }[] = [
  { k: 'round', label: 'Thẻ bo góc' }, { k: 'rect', label: 'Chữ nhật' }, { k: 'circle', label: 'Hình tròn' }, { k: 'star', label: 'Ngôi sao' },
  { k: 'heart', label: 'Trái tim' }, { k: 'arrow', label: 'Mũi tên' }, { k: 'cloud', label: 'Đám mây' }, { k: 'bubble', label: 'Bong bóng lời' },
];
type Lesson3DRow = { id: string; title: string };

export default function DeckStudio({ classId, deckId, initial }: { classId: string; deckId: string; initial: Deck }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [deck, setDeck] = useState<Deck>(initial);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [rib, setRib] = useState<Ribbon>('insert');
  const [pane, setPane] = useState<'props' | 'anim'>('props');
  const [past, setPast] = useState<Deck[]>([]);
  const [future, setFuture] = useState<Deck[]>([]);
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved');
  const [startMode, setStartMode] = useState<Start>('click');
  const [trigMode, setTrigMode] = useState<string>('');
  const [stickerSet, setStickerSet] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [showTpl, setShowTpl] = useState(false);
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
  const addSticker = (src: string) => addEl({ id: uid(), kind: 'img', ...center(220, 220), w: 220, h: 220, rot: 0, src, name: src.split('/').pop()?.replace(/\.(webp|png)$/, '').replace(/-/g, ' ') });
  const addShape = (shape: ShapeKind) => addEl({ id: uid(), kind: 'shape', ...center(320, 220), w: shape === 'circle' || shape === 'star' || shape === 'heart' ? 260 : 360, h: shape === 'circle' || shape === 'star' || shape === 'heart' ? 260 : 200, rot: 0, shape, fill: '#fde68a', stroke: '#f59e0b', sw: 4, text: '', color: '#1f2937', size: 54 });
  const addQuiz = () => addEl({ id: uid(), kind: 'quiz', x: 220, y: 170, w: 1160, h: 620, rot: 0, q: 'Câu hỏi?', opts: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'], a: 0, cols: 2 }, 'pop');
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
  const delEl = () => { if (!sel) return; setSlide((s) => ({ ...s, els: s.els.filter((e) => e.id !== sel).map((e) => (e.kind === 'drop' ? { ...e, accept: e.accept.filter((x) => x !== sel) } : e)), anims: s.anims.filter((a) => a.el !== sel && a.trigger !== sel) })); setSel(null); };
  const dupEl = () => { if (!selEl) return; addEl({ ...JSON.parse(JSON.stringify(selEl)), id: uid(), x: selEl.x + 40, y: selEl.y + 40 }); };
  const order = (top: boolean) => { if (!selEl) return; setSlide((s) => { const r = s.els.filter((e) => e.id !== selEl.id); return { ...s, els: top ? [...r, selEl] : [selEl, ...r] }; }); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (preview) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); dupEl(); return; }
      if (!selEl) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delEl(); return; }
      if (e.key === 'Escape') { setSel(null); return; }
      const st = e.shiftKey ? 20 : 4, mv: Record<string, [number, number]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
      if (mv[e.key]) { e.preventDefault(); patchEl(selEl.id, { x: selEl.x + mv[e.key][0], y: selEl.y + mv[e.key][1] }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const editText = (id: string) => { setSel(id); setPane('props'); setTimeout(() => { textRef.current?.focus(); textRef.current?.select(); }, 30); };
  const showHref = (from: number) => `/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${deckId}/trinh-chieu?trang=${from + 1}`;
  const flush = async () => { if (supabase) await supabase.from('slide_decks').update({ title: deck.title.slice(0, 120) || 'Bài thao giảng', grade: deck.grade, data: deckRef.current }).eq('id', deckId); };

  return (
    <div className="dk">
      <header className="dk-head">
        <Link href={`/giao-vien/lop/${classId}/bai-giang-3d?tab=tg`} className="dk-back" aria-label="Về danh sách bài"><ArrowLeft aria-hidden="true" /></Link>
        <div className="dk-titlebox">
          <small>Bài thao giảng · Lớp {deck.grade}</small>
          <input value={deck.title} maxLength={120} onChange={(e) => commit({ ...deckRef.current, title: e.target.value })} aria-label="Tên bài" />
        </div>
        <select value={deck.grade} onChange={(e) => commit({ ...deckRef.current, grade: Number(e.target.value) })} aria-label="Lớp">{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
        <span className={`dk-saved is-${saved}`}>{saved === 'saved' ? '✓ Đã lưu' : saved === 'saving' ? 'Đang lưu…' : 'Chưa lưu được — kiểm tra mạng'}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={!past.length} title="Hoàn tác (Ctrl+Z)"><Undo2 aria-hidden="true" /></button>
        <button type="button" className="btn btn-outline btn-sm" onClick={redo} disabled={!future.length} title="Làm lại (Ctrl+Y)"><Redo2 aria-hidden="true" /></button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setPreview(true)}><Play aria-hidden="true" /> Xem thử trang</button>
        <a className="btn btn-primary btn-sm dk-show" href={showHref(0)} onClick={() => { void flush(); }}><MonitorPlay aria-hidden="true" /> Trình chiếu</a>
      </header>

      <nav className="dk-ribbon" aria-label="Thanh công cụ">
        <div className="dk-rtabs" role="tablist">{RIBBON.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={rib === k} className={rib === k ? 'is-on' : ''} onClick={() => setRib(k)}>{l}</button>)}</div>
        <div className="dk-rbody">
          {rib === 'page' && <>
            <div className="dk-rg"><div className="dk-row">
              <button type="button" className="dk-tool" onClick={() => addSlides([newSlide(slide.bg)])}><Plus aria-hidden="true" />Trang mới</button>
              <button type="button" className={`dk-tool${showTpl ? ' is-on' : ''}`} onClick={() => setShowTpl(!showTpl)}><span className="dk-emo">🧩</span>Trang mẫu</button>
              <button type="button" className="dk-tool" onClick={dupSlide}><Copy aria-hidden="true" />Nhân bản</button>
              <button type="button" className="dk-tool" onClick={() => moveSlide(-1)} disabled={cur === 0}><ArrowUp aria-hidden="true" />Lên</button>
              <button type="button" className="dk-tool" onClick={() => moveSlide(1)} disabled={cur >= deck.slides.length - 1}><ArrowDown aria-hidden="true" />Xuống</button>
              <button type="button" className="dk-tool is-danger" onClick={delSlide}><Trash2 aria-hidden="true" />Xoá trang</button>
            </div><label>TRANG</label></div>
            <div className="dk-rg"><div className="dk-row dk-bgs">{BGS.map((b) => <button key={b.id} type="button" title={b.label} aria-label={`Nền ${b.label}`} className={slide.bg === b.id ? 'is-on' : ''} style={{ background: b.css }} onClick={() => setSlide((s) => ({ ...s, bg: b.id }))} />)}</div><label>NỀN TRANG</label></div>
            <div className="dk-rg"><div className="dk-row">
              <select value={slide.trans} onChange={(e) => setSlide((s) => ({ ...s, trans: e.target.value as Trans }))} aria-label="Chuyển trang">{(Object.keys(TRANS_LABEL) as Trans[]).map((t) => <option key={t} value={t}>{TRANS_LABEL[t]}</option>)}</select>
              <button type="button" className="btn btn-outline btn-sm" title="Áp dụng cho mọi trang" onClick={() => commit({ ...deckRef.current, slides: deckRef.current.slides.map((x) => ({ ...x, trans: slide.trans })) })}>Áp dụng mọi trang</button>
            </div><label>CHUYỂN TRANG</label></div>
            <div className="dk-rg"><div className="dk-row">
              <select value={slide.sound ?? ''} onChange={(e) => setSlide((s) => ({ ...s, sound: e.target.value || undefined }))} aria-label="Âm thanh khi vào trang">
                <option value="">Không có</option>{SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                {myAudio.map((a) => <option key={a.id} value={`asset:${a.path}`}>🎙 {a.name}</option>)}
              </select>
            </div><label>ÂM THANH KHI VÀO TRANG</label></div>
          </>}
          {rib === 'insert' && <>
            <div className="dk-rg"><div className="dk-row">
              <button type="button" className="dk-tool" onClick={() => addText(true)}><span className="dk-emo" style={{ fontWeight: 800 }}>T</span>Tiêu đề</button>
              <button type="button" className="dk-tool" onClick={() => addText(false)}><span className="dk-emo">¶</span>Chữ</button>
              <button type="button" className={`dk-tool${showStickers ? ' is-on' : ''}`} onClick={() => setShowStickers(!showStickers)}><span className="dk-emo">🐰</span>Hình dán</button>
              <button type="button" className="dk-tool" onClick={() => imgInput.current?.click()} disabled={!!busy}><Upload aria-hidden="true" />Ảnh của tôi</button>
            </div><label>CHỮ · HÌNH</label></div>
            <div className="dk-rg"><div className="dk-row dk-shapes">{SHAPES.map((s) => (
              <button key={s.k} type="button" className="dk-tool is-sm" title={s.label} onClick={() => addShape(s.k)}>
                <span className="dk-shape-ic"><ShapeSvg e={{ id: '', kind: 'shape', shape: s.k, x: 0, y: 0, w: 1, h: 1, rot: 0, fill: '#fde68a', stroke: '#d97706', sw: 1.5 }} /></span>{s.label}
              </button>))}</div><label>HÌNH KHỐI</label></div>
            <div className="dk-rg"><div className="dk-row">
              <button type="button" className="dk-tool" onClick={addQuiz}><span className="dk-emo">❓</span>Câu hỏi</button>
              <button type="button" className="dk-tool" onClick={addDrop}><span className="dk-emo">🎯</span>Ô thả</button>
              <button type="button" className="dk-tool" onClick={addScene}><span className="dk-emo">🧊</span>Cảnh 3D</button>
            </div><label>TƯƠNG TÁC</label></div>
          </>}
          {rib === 'fx' && <>
            {(['in', 'em', 'out'] as const).map((g) => (
              <div className="dk-rg" key={g}><div className="dk-row">{FX.filter((f) => f.group === g).map((f) => (
                <button key={f.id} type="button" className="dk-tool is-fx" onClick={() => addAnim(f.id)} disabled={!selEl}><span className="dk-emo">{f.icon}</span>{f.label}</button>
              ))}</div><label>{g === 'in' ? 'XUẤT HIỆN' : g === 'em' ? 'NHẤN MẠNH' : 'BIẾN MẤT'}</label></div>
            ))}
            <div className="dk-rg"><div className="dk-col">
              <select value={startMode} onChange={(e) => setStartMode(e.target.value as Start)} disabled={!!trigMode} aria-label="Bắt đầu">{(Object.keys(START_LABEL) as Start[]).map((s) => <option key={s} value={s}>{START_LABEL[s]}</option>)}</select>
              <select value={trigMode} onChange={(e) => setTrigMode(e.target.value)} aria-label="Kích hoạt" className={trigMode ? 'is-trg' : ''}>
                <option value="">Chạy theo thứ tự (bấm Tiếp)</option>
                {slide.els.map((e) => <option key={e.id} value={e.id}>🎯 Khi bấm vào: {elLabel(e)}</option>)}
              </select>
            </div><label>BẮT ĐẦU</label></div>
          </>}
          {rib === 'sound' && <>
            <div className="dk-rg"><div className="dk-row dk-snds">{SOUNDS.map((s) => (
              <span key={s.id} className="dk-snd">
                <button type="button" title="Nghe thử" onClick={() => playSound(s.id)}>{s.icon}</button>
                <button type="button" onClick={() => { playSound(s.id); attachSound(s.id); }}>{s.label}</button>
              </span>))}</div><label>THƯ VIỆN ÂM THANH · bấm tên để gắn vào {animSel && slide.anims.some((a) => a.id === animSel) ? 'hiệu ứng đang chọn' : 'trang (khi vào trang)'}</label></div>
            <div className="dk-rg"><div className="dk-row">
              <button type="button" className={`dk-tool${rec ? ' is-rec' : ''}`} onClick={() => void toggleRec()} disabled={!!busy && !rec}>{rec ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}{rec ? 'Dừng ghi' : 'Ghi âm giọng cô'}</button>
              <button type="button" className="dk-tool" onClick={() => audInput.current?.click()} disabled={!!busy}><Upload aria-hidden="true" />Tải lên .mp3</button>
              {myAudio.slice(0, 6).map((a) => <span key={a.id} className="dk-snd"><button type="button" onClick={() => playSound(`asset:${a.path}`)}>🎙</button><button type="button" onClick={() => attachSound(`asset:${a.path}`)}>{a.name}</button></span>)}
            </div><label>ÂM THANH CỦA CÔ (lưu trong Kho của tôi)</label></div>
          </>}
          {rib === 'show' && <>
            <div className="dk-rg"><div className="dk-row">
              <a className="dk-tool" href={showHref(0)} onClick={() => { void flush(); }}><MonitorPlay aria-hidden="true" />Từ trang đầu</a>
              <a className="dk-tool" href={showHref(cur)} onClick={() => { void flush(); }}><Play aria-hidden="true" />Từ trang này</a>
              <button type="button" className="dk-tool" onClick={() => setPreview(true)}><span className="dk-emo">👀</span>Xem thử trang</button>
            </div><label>TRÌNH CHIẾU</label></div>
            <p className="dk-hint">Khi trình chiếu, máy cô thấy ghi chú, trang tiếp theo, đồng hồ và công cụ lớp. Bấm “Mở màn hình chiếu” để mở cửa sổ riêng, kéo cửa sổ đó sang tivi / máy chiếu rồi bấm toàn màn hình.</p>
          </>}
        </div>
        {busy && <p className="dk-busy" role="status">{busy}</p>}
        {msg && <p className={`dk-msg is-${msg.kind}`} role="status">{msg.text} <button type="button" onClick={() => setMsg(null)} aria-label="Đóng">×</button></p>}
        {rib === 'insert' && showStickers && (
          <div className="dk-stickers">
            <div className="dk-stabs">{STICKER_SETS.map((s, i) => <button key={s.label} type="button" className={stickerSet === i ? 'is-on' : ''} onClick={() => setStickerSet(i)}>{s.label}</button>)}
              {myImages.length > 0 && <button type="button" className={stickerSet === 99 ? 'is-on' : ''} onClick={() => setStickerSet(99)}>Ảnh của tôi</button>}</div>
            <div className="dk-sgrid">
              {stickerSet === 99
                ? myImages.map((a) => <button key={a.id} type="button" title={a.name} onClick={() => addEl({ id: uid(), kind: 'img', ...center(360, 260), w: 360, h: Math.round(360 * ((a.meta.h as number) || 3) / ((a.meta.w as number) || 4)), rot: 0, src: a.path, asset: true, name: a.name })}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trong kho */}
                  <img src={a.thumb ?? a.url ?? ''} alt={a.name} /></button>)
                : STICKER_SETS[stickerSet]?.items.map((s) => <button key={s} type="button" onClick={() => addSticker(s)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- hình dán có sẵn */}
                  <img src={s} alt="" loading="lazy" /></button>)}
            </div>
          </div>
        )}
        {rib === 'page' && showTpl && (
          <div className="dk-tpls">{SLIDE_TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => { addSlides(t.make()); setShowTpl(false); }}>
              <span className="dk-tpl-pv" style={{ background: BGS.find((b) => b.id === t.bg)?.css }}>{t.preview.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- xem trước mẫu
                <img key={p} src={p} alt="" />))}</span>
              <b>{t.title}</b><small>{t.desc}</small>
            </button>))}</div>
        )}
      </nav>
      <input ref={imgInput} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onImage(f); }} />
      <input ref={audInput} type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onAudio(f, f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60)); }} />

      <div className="dk-work">
        <aside className="dk-thumbs" aria-label="Các trang">
          {deck.slides.map((s, i) => (
            <button key={s.id} type="button" className={`dk-th${i === cur ? ' is-on' : ''}`} onClick={() => { setCur(i); setSel(null); setAnimSel(null); }} aria-label={`Trang ${i + 1}`} aria-current={i === cur}>
              <span className="dk-th-n">{i + 1}</span>
              <SlideFrame className="dk-th-s">{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame>
              <span className="dk-th-ic">{s.anims.length > 0 && '✨'}{s.anims.some((a) => a.trigger) && '🎯'}{(s.sound || s.anims.some((a) => a.sound)) && '🔊'}</span>
            </button>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => addSlides([newSlide(slide.bg)])}><Plus aria-hidden="true" /> Trang mới</button>
        </aside>

        <section className="dk-stage">
          <SlideFrame className="dk-main">{(k) => (
            <SlideView key={slide.id} slide={slide} mode="edit" scale={k} assetUrl={assetUrl} sel={sel} onSelect={(id) => { setSel(id); if (id) { const a = slide.anims.find((x) => x.el === id); if (a) setAnimSel(a.id); } }} onChange={onChange} onEditText={editText} />
          )}</SlideFrame>
          <label className="dk-notes"><b>Ghi chú của cô</b> (chỉ cô thấy khi trình chiếu)
            <textarea rows={2} value={slide.notes} placeholder="vd: Hỏi lớp “Có mấy bạn thỏ?”, rồi bấm vào cà rốt để hiện đáp án." onChange={(e) => setSlide((s) => ({ ...s, notes: e.target.value }), false)} onBlur={() => commit(deckRef.current)} />
          </label>
        </section>

        <aside className="dk-pane">
          <div className="dk-ptabs" role="tablist">
            <button type="button" role="tab" aria-selected={pane === 'props'} className={pane === 'props' ? 'is-on' : ''} onClick={() => setPane('props')}>Thuộc tính</button>
            <button type="button" role="tab" aria-selected={pane === 'anim'} className={pane === 'anim' ? 'is-on' : ''} onClick={() => setPane('anim')}>Hiệu ứng <i>{slide.anims.length}</i></button>
          </div>
          {pane === 'props' ? (selEl ? (
            <Props e={selEl} slide={slide} deck={deck} patch={(p) => patchEl(selEl.id, p)} patchSoft={(p) => patchEl(selEl.id, p, false)} commitSoft={() => commit(deckRef.current)}
              textRef={textRef} lessons={lessons} onDup={dupEl} onDel={delEl} onOrder={order} onAnimate={() => { setRib('fx'); }} />
          ) : (
            <div className="dk-empty">
              <p>Bấm vào một vật trên trang để sửa. Bấm đúp vào chữ để gõ.</p>
              <p>Thêm chữ, hình dán, câu hỏi, cảnh 3D ở thẻ <b>Chèn</b>; hiệu ứng ở thẻ <b>Hiệu ứng</b>.</p>
              <p className="dk-kbd">Phím tắt: Delete xoá · Ctrl+D nhân bản · mũi tên dịch chuyển · Ctrl+Z hoàn tác.</p>
            </div>
          )) : (
            <AnimList slide={slide} sel={animSel} setSel={(id) => { setAnimSel(id); const a = slide.anims.find((x) => x.id === id); if (a) setSel(a.el); }}
              patch={patchAnim} move={moveAnim} del={(id) => setSlide((s) => ({ ...s, anims: s.anims.filter((a) => a.id !== id) }))} myAudio={myAudio} />
          )}
        </aside>
      </div>

      {preview && <Preview slide={slide} assetUrl={assetUrl} onClose={() => setPreview(false)} />}
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

function Props({ e, slide, deck, patch, patchSoft, commitSoft, textRef, lessons, onDup, onDel, onOrder, onAnimate }: {
  e: El; slide: Slide; deck: Deck; patch: (p: Partial<El>) => void; patchSoft: (p: Partial<El>) => void; commitSoft: () => void;
  textRef: React.RefObject<HTMLTextAreaElement | null>; lessons: Lesson3DRow[] | null;
  onDup: () => void; onDel: () => void; onOrder: (top: boolean) => void; onAnimate: () => void;
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
        <button type="button" className="is-danger" onClick={onDel}><Trash2 aria-hidden="true" /> Xoá</button>
      </div>
      {e.kind === 'text' && <>
        <label className="dk-f">Nội dung<textarea ref={textRef} rows={3} value={e.text} onChange={(v) => patchSoft({ text: v.target.value })} onBlur={commitSoft} /></label>
        <label className="dk-f">Phông chữ<select value={e.font} onChange={(v) => patch({ font: v.target.value as FontKey })}>{(Object.keys(FONTS) as FontKey[]).map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}</select></label>
        <label className="dk-f">Cỡ chữ: {e.size}<input type="range" min={18} max={200} value={e.size} onChange={(v) => patchSoft({ size: Number(v.target.value) })} onPointerUp={commitSoft} /></label>
        <div className="dk-f">Căn chữ<div className="dk-seg">{(['left', 'center', 'right'] as const).map((a) => <button key={a} type="button" className={e.align === a ? 'is-on' : ''} onClick={() => patch({ align: a })}>{a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}</button>)}</div></div>
        <div className="dk-f">Màu chữ<Swatches colors={COLORS} value={e.color} set={(c) => patch({ color: c })} label="Màu chữ" /></div>
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
          {e.opts.map((o, i) => (
            <div key={i} className="dk-opt-row">
              <input type="radio" name={`ans-${e.id}`} checked={e.a === i} onChange={() => patch({ a: i })} aria-label={`Đáp án đúng là ${String.fromCharCode(65 + i)}`} />
              <b>{String.fromCharCode(65 + i)}</b>
              <input value={o} maxLength={60} onChange={(v) => patchSoft({ opts: e.opts.map((x, k) => (k === i ? v.target.value : x)) })} onBlur={commitSoft} />
              <button type="button" aria-label="Bỏ đáp án" disabled={e.opts.length <= 2} onClick={() => patch({ opts: e.opts.filter((_, k) => k !== i), a: e.a === i ? 0 : e.a > i ? e.a - 1 : e.a })}><X aria-hidden="true" /></button>
            </div>
          ))}
          {e.opts.length < 6 && <button type="button" className="btn btn-outline btn-sm" onClick={() => patch({ opts: [...e.opts, `Đáp án ${String.fromCharCode(65 + e.opts.length)}`] })}><Plus aria-hidden="true" /> Thêm đáp án</button>}
        </div>
        <div className="dk-f">Xếp đáp án<div className="dk-seg"><button type="button" className={e.cols === 2 ? 'is-on' : ''} onClick={() => patch({ cols: 2 })}>2 cột</button><button type="button" className={e.cols === 1 ? 'is-on' : ''} onClick={() => patch({ cols: 1 })}>1 cột</button></div></div>
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
      {e.kind !== 'quiz' && e.kind !== 'drop' && e.kind !== 'scene3d' && <label className="dk-chk dk-f"><input type="checkbox" checked={!!e.drag} onChange={(v) => patch({ drag: v.target.checked })} /> Kéo được khi trình chiếu (bài kéo thả)</label>}
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
              <label>Thời lượng (giây)<input type="number" min={0.2} max={5} step={0.1} value={a.dur} onChange={(v) => patch(a.id, { dur: Math.min(5, Math.max(0.2, Number(v.target.value) || 0.6)) })} /></label>
              <label>Chờ trước (giây)<input type="number" min={0} max={10} step={0.1} value={a.delay} onChange={(v) => patch(a.id, { delay: Math.min(10, Math.max(0, Number(v.target.value) || 0)) })} /></label>
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
function Preview({ slide, assetUrl, onClose }: { slide: Slide; assetUrl: (p: string) => string | undefined; onClose: () => void }) {
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
      <SlideFrame className="dk-pv-frame">{(k) => <SlideView key={slide.id} ref={api} slide={slide} mode="play" scale={k} assetUrl={assetUrl} />}</SlideFrame>
    </div>
  );
}
