'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileDown, PencilLine, Printer, Save, X } from 'lucide-react';
import { downloadDocx } from '@/lib/doc-download';
import { htmlToDocx, type DocImage } from '@/lib/docx-write';
import { imageKeys, loadImages, type LoadedImage } from '@/lib/plans/images';

/** CSS chỉ dùng khi xem trên màn hình: giả lập trang A4, vạch ngắt trang */
const SCREEN = `<style id="pv-screen">
@media screen {
  html { background: #e6eaf0; }
  body { background: #fff; max-width: 21cm; margin: 16px auto 40px; padding: 2cm 1.5cm 2cm 3cm; box-sizing: border-box; box-shadow: 0 2px 14px rgba(15,23,42,.18); overflow-wrap: anywhere; }
  .Land { max-width: none; }
  p[style*="page-break-before"] { border-top: 2px dashed #9aa7b8; margin: 28px -1.5cm 18px -3cm !important; height: 0; overflow: hidden; }
  [contenteditable="true"] :focus, body[contenteditable="true"] { outline: none; }
}
img { max-width: 100%; height: auto; }
</style>`;

const withSrc = (html: string, imgs: Map<string, LoadedImage>) => html.replace(/data-img="([^"]+)"/g, (m, k: string) => (imgs.get(k) ? `${m} src="${imgs.get(k)!.url}"` : m));
const stripSrc = (html: string) => html.replace(/\s+src="blob:[^"]*"/g, '');

/**
 * Bản xem trước văn bản trước khi xuất Word: hiện đúng nội dung (cả hình, bảng tô màu của giáo án gốc),
 * cho sửa trực tiếp, in / lưu PDF, tải file .docx.
 */
export default function DocPreview({ title, filename, html, onClose, onSaveOrig, inline, screenCss, fontSize, extra }: {
  title: string; filename: string; html: string; onClose?: () => void;
  /** hiện ngay trong trang thay vì cửa sổ nổi */
  inline?: boolean;
  /** CSS màn hình thay cho trang A4 lề NĐ30 mặc định */
  screenCss?: string;
  /** cỡ chữ mặc định của file Word */
  fontSize?: number;
  /** nút thêm trên thanh công cụ */
  extra?: React.ReactNode;
  /** có = cho lưu phần bản gốc (khối data-orig) đã sửa vào giáo án */
  onSaveOrig?: (html: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [imgs, setImgs] = useState<Map<string, LoadedImage> | null>(null);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const keys = imageKeys(html);

  useEffect(() => {
    let live = true;
    void loadImages(imageKeys(html)).then((m) => { if (live) setImgs(m); });
    return () => { live = false; };
  }, [html]);

  useEffect(() => {
    if (inline || !onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, inline]);

  const screen = screenCss ? `<style id="pv-screen">${screenCss}</style>` : SCREEN;
  const srcDoc = imgs ? withSrc(html, imgs).replace(/<\/head>/i, `${screen}</head>`) : '';

  const toggleEdit = () => {
    const d = frame.current?.contentDocument;
    if (!d?.body) return;
    const on = !editing;
    d.body.contentEditable = on ? 'true' : 'false';
    if (on) { d.body.focus(); d.body.addEventListener('input', () => setEdited(true), { once: true }); }
    setEditing(on);
  };

  /** nội dung hiện tại (kể cả phần đã sửa trên bản xem trước) */
  const currentHtml = useCallback(() => {
    const d = frame.current?.contentDocument;
    if (!d || !edited) return html;
    d.getElementById('pv-screen')?.remove();
    const body = d.body.cloneNode(true) as HTMLElement;
    body.removeAttribute('contenteditable');
    const out = html.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>${stripSrc(body.innerHTML)}</body>`);
    d.head.insertAdjacentHTML('beforeend', screen);
    return out;
  }, [edited, html, screen]);

  const download = () => {
    if (!imgs) return;
    setBusy(true);
    try {
      const map = new Map<string, DocImage>();
      for (const [k, v] of imgs) map.set(k, v);
      downloadDocx(filename, htmlToDocx(currentHtml(), map, { title, fontSize }));
    } finally { setBusy(false); }
  };

  const print = () => frame.current?.contentWindow?.print();

  const saveOrig = () => {
    const d = frame.current?.contentDocument;
    const el = d?.querySelector('[data-orig]');
    if (!el || !onSaveOrig) return;
    onSaveOrig(stripSrc(el.innerHTML));
    setEdited(false);
  };

  const missing = imgs ? keys.filter((k) => !imgs.has(k)).length : 0;

  return (
    <div className={inline ? 'pv-inline' : 'pv-overlay'} role={inline ? 'region' : 'dialog'} aria-modal={inline ? undefined : true} aria-label={`Xem trước: ${title}`}>
      <div className="pv-panel">
        <div className="pv-bar">
          <strong className="pv-title">Xem trước · {title}</strong>
          <span className="pv-note">{!imgs ? 'Đang tải hình…' : missing ? `${missing} hình chưa tải được` : keys.length ? `${keys.length} hình` : ''}{editing ? ' · đang sửa trực tiếp' : ''}</span>
          <span className="planner-spacer" />
          <button type="button" className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-outline'}`} onClick={toggleEdit} disabled={!imgs}><PencilLine aria-hidden="true" /> {editing ? 'Xong sửa' : 'Sửa trực tiếp'}</button>
          {onSaveOrig && edited && html.includes('data-orig') && <button type="button" className="btn btn-outline btn-sm" onClick={saveOrig}><Save aria-hidden="true" /> Lưu sửa vào giáo án</button>}
          <button type="button" className="btn btn-outline btn-sm" onClick={print} disabled={!imgs}><Printer aria-hidden="true" /> In / PDF</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={download} disabled={!imgs || busy}><FileDown aria-hidden="true" /> Tải file Word (.docx)</button>
          {extra}
          {onClose && <button type="button" className="mini-btn" aria-label="Đóng" onClick={onClose}><X aria-hidden="true" /></button>}
        </div>
        {imgs ? <iframe ref={frame} className="pv-frame" title="Bản xem trước" sandbox="allow-same-origin allow-modals" srcDoc={srcDoc} /> : <div className="pv-frame pv-loading">Đang chuẩn bị bản xem trước…</div>}
      </div>
    </div>
  );
}
