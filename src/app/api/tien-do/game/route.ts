import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { checkGameResult } from '@/lib/progress-server/grade';
import { rateLimit } from '@/lib/rate-limit';

// Lưu một lượt chơi game của học sinh đang đăng nhập (kiểm tra giới hạn hợp lý trước khi ghi).
export async function POST(request: Request) {
  const viewer = await getViewer();
  // Khách / người lớn: không lưu gì (không phải lỗi — bài vẫn lưu trên trình duyệt như chế độ khách)
  if (viewer.state !== 'ok') return NextResponse.json({ saved: false, reason: 'guest' });
  if (!viewer.isStudent || !viewer.studentId) return NextResponse.json({ saved: false, reason: 'not_student' });
  if (!hasServiceRole()) return NextResponse.json({ saved: false, reason: 'not_configured' }, { status: 503 });
  if (!rateLimit(`game:${viewer.studentId}`, 120, 60 * 60_000)) return NextResponse.json({ saved: false, reason: 'too_many' }, { status: 429 });

  const gate = await learningGate(await createClient(), viewer.userId);
  if (gate.is_student && !gate.active) return NextResponse.json({ saved: false, reason: 'expired' }, { status: 402 });

  const r = checkGameResult((await request.json().catch(() => ({}))) as Record<string, unknown>);
  if (!r) return NextResponse.json({ saved: false, reason: 'invalid' }, { status: 400 });
  const { error } = await createAdminClient().from('game_results').insert({
    student_id: viewer.studentId, game_id: r.gameId, level: r.level, score: r.score, max_score: r.maxScore, details: r.details,
  });
  if (error) return NextResponse.json({ saved: false, reason: 'db_error' }, { status: 500 });
  return NextResponse.json({ saved: true });
}
