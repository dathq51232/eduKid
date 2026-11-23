'use client';

// Nút mở file của tài liệu trên Kho chia sẻ (quyền kiểm ở kho file — migration 0080; file đã mở được lưu tạm trên máy)
import { useState } from 'react';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fmtSize, openFile, type FileMeta } from '@/lib/community/files';

export default function OpenFileButton({ file }: { file: FileMeta }) {
  const [err, setErr] = useState(false);
  // lần đầu tải qua link ký rồi cất trên máy; lần sau mở thẳng từ máy (không tốn lượt tải của app)
  const open = async () => { if (!(await openFile(createClient(), file))) setErr(true); };
  return (
    <button type="button" className="cdg-file" onClick={open} title={`Mở ${file.name}`}>
      <Download aria-hidden="true" /><span><b>{file.name}</b><small>{err ? 'Không mở được file' : fmtSize(file.size)}</small></span>
    </button>
  );
}
