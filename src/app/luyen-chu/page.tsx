import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import HandwritingPractice from '@/components/writing/HandwritingPractice';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import type { WriteSet } from '@/lib/writing/letters';

export const metadata: Metadata = { title: 'Luyện chữ đẹp · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Cls = { class_id: string; class_name: string; grade: number; student_id: string; student_name: string };

// Luyện chữ trên màn hình: ai cũng tập được; học sinh trong lớp lưu bài vào Hành trình nét chữ (migration 0039).
export default async function WritingPage() {
  const viewer = await getViewer();
  let cls: Cls | null = null;
  const extra: WriteSet[] = [];
  if (viewer.state === 'ok' && viewer.isStudent && viewer.studentId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('gallery_my_classes');
    if (!error) cls = ((data as Cls[] | null) ?? []).find((c) => c.student_id === viewer.studentId) ?? null;
    if (cls) {
      // bài cô giao (migration 0042; chưa chạy migration thì bỏ qua): mỗi dòng thơ / câu là một mục luyện
      const { data: tasks, error: tErr } = await supabase.rpc('writing_task_list', { p_class: cls.class_id });
      const lines = tErr ? [] : ((tasks as { lines: string[] }[] | null) ?? []).flatMap((t) => t.lines);
      const items = [...new Set(lines.map((l) => l.trim()).filter(Boolean))].slice(0, 40);
      if (items.length) extra.push({ id: 'co-giao', label: 'Cô giao', grades: [1, 2, 3, 4, 5], repeat: false, items });
    }
  }
  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <HandwritingPractice grade={cls?.grade ?? 1} classId={cls?.class_id ?? null} studentId={cls?.student_id ?? null} studentName={cls ? cls.student_name.split(/\s+/).slice(-1)[0] : null} extraSets={extra} />
      </main>
    </>
  );
}
