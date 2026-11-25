'use client';

// Cầu nối "Sửa trên trang": các mục in của lớp (phiếu bài tập, phiếu chính tả, đề, giáo án, phiếu báo tiến bộ, họp phụ huynh…)
// gửi bản in (HTML) sang trình soạn ở Văn bản & in ấn › Mở file & in để thầy cô sửa trực tiếp như Word rồi In / PDF, tải Word.
// Chỉ giữ trong bộ nhớ trình duyệt (và sessionStorage để lỡ tải lại trang) — không gửi đi đâu.
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DocImage } from '@/lib/docx-write';

export type Handoff = {
  /** tên hiện trên thanh trình soạn */
  name: string;
  /** tên file khi tải Word (không có đuôi) */
  file: string;
  /** nội dung trang (phần trong <body>, kiểu chữ đã ghi thẳng vào từng thẻ) */
  html: string;
  /** hình dùng data-img="khoá" trong html (giữ khi xuất Word) */
  images?: Map<string, DocImage>;
  landscape?: boolean;
  fontSize?: number;
};

const KEY = 'van-ban:sua-tren-trang';
let pending: Handoff | null = null;

/** Đường dẫn trình soạn của lớp */
export const editorHref = (classId: string) => `/giao-vien/lop/${classId}/van-ban?mo=sua`;

/** Gửi bản in sang trình soạn (gọi trước khi chuyển trang) */
export function sendToEditor(h: Handoff) {
  pending = h;
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...h, images: undefined })); } catch { /* đầy bộ nhớ: vẫn còn bản trong bộ nhớ */ }
}

/** Trình soạn lấy bản in đang chờ (lấy một lần) */
export function takeFromEditor(): Handoff | null {
  let h = pending;
  pending = null;
  try {
    if (!h) { const v = sessionStorage.getItem(KEY); if (v) h = JSON.parse(v) as Handoff; }
    sessionStorage.removeItem(KEY);
  } catch { /* bỏ qua */ }
  return h;
}

/**
 * Văn bản HTML đầy đủ (có <style> trong <head>, kiểu Word) → phần thân với kiểu chữ ghi thẳng vào từng thẻ,
 * để đặt vào trình soạn mà không làm lệch kiểu của cả trang web. Bỏ qua @page, @media (chỉ dành cho bản in / màn hình).
 */
export function inlineStyles(full: string): string {
  const doc = new DOMParser().parseFromString(full, 'text/html');
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  doc.querySelectorAll('style, script, meta, title, link').forEach((n) => n.remove());
  const wrap = doc.createElement('div');
  while (doc.body.firstChild) wrap.appendChild(doc.body.firstChild);
  const bodyStyle = doc.body.getAttribute('style') ?? '';
  doc.body.appendChild(wrap);
  // ghi thêm khai báo vào trước kiểu sẵn có của thẻ (kiểu ghi thẳng trong thẻ vẫn thắng, như CSS thật)
  const extra = new Map<Element, string[]>();
  const add = (el: Element, decl: string) => { const l = extra.get(el) ?? []; l.push(decl); extra.set(el, l); };
  let sheet: CSSStyleSheet | null = null;
  try { sheet = new CSSStyleSheet(); sheet.replaceSync(css); } catch { sheet = null; }
  for (const rule of sheet ? [...sheet.cssRules] : []) {
    if (!(rule instanceof CSSStyleRule)) continue;
    const decl = rule.style.cssText;
    if (!decl) continue;
    for (const sel of rule.selectorText.split(',').map((s) => s.trim())) {
      if (/^(html|body)$/i.test(sel)) { add(wrap, decl); continue; }
      const s = sel.replace(/^(html|body)\s+/i, '');
      try { wrap.querySelectorAll(s).forEach((el) => add(el, decl)); } catch { /* bộ chọn trình duyệt không hiểu */ }
    }
  }
  if (bodyStyle) add(wrap, bodyStyle);
  for (const [el, list] of extra) {
    const own = el === wrap ? '' : (el.getAttribute('style') ?? '');
    // trình duyệt viết lại "page-break-before: always" thành "break-before: page" — trả về dạng cũ để xuất Word còn ngắt trang
    el.setAttribute('style', [...list, own].filter(Boolean).join(';').replace(/;;+/g, ';')
      .replace(/(^|;)\s*break-(before|after):\s*page/g, '$1page-break-$2: always'));
  }
  return wrap.outerHTML;
}

/** Nút "Sửa trên trang" ở các mục của lớp: gửi bản in rồi chuyển sang trình soạn. null = trang không thuộc lớp nào */
export function useEditOnPage(): ((h: Handoff) => void) | null {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = typeof params?.id === 'string' ? params.id : null;
  return useMemo(() => (id ? (h: Handoff) => { sendToEditor(h); router.push(editorHref(id)); } : null), [id, router]);
}
