'use client';

// Nút "Đăng tài liệu" trên Kho chia sẻ: file ≤ 20 MB tải lên kho community-files/tai-lieu/<mã người đăng>/…,
// file lớn hơn thì dán liên kết Drive / OneDrive / YouTube / Canva (file nằm ở kho của thầy cô). Hộp đăng: ShareDialog.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FILE_BUCKET, uploadFile } from '@/lib/community/files';
import { shareError } from '@/lib/community/share';
import ShareDialog, { type ShareResult } from './ShareDialog';

export default function PublishFile({ meId, subjects, grade }: { meId: string; subjects: [string, string][]; grade?: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const publish = async ({ form: f, file, link }: ShareResult, onStep: (t: string) => void) => {
    const sb = createClient();
    const base = { p_title: f.title, p_summary: f.summary, p_subject: f.subject, p_grade: f.grade, p_lesson_ref: f.lessonRef, p_license: f.license, p_visibility: f.visibility };
    if (link) {
      const { error } = await sb.rpc('community_publish_link', { ...base, p_url: link });
      if (error) throw new Error(shareError(error.message));
    } else if (file) {
      onStep('Đang tải file lên…');
      const meta = await uploadFile(sb, `tai-lieu/${meId}`, file).catch((e: Error) => { throw new Error(shareError(e.message)); });
      const { error } = await sb.rpc('community_publish_file', { ...base, p_file: meta });
      if (error) { await sb.storage.from(FILE_BUCKET).remove([meta.path]); throw new Error(shareError(error.message)); }
    }
    setOpen(false);
    router.push('/giao-vien/cong-dong?tab=da_dang');
    router.refresh();
  };
  return (
    <>
      <button type="button" className="cdg-btn" onClick={() => setOpen(true)}><Upload aria-hidden="true" /> Đăng tài liệu</button>
      {open && <ShareDialog kind="tai_lieu" defaults={{ grade: grade ?? null }} subjects={subjects} onClose={() => setOpen(false)} onSubmit={publish} />}
    </>
  );
}
