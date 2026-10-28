'use client';

// Luyện chữ trên màn hình: chữ mẫu nét đứt trên giấy ô li, em tô / tự viết bằng ngón tay hoặc bút cảm ứng,
// bấm "Chấm điểm" để nhận sao và lời nhắc (thiếu nét, ra ngoài nét, chữ cao / nhỏ quá).
// Học sinh trong lớp: lưu bài vào "Hành trình nét chữ" (chờ cô duyệt rồi lên tường triển lãm).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Eraser, GalleryHorizontalEnd, PenLine, RotateCcw, Save, Star, Undo2 } from 'lucide-react';
import { loadPraiseFonts } from '@/lib/praise/render';
import { drawPaper } from '@/lib/writing/paper';
import { setsForGrade, WRITE_SETS, type WriteSet } from '@/lib/writing/letters';
import { CW, PEN, U, buildSheet, drawStrokes, drawTemplate, resetFontCache, scoreWriting, type Result, type Sheet, type Stroke } from '@/lib/writing/score';
import { addItem, canvasToImage } from '@/lib/gallery/client';

const PROGRESS = 'edukid:luyen-chu';
type Progress = Record<string, number>;
const readProgress = (): Progress => { try { return JSON.parse(localStorage.getItem(PROGRESS) ?? '{}') as Progress; } catch { return {}; } };
const INK = ['#1e3a8a', '#111827', '#7c3aed', '#be123c'];

export default function HandwritingPractice({ grade: g0, classId, studentId, studentName }: { grade: number; classId?: string | null; studentId?: string | null; studentName?: string | null }) {
  const [grade, setGrade] = useState(Math.min(5, Math.max(1, g0 || 1)));
  const sets = useMemo(() => setsForGrade(grade), [grade]);
  const [setId, setSetId] = useState(sets[0]?.id ?? 'thuong');
  const set: WriteSet = sets.find((s) => s.id === setId) ?? sets[0] ?? WRITE_SETS[0];
  const [idx, setIdx] = useState(0);
  const text = set.items[Math.min(idx, set.items.length - 1)];
  const [mode, setMode] = useState<'to' | 'viet'>('to');
  const [ink, setInk] = useState(INK[0]);
  const [fontOk, setFontOk] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const base = useRef<HTMLCanvasElement>(null);
  const top = useRef<HTMLCanvasElement>(null);
  const cur = useRef<Stroke | null>(null);
  const penSeen = useRef(false);

  useEffect(() => { setProgress(readProgress()); void loadPraiseFonts().then(() => { resetFontCache(); setFontOk(true); }); }, []);
  useEffect(() => { if (!sets.some((s) => s.id === setId)) { setSetId(sets[0]?.id ?? 'thuong'); setIdx(0); } }, [sets, setId]);

  const sheet: Sheet | null = useMemo(() => {
    if (!fontOk || typeof document === 'undefined') return null;
    const c = document.createElement('canvas').getContext('2d')!;
    return buildSheet(c, text, set.repeat);
  }, [fontOk, text, set.repeat]);

  // giấy + chữ mẫu
  useEffect(() => {
    const c = base.current?.getContext('2d');
    if (!c || !sheet) return;
    drawPaper(c, CW, sheet.h, U, { margin: 40 });
    drawTemplate(c, sheet, mode);
  }, [sheet, mode]);

  // nét viết + lớp chấm
  const redraw = useCallback((list: Stroke[], res: Result | null) => {
    const c = top.current?.getContext('2d');
    if (!c || !sheet) return;
    c.clearRect(0, 0, CW, sheet.h);
    drawStrokes(c, list, ink);
    // lớp chấm vẽ đè lên nét: cam = thiếu nét, đỏ = ra ngoài nét
    if (res) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(res.overlay, 0, 0, CW, sheet.h); c.restore(); }
  }, [sheet, ink]);
  useEffect(() => { redraw(strokes, result); }, [strokes, result, redraw]);
  useEffect(() => { setStrokes([]); setResult(null); setMsg(null); }, [text, mode]);

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = top.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * CW, ((e.clientY - r.top) / r.height) * (sheet?.h ?? 1)];
  };
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (penSeen.current && e.pointerType === 'touch') return; // đang dùng bút: bỏ qua lòng bàn tay chạm màn hình
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (result) setResult(null);
    cur.current = { pts: [pos(e)], w: PEN };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = cur.current; if (!s) return;
    const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of evs) s.pts.push(pos(ev as unknown as React.PointerEvent));
    const c = top.current?.getContext('2d');
    if (c) drawStrokes(c, [{ pts: s.pts.slice(-evs.length - 1), w: s.w }], ink);
  };
  const onUp = () => {
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
    if (!sheet || !classId || !studentId || !result) return;
    setBusy(true); setMsg(null);
    try {
      const c = document.createElement('canvas'); c.width = CW; c.height = sheet.h;
      const x = c.getContext('2d')!;
      drawPaper(x, CW, sheet.h, U, { margin: 40 });
      if (mode === 'to') { x.globalAlpha = 0.6; drawTemplate(x, sheet, 'to'); x.globalAlpha = 1; }
      drawStrokes(x, strokes, ink);
      const image = await canvasToImage(c, 0.88);
      const note = `Luyện trên màn hình (${mode === 'to' ? 'tô theo mẫu' : 'tự viết'}): ${result.score} điểm, ${result.stars} sao.`;
      await addItem(classId, { student: studentId, kind: 'writing', title: `Luyện chữ: ${text}`, note, image, w: c.width, h: c.height }, studentId);
      setMsg({ kind: 'ok', text: 'Đã lưu vào Hành trình nét chữ! Cô duyệt xong bài sẽ lên tường triển lãm.' });
    } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Chưa lưu được, thử lại.' }); }
    finally { setBusy(false); }
  };

  const next = () => setIdx((i) => (i + 1) % set.items.length);

  return (
    <div className="hp">
      <header className="hp-head">
        <div>
          <h1><PenLine aria-hidden="true" /> Luyện chữ đẹp</h1>
          <p className="dash-muted">{studentName ? `${studentName} ơi, ` : ''}tô theo nét đứt màu xanh, viết chậm và đều tay. Viết xong bấm “Chấm điểm”.</p>
        </div>
        <label className="hp-grade">Lớp <select value={grade} onChange={(e) => { setGrade(Number(e.target.value)); setIdx(0); }}>{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
      </header>

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

      <div className="hp-main">
        <div className="hp-paper" style={sheet ? { aspectRatio: `${CW} / ${sheet.h}` } : undefined}>
          {sheet ? (
            <>
              <canvas ref={base} width={CW} height={sheet.h} aria-hidden="true" />
              <canvas ref={top} width={CW} height={sheet.h} className="hp-ink" role="img" aria-label={`Bảng viết chữ ${text}`}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            </>
          ) : <p className="dash-muted" role="status">Đang chuẩn bị chữ mẫu…</p>}
        </div>
        <aside className="hp-side">
          <div className="hp-seg" role="radiogroup" aria-label="Cách luyện">
            <button type="button" role="radio" aria-checked={mode === 'to'} className={mode === 'to' ? 'is-on' : ''} onClick={() => setMode('to')}>Tô theo mẫu</button>
            <button type="button" role="radio" aria-checked={mode === 'viet'} className={mode === 'viet' ? 'is-on' : ''} onClick={() => setMode('viet')}>Tự viết</button>
          </div>
          <div className="hp-ink-pick" role="radiogroup" aria-label="Màu mực">
            {INK.map((c) => <button key={c} type="button" role="radio" aria-checked={ink === c} aria-label={`Mực ${c}`} style={{ background: c }} className={ink === c ? 'is-on' : ''} onClick={() => setInk(c)} />)}
          </div>
          <div className="hp-btns">
            <button type="button" className="btn btn-outline btn-sm" disabled={!strokes.length} onClick={() => { setStrokes((l) => l.slice(0, -1)); setResult(null); }}><Undo2 aria-hidden="true" /> Hoàn tác</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!strokes.length} onClick={() => { setStrokes([]); setResult(null); setMsg(null); }}><Eraser aria-hidden="true" /> Viết lại</button>
          </div>
          <button type="button" className="btn btn-primary hp-check" disabled={!strokes.length} onClick={check}><Check aria-hidden="true" /> Chấm điểm</button>

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
