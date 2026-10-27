import 'server-only';
// Phần máy chủ của cờ vua trực tuyến: xác định học sinh + trường, đọc/ghi ván bằng service_role.
import { getViewer } from '@/lib/auth/viewer';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import type { GameRow } from './online-rules';

export type ChessMe = { studentId: string; schoolId: string; name: string; className: string };
export type ChessMeResult = { ok: true; me: ChessMe } | { ok: false; error: 'signed_out' | 'not_student' | 'no_class' | 'not_configured' };

export async function chessMe(): Promise<ChessMeResult> {
  const v = await getViewer();
  if (v.state === 'not_configured') return { ok: false, error: 'not_configured' };
  if (v.state !== 'ok') return { ok: false, error: 'signed_out' };
  if (!v.isStudent || !v.studentId) return { ok: false, error: 'not_student' };
  if (!hasServiceRole()) return { ok: false, error: 'not_configured' };
  const db = createAdminClient();
  const [{ data: st }, { data: mem }] = await Promise.all([
    db.from('students').select('display_name').eq('id', v.studentId).maybeSingle(),
    db.from('class_memberships').select('joined_at, classes!inner(name, school_id, status)').eq('student_id', v.studentId).eq('status', 'active').eq('classes.status', 'active').order('joined_at', { ascending: false }).limit(1),
  ]);
  const cls = (mem?.[0] as { classes?: { name: string; school_id: string } | { name: string; school_id: string }[] } | undefined)?.classes;
  const c = Array.isArray(cls) ? cls[0] : cls;
  if (!c) return { ok: false, error: 'no_class' };
  return { ok: true, me: { studentId: v.studentId, schoolId: c.school_id, name: (st as { display_name?: string } | null)?.display_name ?? 'Em', className: c.name } };
}

/** Tên + lớp của các học sinh (chỉ hiện tên trong cùng trường) */
export async function namesFor(ids: string[]): Promise<Record<string, { name: string; cls: string }>> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return {};
  const db = createAdminClient();
  const [{ data: st }, { data: mem }] = await Promise.all([
    db.from('students').select('id, display_name').in('id', uniq),
    db.from('class_memberships').select('student_id, joined_at, classes!inner(name, status)').in('student_id', uniq).eq('status', 'active').eq('classes.status', 'active'),
  ]);
  const out: Record<string, { name: string; cls: string }> = {};
  for (const s of (st ?? []) as { id: string; display_name: string }[]) out[s.id] = { name: s.display_name, cls: '' };
  for (const m of (mem ?? []) as unknown as { student_id: string; classes: { name: string } | { name: string }[] }[]) {
    const c = Array.isArray(m.classes) ? m.classes[0] : m.classes;
    if (out[m.student_id] && c && !out[m.student_id].cls) out[m.student_id].cls = c.name;
  }
  return out;
}

export async function ratingsFor(ids: string[]): Promise<Record<string, number>> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return {};
  const { data } = await createAdminClient().from('chess_ratings').select('student_id, rating').in('student_id', uniq);
  return Object.fromEntries(((data ?? []) as { student_id: string; rating: number }[]).map((r) => [r.student_id, r.rating]));
}

export const GAME_COLS = 'id, school_id, white, black, base, inc, moves, ply, fen, white_ms, black_ms, turn_at, status, result, reason, draw_offer, emote, rated, created_at, updated_at, finished_at';

export const isMissingTable = (msg?: string) => /relation|does not exist|schema cache|Could not find/i.test(msg ?? '');

/** Dữ liệu ván gửi về trình duyệt: kèm tên hai bên, điểm, giờ máy chủ để đồng bộ đồng hồ */
export async function gamePayload(row: GameRow) {
  const [names, ratings] = await Promise.all([namesFor([row.white, row.black]), ratingsFor([row.white, row.black])]);
  return {
    game: row,
    players: {
      w: { id: row.white, name: names[row.white]?.name ?? 'Bạn', cls: names[row.white]?.cls ?? '', rating: ratings[row.white] ?? 1000 },
      b: { id: row.black, name: names[row.black]?.name ?? 'Bạn', cls: names[row.black]?.cls ?? '', rating: ratings[row.black] ?? 1000 },
    },
    now: Date.now(),
  };
}
export type GamePayload = Awaited<ReturnType<typeof gamePayload>>;
