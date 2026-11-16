import 'server-only';

// Danh sách bài học rút gọn cho Xưởng video — chỉ chạy trên máy chủ để không đưa cả kho nội dung xuống trình duyệt.
import { CONTENT } from '@/lib/content';
import type { VsLesson } from '@/components/video-studio/VideoStudio';

let cache: VsLesson[] | null = null;
export function videoLessons(): VsLesson[] {
  if (cache) return cache;
  cache = CONTENT.filter((l) => l.kind !== 'review').map((l) => ({
    id: l.id,
    subject: l.subject,
    grade: l.grade,
    title: l.title,
    unit: l.unit?.title ?? '',
    ref: l.ref ?? '',
    description: (l.description ?? '').slice(0, 400),
    samples: l.questions.slice(0, 4).map((q) => q.prompt.replace(/\s+/g, ' ').trim().slice(0, 160)).filter(Boolean),
  }));
  return cache;
}
