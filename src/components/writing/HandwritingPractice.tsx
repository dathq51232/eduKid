'use client';

// Luyện chữ trên trang A4 kẻ ô vuông 4/5 li, em tô / tự viết bằng ngón tay hoặc bút cảm ứng,
// bấm "Chấm điểm" để nhận sao và lời nhắc (thiếu nét, ra ngoài nét, chữ cao / nhỏ quá).
// Học sinh trong lớp: lưu bài vào "Hành trình nét chữ" (chờ cô duyệt rồi lên tường triển lãm).
// Tuỳ chọn khung trang (dùng chung bộ khung của trang vở in) và "Vở trống" để viết tự do (không chữ mẫu, không chấm).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Eraser, GalleryHorizontalEnd, Redo2, RotateCcw, Save, Star, Undo2 } from 'lucide-react';
import PenSettings, { DEFAULT_PEN, type PenState } from './PenSettings';
import { FRAMES, PageFrame } from './frames';
import { loadPraiseFonts } from '@/lib/praise/render';
import { drawPaper } from '@/lib/writing/paper';
import { setsForGrade, WRITE_SETS, type WriteSet } from '@/lib/writing/letters';
import { BRUSH } from '@/lib/writing/ink';
import { CW, PEN, buildSheet, drawStrokes, drawTemplate, resetFontCache, scoreWriting, type Result, type Sheet, type Stroke } from '@/lib/writing/score';
import { addItem, canvasToImage } from '@/lib/gallery/client';
import { ToolIcon } from '@/components/classroom/tool-icons';
import '@/styles/adm.css';
import '@/styles/hp.css';
import '@/styles/btn.css';
import '@/styles/dash.css';

const PROGRESS = 'edukid:luyen-chu';
const PAGE_PREF = 'edukid:luyen-chu-trang';
const A4_HEIGHT = Math.round(CW * 297 / 210);
const MM = CW / 210;
/** khung trang chiếm dải lề 0–11 mm (frames.tsx) → lưới ô li bắt đầu từ 12 mm, lề đỏ cách mép 16 mm */
const FRAME_INSET = Math.round(12 * MM);
const FRAME_MARGIN = Math.round(16 * MM);
type Progress = Record<string, number>;
type Mode = 'to' | 'viet' | 'trong';
type PagePref = { frame: string; blankPaper: 'o-li' | 'trang' };
const readProgress = (): Progress => { try { return JSON.parse(localStorage.getItem(PROGRESS) ?? '{}') as Progress; } catch { return {}; } };
const readPagePref = (): PagePref | null => {
  try {
    const v = JSON.parse(localStorage.getItem(PAGE_PREF) ?? 'null') as PagePref | null;
    return v && typeof v.frame === 'string' && (v.frame === 'none' || FRAMES.some((f) => f.id === v.frame)) && (v.blankPaper === 'o-li' || v.blankPaper === 'trang') ? v : null;
  } catch { return null; }
};
/** vẽ khung (SVG đang hiện trên trang) lên canvas khi lưu ảnh */
function drawSvg(c: CanvasRenderingContext2D, svg: SVGSVGElement, w: number, h: number) {
  return new Promise<void>((resolve) => {
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => { c.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); resolve(); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });
}

export default function HandwritingPractice({ grade: g0, classId, studentId, studentName, extraSets }: { grade: number; classId?: string | null; studentId?: string | null; studentName?: string | null; extraSets?: WriteSet[] }) {
  const [grade, setGrade] = useState(Math.min(5, Math.max(1, g0 || 1)));
  // bài cô giao (câu thơ, ca dao) đứng đầu danh sách
  const sets = useMemo(() => [...(extraSets ?? []).filter((x) => x.items.length), ...setsForGrade(grade)], [grade, extraSets]);
  const [setId, setSetId] = useState(sets[0]?.id ?? 'thuong');
  const set: WriteSet = sets.find((s) => s.id === setId) ?? sets[0] ?? WRITE_SETS[0];
  const [idx, setIdx] = useState(0);
  const text = set.items[Math.min(idx, set.items.length - 1)];
  const [mode, setMode] = useState<Mode>('to');
  const [frame, setFrame] = useState('none');
  const [blankPaper, setBlankPaper] = useState<'o-li' | 'trang'>('o-li');
  const framed = frame !== 'none';
  const frameSvg = useRef<SVGSVGElement>(null);
  const [pen, setPen] = useState<PenState>(DEFAULT_PEN);
  const ink = pen.color, brush = pen.brush;
  const [cellCount, setCellCount] = useState<4 | 5>(4);
  const [cellMm, setCellMm] = useState(2);
  const [fontOk, setFontOk] = useState(false);
  const [strokes, setStrokesRaw] = useState<Stroke[]>([]);
  const [past, setPast] = useState<Stroke[][]>([]);
  const [future, setFuture] = useState<Stroke[][]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;
  // mọi thay đổi nét đều ghi lịch sử để Hoàn tác / Làm lại
  const setStrokes = useCallback((next: Stroke[] | ((l: Stroke[]) => Stroke[])) => {
    const prev = strokesRef.current;
    const v = typeof next === 'function' ? next(prev) : next;
    if (v === prev) return;
    setPast((p) => [...p.slice(-80), prev]); setFuture([]); setStrokesRaw(v); strokesRef.current = v;
  }, []);
  const undo = () => { const p = past.at(-1); if (!p) return; setPast(past.slice(0, -1)); setFuture((f) => [strokes, ...f]); setStrokesRaw(p); setResult(null); };
  const redo = () => { const f = future[0]; if (!f) return; setFuture(future.slice(1)); setPast((p) => [...p, strokes]); setStrokesRaw(f); setResult(null); };
  const done = useRef<HTMLCanvasElement | null>(null); // ảnh các nét đã xong (vẽ nhanh khi đang kéo bút)
  const erasing = useRef(false);
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const base = useRef<HTMLCanvasElement>(null);
  const top = useRef<HTMLCanvasElement>(null);
  const cur = useRef<Stroke | null>(null);
  const penSeen = useRef(false);

  useEffect(() => { const p = readPagePref(); if (p) { setFrame(p.frame); setBlankPaper(p.blankPaper); } }, []);
  const setPage = (next: Partial<PagePref>) => {
    const v = { frame, blankPaper, ...next };
    setFrame(v.frame); setBlankPaper(v.blankPaper);
    try { localStorage.setItem(PAGE_PREF, JSON.stringify(v)); } catch { /* trình duyệt chặn lưu: chỉ không nhớ lựa chọn */ }
  };
  useEffect(() => { setProgress(readProgress()); void loadPraiseFonts().then(() => { resetFontCache(); setFontOk(true); }); }, []);
  useEffect(() => { if (!sets.some((s) => s.id === setId)) { setSetId(sets[0]?.id ?? 'thuong'); setIdx(0); } }, [sets, setId]);

  const sheet: Sheet | null = useMemo(() => {
    if (!fontOk || typeof document === 'undefined') return null;
    const c = document.createElement('canvas').getContext('2d')!;
    const cellUnit = (CW / 210) * cellMm;
    // có khung: chữ mẫu lùi vào trong (sau lề đỏ), dòng đầu xuống một hàng, dòng cuối chừa phần chữ có đuôi (g, y)
    const base = buildSheet(c, text, set.repeat, framed ? FRAME_MARGIN + 20 : 60, cellUnit, cellCount);
    const pitch = cellUnit * cellCount * 2;
    const baseRows = [...new Set(base.rows)].sort((a, b) => a - b);
    const blockHeight = set.repeat ? pitch : pitch * Math.max(1, baseRows.length);
    const glyphs: Sheet['glyphs'] = [];
    const limit = framed ? A4_HEIGHT - FRAME_INSET - cellUnit * 3 : A4_HEIGHT - 30;
    for (let offset = framed ? pitch : 0; offset + (baseRows.at(-1) ?? pitch) <= limit; offset += blockHeight) {
      if (set.repeat) {
        const firstBase = baseRows[0];
        glyphs.push(...base.glyphs.filter((g) => g.base === firstBase).map((g) => ({ ...g, base: g.base + offset })));
      } else {
        glyphs.push(...base.glyphs.map((g) => ({ ...g, base: g.base + offset })));
      }
    }
    return { ...base, h: A4_HEIGHT, glyphs, rows: [...new Set(glyphs.map((g) => g.base))] };
  }, [fontOk, text, set.repeat, cellCount, cellMm, framed]);

  const paperOpt = useCallback(() => ({
    margin: framed ? FRAME_MARGIN : 40, squareGrid: true, cellCount, inset: framed ? FRAME_INSET : 0, blank: mode === 'trong' && blankPaper === 'trang',
  }), [framed, cellCount, mode, blankPaper]);

  // giấy + chữ mẫu
  useEffect(() => {
    const c = base.current?.getContext('2d');
    if (!c || !sheet) return;
    const cellUnit = (CW / 210) * cellMm;
    drawPaper(c, CW, sheet.h, cellUnit, paperOpt());
    if (mode !== 'trong') drawTemplate(c, sheet, mode);
  }, [sheet, mode, cellCount, cellMm, paperOpt]);

  // nét viết + lớp chấm
  const redraw = useCallback((list: Stroke[], res: Result | null) => {
    const c = top.current?.getContext('2d');
    if (!c || !sheet) return;
    c.clearRect(0, 0, CW, sheet.h);
    drawStrokes(c, list, ink);
    const d = done.current ?? (done.current = document.createElement('canvas'));
    d.width = CW; d.height = sheet.h;
    d.getContext('2d')!.drawImage(c.canvas, 0, 0);
    // lớp chấm vẽ đè lên nét: cam = thiếu nét, đỏ = ra ngoài nét
    if (res) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(res.overlay, 0, 0, CW, sheet.h); c.restore(); }
  }, [sheet, ink]);
  useEffect(() => { redraw(strokes, result); }, [strokes, result, redraw]);
  // đổi chữ / cách luyện / ô li thì trang mới; ở Vở trống, đổi chữ mẫu không xoá bài đang viết
  const pageKey = mode === 'trong' ? 'trong' : `${mode}|${text}`;
  useEffect(() => { setStrokesRaw([]); setPast([]); setFuture([]); setResult(null); setMsg(null); }, [pageKey, cellCount, cellMm, framed]);

  const pos = (e: { clientX: number; clientY: number; pressure: number }): [number, number, number] => {
    const r = top.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * CW, ((e.clientY - r.top) / r.height) * (sheet?.h ?? 1), e.pressure || 0.5];
  };
  // tẩy theo nét: chạm vào nét nào thì xoá nét đó
  const eraseAt = (x: number, y: number) => {
    const r = Math.max(10, pen.size * 6);
    setStrokes((l) => {
      const keep = l.filter((s) => !s.pts.some(([px, py]) => Math.hypot(px - x, py - y) < r + s.w / 2));
      return keep.length === l.length ? l : keep;
    });
  };
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (penSeen.current && e.pointerType === 'touch') return; // đang dùng bút: bỏ qua lòng bàn tay chạm màn hình
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (result) setResult(null);
    const p = pos(e);
    if (pen.tool === 'erase' || e.button === 5) { erasing.current = true; eraseAt(p[0], p[1]); return; }
    cur.current = { pts: [p], w: PEN * BRUSH[brush].mul * pen.size, color: ink, brush, taper: brush === 'marker' ? [0, 0] : [pen.taperStart, pen.taperEnd] };
  };
  const onMove = (e: React.PointerEvent) => {
    if (erasing.current) { const p = pos(e); eraseAt(p[0], p[1]); return; }
    const s = cur.current; if (!s) return;
    const evs = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of evs) s.pts.push(pos(ev));
    const c = top.current?.getContext('2d');
    if (!c || !sheet) return;
    // vẽ lại cả nét đang viết (để đầu / đuôi nét thon đúng hình)
    c.clearRect(0, 0, CW, sheet.h);
    if (done.current) c.drawImage(done.current, 0, 0);
    drawStrokes(c, [s], ink);
  };
  const onUp = () => {
    erasing.current = false;
    const s = cur.current; cur.current = null;
    if (s) setStrokes((l) => [...l, s]);
  };

  const check = () => {
    if (!sheet) return;
    const r = scoreWriting(sheet, strokes);
    setResult(r);
    if (r.stars > (progress[text] ?? 0)) {
      const p = { ...progress, [text]: r.stars };
      setProgress(p);
      try { localStorage.setItem(PROGRESS, JSON.stringify(p)); } catch { /* bỏ qua */ }
    }
  };

  const save = async () => {
    if (!sheet || !classId || !studentId || (!result && mode !== 'trong')) return;
    setBusy(true); setMsg(null);
    try {
      const c = document.createElement('canvas'); c.width = CW; c.height = sheet.h;
      const x = c.getContext('2d')!;
      const cellUnit = (CW / 210) * cellMm;
      drawPaper(x, CW, sheet.h, cellUnit, paperOpt());
      if (framed && frameSvg.current) await drawSvg(x, frameSvg.current, CW, sheet.h);
      if (mode === 'to') { x.globalAlpha = 0.6; drawTemplate(x, sheet, 'to'); x.globalAlpha = 1; }
      drawStrokes(x, strokes, ink);
      const image = await canvasToImage(c, 0.88);
      const note = result
        ? `Luyện trên màn hình (${mode === 'to' ? 'tô theo mẫu' : 'tự viết'}): ${result.score} điểm, ${result.stars} sao.`
        : 'Luyện trên màn hình: trang vở trống, em viết tự do.';
      await addItem(classId, { student: studentId, kind: 'writing', title: mode === 'trong' ? 'Luyện chữ: trang vở trống' : `Luyện chữ: ${text}`, note, image, w: c.width, h: c.height }, studentId);
      setMsg({ kind: 'ok', text: 'Đã lưu vào Hành trình nét chữ! Cô duyệt xong bài sẽ lên tường triển lãm.' });
    } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Chưa lưu được, thử lại.' }); }
    finally { setBusy(false); }
  };

  const next = () => setIdx((i) => (i + 1) % set.items.length);

  return (
    <div className="hp">
      <header className="hp-head">
        <div>
          <h1><ToolIcon k="luyen-chu" /> Luyện chữ đẹp</h1>
          <p className="dash-muted">{mode === 'trong'
            ? `${studentName ? `${studentName} ơi, đây` : 'Đây'} là trang vở trống: viết gì tuỳ thích, viết chậm và đều tay nhé.`
            : `${studentName ? `${studentName} ơi, tô` : 'Tô'} theo nét đứt màu xanh, viết chậm và đều tay. Viết xong bấm “Chấm điểm”.`}</p>
        </div>
        <label className="hp-grade">Lớp <select value={grade} onChange={(e) => { setGrade(Number(e.target.value)); setIdx(0); }}>{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
      </header>

      {mode !== 'trong' && <>
      <div className="hp-sets" role="tablist" aria-label="Nội dung luyện">
        {sets.map((s) => <button key={s.id} type="button" role="tab" aria-selected={s.id === set.id} className={s.id === set.id ? 'is-on' : ''} onClick={() => { setSetId(s.id); setIdx(0); }}>{s.label}</button>)}
      </div>
      <div className="hp-items" aria-label="Chọn chữ">
        {set.items.map((t, i) => (
          <button key={t} type="button" className={`hp-chip${i === idx ? ' is-on' : ''}${set.repeat ? '' : ' is-long'}`} onClick={() => setIdx(i)} aria-pressed={i === idx}>
            <span className="hp-chip-t">{t}</span>
            {(progress[t] ?? 0) > 0 && <span className="hp-chip-s" aria-label={`${progress[t]} sao`}>{'★'.repeat(progress[t])}</span>}
          </button>
        ))}
      </div>
      </>}

      <div className="hp-main">
        <div className="hp-paper" style={sheet ? { aspectRatio: '210 / 297' } : undefined}>
          {sheet ? (
            <>
              <canvas ref={base} width={CW} height={sheet.h} aria-hidden="true" />
              {framed && (
                <svg ref={frameSvg} className="hp-frame" xmlns="http://www.w3.org/2000/svg" width={CW} height={sheet.h} viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
                  <PageFrame id={frame} W={210} H={297} />
                </svg>
              )}
              <canvas ref={top} width={CW} height={sheet.h} className="hp-ink" role="img" aria-label={mode === 'trong' ? 'Trang vở trống' : `Bảng viết chữ ${text}`}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            </>
          ) : <p className="dash-muted" role="status">Đang chuẩn bị chữ mẫu…</p>}
        </div>
        <aside className="hp-side">
          <div className="hp-seg" role="radiogroup" aria-label="Cách luyện">
            <button type="button" role="radio" aria-checked={mode === 'to'} className={mode === 'to' ? 'is-on' : ''} onClick={() => setMode('to')}>Tô theo mẫu</button>
            <button type="button" role="radio" aria-checked={mode === 'viet'} className={mode === 'viet' ? 'is-on' : ''} onClick={() => setMode('viet')}>Tự viết</button>
            <button type="button" role="radio" aria-checked={mode === 'trong'} className={mode === 'trong' ? 'is-on' : ''} onClick={() => setMode('trong')}>Vở trống</button>
          </div>
          {mode === 'trong' && (
            <div className="hp-grid-pick" role="radiogroup" aria-label="Kiểu giấy vở trống">
              <button type="button" role="radio" aria-checked={blankPaper === 'o-li'} className={blankPaper === 'o-li' ? 'is-on' : ''} onClick={() => setPage({ blankPaper: 'o-li' })}>Ô li <small>kẻ ô như vở</small></button>
              <button type="button" role="radio" aria-checked={blankPaper === 'trang'} className={blankPaper === 'trang' ? 'is-on' : ''} onClick={() => setPage({ blankPaper: 'trang' })}>Giấy trắng <small>không kẻ</small></button>
            </div>
          )}
          <details className="hp-frames-box" open={framed || undefined}>
            <summary>Khung trang vở <b>{framed ? FRAMES.find((f) => f.id === frame)?.label : 'Không khung'}</b></summary>
            <div className="hp-frames" role="radiogroup" aria-label="Khung trang vở">
              <button type="button" role="radio" aria-checked={!framed} className={!framed ? 'is-on' : ''} onClick={() => setPage({ frame: 'none' })}>
                <span className="hp-frame-none" aria-hidden="true">∅</span><b>Không khung</b>
              </button>
              {FRAMES.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={frame === f.id} className={frame === f.id ? 'is-on' : ''} title={f.hint} onClick={() => setPage({ frame: f.id })}>
                  <svg viewBox="0 0 210 297" aria-hidden="true"><PageFrame id={f.id} W={210} H={297} /></svg>
                  <b>{f.label}</b>
                </button>
              ))}
            </div>
          </details>
          {!(mode === 'trong' && blankPaper === 'trang') && <section className="hp-grid-options" aria-label="Tùy chỉnh giấy ô li">
            <strong>Giấy A4 · ô vuông lớn</strong>
            <div className="hp-grid-pick" role="radiogroup" aria-label="Số ô nhỏ trong mỗi cạnh ô lớn">
              {([4, 5] as const).map((n) => (
                <button key={n} type="button" role="radio" aria-checked={cellCount === n} className={cellCount === n ? 'is-on' : ''} onClick={() => setCellCount(n)}>
                  {n} ô li <small>{n} × {n} ô nhỏ</small>
                </button>
              ))}
            </div>
            <label className="hp-cell-size">Cỡ ô nhỏ <b>{cellMm.toFixed(1)} mm</b>
              <input type="range" min="1.5" max="3.5" step="0.1" value={cellMm} onChange={(e) => setCellMm(Number(e.target.value))} />
            </label>
          </section>}
          <PenSettings value={pen} onChange={setPen} brushes={['fountain', 'ink', 'brush', 'pencil', 'marker']} eraser />
          <div className="hp-btns">
            <button type="button" className="btn btn-outline btn-sm" disabled={!past.length} onClick={undo}><Undo2 aria-hidden="true" /> Hoàn tác</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!future.length} onClick={redo}><Redo2 aria-hidden="true" /> Làm lại</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!strokes.length} onClick={() => { setStrokes([]); setResult(null); setMsg(null); }}><Eraser aria-hidden="true" /> Xoá hết</button>
          </div>
          {mode !== 'trong' && <button type="button" className="btn btn-primary hp-check" disabled={!strokes.length} onClick={check}><Check aria-hidden="true" /> Chấm điểm</button>}
          {mode === 'trong' && classId && studentId && (
            <button type="button" className="btn btn-primary hp-check" disabled={busy || !strokes.length} onClick={() => void save()}><Save aria-hidden="true" /> Lưu vào Hành trình nét chữ</button>
          )}

          {result && (
            <div className={`hp-result s-${result.stars}`} role="status">
              <div className="hp-stars" aria-label={`${result.stars} trên 3 sao`}>
                {[1, 2, 3].map((n) => <Star key={n} className={n <= result.stars ? 'is-on' : ''} aria-hidden="true" />)}
              </div>
              <b>{result.score} điểm</b>
              <ul>{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="hp-legend"><i className="l-miss" /> thiếu nét <i className="l-out" /> ra ngoài nét</p>
              <div className="hp-btns">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setStrokes([]); setResult(null); }}><RotateCcw aria-hidden="true" /> Viết lại</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={next}>Chữ tiếp <ChevronRight aria-hidden="true" /></button>
              </div>
              {classId && studentId && result.stars > 0 && (
                <button type="button" className="btn btn-outline btn-sm hp-save" disabled={busy} onClick={() => void save()}><Save aria-hidden="true" /> Lưu vào Hành trình nét chữ</button>
              )}
            </div>
          )}
          {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
          {classId && <Link className="hp-link" href="/trien-lam"><GalleryHorizontalEnd aria-hidden="true" /> Phòng triển lãm của lớp</Link>}
          <p className="dash-muted hp-note">Chữ mẫu viết tay mô phỏng; app chấm hình dáng, độ cao chữ và vị trí trên dòng kẻ, chưa chấm thứ tự nét.</p>
        </aside>
      </div>
    </div>
  );
}
