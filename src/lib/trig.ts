// sin/cos làm tròn 6 chữ số: Node (máy chủ) và trình duyệt có thể lệch chữ số cuối của Math.sin/cos,
// làm toạ độ SVG vẽ sẵn trên máy chủ khác trình duyệt → lỗi hydrate. Dùng cho hình vẽ có SSR.
export const sinR = (a: number) => Math.round(Math.sin(a) * 1e6) / 1e6;
export const cosR = (a: number) => Math.round(Math.cos(a) * 1e6) / 1e6;
