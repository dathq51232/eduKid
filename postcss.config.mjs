/** @type {import('postcss-load-config').Config} */
// Không dùng Tailwind nữa (phần nền đã viết sẵn ở đầu globals.css) — bỏ bước quét toàn bộ mã nguồn mỗi lần biên dịch CSS.
const config = {
  plugins: {
    autoprefixer: {},
  },
};
export default config;
