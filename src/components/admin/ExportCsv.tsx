'use client';

import { Download } from 'lucide-react';

/** Xuất bảng số liệu ra CSV (có BOM để Excel đọc đúng tiếng Việt) */
export default function ExportCsv({ name, rows }: { name: string; rows: (string | number)[][] }) {
  const download = () => {
    const esc = (v: string | number) => { const s = String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" className="adm-btn" onClick={download}><Download size={18} aria-hidden="true" /> Xuất Excel (CSV)</button>;
}
