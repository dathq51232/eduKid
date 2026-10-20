// Ghép nhiều ảnh JPEG thành một file PDF, mỗi ảnh một trang A4 ngang (không dùng thư viện ngoài).
// PDF tối giản theo chuẩn PDF 1.4: Catalog → Pages → Page (+ nội dung vẽ ảnh) + ảnh nén DCT (JPEG giữ nguyên byte).

export type PdfImage = { jpeg: Uint8Array; width: number; height: number };

const A4_LANDSCAPE = { w: 841.89, h: 595.28 };

export function buildImagePdf(pages: PdfImage[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (b: Uint8Array) => { parts.push(b); size += b.length; };
  const text = (s: string) => push(enc.encode(s));
  const startObj = (n: number) => { offsets[n] = size; text(`${n} 0 obj\n`); };

  text('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // dòng đánh dấu file nhị phân
  const n = pages.length;
  // 1: Catalog, 2: Pages, rồi mỗi trang 3 đối tượng: Page, Contents, Image
  const pageObj = (i: number) => 3 + i * 3;
  startObj(1); text('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObj(2); text(`<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>\nendobj\n`);

  const { w: PW, h: PH } = A4_LANDSCAPE;
  pages.forEach((p, i) => {
    const po = pageObj(i);
    // ảnh phủ kín trang, giữ tỉ lệ (căn giữa nếu tỉ lệ khác A4)
    const k = Math.min(PW / p.width, PH / p.height);
    const w = p.width * k, h = p.height * k;
    const x = (PW - w) / 2, y = (PH - h) / 2;
    startObj(po);
    text(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${po + 2} 0 R >> >> /Contents ${po + 1} 0 R >>\nendobj\n`);
    const content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    startObj(po + 1); text(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    startObj(po + 2);
    text(`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
    push(p.jpeg);
    text('\nendstream\nendobj\n');
  });

  const total = 3 + n * 3;
  const xref = size;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  text(`${x}trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let o = 0;
  for (const b of parts) { out.set(b, o); o += b.length; }
  return out;
}

/** Tải một mảng byte về máy */
export function downloadBytes(filename: string, bytes: Uint8Array | Blob, type: string) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
