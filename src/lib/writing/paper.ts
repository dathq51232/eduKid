// Giấy ô li kiểu vở tiểu học: dòng li mảnh cách nhau U px, dòng kẻ đậm mỗi 4 li, đường dọc mỗi ô, lề đỏ bên trái.
export function drawPaper(c: CanvasRenderingContext2D, w: number, h: number, U: number, opt: { margin?: number; offsetY?: number; squareGrid?: boolean; cellCount?: 4 | 5 } = {}) {
  const margin = opt.margin ?? 0;
  const oy = opt.offsetY ?? 0;
  const cellCount = opt.cellCount ?? 4;
  c.save();
  c.fillStyle = '#fffefa';
  c.fillRect(0, 0, w, h);
  const drawLine = (x1: number, y1: number, x2: number, y2: number, bold: boolean) => {
    c.strokeStyle = bold ? 'rgba(124, 58, 237, .62)' : 'rgba(167, 139, 250, .34)';
    c.lineWidth = bold ? 1.6 : 1;
    c.beginPath();
    c.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    c.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    c.stroke();
  };
  if (opt.squareGrid) {
    const step = U;
    const left = margin > 0 ? margin : 0;
    let col = 0;
    for (let x = left; x <= w; x += step, col++) {
      drawLine(x, 0, x, h, col % cellCount === 0);
    }
    let row = 0;
    for (let y = oy % step; y <= h; y += step, row++) {
      drawLine(left, y, w, y, row % cellCount === 0);
    }
  } else {
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
  }
  if (margin > 0) {
    c.strokeStyle = 'rgba(239, 68, 68, .55)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(margin + 0.5, 0); c.lineTo(margin + 0.5, h); c.stroke();
  }
  c.restore();
}
