import { NextResponse } from 'next/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { gradeLessonSubmission, type SubmittedAnswer } from '@/lib/progress-server/grade';
import { rateLimit } from '@/lib/rate-limit';

// Lưu kết quả một bài học cho HỌC SINH đang đăng nhập.
// Máy chủ chấm lại toàn bộ; học sinh không ghi thẳng vào bảng (RLS chặn), chỉ máy chủ ghi bằng service_role.
export async function POST(request: Request) {
  const viewer = await getVerifiedViewer();
  // Khách / người lớn: không lưu gì (không phải lỗi — bài vẫn lưu trên trình duyệt như chế độ khách)
  if (viewer.state !== 'ok') return NextResponse.json({ saved: false, reason: 'guest' });
  if (!viewer.isStudent || !viewer.studentId) return NextResponse.json({ saved: false, reason: 'not_student' });
  if (!hasServiceRole()) return NextResponse.json({ saved: false, reason: 'not_configured' }, { status: 503 });
  if (!rateLimit(`tiendo:${viewer.studentId}`, 60, 60 * 60_000)) return NextResponse.json({ saved: false, reason: 'too_many' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { lessonId?: unknown; seed?: unknown; muc?: unknown; answers?: unknown };
  if (typeof body.lessonId !== 'string' || body.lessonId.length > 120) return NextResponse.json({ saved: false, reason: 'invalid' }, { status: 400 });
  const graded = gradeLessonSubmission(body.lessonId, body.answers as SubmittedAnswer[]);
  if ('error' in graded) return NextResponse.json({ saved: false, reason: graded.error }, { status: 400 });

  // Còn hạn học phí + chỉ lưu bài của khối mình (lấy từ database, không tin dữ liệu trình duyệt gửi)
  const gate = await learningGate(await createClient(), viewer.userId);
  if (gate.is_student && !gate.active) return NextResponse.json({ saved: false, reason: 'expired' }, { status: 402 });
  if (gate.grade && graded.grade !== gate.grade) return NextResponse.json({ saved: false, reason: 'wrong_grade' }, { status: 403 });

  const seed = Number.isSafeInteger(body.seed) && (body.seed as number) > 0 ? (body.seed as number) : null;
  const muc = body.muc === 1 || body.muc === 2 || body.muc === 3 ? body.muc : null;
  const { error } = await createAdminClient().from('lesson_results').insert({
    student_id: viewer.studentId,
    lesson_code: graded.lessonCode,
    lesson_title: graded.lessonTitle,
    subject_code: graded.subjectCode,
    grade: graded.grade,
    seed,
    muc,
    score: graded.score,
    total: graded.total,
    points: graded.points,
    duration_ms: graded.durationMs,
    answers: graded.answers,
  });
  if (error) return NextResponse.json({ saved: false, reason: 'db_error' }, { status: 500 });
  return NextResponse.json({ saved: true, score: graded.score, total: graded.total, points: graded.points });
}
