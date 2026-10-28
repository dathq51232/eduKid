import { NextResponse } from 'next/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { createClient } from '@/lib/supabase/server';
import type { ExamItem } from '@/lib/classroom/assignments';
import { gradeExam } from '@/lib/classroom/exam-grade';
import { rateLimit } from '@/lib/rate-limit';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';

// Nộp đề được giao làm trên app (migration 0017). Học sinh không ghi thẳng vào bảng (RLS chặn):
// máy chủ kiểm tra em có được giao đề không, đề còn mở không, chưa nộp lần nào, rồi chấm theo đáp án lưu trong đề.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Đề không hợp lệ.' }, { status: 400 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok' || !viewer.isStudent || !viewer.studentId) return NextResponse.json({ error: 'Em cần đăng nhập bằng tài khoản học sinh.' }, { status: 401 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình lưu bài.' }, { status: 503 });
  if (!rateLimit(`nopde:${viewer.studentId}`, 20, 60 * 60_000)) return NextResponse.json({ error: 'Em nộp quá nhiều lần, thử lại sau.' }, { status: 429 });

  const gate = await learningGate(await createClient(), viewer.userId);
  if (gate.is_student && !gate.active) return NextResponse.json({ error: 'Đã hết hạn học phí — nhờ bố mẹ đóng học phí để tiếp tục.' }, { status: 402 });

  const body = (await request.json().catch(() => ({}))) as { answers?: unknown; durationMs?: unknown };
  const admin = createAdminClient();
  const { data: a, error } = await admin.from('class_assignments').select('id, kind, status, questions').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Không đọc được đề.' }, { status: 500 });
  if (!a || a.kind !== 'exam') return NextResponse.json({ error: 'Không tìm thấy đề.' }, { status: 404 });
  const { data: allowed } = await admin.rpc('assignment_targets', { p_assignment: id, p_student: viewer.studentId });
  if (allowed !== true) return NextResponse.json({ error: 'Đề này không giao cho em.' }, { status: 403 });
  if (a.status !== 'open') return NextResponse.json({ error: 'Thầy cô đã đóng đề này.' }, { status: 409 });

  const graded = gradeExam(a.questions as ExamItem[], body.answers);
  if ('error' in graded) return NextResponse.json({ error: 'Bài làm không hợp lệ.' }, { status: 400 });
  const duration = Number.isSafeInteger(body.durationMs) && (body.durationMs as number) >= 0 ? Math.min(body.durationMs as number, 4 * 3600_000) : null;
  const { error: insErr } = await admin.from('assignment_submissions').insert({
    assignment_id: id, student_id: viewer.studentId, score: graded.score, max_score: graded.max,
    correct: graded.correct, total: graded.total, answers: graded.rows, duration_ms: duration,
  });
  if (insErr) {
    if (insErr.code === '23505') return NextResponse.json({ error: 'Em đã nộp đề này rồi.' }, { status: 409 });
    return NextResponse.json({ error: 'Chưa lưu được bài, thử lại.' }, { status: 500 });
  }
  return NextResponse.json({ score: graded.score, max: graded.max, correct: graded.correct, total: graded.total, results: graded.rows.map((r) => ({ i: r.i, ok: r.ok })) });
}
