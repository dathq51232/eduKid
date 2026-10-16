'use client';

import { Download } from 'lucide-react';
import { toCsv } from '@/lib/classroom/progress';

// Tải bảng kết quả về máy dưới dạng CSV (mở bằng Excel). Tạo ngay trong trình duyệt, không gửi đi đâu.
export default function CsvButton({ filename, header, rows, label = 'Tải Excel (CSV)' }: { filename: string; header: string[]; rows: (string | number | null)[][]; label?: string }) {
  const download = () => {
    const blob = new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <button type="button" className="btn btn-outline btn-sm no-print" onClick={download} disabled={rows.length === 0}>
      <Download aria-hidden="true" /> {label}
    </button>
  );
}
