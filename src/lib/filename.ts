/** Tên file không dấu (một số trình duyệt bỏ tên file có dấu tiếng Việt và lưu thành "download") */
export const asciiFilename = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-');
