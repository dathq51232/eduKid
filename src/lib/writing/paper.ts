// Giấy ô li kiểu vở tiểu học: dòng li mảnh cách nhau U px, dòng kẻ đậm mỗi 4 li, đường dọc mỗi ô, lề đỏ bên trái.
export function drawPaper(c: CanvasRenderingContext2D, w: number, h: number, U: number, opt: { margin?: number; offsetY?: number } = {}) {
  const margin = opt.margin ?? 0;
  const oy = opt.offsetY ?? 0;
  c.save();
  c.fillStyle = '#fffefa';
  c.fillRect(0, 0, w, h);
  for (let x = margin + U * 4; x < w; x += U * 4) {
    c.strokeStyle = 'rgba(167, 139, 250, .28)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); c.stroke();
  }
  let i = 0;
  for (let y = oy % U; y < h; y += U, i++) {
    const k = Math.round((y - oy) / U);
    const bold = ((k % 4) + 4) % 4 === 0;
    c.strokeStyle = bold ? 'rgba(124, 58, 237, .55)' : 'rgba(167, 139, 250, .38)';
    c.lineWidth = bold ? 1.6 : 1;
    c.beginPath(); c.moveTo(0, Math.round(y) + 0.5); c.lineTo(w, Math.round(y) + 0.5); c.stroke();
  }
  if (margin > 0) {
    c.strokeStyle = 'rgba(239, 68, 68, .55)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(margin + 0.5, 0); c.lineTo(margin + 0.5, h); c.stroke();
  }
  c.restore();
}
