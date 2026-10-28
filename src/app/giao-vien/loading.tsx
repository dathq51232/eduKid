// Hiện ngay khi bấm chuyển trang (trong lúc máy chủ chuẩn bị trang mới) để không có cảm giác "đứng hình".
export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-dot" aria-hidden="true" />
      <span className="page-loading-dot" aria-hidden="true" />
      <span className="page-loading-dot" aria-hidden="true" />
      <span className="sr-only">Đang tải trang…</span>
    </div>
  );
}
