import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chessStudentId, gamePayload, GAME_COLS, isMissingTable } from '@/lib/chess/online';
import { decideAbort, decideDraw, decideEmote, decideFlag, decideMove, decideResign, sideOf, type Decision, type GameRow } from '@/lib/chess/online-rules';
import { rateLimit } from '@/lib/rate-limit';

// Một ván cờ vua trực tuyến. GET: trạng thái ván. POST: đi quân / hết giờ / xin thua / xin hòa / hủy / biểu cảm.
// Máy chủ là trọng tài: dựng lại ván từ các nước đã lưu, kiểm tra luật, tự tính đồng hồ theo giờ máy chủ.
// POST trả về gọn (chỉ dòng ván + giờ máy chủ) để nước đi được xác nhận nhanh; tên/điểm người chơi lấy ở GET.
type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

async function load(id: string) {
  const { data, error } = await createAdminClient().from('chess_games').select(GAME_COLS).eq('id', id).maybeSingle();
  return { row: data as GameRow | null, error };
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const who = await chessStudentId();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.error === 'signed_out' ? 401 : 403 });
  if (!UUID.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { row, error } = await load(id);
  if (error) return NextResponse.json({ error: isMissingTable(error.message) ? 'missing' : 'server' }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!sideOf(row, who.studentId)) return NextResponse.json({ error: 'not_player' }, { status: 403 });
  return NextResponse.json(await gamePayload(row));
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const who = await chessStudentId();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.error === 'signed_out' ? 401 : 403 });
  if (!UUID.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!rateLimit(`chess:${who.studentId}`, 240, 60_000)) return NextResponse.json({ error: 'rate' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; uci?: unknown; ply?: unknown; code?: unknown };

  const { row, error } = await load(id);
  if (error) return NextResponse.json({ error: isMissingTable(error.message) ? 'missing' : 'server' }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const side = sideOf(row, who.studentId);
  if (!side) return NextResponse.json({ error: 'not_player' }, { status: 403 });

  const now = Date.now();
  let d: Decision;
  switch (body.action) {
    case 'move': d = decideMove(row, side, typeof body.uci === 'string' ? body.uci : '', typeof body.ply === 'number' ? body.ply : -1, now); break;
    case 'flag': d = decideFlag(row, now); break;
    case 'resign': d = decideResign(row, side, now); break;
    case 'draw_offer': d = decideDraw(row, side, 'offer', now); break;
    case 'draw_accept': d = decideDraw(row, side, 'accept', now); break;
    case 'draw_decline': d = decideDraw(row, side, 'decline', now); break;
    case 'abort': d = decideAbort(row, now); break;
    case 'emote': d = decideEmote(row, side, typeof body.code === 'string' ? body.code : '', now); break;
    default: return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  }
  if (!d.ok) return NextResponse.json({ error: d.error, game: row, now: Date.now() }, { status: 409 });

  // Ghi có điều kiện: chỉ khi ván chưa đổi (cùng ply, cùng updated_at, còn active) — hai yêu cầu đến cùng lúc thì một bên phải tải lại
  const db = createAdminClient();
  const { data: upd, error: e2 } = await db.from('chess_games').update(d.patch).eq('id', id).eq('ply', row.ply).eq('updated_at', row.updated_at).eq('status', 'active').select(GAME_COLS).maybeSingle();
  if (e2) return NextResponse.json({ error: 'server' }, { status: 500 });
  if (!upd) { const again = await load(id); return NextResponse.json({ error: 'conflict', ...(again.row ? { game: again.row } : {}), now: Date.now() }, { status: 409 }); }
  if (d.finished) await db.rpc('chess_apply_rating', { p_game: id });
  return NextResponse.json({ game: upd as GameRow, now: Date.now(), finished: d.finished });
}
