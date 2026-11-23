import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Globe, School, ShieldCheck } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ResourceActions from '@/components/community/ResourceActions';
import ResourcePreview from '@/components/community/ResourcePreview';
import { getViewer } from '@/lib/auth/viewer';
import { schoolName, teacherClasses } from '@/lib/classroom/teacher-home';
import { createClient } from '@/lib/supabase/server';
import { KIND_LABEL, LICENSE_INFO, VISIBILITY_LABEL, type ResourceCard } from '@/lib/community/types';
import { fmtSize } from '@/lib/community/files';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import '@/styles/dash.css';
import '@/styles/cdg.css';

export const metadata: Metadata = { title: 'Tài nguyên · Cộng đồng giáo viên', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Trang chi tiết một tài nguyên trên Cộng đồng: thông tin, giấy phép, xem trước, Sao chép về sửa / Mở file / Lưu / Nhắn tác giả.
export default async function ResourcePage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Cộng đồng giáo viên" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/cong-dong/${rid}`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(rid)) notFound();

  const sb = await createClient();
  const [{ data, error }, classes, school] = await Promise.all([
    sb.rpc('community_get', { p_id: rid }),
    teacherClasses().catch(() => []),
    schoolName(viewer.teacherSchoolId),
  ]);
  if (error || !data) notFound();
  const r = data as ResourceCard & { snapshot: Record<string, unknown> };
  const classId = (classes.find((c) => c.status === 'active') ?? classes[0])?.id ?? null;
  const lic = LICENSE_INFO[r.license];
  const meta = [SUBJECT_NAMES[r.subject as keyof typeof SUBJECT_NAMES], r.grade ? `Lớp ${r.grade}` : '', r.book, r.slides ? `${r.slides} trang` : '', r.file ? fmtSize(r.file.size) : '', r.link?.host]
    .filter(Boolean).join(' · ');

  return (
    <main className="cdg is-detail">
      <Link href="/giao-vien/cong-dong" className="cdg-backlink"><ArrowLeft aria-hidden="true" /> Kho chia sẻ</Link>
      <header className="cdg-detail-head">
        <span className="cdg-kind">{KIND_LABEL[r.kind]}</span>
        <h1>{r.title}</h1>
        {meta && <p className="cdg-meta">{meta}</p>}
        {r.lessonRef && r.lessonRef !== r.title && <p className="cdg-ref">{r.lessonRef}</p>}
        <p className="cdg-by"><b>{r.mine ? 'Thầy cô' : r.author.name}</b>{r.author.school && ` · ${r.author.school}`} · {new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
        <div className="cdg-badges">
          <span className={`cdg-lic is-${r.license}`}><ShieldCheck aria-hidden="true" /> {lic.label}</span>
          <span className="cdg-vis">{r.visibility === 'truong' ? <School aria-hidden="true" /> : <Globe aria-hidden="true" />}{VISIBILITY_LABEL[r.visibility]}</span>
          {r.status !== 'hien' && <span className="cdg-vis">{r.status === 'an' ? 'Đang ẩn' : 'Đã gỡ'}</span>}
        </div>
        <p className="cdg-muted">{lic.desc}{r.kind === 'lien_ket' ? ' Tài liệu nằm ở kho của tác giả, nội dung có thể thay đổi.' : ''}</p>
        {r.summary && <p className="cdg-sum-full">{r.summary}</p>}
      </header>
      <ResourceActions r={r} classId={classId} />
      <section className="cdg-preview" aria-label="Xem trước">
        <ResourcePreview kind={r.kind} snapshot={r.snapshot} school={school} />
      </section>
    </main>
  );
}
