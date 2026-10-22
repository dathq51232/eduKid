'use client';

// Thi đua tổ: bấm +1 / −1 cho từng tổ kèm lý do, tự cộng dồn theo tuần (sang tuần mới tự về 0), xem lại / hoàn tác,
// bảng điểm cả tuần (tải Excel), tổng kết tuần cho giờ sinh hoạt lớp, chiếu lên bảng.
// Lưu trên database (migration 0028): danh sách tổ = teacher_tool_*('teams'), điểm = teacher_team_*.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, Maximize, Settings2, Trophy, Undo2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx, range, XS, type XSheet } from '@/lib/xlsx';
import { playPop } from '@/components/classroom/ClassTimer';
import {
  DOW_LABEL, MINUS_REASONS, REASONS, TEAM_COLORS, TEAM_EMOJI, ddmm, defaultTeams, dowOf, normalizeSeating, normalizeTeams, ranking, shortName,
  teamTotals, teamsFromSeating, vnDay, weekOf, type Point, type TeamsState, type ToolStudent,
} from '@/lib/classroom/class-tools';

type Props = { classId: string; className: string; students: ToolStudent[] };
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
const timeOf = (at: string) => new Date(at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

export default function TeamContest({ classId, className, students }: Props) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const today = vnDay();
  const [weekStart, setWeekStart] = useState(() => weekOf(today).from);
  const week = weekOf(weekStart);
  const isNow = week.from === weekOf(today).from;
  const [teams, setTeams] = useState<TeamsState>(() => defaultTeams());
  const [points, setPoints] = useState<Point[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState('');
  const [plus, setPlus] = useState(REASONS[0].label);
  const [minus, setMinus] = useState(MINUS_REASONS[0].label);
  const [other, setOther] = useState('');
  const [edit, setEdit] = useState(false);
  const [summary, setSummary] = useState(false);
  const [pops, setPops] = useState<{ key: number; team: number; up: boolean }[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const nameOf = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.name])), [students]);

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    void supabase.rpc('teacher_tool_get', { p_class: classId, p_tool: 'teams' }).then(({ data, error }) => {
      if (error) { setMissing(true); setLoaded(true); return; }
      setTeams(normalizeTeams(data as Partial<TeamsState> | null, students));
      setLoaded(true);
    });
  }, [supabase, classId, students]);
  const loadPoints = useCallback(() => {
    if (!supabase) return;
    void supabase.rpc('teacher_team_points', { p_class: classId, p_from: week.from, p_to: week.to }).then(({ data, error }) => {
      if (!error) setPoints((data ?? []) as Point[]);
    });
  }, [supabase, classId, week.from, week.to]);
  useEffect(() => { loadPoints(); }, [loadPoints]);

  const n = teams.teams.length;
  const { total, byDay } = teamTotals(points, n);
  const rank = ranking(total);
  const leaderScore = Math.max(...total);
  // cờ: số ngày tổ đứng nhất trong ngày (có điểm dương)
  const flags = teams.teams.map((_, i) => week.days.filter((d) => { const row = byDay[d]; return row && row[i] > 0 && row[i] === Math.max(...row); }).length);
  const todayLog = points.filter((p) => vnDay(p.at) === today).slice().reverse();

  const score = async (team: number, up: boolean) => {
    if (!isNow) return;
    const reason = (other.trim() || (up ? plus : minus)).slice(0, 80);
    playPop(up);
    const key = Date.now() + Math.random();
    setPops((p) => [...p, { key, team, up }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.key !== key)), 900);
    const temp: Point = { id: -key, team: team + 1, delta: up ? 1 : -1, reason, at: new Date().toISOString() };
    setPoints((p) => [...p, temp]);
    if (!supabase || missing) return;
    const { data, error } = await supabase.rpc('teacher_team_point', { p_class: classId, p_team: team + 1, p_delta: up ? 1 : -1, p_reason: reason });
    if (error) { setErr('Chưa lưu được điểm. Kiểm tra mạng rồi thử lại.'); setPoints((p) => p.filter((x) => x.id !== temp.id)); return; }
    setPoints((p) => p.map((x) => (x.id === temp.id ? (data as Point) : x)));
  };
  const undo = async (id: number) => {
    setPoints((p) => p.filter((x) => x.id !== id));
    if (supabase && id > 0) {
      const { error } = await supabase.rpc('teacher_team_undo', { p_class: classId, p_id: id });
      if (error) { setErr('Chưa hoàn tác được.'); loadPoints(); }
    }
  };
  const saveTeams = async (next: TeamsState) => {
    setTeams(next); setEdit(false);
    if (supabase && !missing) {
      const { error } = await supabase.rpc('teacher_tool_save', { p_class: classId, p_tool: 'teams', p_data: next });
      if (error) setErr('Chưa lưu được danh sách tổ.');
    }
  };
  const fromSeating = async (): Promise<TeamsState | null> => {
    if (!supabase) return null;
    const { data } = await supabase.rpc('teacher_tool_get', { p_class: classId, p_tool: 'seating' });
    if (!data) return null;
    return teamsFromSeating(normalizeSeating(data as never, students), teams);
  };

  const exportXlsx = () => {
    const head = ['Tổ', ...week.days.map((d) => `${dowOf(d)} ${ddmm(d)}`), 'Tổng', 'Hạng'];
    const sheet: XSheet = {
      name: 'Thi đua tổ',
      cols: [16, ...week.days.map(() => 10), 8, 7],
      rows: [
        [{ v: `THI ĐUA TỔ — LỚP ${className.toUpperCase()} — TUẦN ${ddmm(week.from)} – ${ddmm(week.to)}`, s: XS.title }],
        [],
        head.map((v) => ({ v, s: XS.header })),
        ...teams.teams.map((t, i) => [
          { v: `${t.name}`, s: XS.text }, ...week.days.map((d) => ({ v: byDay[d]?.[i] ?? '', s: XS.center })),
          { v: total[i], s: XS.center }, { v: rank.find((r) => r.team === i)?.rank ?? '', s: XS.center },
        ]),
      ],
      merges: [range(0, 0, 0, head.length - 1)],
    };
    const log: XSheet = {
      name: 'Chi tiết',
      cols: [12, 8, 16, 8, 28],
      rows: [
        ['Ngày', 'Giờ', 'Tổ', 'Điểm', 'Lý do'].map((v) => ({ v, s: XS.header })),
        ...points.map((p) => [{ v: ddmm(vnDay(p.at)), s: XS.center }, { v: timeOf(p.at), s: XS.center }, { v: teams.teams[p.team - 1]?.name ?? `Tổ ${p.team}`, s: XS.text }, { v: p.delta, s: XS.center }, { v: p.reason ?? '', s: XS.text }]),
      ],
    };
    downloadXlsx(`thi-dua-lop-${className}-tuan-${week.from}.xlsx`, [sheet, log]);
  };

  if (!loaded) return <p className="dash-muted">Đang tải…</p>;
  return (
    <div className="ct td">
      <div className="ct-head">
        <div>
          <p className="ct-sub">
            <button type="button" className="ct-week" onClick={() => setWeekStart(addDays(week.from, -7))} aria-label="Tuần trước"><ChevronLeft aria-hidden="true" /></button>
            Tuần {ddmm(week.from)} – {ddmm(week.to)}{isNow ? ' · tuần này, tự cộng dồn; sang tuần mới tự về 0' : ' · tuần đã qua (chỉ xem)'}
            {!isNow && <button type="button" className="ct-week" onClick={() => setWeekStart(addDays(week.from, 7))} aria-label="Tuần sau"><ChevronRight aria-hidden="true" /></button>}
          </p>
          <h1>Thi đua tổ</h1>
        </div>
        <div className="ct-actions">
          <button type="button" className="btn btn-outline" onClick={() => setEdit(true)}><Settings2 aria-hidden="true" /> Sửa tổ</button>
          <button type="button" className="btn btn-outline" onClick={() => setSummary(true)}><Trophy aria-hidden="true" /> Tổng kết tuần</button>
          <button type="button" className="btn btn-primary" onClick={() => void board.current?.requestFullscreen?.().catch(() => undefined)}><Maximize aria-hidden="true" /> Chiếu lên bảng</button>
        </div>
      </div>
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0028_class_tools.sql</code> trên Supabase: điểm chỉ hiện tạm, chưa lưu lại được.</p>}
      {err && <p className="adm-alert is-error" role="alert">{err} <button type="button" className="ct-x" onClick={() => setErr('')} aria-label="Đóng"><X aria-hidden="true" /></button></p>}

      {isNow && (
        <div className="td-reasons">
          <span className="td-rl">Cộng điểm vì:</span>
          {REASONS.map((r) => <button key={r.label} type="button" className={!other && plus === r.label ? 'is-on' : ''} onClick={() => { setPlus(r.label); setOther(''); }}>{r.icon} {r.label}</button>)}
          <span className="td-rl">Trừ vì:</span>
          {MINUS_REASONS.map((r) => <button key={r.label} type="button" className={`is-minus${!other && minus === r.label ? ' is-on' : ''}`} onClick={() => { setMinus(r.label); setOther(''); }}>{r.icon} {r.label}</button>)}
          <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="✏️ Lý do khác…" maxLength={80} aria-label="Lý do khác" />
        </div>
      )}

      <div ref={board} className="td-board">
        <p className="ct-proj-title">Thi đua tổ · Lớp {className}</p>
        <div className="td-teams" style={{ gridTemplateColumns: `repeat(${Math.min(n, 4)}, minmax(0, 1fr))` }}>
          {teams.teams.map((t, i) => {
            const c = TEAM_COLORS[i % TEAM_COLORS.length];
            const top = total[i] === leaderScore && leaderScore > 0;
            return (
              <section key={i} className={`td-team${top ? ' is-top' : ''}`} style={{ '--c': c } as React.CSSProperties}>
                {top && <span className="td-crown" aria-label="Đang dẫn đầu">👑</span>}
                <h2><span aria-hidden="true">{t.emoji}</span> {t.name}</h2>
                <p className="td-score"><b>{total[i]}</b> điểm</p>
                <p className="td-flags" aria-label={`${flags[i]} ngày đứng nhất`}>{'🚩'.repeat(flags[i]) || <span>&nbsp;</span>}</p>
                {isNow && (
                  <div className="td-bt">
                    <button type="button" onClick={() => void score(i, false)} aria-label={`Trừ 1 điểm ${t.name}`}>−1</button>
                    <button type="button" className="is-plus" onClick={() => void score(i, true)} aria-label={`Cộng 1 điểm ${t.name}`}>+1</button>
                  </div>
                )}
                <p className="td-mem">{t.members.length ? `${t.members.length} em` : 'Chưa xếp em'}{t.leader ? ` · tổ trưởng: ${shortName(nameOf[t.leader] ?? '')}` : ''}</p>
                {pops.filter((p) => p.team === i).map((p) => <span key={p.key} className={`td-pop${p.up ? '' : ' is-minus'}`} aria-hidden="true">{p.up ? '+1' : '−1'}</span>)}
              </section>
            );
          })}
        </div>
      </div>

      <div className="td-low">
        <section className="card">
          <h2 className="td-h">📅 Điểm cả tuần <button type="button" className="ct-link" onClick={exportXlsx}><Download aria-hidden="true" /> Tải Excel</button></h2>
          <div className="td-scroll">
            <table className="td-week">
              <thead><tr><th>Tổ</th>{week.days.map((d) => <th key={d} className={d === today ? 'is-today' : ''}>{DOW_LABEL[new Date(`${d}T00:00:00Z`).getUTCDay()]}<small>{ddmm(d)}</small></th>)}<th>Tổng</th></tr></thead>
              <tbody>{teams.teams.map((t, i) => (
                <tr key={i}><td>{t.emoji} {t.name}</td>{week.days.map((d) => <td key={d} className={d === today ? 'is-today' : ''}>{byDay[d]?.[i] ?? '—'}</td>)}<td className="td-tot">{total[i]}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        <section className="card td-log">
          <h2 className="td-h">🕘 {isNow ? 'Hôm nay' : 'Cả tuần'} {isNow && todayLog[0] && <button type="button" className="ct-link" onClick={() => void undo(todayLog[0].id)}><Undo2 aria-hidden="true" /> Hoàn tác lần cuối</button>}</h2>
          {(isNow ? todayLog : points.slice().reverse()).slice(0, 40).map((p) => (
            <p key={p.id}>
              <span>{isNow ? timeOf(p.at) : `${dowOf(vnDay(p.at))} ${timeOf(p.at)}`}</span>
              <b className={p.delta > 0 ? 'is-plus' : 'is-minus'}>{p.delta > 0 ? `+${p.delta}` : `−${-p.delta}`}</b>
              {teams.teams[p.team - 1]?.name ?? `Tổ ${p.team}`}{p.reason ? ` · ${p.reason}` : ''}
              {isNow && <button type="button" className="ct-x" onClick={() => void undo(p.id)} aria-label="Xóa lần này"><X aria-hidden="true" /></button>}
            </p>
          ))}
          {!(isNow ? todayLog : points).length && <p className="dash-muted">Chưa có lần cộng / trừ nào.</p>}
        </section>
      </div>

      {edit && <TeamEditor teams={teams} students={students} onCancel={() => setEdit(false)} onSave={(t) => void saveTeams(t)} fromSeating={fromSeating} />}
      {summary && <WeekSummary className={className} week={week} teams={teams} total={total} points={points} onClose={() => setSummary(false)} />}
    </div>
  );
}

/* ====================================================================== sửa tổ */
function TeamEditor({ teams, students, onCancel, onSave, fromSeating }: {
  teams: TeamsState; students: ToolStudent[]; onCancel: () => void; onSave: (t: TeamsState) => void; fromSeating: () => Promise<TeamsState | null>;
}) {
  const [t, setT] = useState<TeamsState>(teams);
  const [msg, setMsg] = useState('');
  const teamOf = (id: string) => t.teams.findIndex((x) => x.members.includes(id));
  const setCount = (n: number) => setT((x) => {
    const list = x.teams.slice(0, n);
    while (list.length < n) list.push({ name: `Tổ ${list.length + 1}`, emoji: TEAM_EMOJI[list.length % TEAM_EMOJI.length], members: [], leader: null });
    return { teams: list };
  });
  const assign = (id: string, to: number) => setT((x) => ({
    teams: x.teams.map((tm, i) => ({ ...tm, members: i === to ? [...tm.members.filter((m) => m !== id), id] : tm.members.filter((m) => m !== id), leader: tm.leader === id && i !== to ? null : tm.leader })),
  }));
  const patch = (i: number, p: Partial<TeamsState['teams'][number]>) => setT((x) => ({ teams: x.teams.map((tm, j) => (j === i ? { ...tm, ...p } : tm)) }));
  return (
    <div className="ct-modal-bg" onClick={onCancel}>
      <div className="ct-modal" role="dialog" aria-modal="true" aria-label="Sửa tổ" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-head"><h2>Sửa tổ</h2><button type="button" className="ct-x" onClick={onCancel} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        <div className="td-edit-top">
          <label>Số tổ <select value={t.teams.length} onChange={(e) => setCount(Number(e.target.value))}>{[2, 3, 4, 5, 6, 7, 8].map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void fromSeating().then((x) => { if (x) { setT(x); setMsg('Đã lấy tổ theo dãy bàn của sơ đồ chỗ ngồi.'); } else setMsg('Chưa có sơ đồ chỗ ngồi — xếp ở trang Nhóm & chỗ ngồi trước.'); })}>Lấy theo dãy bàn (sơ đồ chỗ ngồi)</button>
          {msg && <span className="dash-muted">{msg}</span>}
        </div>
        <div className="td-edit-teams">
          {t.teams.map((tm, i) => (
            <div key={i} className="td-edit-team" style={{ '--c': TEAM_COLORS[i % TEAM_COLORS.length] } as React.CSSProperties}>
              <select value={tm.emoji} onChange={(e) => patch(i, { emoji: e.target.value })} aria-label="Biểu tượng">{TEAM_EMOJI.map((e) => <option key={e} value={e}>{e}</option>)}</select>
              <input value={tm.name} maxLength={30} onChange={(e) => patch(i, { name: e.target.value })} aria-label={`Tên tổ ${i + 1}`} />
              <select value={tm.leader ?? ''} onChange={(e) => patch(i, { leader: e.target.value || null })} aria-label="Tổ trưởng">
                <option value="">Tổ trưởng…</option>{tm.members.map((m) => <option key={m} value={m}>{students.find((s) => s.id === m)?.name}</option>)}
              </select>
              <small>{tm.members.length} em</small>
            </div>
          ))}
        </div>
        <div className="td-edit-list">
          {students.map((s) => (
            <label key={s.id}><span>{s.name}</span>
              <select value={teamOf(s.id)} onChange={(e) => assign(s.id, Number(e.target.value))}>
                <option value={-1}>— chưa xếp —</option>{t.teams.map((tm, i) => <option key={i} value={i}>{tm.emoji} {tm.name}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="ct-modal-foot">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave({ teams: t.teams.map((tm, i) => ({ ...tm, name: tm.name.trim() || `Tổ ${i + 1}` })) })}>Lưu</button>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== tổng kết tuần */
function WeekSummary({ className, week, teams, total, points, onClose }: {
  className: string; week: ReturnType<typeof weekOf>; teams: TeamsState; total: number[]; points: Point[]; onClose: () => void;
}) {
  const rank = ranking(total);
  const medal = ['🥇', '🥈', '🥉'];
  const best = rank.filter((r) => r.rank === 1 && r.score > 0).map((r) => teams.teams[r.team]?.name);
  const why = (i: number) => {
    const c: Record<string, number> = {};
    points.filter((p) => p.team === i + 1 && p.delta > 0 && p.reason).forEach((p) => { c[p.reason!] = (c[p.reason!] ?? 0) + p.delta; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([r]) => r.toLowerCase());
  };
  const text = [
    `TỔNG KẾT THI ĐUA TUẦN ${ddmm(week.from)} – ${ddmm(week.to)} — LỚP ${className.toUpperCase()}`,
    ...rank.map((r) => `${r.rank}. ${teams.teams[r.team]?.name}: ${r.score} điểm${why(r.team).length ? ` (nổi bật: ${why(r.team).join(', ')})` : ''}`),
    best.length ? `Tổ xuất sắc tuần: ${best.join(', ')}. Cả lớp cùng chúc mừng nhé!` : 'Tuần này chưa có điểm thi đua.',
  ].join('\n');
  const [copied, setCopied] = useState(false);
  return (
    <div className="ct-modal-bg" onClick={onClose}>
      <div className="ct-modal td-sum" role="dialog" aria-modal="true" aria-label="Tổng kết tuần" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-head"><h2>🏆 Tổng kết tuần {ddmm(week.from)} – {ddmm(week.to)}</h2><button type="button" className="ct-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        <ol className="td-podium">
          {rank.map((r) => (
            <li key={r.team} className={`is-r${Math.min(r.rank, 4)}`} style={{ '--c': TEAM_COLORS[r.team % TEAM_COLORS.length] } as React.CSSProperties}>
              <span className="td-medal">{medal[r.rank - 1] ?? r.rank}</span>
              <b>{teams.teams[r.team]?.emoji} {teams.teams[r.team]?.name}</b>
              <span>{r.score} điểm</span>
              {why(r.team).length > 0 && <small>Nổi bật: {why(r.team).join(', ')}</small>}
            </li>
          ))}
        </ol>
        <p className="td-best">{best.length ? <>🎉 Tổ xuất sắc tuần: <b>{best.join(', ')}</b></> : 'Tuần này chưa có điểm thi đua.'}</p>
        <textarea readOnly value={text} rows={6} aria-label="Nội dung tổng kết" />
        <div className="ct-modal-foot">
          <button type="button" className="btn btn-outline" onClick={() => { void navigator.clipboard?.writeText(text).then(() => setCopied(true)); }}><Copy aria-hidden="true" /> {copied ? 'Đã chép' : 'Chép nội dung'}</button>
          <button type="button" className="btn btn-primary" onClick={onClose}>Xong</button>
        </div>
      </div>
    </div>
  );
}
