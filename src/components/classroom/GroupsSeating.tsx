'use client';

// Chia nhóm & sơ đồ chỗ ngồi: chia ngẫu nhiên / cân bằng học lực / theo tổ, tách các em không nên ngồi chung,
// chiếu nhóm lên bảng; sơ đồ lớp kéo thả (hoặc bấm 2 ghế để đổi chỗ), in dán bàn giáo viên, lấy dãy bàn làm tổ thi đua.
// Lưu trên database (migration 0028, teacher_tool_get / teacher_tool_save) để mở máy nào cũng thấy.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Armchair, Crown, Dices, Maximize, Minus, Plus, Printer, Trophy, Undo2, UsersRound, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  DESK_LABEL, DESK_SEATS, GROUP_LOOKS, LEVELS, TEAM_COLORS, autoSeat, colOfSeat, conflictsOf, defaultGroupOpts, groupCount, makeGroups,
  normalizeSeating, normalizeTeams, placeSeat, relayout, seatIndex, shortName, teamsFromSeating, unseat, unseated,
  type DeskKind, type Group, type GroupMode, type GroupOpts, type GroupsState, type Level, type Seating, type TeamsState, type ToolStudent,
} from '@/lib/classroom/class-tools';

type Props = { classId: string; className: string; students: ToolStudent[]; levels: Record<string, Level>; absentToday: string[]; initialTab: 'groups' | 'seating' };
type Save = 'idle' | 'saving' | 'saved' | 'error';

export default function GroupsSeating({ classId, className, students, levels, absentToday, initialTab }: Props) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [tab, setTab] = useState(initialTab);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false); // chưa chạy migration 0028
  const [save, setSave] = useState<Save>('idle');
  const [notice, setNotice] = useState('');
  const nameOf = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.name])), [students]);

  const [gs, setGs] = useState<GroupsState>({ opts: defaultGroupOpts(), groups: [] });
  const [seat, setSeat] = useState<Seating>(() => normalizeSeating(null, students));
  const [teams, setTeams] = useState<TeamsState | null>(null);

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    void Promise.all(['groups', 'seating', 'teams'].map((tool) => supabase.rpc('teacher_tool_get', { p_class: classId, p_tool: tool }))).then(([g, s, t]) => {
      if (g.error) { setMissing(true); setLoaded(true); return; }
      const gd = g.data as Partial<GroupsState> | null;
      if (gd?.opts) setGs({ opts: { ...defaultGroupOpts(), ...gd.opts }, groups: cleanGroups(gd.groups, students), at: gd.at });
      setSeat(normalizeSeating(s.data as Partial<Seating> | null, students));
      if (t.data) setTeams(normalizeTeams(t.data as Partial<TeamsState>, students));
      setLoaded(true);
    });
  }, [supabase, classId, students]);

  const timers = useRef<Record<string, number>>({});
  const persist = useCallback((tool: 'groups' | 'seating' | 'teams', data: object, delay = 0) => {
    if (!supabase || missing) return;
    window.clearTimeout(timers.current[tool]);
    const run = async () => {
      setSave('saving');
      const { error } = await supabase.rpc('teacher_tool_save', { p_class: classId, p_tool: tool, p_data: data });
      setSave(error ? 'error' : 'saved');
    };
    if (delay) timers.current[tool] = window.setTimeout(() => void run(), delay); else void run();
  }, [supabase, classId, missing]);

  const saveTeams = (next: TeamsState, msg: string) => {
    setTeams(next); persist('teams', next); setNotice(msg);
  };

  return (
    <div className="ct">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Lớp {className} · {students.length} em{absentToday.length ? ` · ${absentToday.length} em vắng hôm nay (theo Sổ lớp)` : ''}</p>
          <h1>Nhóm & chỗ ngồi</h1>
        </div>
        <div className="ct-seg" role="tablist" aria-label="Chọn công cụ">
          <button type="button" role="tab" aria-selected={tab === 'groups'} className={tab === 'groups' ? 'is-on' : ''} onClick={() => setTab('groups')}><UsersRound aria-hidden="true" /> Chia nhóm</button>
          <button type="button" role="tab" aria-selected={tab === 'seating'} className={tab === 'seating' ? 'is-on' : ''} onClick={() => setTab('seating')}><Armchair aria-hidden="true" /> Sơ đồ chỗ ngồi</button>
        </div>
        <span className={`ct-save is-${save}`} aria-live="polite">{save === 'saving' ? 'Đang lưu…' : save === 'saved' ? '✓ Đã lưu' : save === 'error' ? 'Chưa lưu được — thử lại' : ''}</span>
      </div>
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0028_class_tools.sql</code> trên Supabase: vẫn dùng được nhưng chưa lưu lại được.</p>}
      {notice && <p className="adm-alert is-ok" role="status">{notice} <button type="button" className="ct-x" onClick={() => setNotice('')} aria-label="Đóng"><X aria-hidden="true" /></button></p>}
      {!students.length ? <p className="dash-muted">Lớp chưa có học sinh. <Link href={`/giao-vien/lop/${classId}`}>Thêm học sinh</Link></p>
        : !loaded ? <p className="dash-muted">Đang tải…</p>
        : tab === 'groups'
          ? <GroupsTab classId={classId} students={students} levels={levels} absentToday={absentToday} nameOf={nameOf} gs={gs} teams={teams}
              onChange={(next) => { setGs(next); persist('groups', next); }}
              onUseAsTeams={(groups) => saveTeams({ teams: groups.map((g, i) => ({ name: `Tổ ${i + 1}`, emoji: GROUP_LOOKS[i % GROUP_LOOKS.length].emoji, members: g.members, leader: g.leader })) }, `Đã dùng ${groups.length} nhóm làm tổ thi đua.`)} />
          : <SeatingTab classId={classId} className={className} students={students} absentToday={absentToday} nameOf={nameOf} seat={seat}
              onChange={(next) => { setSeat(next); persist('seating', next, 700); }}
              onUseAsTeams={() => saveTeams(teamsFromSeating(seat, teams ?? undefined), `Đã lấy ${seat.cols} dãy bàn làm ${seat.cols} tổ thi đua.`)} />}
    </div>
  );
}

function cleanGroups(raw: unknown, students: ToolStudent[]): Group[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(students.map((s) => s.id)), seen = new Set<string>();
  return raw.slice(0, 20).map((g: Partial<Group>) => {
    const members = (Array.isArray(g?.members) ? g.members : []).filter((id): id is string => typeof id === 'string' && valid.has(id) && !seen.has(id) && !!seen.add(id));
    return { members, leader: typeof g?.leader === 'string' && members.includes(g.leader) ? g.leader : null };
  }).filter((g) => g.members.length);
}

/* ====================================================================== CHIA NHÓM */
function GroupsTab({ classId, students, levels, absentToday, nameOf, gs, teams, onChange, onUseAsTeams }: {
  classId: string; students: ToolStudent[]; levels: Record<string, Level>; absentToday: string[]; nameOf: Record<string, string>;
  gs: GroupsState; teams: TeamsState | null; onChange: (g: GroupsState) => void; onUseAsTeams: (g: Group[]) => void;
}) {
  const { opts, groups } = gs;
  const [picked, setPicked] = useState<string | null>(null);
  const [showLv, setShowLv] = useState(true);
  const [anim, setAnim] = useState(0);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const board = useRef<HTMLDivElement>(null);
  const pool = opts.skipAbsent ? students.filter((s) => !absentToday.includes(s.id)) : students;
  const setOpts = (o: Partial<GroupOpts>) => onChange({ ...gs, opts: { ...opts, ...o } });
  const k = opts.mode === 'teams' ? (teams?.teams.filter((t) => t.members.length).length ?? 0) : groupCount(pool.length, opts);
  const per = k ? Math.ceil(pool.length / k) : 0;
  const hasTeams = !!teams?.teams.some((t) => t.members.length);

  const deal = () => {
    const g = makeGroups(pool, levels, opts, Math.random, teams?.teams.map((t) => t.members));
    setPicked(null); setAnim((a) => a + 1);
    onChange({ opts, groups: g, at: new Date().toISOString() });
  };
  const move = (id: string, to: number) => {
    const next = groups.map((g, i) => {
      const members = i === to ? (g.members.includes(id) ? g.members : [...g.members, id]) : g.members.filter((x) => x !== id);
      return { members, leader: g.leader === id && i !== to ? null : g.leader };
    }).filter((g) => g.members.length);
    setPicked(null); onChange({ ...gs, groups: next });
  };
  const makeLeader = (id: string) => { setPicked(null); onChange({ ...gs, groups: groups.map((g) => (g.members.includes(id) ? { ...g, leader: id } : g)) }); };
  const conflicts = conflictsOf(groups.map((g) => g.members), opts.avoid);
  const addPair = () => {
    if (!pairA || !pairB || pairA === pairB || opts.avoid.some(([a, b]) => (a === pairA && b === pairB) || (a === pairB && b === pairA))) return;
    setOpts({ avoid: [...opts.avoid, [pairA, pairB]].slice(0, 30) as [string, string][] });
    setPairA(''); setPairB('');
  };
  const project = () => { void board.current?.requestFullscreen?.().catch(() => undefined); };

  return (
    <div className="ct-cols">
      <section className="card ct-opt" aria-label="Cách chia nhóm">
        <h3>Chia theo</h3>
        <div className="ct-pills">
          <button type="button" className={opts.by === 'count' ? 'is-on' : ''} onClick={() => setOpts({ by: 'count', n: Math.min(opts.n, 12) })} disabled={opts.mode === 'teams'}>Số nhóm</button>
          <button type="button" className={opts.by === 'size' ? 'is-on' : ''} onClick={() => setOpts({ by: 'size' })} disabled={opts.mode === 'teams'}>Mỗi nhóm … em</button>
        </div>
        {opts.mode !== 'teams' && (
          <div className="ct-step">
            <button type="button" onClick={() => setOpts({ n: Math.max(opts.by === 'count' ? 2 : 2, opts.n - 1) })} aria-label="Bớt"><Minus aria-hidden="true" /></button>
            <b>{opts.n}</b>
            <button type="button" onClick={() => setOpts({ n: Math.min(opts.by === 'count' ? 12 : 10, opts.n + 1) })} aria-label="Thêm"><Plus aria-hidden="true" /></button>
            <span>{opts.by === 'count' ? `nhóm · ${per} em/nhóm` : `em/nhóm · ${k} nhóm`}</span>
          </div>
        )}
        <h3>Cách chia</h3>
        {([['random', 'Ngẫu nhiên', 'Trộn đều cả lớp'], ['balanced', 'Cân bằng học lực', 'Mỗi nhóm đủ em học tốt – khá – cần hỗ trợ (theo kết quả luyện tập trong app)'], ['teams', 'Theo tổ trên lớp', hasTeams ? `Giữ nguyên ${teams!.teams.filter((t) => t.members.length).length} tổ đã xếp` : 'Chưa xếp tổ — xếp ở Sơ đồ chỗ ngồi hoặc Thi đua tổ']] as [GroupMode, string, string][]).map(([id, label, hint]) => (
          <label key={id} className={`ct-radio${opts.mode === id ? ' is-on' : ''}${id === 'teams' && !hasTeams ? ' is-off' : ''}`}>
            <input type="radio" name="gmode" checked={opts.mode === id} disabled={id === 'teams' && !hasTeams} onChange={() => setOpts({ mode: id })} />
            <span><b>{label}</b><small>{hint}</small></span>
          </label>
        ))}
        <h3>Thêm</h3>
        <label className="ct-check"><input type="checkbox" checked={opts.leaders} onChange={(e) => setOpts({ leaders: e.target.checked })} /> Chọn nhóm trưởng ngẫu nhiên</label>
        <label className="ct-check"><input type="checkbox" checked={opts.skipAbsent} onChange={(e) => setOpts({ skipAbsent: e.target.checked })} /> Bỏ qua em vắng hôm nay{absentToday.length ? ` (${absentToday.length})` : ''}</label>
        <label className="ct-check"><input type="checkbox" checked={showLv} onChange={(e) => setShowLv(e.target.checked)} /> Hiện màu học lực (không hiện khi chiếu)</label>
        <h3>Không xếp chung</h3>
        <ul className="ct-pairs">
          {opts.avoid.map(([a, b], i) => nameOf[a] && nameOf[b] ? (
            <li key={`${a}-${b}`}>{shortName(nameOf[a])} – {shortName(nameOf[b])}
              <button type="button" aria-label="Bỏ cặp này" onClick={() => setOpts({ avoid: opts.avoid.filter((_, j) => j !== i) })}><X aria-hidden="true" /></button></li>
          ) : null)}
        </ul>
        <div className="ct-pair-add">
          <select value={pairA} onChange={(e) => setPairA(e.target.value)} aria-label="Em thứ nhất"><option value="">Chọn em…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={pairB} onChange={(e) => setPairB(e.target.value)} aria-label="Em thứ hai"><option value="">với em…</option>{students.filter((s) => s.id !== pairA).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <button type="button" className="btn btn-outline btn-sm" onClick={addPair} disabled={!pairA || !pairB}>Thêm</button>
        </div>
        {showLv && <div className="ct-legend">{(Object.keys(LEVELS) as Level[]).map((l) => <span key={l}><i style={{ background: LEVELS[l].color }} />{LEVELS[l].label}</span>)}</div>}
      </section>

      <div className="ct-board-wrap">
        <div className="ct-actions">
          <button type="button" className="btn btn-primary" onClick={deal}><Dices aria-hidden="true" /> {groups.length ? 'Chia lại' : 'Chia nhóm'}</button>
          <button type="button" className="btn btn-outline" onClick={() => onUseAsTeams(groups)} disabled={!groups.length}><Trophy aria-hidden="true" /> Dùng làm tổ thi đua</button>
          <button type="button" className="btn btn-outline" onClick={project} disabled={!groups.length}><Maximize aria-hidden="true" /> Chiếu lên bảng</button>
          <Link className="btn btn-outline" href={`/giao-vien/lop/${classId}/hen-gio`}>⏱️ Hẹn giờ thảo luận</Link>
        </div>
        {conflicts.length > 0 && <p className="adm-alert is-warn">Còn {conflicts.length} cặp “không xếp chung” đang chung nhóm (do thầy cô vừa chuyển). Bấm Chia lại hoặc chuyển em sang nhóm khác.</p>}
        {picked && <p className="ct-hint">Đã chọn <b>{nameOf[picked]}</b> — bấm vào nhóm khác để chuyển em sang, hoặc <button type="button" className="ct-link" onClick={() => makeLeader(picked)}><Crown aria-hidden="true" /> làm nhóm trưởng</button> · <button type="button" className="ct-link" onClick={() => setPicked(null)}>bỏ chọn</button></p>}
        <div ref={board} className={`ct-groups${showLv ? ' show-lv' : ''}`} key={anim}>
          <p className="ct-proj-title">Nhóm hôm nay</p>
          {!groups.length && <div className="ct-empty"><UsersRound aria-hidden="true" /><p>Chọn cách chia rồi bấm <b>Chia nhóm</b>.</p></div>}
          {groups.map((g, i) => {
            const look = GROUP_LOOKS[i % GROUP_LOOKS.length];
            return (
              <section key={i} className={`ct-gcard${picked && !g.members.includes(picked) ? ' is-target' : ''}`} style={{ '--c': look.color, animationDelay: `${i * 60}ms` } as React.CSSProperties}
                onClick={() => { if (picked && !g.members.includes(picked)) move(picked, i); }}>
                <h4><span aria-hidden="true">{look.emoji}</span>Nhóm {look.name}<small>{g.members.length} em</small></h4>
                <ul>
                  {g.members.map((id) => (
                    <li key={id}>
                      <button type="button" className={`ct-mem${picked === id ? ' is-picked' : ''}`} onClick={(e) => { e.stopPropagation(); if (picked && picked !== id && !g.members.includes(picked)) move(picked, i); else setPicked(picked === id ? null : id); }}>
                        <i className="ct-lv" style={{ background: LEVELS[levels[id] ?? 'chua'].color }} title={LEVELS[levels[id] ?? 'chua'].label} />
                        {shortName(nameOf[id] ?? '')}
                        {g.leader === id && <span className="ct-lead"><Crown aria-hidden="true" /> Trưởng</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== SƠ ĐỒ CHỖ NGỒI */
function SeatingTab({ className, students, absentToday, nameOf, seat, onChange, onUseAsTeams }: {
  classId: string; className: string; students: ToolStudent[]; absentToday: string[]; nameOf: Record<string, string>;
  seat: Seating; onChange: (s: Seating) => void; onUseAsTeams: () => void;
}) {
  const [undo, setUndo] = useState<Seating[]>([]);
  const [sel, setSel] = useState<{ kind: 'seat'; i: number } | { kind: 'free'; id: string } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const room = useRef<HTMLDivElement>(null);
  const free = unseated(seat, students);
  const per = DESK_SEATS[seat.desk];
  const change = (next: Seating) => { setUndo((u) => [...u.slice(-29), seat]); setSel(null); onChange(next); };
  const back = () => { const prev = undo[undo.length - 1]; if (!prev) return; setUndo((u) => u.slice(0, -1)); onChange(prev); };
  const layout = (o: Partial<Pick<Seating, 'cols' | 'rows' | 'desk'>>) => change(relayout(seat, { cols: seat.cols, rows: seat.rows, desk: seat.desk, ...o }));
  const drop = (to: number, payload: string) => {
    if (payload.startsWith('seat:')) {
      const from = Number(payload.slice(5));
      const id = seat.seats[from];
      if (id && from !== to) change(placeSeat(seat, id, to));
    } else if (payload.startsWith('free:')) change(placeSeat(seat, payload.slice(5), to));
  };
  const clickSeat = (i: number) => {
    if (!sel) { if (seat.seats[i]) setSel({ kind: 'seat', i }); return; }
    if (sel.kind === 'seat') { if (sel.i === i) { setSel(null); return; } drop(i, `seat:${sel.i}`); }
    else drop(i, `free:${sel.id}`);
  };
  const shuffleAll = () => {
    if (seat.seats.some(Boolean) && !window.confirm('Xếp lại toàn bộ chỗ ngồi ngẫu nhiên?')) return;
    change(autoSeat(seat, students.map((s) => s.id)));
  };
  const fillFree = () => {
    let s = seat;
    for (const st of free) { const i = s.seats.indexOf(null); if (i < 0) break; s = placeSeat(s, st.id, i); }
    change(s);
  };
  const capacity = seat.seats.length;

  return (
    <div className="ct-cols ct-cols-seat">
      <div>
        <div className="ct-actions">
          <button type="button" className="btn btn-primary" onClick={shuffleAll}><Dices aria-hidden="true" /> Xếp ngẫu nhiên</button>
          <button type="button" className="btn btn-outline" onClick={back} disabled={!undo.length}><Undo2 aria-hidden="true" /> Hoàn tác</button>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}><Printer aria-hidden="true" /> In sơ đồ</button>
          <button type="button" className="btn btn-outline" onClick={() => void room.current?.requestFullscreen?.().catch(() => undefined)}><Maximize aria-hidden="true" /> Chiếu lên bảng</button>
        </div>
        <p className="ct-hint no-print">{sel ? <>Đã chọn <b>{sel.kind === 'seat' ? nameOf[seat.seats[sel.i] ?? ''] : nameOf[sel.id]}</b> — bấm vào ghế muốn chuyển tới (ghế có bạn thì hai bạn đổi chỗ). <button type="button" className="ct-link" onClick={() => setSel(null)}>Bỏ chọn</button></> : 'Kéo thả tên để đổi chỗ, hoặc bấm vào 2 ghế lần lượt. Bấm ✕ trên ghế để đưa em ra ngoài.'}</p>
        <section ref={room} className="ct-room" aria-label={`Sơ đồ chỗ ngồi lớp ${className}`}>
          <p className="ct-print-title">SƠ ĐỒ CHỖ NGỒI — LỚP {className.toUpperCase()}</p>
          <div className="ct-board">BẢNG LỚP</div>
          <div className="ct-tdesk">Bàn giáo viên</div>
          <div className="ct-rows" style={{ gridTemplateColumns: `repeat(${seat.cols}, minmax(0, 1fr))`, minWidth: seat.cols * (per === 1 ? 92 : per === 2 ? 156 : 176) }}>
            {Array.from({ length: seat.rows }, (_, r) => Array.from({ length: seat.cols }, (_, c) => (
              <div key={`${r}-${c}`} className={`ct-desk is-${seat.desk}`}>
                {Array.from({ length: per }, (_, k) => {
                  const i = seatIndex(seat, r, c, k);
                  const id = seat.seats[i];
                  const color = seat.colorByCol ? TEAM_COLORS[colOfSeat(seat, i) % TEAM_COLORS.length] : '#64748b';
                  const picked = sel?.kind === 'seat' && sel.i === i;
                  return (
                    <div key={k} className={`ct-seat${id ? '' : ' is-empty'}${picked ? ' is-picked' : ''}${over === i ? ' is-over' : ''}${id && absentToday.includes(id) ? ' is-absent' : ''}`}
                      style={{ '--c': color } as React.CSSProperties}
                      draggable={!!id} onDragStart={(e) => { e.dataTransfer.setData('text/plain', `seat:${i}`); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver((o) => (o === i ? null : o))}
                      onDrop={(e) => { e.preventDefault(); setOver(null); drop(i, e.dataTransfer.getData('text/plain')); }}>
                      <button type="button" className="ct-seat-btn" onClick={() => clickSeat(i)} aria-label={id ? `${nameOf[id]}, dãy ${c + 1} bàn ${r + 1}` : `Ghế trống dãy ${c + 1} bàn ${r + 1}`}>
                        {id ? <>{shortName(nameOf[id] ?? '')}{seat.colorByCol && <small>Tổ {c + 1}</small>}</> : <span>Trống</span>}
                      </button>
                      {id && <button type="button" className="ct-seat-x no-print" aria-label={`Đưa ${nameOf[id]} ra khỏi ghế`} onClick={() => change(unseat(seat, i))}><X aria-hidden="true" /></button>}
                    </div>
                  );
                })}
              </div>
            )))}
          </div>
          {seat.colorByCol && <div className="ct-legend ct-legend-c">{Array.from({ length: seat.cols }, (_, c) => <span key={c}><i style={{ background: TEAM_COLORS[c % TEAM_COLORS.length] }} />Tổ {c + 1} (dãy {c + 1})</span>)}</div>}
        </section>
      </div>

      <aside className="ct-side no-print">
        <section className="card ct-opt">
          <h3>Bố cục lớp</h3>
          <div className="ct-step"><button type="button" onClick={() => layout({ cols: Math.max(1, seat.cols - 1) })} aria-label="Bớt dãy"><Minus aria-hidden="true" /></button><b>{seat.cols}</b><button type="button" onClick={() => layout({ cols: Math.min(8, seat.cols + 1) })} aria-label="Thêm dãy"><Plus aria-hidden="true" /></button><span>dãy</span></div>
          <div className="ct-step"><button type="button" onClick={() => layout({ rows: Math.max(1, seat.rows - 1) })} aria-label="Bớt bàn"><Minus aria-hidden="true" /></button><b>{seat.rows}</b><button type="button" onClick={() => layout({ rows: Math.min(10, seat.rows + 1) })} aria-label="Thêm bàn"><Plus aria-hidden="true" /></button><span>bàn mỗi dãy</span></div>
          <div className="ct-pills">{(Object.keys(DESK_LABEL) as DeskKind[]).map((d) => <button key={d} type="button" className={seat.desk === d ? 'is-on' : ''} onClick={() => layout({ desk: d })}>{DESK_LABEL[d]}</button>)}</div>
          <p className="ct-cap">{capacity} chỗ · {students.length} em{capacity < students.length ? <b> — thiếu {students.length - capacity} chỗ</b> : ''}</p>
          <label className="ct-check"><input type="checkbox" checked={seat.colorByCol} onChange={(e) => change({ ...seat, colorByCol: e.target.checked })} /> Tô màu theo tổ (mỗi dãy một tổ)</label>
          <h3>Chưa xếp chỗ ({free.length})</h3>
          <div className="ct-free" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const p = e.dataTransfer.getData('text/plain'); if (p.startsWith('seat:')) change(unseat(seat, Number(p.slice(5)))); }}>
            {free.length ? free.map((s) => (
              <button key={s.id} type="button" draggable className={sel?.kind === 'free' && sel.id === s.id ? 'is-picked' : ''}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', `free:${s.id}`)} onClick={() => setSel(sel?.kind === 'free' && sel.id === s.id ? null : { kind: 'free', id: s.id })}>{shortName(s.name)}</button>
            )) : <span className="dash-muted">Cả lớp đã có chỗ 🎉</span>}
          </div>
          {free.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={fillFree}>Xếp các em này vào ghế trống</button>}
          <h3>Thi đua</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onUseAsTeams} disabled={!seat.seats.some(Boolean)}><Trophy aria-hidden="true" /> Dùng {seat.cols} dãy làm {seat.cols} tổ thi đua</button>
        </section>
        <section className="card ct-tip">💡 In sơ đồ dán ở bàn giáo viên — thầy cô dạy thay nhìn là biết tên em. Em vắng hôm nay hiện mờ.</section>
      </aside>
    </div>
  );
}
