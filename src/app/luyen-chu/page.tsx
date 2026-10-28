import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import HandwritingPractice from '@/components/writing/HandwritingPractice';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Luyện chữ đẹp · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Cls = { class_id: string; class_name: string; grade: number; student_id: string; student_name: string };

// Luyện chữ trên màn hình: ai cũng tập được; học sinh trong lớp lưu bài vào Hành trình nét chữ (migration 0039).
export default async function WritingPage() {
  const viewer = await getViewer();
  let cls: Cls | null = null;
  if (viewer.state === 'ok' && viewer.isStudent && viewer.studentId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('gallery_my_classes');
    if (!error) cls = ((data as Cls[] | null) ?? []).find((c) => c.student_id === viewer.studentId) ?? null;
  }
  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <HandwritingPractice grade={cls?.grade ?? 1} classId={cls?.class_id ?? null} studentId={cls?.student_id ?? null} studentName={cls ? cls.student_name.split(/\s+/).slice(-1)[0] : null} />
      </main>
    </>
  );
}
