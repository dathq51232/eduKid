'use client';

// Bài tập theo tổ: bật "Tính vào thi đua tổ" cho một bài đã giao → app tính số em mỗi tổ đã làm (đúng hạn), điểm trung bình,
// đề xuất điểm thi đua theo quy tắc của cô; cô bấm "Cộng điểm" thì ghi vào Thi đua tổ (lý do có tiền tố 📝 = nguồn bài tập).
// Không cần bảng mới: quy tắc lưu cùng danh sách tổ (tool 'teams'), điểm lưu ở class_team_points như các điểm khác.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_HW_RULE, SOURCE, TEAM_COLORS, hwTeamResults, normalizeTeams, vnDay,
  type HwRule, type Point, type TeamsState, type ToolStudent,
} from '@/lib/classroom/class-tools';
import type { AssignmentRow, DetailRow } from '@/lib/classroom/assignments';

const tag = (id: string) => `#${id.slice(0, 6)}`;

export default function TeamHw({ classId, a, rows, students }: { classId: string; a: AssignmentRow; rows: DetailRow[]; students: ToolStudent[] }) {
  const sb = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [teams, setTeams] = useState<TeamsState | null>(null);
  const [missing, setMissing] = useState(false);
  const [given, setGiven] = useState<Point[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const loadGiven = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.rpc('teacher_team_points', { p_class: classId, p_from: vnDay(a.created_at), p_to: vnDay() });
    setGiven(((data ?? []) as Point[]).filter((p) => p.reason?.includes(tag(a.id))));
  }, [sb, classId, a.id, a.created_at]);
  useEffect(() => {
    if (!sb) return;
    void sb.rpc('teacher_tool_get', { p_class: classId, p_tool: 'teams' }).then(({ data, error }) => {
      if (error) { setMissing(true); return; }
      setTeams(normalizeTeams(data as Partial<TeamsState> | null, students));
    });
    void loadGiven();
  }, [sb, classId, students, loadGiven]);

  const save = async (next: TeamsState) => {
    setTeams(next);
    if (sb) { const { error } = await sb.rpc('teacher_tool_save', { p_class: classId, p_tool: 'teams', p_data: next }); if (error) setMsg('Chưa lưu được cài đặt.'); }
  };
  if (missing) return null;
  if (!teams) return null;
  const rule = teams.hw?.[a.id];
  const hasMembers = teams.teams.some((t) => t.members.length);
  const toggle = (on: boolean) => {
    const hw = { ...(teams.hw ?? {}) };
    if (on) hw[a.id] = DEFAULT_HW_RULE; else delete hw[a.id];
    void save({ ...teams, hw });
  };
  const setRule = (p: Partial<HwRule>) => rule && void save({ ...teams, hw: { ...(teams.hw ?? {}), [a.id]: { ...rule, ...p } } });
  const res = rule ? hwTeamResults(rows, teams.teams, rule, a.due_at, a.kind) : [];
  const overdue = Date.now() > Date.parse(a.due_at);
  const award = async () => {
    if (!sb || !rule) return;
    setBusy(true); setMsg('');
    for (const r of res.filter((x) => x.pts > 0)) {
      const reason = `${SOURCE.bt.prefix}“${a.title.slice(0, 34)}” ${tag(a.id)}: ${r.why.join(', ')}`.slice(0, 80);
      const { error } = await sb.rpc('teacher_team_point', { p_class: classId, p_team: r.team + 1, p_delta: Math.min(10, r.pts), p_reason: reason });
      if (error) { setMsg('Chưa cộng được điểm (kiểm tra mạng rồi thử lại).'); break; }
    }
    await loadGiven(); setBusy(false);
  };
  const totalPts = res.reduce((s, r) => s + r.pts, 0);

  return (
    <section className="thw">
      <label className="thw-sw"><input type="checkbox" checked={!!rule} onChange={(e) => toggle(e.target.checked)} /> <Trophy aria-hidden="true" /> <b>Tính vào thi đua tổ</b>
        <small>— cộng điểm cho tổ theo kết quả bài này</small></label>
      {rule && <>
        {!hasMembers && <p className="adm-alert is-warn">Các tổ chưa có thành viên. Xếp em vào tổ ở <Link href={`/giao-vien/lop/${classId}/thi-dua`}>Thi đua tổ → Sửa tổ</Link> (hoặc lấy theo dãy bàn).</p>}
        <div className="thw-rules">
          <label>✅ Tổ làm đủ, đúng hạn: <input type="number" min={0} max={5} value={rule.full} onChange={(e) => setRule({ full: Number(e.target.value) })} /> điểm</label>
          <label>⭐ Điểm TB tổ ≥ <input type="number" min={5} max={10} value={rule.avgMin} onChange={(e) => setRule({ avgMin: Number(e.target.value) })} />: <input type="number" min={0} max={5} value={rule.avg} onChange={(e) => setRule({ avg: Number(e.target.value) })} /> điểm</label>
          <label>🏅 Tổ có TB cao nhất: <input type="number" min={0} max={5} value={rule.best} onChange={(e) => setRule({ best: Number(e.target.value) })} /> điểm</label>
        </div>
        <div className="thw-bars">
          {res.map((r) => {
            const t = teams.teams[r.team]; const c = TEAM_COLORS[r.team % TEAM_COLORS.length];
            const got = given.filter((g) => g.team === r.team + 1).reduce((s, g) => s + g.delta, 0);
            return (
              <div key={r.team} className="thw-row">
                <b>{t.emoji} {t.name}</b>
                <span className="thw-bar"><i style={{ width: `${r.members ? (r.done / r.members) * 100 : 0}%`, background: c }} /></span>
                <span>{r.done}/{r.members} em{r.onTime < r.done ? ` (${r.done - r.onTime} muộn)` : ''}{r.avg !== null ? ` · TB ${String(r.avg).replace('.', ',')}` : ''}</span>
                <span className={r.pts ? 'thw-pts' : 'thw-zero'}>{got ? `Đã cộng +${got}` : r.pts ? `+${r.pts}` : '—'}</span>
              </div>
            );
          })}
        </div>
        <div className="thw-foot">
          {given.length ? <span className="tag-ok">Đã cộng vào Thi đua tổ</span>
            : <button type="button" className="btn btn-primary btn-sm" disabled={busy || !totalPts || !hasMembers} onClick={() => void award()}>{busy ? 'Đang cộng…' : `Cộng ${totalPts} điểm cho các tổ`}</button>}
          <small className="dash-muted">{overdue ? 'Đã hết hạn nộp.' : 'Chưa hết hạn: nên chờ hết hạn rồi mới cộng.'} Điểm ghi ở <Link href={`/giao-vien/lop/${classId}/thi-dua`}>Thi đua tổ</Link> với nguồn 📝 Bài tập.</small>
          {msg && <span className="adm-alert is-error">{msg}</span>}
        </div>
      </>}
    </section>
  );
}
