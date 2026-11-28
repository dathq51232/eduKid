// ĐẤU TỔ — hai phần: (1) Đấu tổ TRÊN LỚP (cô trình chiếu, các tổ trả lời bằng bảng con, tổ đúng +1 — TeamQuiz.tsx);
// (2) bảng xếp hạng tổ cho phòng thi online cũ đã tạo kèm danh sách tổ (TeamBoard trong ExamRooms) — cả lớp làm bài trong một phòng thi, kết quả cộng theo TỔ
// (tổ lấy từ Thi đua tổ: class_tool_state tool 'teams'). Không cần bảng mới: danh sách tổ lúc tạo phòng
// được chụp lại trong exam_rooms.matrix.teams, nên cô đổi tổ sau đó cũng không làm lệch kết quả phòng cũ.
//
// Luật (hiện cho cô và các em):
//   điểm tổ = tổng điểm các em trong tổ đã nộp ÷ số thành viên của tổ (em không làm tính 0) — thang 10
//   bằng điểm → tổ nộp nhiều bài hơn xếp trên → vẫn bằng thì tổ làm nhanh hơn (thời gian trung bình) xếp trên
//   phòng đóng → cô bấm cộng điểm Thi đua tổ: hạng 1 +3, hạng 2 +2, hạng 3 +1.

export type TeamSnap = { /** số thứ tự tổ trong Thi đua tổ (1-based) — dùng khi cộng điểm thi đua */ no: number; name: string; emoji: string; members: string[] };
export type TeamRow = { student_id: string; done: boolean; score: number | string | null; duration_ms: number | null };
export type TeamScore = TeamSnap & { size: number; done: number; points: number; avgMs: number | null; rank: number };

export const TEAM_AWARD = [3, 2, 1];
export const TEAM_RULE = 'Điểm tổ = tổng điểm các em đã nộp ÷ số thành viên (em không làm tính 0). Bằng điểm: tổ nộp nhiều bài hơn, rồi tổ làm nhanh hơn xếp trên.';

/** Danh sách tổ chụp trong ma trận phòng (null: không phải phòng Đấu tổ) */
export function teamsOfRoom(matrix: unknown): TeamSnap[] | null {
  const t = (matrix as { teams?: unknown } | null)?.teams;
  if (!Array.isArray(t) || t.length < 2) return null;
  const out = t.flatMap((x, i): TeamSnap[] => {
    const o = x as Partial<TeamSnap> | null;
    if (!o || !Array.isArray(o.members)) return [];
    return [{
      no: typeof o.no === 'number' ? o.no : i + 1,
      name: String(o.name ?? `Tổ ${i + 1}`).slice(0, 30),
      emoji: String(o.emoji ?? '').slice(0, 8),
      members: o.members.filter((m): m is string => typeof m === 'string'),
    }];
  });
  return out.length >= 2 ? out : null;
}

/** Bảng xếp hạng tổ từ kết quả từng em (teacher_room_detail) */
export function teamScores(teams: TeamSnap[], rows: TeamRow[]): TeamScore[] {
  const by = new Map(rows.map((r) => [r.student_id, r]));
  const list = teams.map((t) => {
    const done = t.members.map((m) => by.get(m)).filter((r): r is TeamRow => !!r?.done);
    const sum = done.reduce((a, r) => a + (Number(r.score) || 0), 0);
    const ms = done.map((r) => r.duration_ms).filter((x): x is number => typeof x === 'number');
    const size = t.members.length;
    return {
      ...t, size, done: done.length,
      points: size ? Math.round((sum / size) * 100) / 100 : 0,
      avgMs: ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null,
      rank: 0,
    };
  });
  const cmp = (a: TeamScore, b: TeamScore) => b.points - a.points || b.done - a.done || (a.avgMs ?? Infinity) - (b.avgMs ?? Infinity);
  list.sort(cmp);
  list.forEach((t, i) => { t.rank = i > 0 && cmp(list[i - 1], t) === 0 ? list[i - 1].rank : i + 1; });
  return list;
}

// ---------------------------------------------------------------- Đấu tổ TRÊN LỚP (cô trình chiếu, cả lớp trả lời bằng bảng con — TeamQuiz.tsx)
/** giới hạn thời gian một câu Đấu tổ (giây) — cô tự đặt ở form, chỉnh nhanh ±5 giây khi đang chiếu */
export const QUIZ_SECS = { min: 5, max: 600, def: 30 };
export const liveAwardReason = (day: string, rank: number) => `🏆 Đấu tổ trên lớp ${day} · hạng ${rank}`;

/** Lý do ghi vào điểm thi đua (có mã phòng để biết đã cộng chưa, không cộng hai lần) */
export const awardReason = (code: string, rank: number) => `🏆 Đấu tổ phòng ${code} · hạng ${rank}`;
export const awardedFor = (reasons: (string | null)[], code: string) => reasons.some((r) => !!r && r.includes(`Đấu tổ phòng ${code}`));
