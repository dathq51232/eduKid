// Tải file Word (.doc dạng HTML — Word mở trực tiếp). Tách riêng để trang dùng không phải nạp ngân hàng câu hỏi.
import { asciiFilename } from './filename';

export function downloadDoc(filename: string, html: string) {
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = asciiFilename(filename);
  a.download = name.endsWith('.doc') ? name : `${name}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
