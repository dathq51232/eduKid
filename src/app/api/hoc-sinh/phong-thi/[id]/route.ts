import { NextResponse } from 'next/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { createClient } from '@/lib/supabase/server';
import { gradeExam } from '@/lib/classroom/exam-grade';
import { score10, starsOf, type RoomItem } from '@/lib/classroom/rooms';
import { rateLimit } from '@/lib/rate-limit';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';

// Nộp bài phòng thi lớp (migration 0062). Học sinh không ghi thẳng vào bảng (RLS chặn): máy chủ kiểm tra em thuộc lớp,
// phòng đang mở, đã bấm bắt đầu, chưa nộp; chấm theo ĐỀ RIÊNG của em; gắn cờ bất thường để cô xem lại (không tự trừ điểm).
const GRACE_MS = 2 * 60_000; // trễ mạng khi hết giờ máy tự nộp

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Phòng thi không hợp lệ.' }, { status: 400 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok' || !viewer.isStudent || !viewer.studentId) return NextResponse.json({ error: 'Em cần đăng nhập bằng tài khoản học sinh.' }, { status: 401 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình lưu bài.' }, { status: 503 });
  if (!rateLimit(`phongthi:${viewer.studentId}`, 20, 60 * 60_000)) return NextResponse.json({ error: 'Em nộp quá nhiều lần, thử lại sau.' }, { status: 429 });

  const gate = await learningGate(await createClient(), viewer.userId);
  // Bài cô giao / phòng thi lớp: hết học phí vẫn làm được (migration 0075); chỉ chặn em bị tạm khoá vì gói của thầy cô (0045)
  if (gate.is_student && gate.reason === 'plan_locked') return NextResponse.json({ error: 'Tài khoản đang tạm khoá — nhờ thầy cô liên hệ quản trị.' }, { status: 402 });

  const body = (await request.json().catch(() => ({}))) as { answers?: unknown; leaves?: unknown };
  const admin = createAdminClient();
  const sid = viewer.studentId;
  const { data: room, error } = await admin.from('exam_rooms').select('id, class_id, status, opens_at, closes_at, minutes').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Không đọc được phòng thi.' }, { status: 500 });
  if (!room) return NextResponse.json({ error: 'Không tìm thấy phòng thi.' }, { status: 404 });
  const { data: member } = await admin.from('class_memberships').select('student_id').eq('class_id', room.class_id).eq('student_id', sid).eq('status', 'active').maybeSingle();
  if (!member) return NextResponse.json({ error: 'Phòng thi này không phải của lớp em.' }, { status: 403 });
  const { data: paper } = await admin.from('exam_room_papers').select('questions, started_at').eq('room_id', id).eq('student_id', sid).maybeSingle();
  if (!paper) return NextResponse.json({ error: 'Em chưa có đề trong phòng này.' }, { status: 404 });
  if (!paper.started_at) return NextResponse.json({ error: 'Em chưa bấm Bắt đầu.' }, { status: 409 });

  const now = Date.now();
  const started = new Date(paper.started_at).getTime();
  const limitEnd = started + room.minutes * 60_000 + GRACE_MS;
  const closes = new Date(room.closes_at).getTime() + GRACE_MS;
  if (room.status !== 'open') return NextResponse.json({ error: 'Cô đã đóng phòng thi này.' }, { status: 409 });
  // quá giờ làm bài / giờ đóng phòng (đã tính ân hạn trễ mạng) — không nhận nữa
  if (now > Math.min(limitEnd, closes)) return NextResponse.json({ error: 'Đã hết giờ làm bài.' }, { status: 409 });

  const items = paper.questions as RoomItem[];
  const graded = gradeExam(items, body.answers);
  if ('error' in graded) return NextResponse.json({ error: 'Bài làm không hợp lệ.' }, { status: 400 });
  let stars = 0, maxStars = 0;
  const rows = graded.rows.map((r) => {
    const muc = items[r.i]?.muc ?? 1;
    const st = starsOf(muc);
    maxStars += st;
    if (r.ok) stars += st;
    return { ...r, muc, lesson: items[r.i]?.lessonTitle ?? '' };
  });
  // thang 10 theo điểm từng câu cô đặt trong quy tắc sinh đề (phòng cũ: mọi câu 1 điểm → như tính theo số câu đúng)
  const score = score10(graded.score, graded.max);
  const duration = Math.max(0, Math.min(now, started + room.minutes * 60_000) - started);
  const leaves = Number.isSafeInteger(body.leaves) ? Math.max(0, Math.min(999, body.leaves as number)) : 0;
  const flags: string[] = [];
  if (score >= 10 && duration < room.minutes * 60_000 * 0.3) flags.push('fast');
  if (leaves >= 3) flags.push('tab');

  const { error: insErr } = await admin.from('exam_room_results').insert({
    room_id: id, student_id: sid, score, correct: graded.correct, total: graded.total, stars, max_stars: maxStars,
    answers: rows, duration_ms: duration, leaves, flags,
  });
  if (insErr) {
    if (insErr.code === '23505') return NextResponse.json({ error: 'Em đã nộp bài phòng thi này rồi.' }, { status: 409 });
    return NextResponse.json({ error: 'Chưa lưu được bài, thử lại.' }, { status: 500 });
  }
  return NextResponse.json({ score, correct: graded.correct, total: graded.total, stars, maxStars, results: rows.map((r) => ({ i: r.i, ok: r.ok, lesson: r.lesson })) });
}
