import { NextResponse } from 'next/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { TQ_ID, teacherKeysFor, teacherQuestionsFor } from '@/lib/bank/for-class-server';
import { gradeLocal } from '@/lib/grading';
import { rateLimit } from '@/lib/rate-limit';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import type { AnswerValue } from '@/lib/types';

// "Câu của cô" trong bài học (migration 0072): câu thầy cô lưu ở Kho câu hỏi và bật "cho lớp luyện".
// Học sinh không đọc thẳng bảng teacher_questions (RLS chỉ cho chủ sở hữu). Máy chủ kiểm tra em đang học lớp nào,
// trả câu của thầy cô lớp đó KHÔNG kèm đáp án, và chấm từng câu ở POST.
//   GET  ?lessonId=…     -> { questions: Question[] }  (mã câu "tq-<uuid>")
//   POST { id, answer }  -> { correct, explanation }

const LESSON_RE = /^[a-z0-9][a-z0-9-]{0,79}$/i;

async function studentId() {
  const viewer = await getVerifiedViewer();
  return viewer.state === 'ok' && viewer.isStudent && viewer.studentId ? viewer.studentId : null;
}

export async function GET(request: Request) {
  const lessonId = new URL(request.url).searchParams.get('lessonId') ?? '';
  const sid = LESSON_RE.test(lessonId) ? await studentId() : null;
  // Khách / phụ huynh / giáo viên xem thử: không có câu của cô, bài vẫn chạy như cũ
  if (!sid || !hasServiceRole() || !rateLimit(`cauco:${sid}`, 120, 60 * 60_000)) return NextResponse.json({ questions: [] });
  const questions = await teacherQuestionsFor(createAdminClient(), sid, lessonId);
  return NextResponse.json({ questions }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const sid = await studentId();
  if (!sid) return NextResponse.json({ error: 'Em cần đăng nhập bằng tài khoản học sinh.' }, { status: 401 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình.' }, { status: 503 });
  if (!rateLimit(`chamco:${sid}`, 600, 60 * 60_000)) return NextResponse.json({ error: 'Em làm nhanh quá, nghỉ chút rồi thử lại nhé.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { id?: unknown; answer?: unknown };
  const id = typeof body.id === 'string' && TQ_ID.test(body.id) ? body.id : null;
  if (!id) return NextResponse.json({ error: 'Câu không hợp lệ.' }, { status: 400 });
  const answer = body.answer as AnswerValue;
  const okShape = answer === null || typeof answer === 'string' || (Array.isArray(answer) && answer.every((x) => typeof x === 'string'));
  if (!okShape || JSON.stringify(answer ?? '').length > 4000) return NextResponse.json({ error: 'Bài làm không hợp lệ.' }, { status: 400 });

  const k = (await teacherKeysFor(createAdminClient(), sid, [id])).get(id);
  if (!k) return NextResponse.json({ error: 'Câu này không dành cho lớp em.' }, { status: 404 });
  const correct = answer !== null && gradeLocal(k.type, answer, k.key);
  return NextResponse.json({ correct, explanation: k.explanation || undefined });
}
