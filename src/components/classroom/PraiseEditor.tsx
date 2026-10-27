'use client';

// Trình chỉnh sửa thư khen kiểu Canva: kéo thả, phóng to / thu nhỏ, xoay; thêm chữ, sticker, biểu tượng, hình, ảnh;
// đổi màu chữ của mẫu. Thiết kế áp dụng cho mọi thư khi xuất PDF / ảnh / in (tên từng em tự điền vào).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, Circle, Copy, Eye, EyeOff, Heart, ImagePlus, Minus, Redo2, RotateCcw,
  Shapes, Smile, Square, Star, Sticker, Trash2, Type, Undo2, X,
} from 'lucide-react';
import { STICKERS } from '@/lib/stickers';
import { LETTER_H, LETTER_W, type PraiseTemplate } from '@/lib/praise/templates';
import { blockBoxes, drawLetter, itemBox, loadItemImages, loadTemplateAssets, type LetterAssets, type LetterData } from '@/lib/praise/render';
import {
  BLOCK_LABEL, EMOJIS, PALETTE, TEXT_PRESETS, VARS, adjOf, emptyDesign, shrinkImage, uid,
  type BlockAdj, type BlockKey, type DesignItem, type FontKey, type PraiseDesign, type ShapeItem, type ShapeKind, type TextItem,
} from '@/lib/praise/design';

type Sel = { kind: 'block'; key: BlockKey } | { kind: 'item'; id: string } | null;
type Tab = 'text' | 'sticker' | 'emoji' | 'shape' | 'image';
type Drag = { mode: 'move' | 'size' | 'rot'; sx: number; sy: number; cx: number; cy: number; before: PraiseDesign; orig: BlockAdj | DesignItem };

const FONTS: { key: FontKey; label: string }[] = [{ key: 'baloo', label: 'Tròn (Baloo)' }, { key: 'oswald', label: 'Đứng (Oswald)' }, { key: 'script', label: 'Viết tay' }];
const BLOCKS: BlockKey[] = ['title', 'body', 'sign'];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clone = (d: PraiseDesign): PraiseDesign => JSON.parse(JSON.stringify(d)) as PraiseDesign;

function Swatches({ value, onPick, allowNone }: { value?: string; onPick: (c: string | undefined) => void; allowNone?: string }) {
  return (
    <div className="pe-sw">
      {allowNone && <button type="button" className={`pe-sw-none${!value || value === 'transparent' ? ' is-on' : ''}`} onClick={() => onPick(undefined)} title={allowNone}>∅</button>}
      {PALETTE.map((c) => <button key={c} type="button" style={{ background: c }} className={value === c ? 'is-on' : ''} aria-label={`Màu ${c}`} onClick={() => onPick(c)} />)}
      <label className="pe-sw-pick" title="Màu khác"><input type="color" value={value && value.startsWith('#') ? value : '#2457c5'} onChange={(e) => onPick(e.target.value)} /></label>
    </div>
  );
}

export default function PraiseEditor({ tpl, data, initial, onSave, onClose }: {
  tpl: PraiseTemplate; data: LetterData; initial: PraiseDesign | null; onSave: (d: PraiseDesign) => void; onClose: () => void;
}) {
  const [design, setDesign] = useState<PraiseDesign>(() => clone(initial ?? emptyDesign()));
  const [past, setPast] = useState<PraiseDesign[]>([]);
  const [future, setFuture] = useState<PraiseDesign[]>([]);
  const [sel, setSel] = useState<Sel>(null);
  const [tab, setTab] = useState<Tab>('text');
  const [assets, setAssets] = useState<LetterAssets | null>(null);
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const [note, setNote] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  /* ------------------------------------------------ lịch sử (hoàn tác / làm lại) */
  const commit = useCallback((next: PraiseDesign, before?: PraiseDesign) => {
    setPast((p) => [...p.slice(-60), before ?? design]);
    setFuture([]);
    setDesign(next);
  }, [design]);
  const edit = (fn: (d: PraiseDesign) => void) => { const n = clone(design); fn(n); commit(n); };
  const undo = useCallback(() => { setPast((p) => { if (!p.length) return p; setFuture((f) => [design, ...f]); setDesign(p[p.length - 1]); return p.slice(0, -1); }); }, [design]);
  const redo = useCallback(() => { setFuture((f) => { if (!f.length) return f; setPast((p) => [...p, design]); setDesign(f[0]); return f.slice(1); }); }, [design]);

  /* ------------------------------------------------ tải ảnh & vẽ */
  useEffect(() => { let live = true; void loadTemplateAssets(tpl, design).then((a) => { if (live) setAssets(a); }); return () => { live = false; }; // eslint-disable-next-line react-hooks/exhaustive-deps -- ảnh nền chỉ tải lại khi đổi mẫu
  }, [tpl]);
  const srcKey = design.items.filter((i) => i.kind === 'image').map((i) => (i as { src: string }).src.slice(-40)).join('|');
  useEffect(() => {
    if (!assets) return;
    let live = true;
    void loadItemImages(design).then((items) => { if (live) setAssets((a) => (a ? { ...a, items } : a)); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi danh sách ảnh đổi
  }, [srcKey, !!assets]);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !assets) return;
    const id = requestAnimationFrame(() => drawLetter(ctx, tpl, assets, data, design));
    return () => cancelAnimationFrame(id);
  }, [tpl, assets, data, design]);

  const boxes = useMemo(() => (assets ? blockBoxes(tpl, data, design) : null), [tpl, data, design, assets]);
  const selItem = sel?.kind === 'item' ? design.items.find((i) => i.id === sel.id) ?? null : null;
  const selBlock = sel?.kind === 'block' ? sel.key : null;

  /* ------------------------------------------------ thêm đồ vật */
  const add = (it: DesignItem) => { edit((d) => { d.items.push(it); }); setSel({ kind: 'item', id: it.id }); };
  const addText = (p: (typeof TEXT_PRESETS)[number]) => add({ ...p.item, id: uid(), x: LETTER_W / 2, y: LETTER_H / 2, rot: 0 } as TextItem);
  const addImage = (src: string, w = 160) => add({ kind: 'image', id: uid(), src, w, x: LETTER_W / 2, y: LETTER_H / 2, rot: 0 });
  const addShape = (shape: ShapeKind, frame = false) => add({
    kind: 'shape', id: uid(), shape, x: LETTER_W / 2, y: LETTER_H / 2, rot: 0,
    w: shape === 'line' ? 420 : frame ? 1200 : 220, h: shape === 'line' ? 8 : frame ? 820 : shape === 'rect' ? 140 : 200,
    fill: frame ? 'transparent' : shape === 'line' ? '#f59e0b' : '#fde68a', stroke: frame ? '#c0161b' : shape === 'line' ? '#f59e0b' : '#f59e0b', sw: frame ? 10 : shape === 'line' ? 8 : 4, radius: frame ? 36 : 24,
  } as ShapeItem);
  const onUpload = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 8_000_000) { setNote('Chọn ảnh PNG/JPG dưới 8 MB.'); return; }
    try { addImage(await shrinkImage(f), 220); setNote(''); } catch { setNote('Không đọc được ảnh.'); }
  };

  /* ------------------------------------------------ sửa đồ vật / khối */
  const patchItem = (id: string, patch: Partial<DesignItem>) => edit((d) => { const i = d.items.findIndex((x) => x.id === id); if (i >= 0) d.items[i] = { ...d.items[i], ...patch } as DesignItem; });
  const patchBlock = (k: BlockKey, patch: Partial<BlockAdj>) => edit((d) => { d.blocks[k] = { ...adjOf(d, k), ...patch }; });
  const removeSel = useCallback(() => {
    if (!sel) return;
    const n = clone(design);
    if (sel.kind === 'item') n.items = n.items.filter((i) => i.id !== sel.id);
    else n.blocks[sel.key] = { ...adjOf(n, sel.key), hide: true };
    commit(n); setSel(null);
  }, [sel, design, commit]);
  const dup = (it: DesignItem) => add({ ...JSON.parse(JSON.stringify(it)), id: uid(), x: it.x + 30, y: it.y + 30 } as DesignItem);
  const layer = (id: string, dir: 1 | -1) => edit((d) => { const i = d.items.findIndex((x) => x.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= d.items.length) return; [d.items[i], d.items[j]] = [d.items[j], d.items[i]]; });

  /* ------------------------------------------------ kéo thả */
  const toLetter = (e: { clientX: number; clientY: number }) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LETTER_W, y: ((e.clientY - r.top) / r.height) * LETTER_H };
  };
  const startDrag = (e: React.PointerEvent, s: Exclude<Sel, null>, mode: Drag['mode']) => {
    e.preventDefault(); e.stopPropagation();
    setSel(s);
    const p = toLetter(e);
    let cx: number, cy: number, orig: BlockAdj | DesignItem;
    if (s.kind === 'block') { const b = boxes![s.key]; cx = b.x + b.w / 2; cy = b.y + b.h / 2; orig = { ...adjOf(design, s.key) }; }
    else { const it = design.items.find((i) => i.id === s.id)!; cx = it.x; cy = it.y; orig = { ...it }; }
    drag.current = { mode, sx: p.x, sy: p.y, cx, cy, before: clone(design), orig };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current; if (!g || !sel) return;
    const p = toLetter(e);
    const n = clone(g.before);
    if (g.mode === 'move') {
      let dx = p.x - g.sx, dy = p.y - g.sy;
      // hít vào giữa trang
      const ncx = g.cx + dx, ncy = g.cy + dy;
      const v = Math.abs(ncx - LETTER_W / 2) < 10, h = Math.abs(ncy - LETTER_H / 2) < 10;
      if (v) dx = LETTER_W / 2 - g.cx;
      if (h) dy = LETTER_H / 2 - g.cy;
      setGuides({ v, h });
      if (sel.kind === 'block') { const o = g.orig as BlockAdj; n.blocks[sel.key] = { ...o, dx: Math.round(o.dx + dx), dy: Math.round(o.dy + dy) }; }
      else { const i = n.items.findIndex((x) => x.id === sel.id); const o = g.orig as DesignItem; n.items[i] = { ...n.items[i], x: Math.round(o.x + dx), y: Math.round(o.y + dy) } as DesignItem; }
    } else if (g.mode === 'size') {
      const d0 = Math.hypot(g.sx - g.cx, g.sy - g.cy) || 1, d1 = Math.hypot(p.x - g.cx, p.y - g.cy);
      const f = clamp(d1 / d0, 0.15, 6);
      if (sel.kind === 'block') { const o = g.orig as BlockAdj; n.blocks[sel.key] = { ...o, k: clamp(Math.round(o.k * f * 100) / 100, 0.35, 2.5) }; }
      else {
        const i = n.items.findIndex((x) => x.id === sel.id); const o = g.orig as DesignItem;
        if (o.kind === 'text') n.items[i] = { ...o, size: clamp(Math.round(o.size * f), 12, 260) };
        else if (o.kind === 'image') n.items[i] = { ...o, w: clamp(Math.round(o.w * f), 24, 1414) };
        else n.items[i] = { ...o, w: clamp(Math.round(o.w * f), 10, 1414), h: clamp(Math.round(o.h * f), 4, 1000) };
      }
    } else if (sel.kind === 'item') {
      const i = n.items.findIndex((x) => x.id === sel.id);
      let a = (Math.atan2(p.y - g.cy, p.x - g.cx) * 180) / Math.PI + 90;
      a = ((a + 540) % 360) - 180;
      for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(a - snap) < 5) a = snap;
      n.items[i] = { ...n.items[i], rot: Math.round(a) } as DesignItem;
    }
    setDesign(n);
  };
  const onUp = () => {
    const g = drag.current; if (!g) return;
    drag.current = null; setGuides({ v: false, h: false });
    if (JSON.stringify(g.before) !== JSON.stringify(design)) { setPast((p) => [...p.slice(-60), g.before]); setFuture([]); }
  };

  /* ------------------------------------------------ bàn phím */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { if (typing) return; e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { if (typing) return; e.preventDefault(); redo(); return; }
      if (typing) return;
      if (e.key === 'Escape') { if (sel) setSel(null); else onClose(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); removeSel(); return; }
      if (sel && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const st = e.shiftKey ? 10 : 2;
        const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
        const n = clone(design);
        if (sel.kind === 'block') { const a = adjOf(n, sel.key); n.blocks[sel.key] = { ...a, dx: a.dx + dx, dy: a.dy + dy }; }
        else { const i = n.items.findIndex((x) => x.id === sel.id); if (i >= 0) n.items[i] = { ...n.items[i], x: n.items[i].x + dx, y: n.items[i].y + dy } as DesignItem; }
        commit(n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, design, undo, redo, removeSel, commit, onClose]);

  /* ------------------------------------------------ giao diện */
  const pct = (b: { x: number; y: number; w: number; h: number }) => ({ left: `${(b.x / LETTER_W) * 100}%`, top: `${(b.y / LETTER_H) * 100}%`, width: `${(b.w / LETTER_W) * 100}%`, height: `${(b.h / LETTER_H) * 100}%` });
  const handles = (s: Exclude<Sel, null>, rot: boolean) => (
    <>
      <span className="pe-h pe-h-size" onPointerDown={(e) => startDrag(e, s, 'size')} title="Kéo để phóng to / thu nhỏ" />
      {rot && <span className="pe-h pe-h-rot" onPointerDown={(e) => startDrag(e, s, 'rot')} title="Kéo để xoay" />}
    </>
  );

  return (
    <div className="pe" role="dialog" aria-modal="true" aria-label="Chỉnh sửa thư khen">
      <header className="pe-top">
        <b>Chỉnh sửa thư khen · <span>{tpl.label}</span></b>
        <div className="pe-top-act">
          <button type="button" className="pe-icon" onClick={undo} disabled={!past.length} title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác"><Undo2 /></button>
          <button type="button" className="pe-icon" onClick={redo} disabled={!future.length} title="Làm lại (Ctrl+Y)" aria-label="Làm lại"><Redo2 /></button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { commit(emptyDesign()); setSel(null); }}><RotateCcw aria-hidden="true" /> Về mẫu gốc</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}><X aria-hidden="true" /> Huỷ</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave(design)}>Lưu thiết kế</button>
        </div>
      </header>

      <div className="pe-body">
        <nav className="pe-tools" aria-label="Thêm vào thư">
          {([['text', Type, 'Chữ'], ['sticker', Sticker, 'Sticker'], ['emoji', Smile, 'Biểu tượng'], ['shape', Shapes, 'Hình'], ['image', ImagePlus, 'Ảnh']] as const).map(([k, Icon, label]) => (
            <button key={k} type="button" className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}><Icon aria-hidden="true" /><span>{label}</span></button>
          ))}
        </nav>
        <aside className="pe-lib">
          {tab === 'text' && (
            <div className="pe-lib-list">
              <p className="pe-hint">Bấm để thêm vào giữa thư, rồi kéo tới chỗ muốn đặt. Gõ <code>{'{ten}'}</code> để chèn tên từng em.</p>
              {TEXT_PRESETS.map((p) => (
                <button key={p.label} type="button" className="pe-preset" onClick={() => addText(p)} style={{ color: p.item.color === '#ffffff' ? '#111' : p.item.color, fontFamily: p.item.font === 'script' ? 'PraiseScript, cursive' : p.item.font === 'oswald' ? 'PraiseOswald, sans-serif' : 'PraiseBaloo, sans-serif', fontWeight: p.item.bold ? 800 : 600, fontSize: Math.min(26, p.item.size / 2.2) }}>{p.label}</button>
              ))}
            </div>
          )}
          {tab === 'sticker' && (
            <div className="pe-grid">
              {STICKERS.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <button key={s.id} type="button" title={s.name} onClick={() => addImage(`/stickers/${s.id}.webp`, 170)}><img src={`/stickers/${s.id}.webp`} alt={s.name} loading="lazy" /></button>
              ))}
            </div>
          )}
          {tab === 'emoji' && (
            <div className="pe-grid">
              {EMOJIS.map((e) => (
                // eslint-disable-next-line @next/next/no-img-element
                <button key={e} type="button" onClick={() => addImage(`/emoji/${e}.png`, 120)}><img src={`/emoji/${e}.png`} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}
          {tab === 'shape' && (
            <div className="pe-lib-list">
              <button type="button" className="pe-shape" onClick={() => addShape('rect')}><Square aria-hidden="true" /> Khung chữ nhật bo góc</button>
              <button type="button" className="pe-shape" onClick={() => addShape('circle')}><Circle aria-hidden="true" /> Hình tròn / bầu dục</button>
              <button type="button" className="pe-shape" onClick={() => addShape('star')}><Star aria-hidden="true" /> Ngôi sao</button>
              <button type="button" className="pe-shape" onClick={() => addShape('heart')}><Heart aria-hidden="true" /> Trái tim</button>
              <button type="button" className="pe-shape" onClick={() => addShape('line')}><Minus aria-hidden="true" /> Đường kẻ</button>
              <button type="button" className="pe-shape" onClick={() => addShape('rect', true)}><Square aria-hidden="true" /> Viền trang</button>
            </div>
          )}
          {tab === 'image' && (
            <div className="pe-lib-list">
              <p className="pe-hint">Logo trường, ảnh lớp, con dấu… Ảnh chỉ lưu trên máy này, tự thu nhỏ cho nhẹ.</p>
              <label className="btn btn-primary btn-sm pe-upload"><ImagePlus aria-hidden="true" /> Tải ảnh lên
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void onUpload(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {note && <p className="adm-alert is-error">{note}</p>}
            </div>
          )}
        </aside>

        <main className="pe-main" onPointerDown={() => setSel(null)}>
          <div className="pe-stage" ref={stage} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <canvas ref={canvas} width={LETTER_W} height={LETTER_H} aria-label="Thư khen đang chỉnh" role="img" />
            {guides.v && <i className="pe-guide is-v" aria-hidden="true" />}
            {guides.h && <i className="pe-guide is-h" aria-hidden="true" />}
            {boxes && BLOCKS.map((k) => {
              const a = adjOf(design, k);
              if (a.hide) return null;
              const on = selBlock === k;
              return (
                <div key={k} className={`pe-box is-block${on ? ' is-sel' : ''}`} style={pct(boxes[k])} onPointerDown={(e) => startDrag(e, { kind: 'block', key: k }, 'move')} title={BLOCK_LABEL[k]}>
                  {on && <span className="pe-tag">{BLOCK_LABEL[k]}</span>}
                  {on && handles({ kind: 'block', key: k }, false)}
                </div>
              );
            })}
            {assets && design.items.map((it) => {
              const b = itemBox(it, data, assets);
              const on = sel?.kind === 'item' && sel.id === it.id;
              return (
                <div key={it.id} className={`pe-box${on ? ' is-sel' : ''}`} style={{ ...pct(b), transform: it.rot ? `rotate(${it.rot}deg)` : undefined }} onPointerDown={(e) => startDrag(e, { kind: 'item', id: it.id }, 'move')}>
                  {on && handles({ kind: 'item', id: it.id }, true)}
                </div>
              );
            })}
          </div>
          <p className="pe-foot">Kéo để di chuyển · kéo chấm xanh để phóng to/thu nhỏ · chấm tròn trên đầu để xoay · phím mũi tên để nhích · Delete để xoá · đang xem thư của <b>{data.name}</b></p>
        </main>

        <aside className="pe-props" aria-label="Thuộc tính">
          {!sel && (
            <>
              <h3>Màu chữ của mẫu</h3>
              <div className="pe-field"><span>Tiêu đề THƯ KHEN</span><Swatches value={design.colors.title} allowNone="Màu của mẫu" onPick={(c) => edit((d) => { d.colors.title = c; })} /></div>
              <div className="pe-field"><span>Viền tiêu đề</span><Swatches value={design.colors.titleRing} allowNone="Màu của mẫu" onPick={(c) => edit((d) => { d.colors.titleRing = c; })} /></div>
              <div className="pe-field"><span>Tên học sinh</span><Swatches value={design.colors.name} allowNone="Màu của mẫu" onPick={(c) => edit((d) => { d.colors.name = c; })} /></div>
              <div className="pe-field"><span>Chữ nội dung</span><Swatches value={design.colors.ink} allowNone="Màu của mẫu" onPick={(c) => edit((d) => { d.colors.ink = c; })} /></div>
              <div className="pe-field"><span>Lời chúc</span><Swatches value={design.colors.wish} allowNone="Màu của mẫu" onPick={(c) => edit((d) => { d.colors.wish = c; })} /></div>
              {tpl.stickers.length > 0 && <label className="pe-check"><input type="checkbox" checked={!!design.hideStickers} onChange={(e) => edit((d) => { d.hideStickers = e.target.checked; })} /> Ẩn sticker có sẵn của mẫu</label>}
              <h3>Khối có sẵn</h3>
              {BLOCKS.map((k) => {
                const a = adjOf(design, k);
                return (
                  <div key={k} className="pe-blockrow">
                    <button type="button" className="pe-link" onClick={() => !a.hide && setSel({ kind: 'block', key: k })}>{BLOCK_LABEL[k]}</button>
                    <button type="button" className="pe-icon" title={a.hide ? 'Hiện' : 'Ẩn'} aria-label={a.hide ? 'Hiện' : 'Ẩn'} onClick={() => patchBlock(k, { hide: !a.hide })}>{a.hide ? <EyeOff /> : <Eye />}</button>
                  </div>
                );
              })}
              <p className="pe-hint">Bấm vào chữ, sticker hay hình trên thư để chọn và sửa.</p>
            </>
          )}

          {selBlock && (() => {
            const a = adjOf(design, selBlock);
            return (
              <>
                <h3>{BLOCK_LABEL[selBlock]}</h3>
                <label className="pe-range"><span>Cỡ {Math.round(a.k * 100)}%</span><input type="range" min={35} max={250} value={Math.round(a.k * 100)} onChange={(e) => patchBlock(selBlock, { k: Number(e.target.value) / 100 })} /></label>
                <div className="pe-row">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => patchBlock(selBlock, { dx: 0 })}><AlignCenter aria-hidden="true" /> Về giữa</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => patchBlock(selBlock, { dx: 0, dy: 0, k: 1 })}><RotateCcw aria-hidden="true" /> Vị trí gốc</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={removeSel}><EyeOff aria-hidden="true" /> Ẩn khối</button>
                </div>
                <p className="pe-hint">Nội dung chữ của khối này sửa ở mục 2 “Nội dung chung”. Màu chữ: bỏ chọn rồi đổi ở “Màu chữ của mẫu”.</p>
              </>
            );
          })()}

          {selItem && (
            <>
              <h3>{selItem.kind === 'text' ? 'Chữ' : selItem.kind === 'image' ? 'Hình ảnh' : 'Hình'}</h3>
              {selItem.kind === 'text' && (
                <>
                  <label className="pe-field"><span>Nội dung</span><textarea rows={3} value={selItem.text} maxLength={300} onChange={(e) => patchItem(selItem.id, { text: e.target.value })} /></label>
                  <div className="pe-vars">{VARS.map((v) => <button key={v.key} type="button" onClick={() => patchItem(selItem.id, { text: `${selItem.text}${v.key}` })} title={v.label}>{v.key}</button>)}</div>
                  <label className="pe-field"><span>Phông chữ</span>
                    <select value={selItem.font} onChange={(e) => patchItem(selItem.id, { font: e.target.value as FontKey })}>{FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select>
                  </label>
                  <label className="pe-range"><span>Cỡ chữ {selItem.size}</span><input type="range" min={12} max={200} value={selItem.size} onChange={(e) => patchItem(selItem.id, { size: Number(e.target.value) })} /></label>
                  <div className="pe-row">
                    <button type="button" className={`pe-icon${selItem.bold ? ' is-on' : ''}`} onClick={() => patchItem(selItem.id, { bold: !selItem.bold })} aria-label="Chữ đậm" title="Chữ đậm"><Bold /></button>
                    <button type="button" className={`pe-icon${selItem.upper ? ' is-on' : ''}`} onClick={() => patchItem(selItem.id, { upper: !selItem.upper })} aria-label="IN HOA" title="IN HOA">Aa</button>
                    {(['left', 'center', 'right'] as const).map((al) => {
                      const I = al === 'left' ? AlignLeft : al === 'right' ? AlignRight : AlignCenter;
                      return <button key={al} type="button" className={`pe-icon${selItem.align === al ? ' is-on' : ''}`} onClick={() => patchItem(selItem.id, { align: al })} aria-label={`Căn ${al}`}><I /></button>;
                    })}
                  </div>
                  <div className="pe-field"><span>Màu chữ</span><Swatches value={selItem.color} onPick={(c) => c && patchItem(selItem.id, { color: c })} /></div>
                  <div className="pe-field"><span>Viền chữ</span><Swatches value={selItem.ring} allowNone="Không viền" onPick={(c) => patchItem(selItem.id, { ring: c })} /></div>
                </>
              )}
              {selItem.kind === 'image' && (
                <label className="pe-range"><span>Rộng {selItem.w}px</span><input type="range" min={24} max={1414} value={selItem.w} onChange={(e) => patchItem(selItem.id, { w: Number(e.target.value) })} /></label>
              )}
              {selItem.kind === 'shape' && (
                <>
                  <div className="pe-field"><span>Màu nền</span><Swatches value={selItem.fill} allowNone="Trong suốt" onPick={(c) => patchItem(selItem.id, { fill: c ?? 'transparent' })} /></div>
                  <div className="pe-field"><span>Màu viền</span><Swatches value={selItem.stroke} allowNone="Không viền" onPick={(c) => patchItem(selItem.id, { stroke: c ?? 'transparent' })} /></div>
                  <label className="pe-range"><span>Độ dày viền {selItem.sw}</span><input type="range" min={0} max={40} value={selItem.sw} onChange={(e) => patchItem(selItem.id, { sw: Number(e.target.value) })} /></label>
                  <label className="pe-range"><span>Rộng {selItem.w}</span><input type="range" min={10} max={1414} value={selItem.w} onChange={(e) => patchItem(selItem.id, { w: Number(e.target.value) })} /></label>
                  {selItem.shape !== 'line' && <label className="pe-range"><span>Cao {selItem.h}</span><input type="range" min={10} max={1000} value={selItem.h} onChange={(e) => patchItem(selItem.id, { h: Number(e.target.value) })} /></label>}
                  {selItem.shape === 'rect' && <label className="pe-range"><span>Bo góc {selItem.radius ?? 24}</span><input type="range" min={0} max={200} value={selItem.radius ?? 24} onChange={(e) => patchItem(selItem.id, { radius: Number(e.target.value) })} /></label>}
                </>
              )}
              <label className="pe-range"><span>Xoay {selItem.rot}°</span><input type="range" min={-180} max={180} value={selItem.rot} onChange={(e) => patchItem(selItem.id, { rot: Number(e.target.value) })} /></label>
              <label className="pe-range"><span>Độ trong {Math.round((selItem.opacity ?? 1) * 100)}%</span><input type="range" min={10} max={100} value={Math.round((selItem.opacity ?? 1) * 100)} onChange={(e) => patchItem(selItem.id, { opacity: Number(e.target.value) / 100 })} /></label>
              <div className="pe-row">
                <button type="button" className="pe-icon" onClick={() => layer(selItem.id, 1)} title="Đưa lên trên" aria-label="Đưa lên trên"><ArrowUp /></button>
                <button type="button" className="pe-icon" onClick={() => layer(selItem.id, -1)} title="Đưa xuống dưới" aria-label="Đưa xuống dưới"><ArrowDown /></button>
                <button type="button" className="pe-icon" onClick={() => patchItem(selItem.id, { x: LETTER_W / 2 })} title="Căn giữa trang" aria-label="Căn giữa trang"><AlignCenter /></button>
                <button type="button" className="pe-icon" onClick={() => dup(selItem)} title="Nhân bản" aria-label="Nhân bản"><Copy /></button>
                <button type="button" className="pe-icon is-danger" onClick={removeSel} title="Xoá (Delete)" aria-label="Xoá"><Trash2 /></button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
