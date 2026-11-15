// Chụp một khối HTML (đang hiển thị, kể cả nằm ngoài màn hình) thành ảnh PNG / JPEG ngay trên trình duyệt,
// không cần thư viện: chép kiểu đã tính của từng phần tử vào thuộc tính style, nhúng hình thành data URL,
// bọc trong <svg><foreignObject> rồi vẽ lên canvas. Dùng cho nền cảnh minh hoạ và hình khối trang trí khi xuất .pptx.

const SKIP = /^(animation|transition|will-change|cursor|pointer-events|user-select|-webkit-user-select|caret|outline)/;
/** thuộc tính chép cho phần tử bên trong SVG (giữ thuộc tính vẽ, không chép transform để khỏi đè thuộc tính transform của SVG) */
const SVG_KEEP = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'display', 'visibility', 'stop-color', 'stop-opacity', 'font-family', 'font-size', 'font-weight'];

const cache = new Map<string, Promise<string | null>>();
export function toDataUrl(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return Promise.resolve(src);
  let p = cache.get(src);
  if (!p) {
    p = fetch(src, { mode: 'cors', credentials: 'omit' })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? new Promise<string | null>((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result as string); fr.onerror = () => ok(null); fr.readAsDataURL(b); }) : null))
      .catch(() => null);
    cache.set(src, p);
  }
  return p;
}

async function inlineUrls(css: string): Promise<string> {
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('#') && !u.startsWith('data:'));
  let out = css;
  for (const u of new Set(urls)) {
    const d = await toDataUrl(new URL(u, location.href).href);
    out = out.split(u).join(d ?? '');
  }
  return out;
}

/** chép cây phần tử; skip(el) = true thì bỏ phần tử đó (vd các vật trên trang khi chỉ cần chụp nền) */
async function cloneStyled(src: Element, skip?: (el: Element) => boolean, inSvg = false): Promise<Element | null> {
  if (skip?.(src)) return null;
  const cs = getComputedStyle(src);
  if (cs.display === 'none') return null;
  const el = src.cloneNode(false) as Element;
  const isSvgChild = inSvg && src.namespaceURI === 'http://www.w3.org/2000/svg';
  let css = '';
  if (isSvgChild) {
    for (const k of SVG_KEEP) { const v = cs.getPropertyValue(k); if (v) css += `${k}:${v};`; }
  } else {
    for (let i = 0; i < cs.length; i++) { const k = cs[i]; if (!SKIP.test(k)) css += `${k}:${cs.getPropertyValue(k)};`; }
    if (/url\(/.test(css)) css = await inlineUrls(css);
  }
  el.setAttribute('style', css);
  el.removeAttribute('class');
  if (src instanceof HTMLImageElement) {
    const d = await toDataUrl(src.currentSrc || src.src);
    if (d) el.setAttribute('src', d); else el.removeAttribute('src');
    el.removeAttribute('srcset'); el.removeAttribute('loading');
  }
  if (src.namespaceURI === 'http://www.w3.org/2000/svg' && src.localName === 'image') {
    const h = src.getAttribute('href') ?? src.getAttribute('xlink:href');
    if (h && !h.startsWith('data:')) { const d = await toDataUrl(new URL(h, location.href).href); if (d) el.setAttribute('href', d); }
  }
  const svg = inSvg || src.localName === 'svg';
  for (const c of src.childNodes) {
    if (c.nodeType === Node.TEXT_NODE) el.appendChild(c.cloneNode());
    else if (c.nodeType === Node.ELEMENT_NODE) { const k = await cloneStyled(c as Element, skip, svg); if (k) el.appendChild(k); }
  }
  return el;
}

/** chụp phần tử thành ảnh (w × h điểm theo kích thước phần tử, nhân k). null nếu trình duyệt không cho (vd Safari chặn canvas) */
export async function rasterize(node: HTMLElement, opt: { k?: number; type?: 'image/png' | 'image/jpeg'; quality?: number; skip?: (el: Element) => boolean } = {}): Promise<Uint8Array | null> {
  const w = node.offsetWidth, h = node.offsetHeight;
  if (!w || !h) return null;
  const k = opt.k ?? 1;
  try {
    const clone = (await cloneStyled(node, opt.skip)) as HTMLElement | null;
    if (!clone) return null;
    // khung gốc: đặt về góc trái trên, không co giãn
    clone.style.position = 'relative'; clone.style.left = '0'; clone.style.top = '0'; clone.style.transform = 'none'; clone.style.margin = '0';
    const xml = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * k}" height="${h * k}" viewBox="0 0 ${w} ${h}"><foreignObject x="0" y="0" width="${w}" height="${h}">${xml}</foreignObject></svg>`;
    const img = new Image();
    img.decoding = 'sync';
    const loaded = new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('svg')); });
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await loaded;
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const g = cv.getContext('2d'); if (!g) return null;
    if (opt.type === 'image/jpeg') { g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height); }
    g.drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, opt.type ?? 'image/png', opt.quality ?? 0.9));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** đổi một ảnh (webp, svg, png…) sang PNG — PowerPoint cũ không đọc webp. Trả về cả kích thước gốc. */
export async function toPng(src: string): Promise<{ data: Uint8Array; w: number; h: number } | null> {
  const d = await toDataUrl(src);
  if (!d) return null;
  try {
    const img = new Image();
    await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('img')); img.src = d; });
    let w = img.naturalWidth || 512, h = img.naturalHeight || 512;
    // ảnh quá lớn: thu về cạnh dài 1400 điểm cho file gọn
    const s = Math.min(1, 1400 / Math.max(w, h)); w = Math.round(w * s); h = Math.round(h * s);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); if (!g) return null;
    g.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, 'image/png'));
    return blob ? { data: new Uint8Array(await blob.arrayBuffer()), w: img.naturalWidth || w, h: img.naturalHeight || h } : null;
  } catch {
    return null;
  }
}
