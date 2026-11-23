'use client';

// Nút mở / tải file của tài liệu trên Kho chia sẻ (link ký 10 phút; quyền kiểm ở kho file — migration 0080)
import { useState } from 'react';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fileUrl, fmtSize, type FileMeta } from '@/lib/community/files';

export default function OpenFileButton({ file }: { file: FileMeta }) {
  const [err, setErr] = useState(false);
  const open = async () => {
    const u = await fileUrl(createClient(), file.path);
    if (u) window.open(u, '_blank', 'noopener'); else setErr(true);
  };
  return (
    <button type="button" className="cdg-file" onClick={open} title={`Mở ${file.name}`}>
      <Download aria-hidden="true" /><span><b>{file.name}</b><small>{err ? 'Không mở được file' : fmtSize(file.size)}</small></span>
    </button>
  );
}
