'use client';

// "Tải về / In" của trình soạn bài giảng (kiểu Canva): in hoặc lưu PDF bằng hộp in của trình duyệt.
//  • Trang chiếu: mỗi trang một tờ A4 ngang — lưu thành PDF để gửi, chiếu ở máy khác.
//  • Bản phát tay: 3 hoặc 6 trang / tờ A4 dọc (3 trang có dòng kẻ bên cạnh để học sinh ghi chép).
//  • Kèm ghi chú: mỗi tờ một trang + ghi chú của cô (kịch bản dạy) — để cô cầm khi thao giảng.
//  • PowerPoint (.pptx): chữ, hình, ảnh sửa được trong PowerPoint; nền cảnh minh hoạ chụp thành ảnh (src/lib/deck/pptx.ts).
// Các trang được vẽ sẵn ở kích thước cố định (px) ngoài màn hình, rồi chỉ in khung đó (@media print), không chụp ảnh.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileDown, Printer, X } from 'lucide-react';
import type { Deck, ShapeEl } from '@/lib/deck/types';
import { buildPptx } from '@/lib/deck/pptx';
import { rasterize, toPng } from '@/lib/deck/raster';
import SlideView, { ShapeSvg, SlideFrame } from './SlideView';

type Mode = 'slides' | 'handout3' | 'handout6' | 'notes' | 'pptx';
const MODES: { k: Mode; label: string; sub: string }[] = [
  { k: 'slides', label: 'Trang chiếu (PDF)', sub: 'Mỗi trang một tờ A4 ngang — lưu PDF để gửi, chiếu ở máy khác' },
  { k: 'handout3', label: 'Phát tay 3 trang/tờ', sub: 'A4 dọc, dòng kẻ bên cạnh để học sinh ghi chép' },
  { k: 'handout6', label: 'Phát tay 6 trang/tờ', sub: 'A4 dọc, tiết kiệm giấy' },
  { k: 'notes', label: 'Kèm ghi chú của cô', sub: 'Mỗi tờ một trang + ghi chú (kịch bản dạy) để cầm khi thao giảng' },
  { k: 'pptx', label: 'PowerPoint (.pptx)', sub: 'Mở và sửa tiếp trong PowerPoint / Google Trang trình bày, kèm ghi chú' },
];
/** hình khối có sẵn trong PowerPoint (còn lại chụp thành ảnh khi xuất .pptx) */
const NATIVE_SHAPES = new Set(['rect', 'round', 'circle', 'star', 'heart', 'arrow', 'cloud', 'bubble', 'banner']);
// bề ngang khung trang (px, 96 dpi) theo từng kiểu — vừa khổ A4 trừ lề 8 mm
const FRAME_W: Record<Mode, number> = { slides: 1040, handout3: 380, handout6: 340, notes: 690, pptx: 1040 };
const PAGE: Record<Mode, string> = { slides: 'A4 landscape', handout3: 'A4 portrait', handout6: 'A4 portrait', notes: 'A4 portrait', pptx: 'A4 landscape' };
const PER: Record<Mode, number> = { slides: 1, handout3: 3, handout6: 6, notes: 1, pptx: 1 };

export default function DeckPrint({ deck, assetUrl, onClose, beforePrint }: {
  deck: Deck; assetUrl?: (p: string) => string | undefined; onClose: () => void; beforePrint?: () => Promise<void> | void;
}) {
  const [mode, setMode] = useState<Mode>('slides');
  const [busy, setBusy] = useState(false);
  // khung in gắn vào <body> — chỉ sau khi đã chạy trên trình duyệt
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = deck.slides.length;
  const sheets = Math.ceil(n / PER[mode]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  // xuất .pptx: dựng các trang cỡ thật (1600 × 900) ngoài màn hình để chụp nền và hình trang trí
  const [pptx, setPptx] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const pRef = useRef<HTMLDivElement>(null);
  const exportPptx = async () => {
    setErr(''); setBusy(true); setPptx('Đang chuẩn bị…');
    try {
      await beforePrint?.();
      await new Promise((r) => setTimeout(r, 400)); // chờ khung cỡ thật vẽ xong
      const root = pRef.current;
      const q = (sel: string) => root?.querySelector<HTMLElement>(sel) ?? null;
      const bytes = await buildPptx(deck, {
        bg: async (i) => { const node = q(`[data-bg="${i}"] .dk-slide`); const d = node && await rasterize(node, { type: 'image/jpeg', quality: 0.86, skip: (el) => el.classList.contains('dk-el') }); return d ? { data: d, ext: 'jpeg' } : null; },
        shape: async (i, e) => { const node = q(`[data-shape="${i}:${e.id}"]`); const d = node && await rasterize(node, { k: 1.5 }); return d ? { data: d, ext: 'png' } : null; },
        img: async (e) => { const src = e.asset ? assetUrl?.(e.src) : e.src; return src ? toPng(new URL(src, window.location.href).href) : null; },
        onProgress: (d, t) => setPptx(`Đang tạo trang ${d}/${t}…`),
      });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${(deck.title || 'Bài thao giảng').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'Bài thao giảng'}.pptx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setPptx(null); onClose();
    } catch {
      setErr('Chưa tạo được file PowerPoint. Thử lại, hoặc dùng “Trang chiếu (PDF)”.'); setPptx(null);
    } finally { setBusy(false); }
  };

  const print = async () => {
    setBusy(true);
    await beforePrint?.();
    // chờ hình trong các trang tải xong rồi mới mở hộp in
    const imgs = [...document.querySelectorAll<HTMLImageElement>('#dk-print img')];
    await Promise.race([Promise.all(imgs.map((i) => (i.complete ? null : i.decode().catch(() => null)))), new Promise((r) => setTimeout(r, 4000))]);
    await new Promise((r) => setTimeout(r, 150));
    setBusy(false);
    window.print();
  };

  const groups: number[][] = [];
  for (let i = 0; i < n; i += PER[mode]) groups.push(Array.from({ length: Math.min(PER[mode], n - i) }, (_, j) => i + j));
  const w = FRAME_W[mode];
  const frame = (i: number) => (
    <div className="dkp-frame" style={{ width: w, height: (w * 9) / 16 }}>
      <SlideFrame>{(k) => <SlideView slide={deck.slides[i]} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame>
    </div>
  );

  return (
    <>
      <div className="ct-modal-bg" onClick={onClose}>
        <div className="ct-modal dkp" role="dialog" aria-modal="true" aria-label="Tải về hoặc in bài giảng" onClick={(e) => e.stopPropagation()}>
          <div className="ct-modal-head"><h2><FileDown aria-hidden="true" /> Tải về / In bài giảng</h2><button type="button" className="ct-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></div>
          <div className="dkp-modes" role="radiogroup" aria-label="Kiểu in">
            {MODES.map((m) => (
              <button key={m.k} type="button" role="radio" aria-checked={mode === m.k} className={mode === m.k ? 'is-on' : ''} onClick={() => setMode(m.k)}>
                <span className={`dkp-ic is-${m.k}`} aria-hidden="true">{m.k === 'pptx' ? <b>P</b> : Array.from({ length: m.k === 'handout6' ? 6 : m.k === 'handout3' ? 3 : 1 }, (_, i) => <i key={i} />)}</span>
                <b>{m.label}</b><small>{m.sub}</small>
              </button>
            ))}
          </div>
          {mode === 'pptx' ? <p className="dash-muted dkp-tip">{n} trang → <b>file .pptx 16:9</b>. Chữ, hình khối, ảnh mở ra là <b>sửa được</b>; nền cảnh minh hoạ và hình trang trí thành ảnh; câu hỏi thành thẻ đáp án (đáp án đúng ghi ở phần Ghi chú). Hiệu ứng động chưa chuyển sang PowerPoint.</p> : <p className="dash-muted dkp-tip">{n} trang → <b>{sheets} tờ {PAGE[mode].includes('landscape') ? 'A4 ngang' : 'A4 dọc'}</b>. Bấm nút dưới, ở hộp in chọn <b>“Lưu dưới dạng PDF”</b> để tải về, hoặc chọn máy in. Nên bật <b>“Hình nền”</b> (Background graphics) để in đủ màu nền.</p>}
          {err && <p className="dk-msg is-error" role="alert">{err}</p>}
          <div className="ct-modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Huỷ</button>
            {mode === 'pptx'
              ? <button type="button" className="btn btn-primary" disabled={busy || !n} onClick={() => void exportPptx()}><Download aria-hidden="true" /> {pptx ?? 'Tải file .pptx'}</button>
              : <button type="button" className="btn btn-primary" disabled={busy || !n} onClick={() => void print()}><Printer aria-hidden="true" /> {busy ? 'Đang chuẩn bị…' : 'In / Lưu PDF'}</button>}
          </div>
        </div>
      </div>
      {mounted && createPortal(
        <div id="dk-print" className={`is-${mode}`} aria-hidden="true">
          <style>{`@page { size: ${PAGE[mode]}; margin: 8mm; }`}</style>
          {groups.map((g, gi) => (
            <section key={`${mode}-${gi}`} className="dkp-sheet">
              {mode === 'notes' && <header className="dkp-hd"><b>{deck.title}</b><span>Trang {g[0] + 1}/{n}</span></header>}
              {g.map((i) => (
                <div key={i} className="dkp-item">
                  {frame(i)}
                  {mode === 'handout3' && <div className="dkp-lines"><small>Trang {i + 1}</small>{Array.from({ length: 7 }, (_, j) => <i key={j} />)}</div>}
                  {mode === 'handout6' && <small className="dkp-no">{i + 1}</small>}
                  {mode === 'notes' && <div className="dkp-notes"><b>Ghi chú của cô</b><p>{deck.slides[i].notes?.trim() || '……………………………………………………………………………………………………………'}</p></div>}
                </div>
              ))}
              {mode === 'handout3' || mode === 'handout6' ? <footer className="dkp-ft">{deck.title} · tờ {gi + 1}/{groups.length}</footer> : null}
            </section>
          ))}
        </div>,
        document.body,
      )}
      {mounted && pptx !== null && createPortal(
        <div id="dk-pptx" ref={pRef} aria-hidden="true">
          {deck.slides.map((s, i) => (
            <div key={s.id} data-bg={i} className="dkx-slide"><SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame></div>
          ))}
          {deck.slides.flatMap((s, i) => s.els.filter((e): e is ShapeEl => e.kind === 'shape' && !e.hide && !NATIVE_SHAPES.has(e.shape)).map((e) => (
            <div key={`${i}:${e.id}`} data-shape={`${i}:${e.id}`} className="dkx-shape" style={{ width: e.w, height: e.h }}><ShapeSvg e={{ ...e, text: '' }} /></div>
          )))}
        </div>,
        document.body,
      )}
    </>
  );
}
