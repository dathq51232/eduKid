'use client';

// ĐẤU CẶP MẮT XÍCH — trang của cô (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2):
// tạo phòng (chọn chương / bài, số câu mỗi trận, giây mỗi câu) → chiếu mã → sảnh chờ → bốc thăm (máy chủ ghép cặp,
// máy cô sinh bộ câu cho từng trận từ kho app + Câu của tôi) → sơ đồ nhánh cập nhật mỗi 2,5 giây → vòng sau → nhà vô địch.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crown, DoorOpen, Gavel, Lock, RotateCcw, Shuffle, Swords, Users } from 'lucide-react';
import { useGradeContent } from '@/components/learn/GradeReady';
import { useMyBank } from '@/components/exams/useMyBank';
import { SUBJECT_NAME, type ExamItem } from '@/lib/classroom/assignments';
import { bookLessons, buildPaper, defaultMatrix, type BookLesson } from '@/lib/exams/matrix';
import { slotItem } from '@/lib/classroom/rooms-build';
import { REASON_LABEL, battleDefaults, battleError, fmtMs, roundName, roundRatio, type WinReason } from '@/lib/classroom/battle';
import type { SubjectCode } from '@/lib/types';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/bt.css';

type RoomItem = { id: string; code: string; title: string; subject: SubjectCode; n_questions: number; sec_per_q: number; status: string; round: number; created_at: string };
type P = { i: number; correct: number; ms: number; done: boolean } | null;
type Match = { id: string; round: number; slot: number; n: number; a: string; b: string | null; aName: string; bName: string | null; status: 'playing' | 'done'; winner: string | null; reason: WinReason | null; pa: P; pb: P };
type Host = {
  room: { id: string; code: string; title: string; subject: SubjectCode; grade: number; lessons: string[]; n: number; sec: number; status: string; round: number; champion: string | null; championName: string | null };
  players: { id: string; name: string; out: number | null; byes: number }[];
  matches: Match[]; used: string[];
};

const STATUS: Record<string, string> = { lobby: 'Sảnh chờ', playing: 'Đang đấu', done: 'Đã có vô địch', closed: 'Đã đóng' };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(battleError((d as { error?: string }).error ?? ''));
  return d as T;
}

/** Bộ câu cho `count` trận: theo các bài đã chọn, độ khó theo số em còn lại, không lặp câu đã dùng */
function buildSets(lessons: BookLesson[], n: number, alive: number, count: number, used: string[]): ExamItem[][] | null {
  const m = defaultMatrix(lessons, n, roundRatio(alive));
  // ưu tiên câu chưa ra ở các vòng trước; kho của chương hết câu mới thì cho lặp câu cũ để trận nào cũng đủ số câu
  const avoid = new Set(used);
  const out: ExamItem[][] = [];
  for (let k = 0; k < count; k++) {
    const seed = (Math.random() * 2 ** 32) >>> 0;
    let p = buildPaper(m, seed, 'D', avoid);
    if (p.slots.length < n) { const q = buildPaper(m, seed, 'D'); if (q.slots.length > p.slots.length) p = q; }
    if (p.slots.length < Math.min(3, n)) return null;
    out.push(p.slots.map((s) => slotItem(s, m.points)));
  }
  return out;
}

export default function BattleRooms({ classId, grade }: { classId: string; grade: number }) {
  const { version } = useGradeContent(grade);
  const subjects = useMemo(() => (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => bookLessons(s, grade).length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tính lại khi kho bài của khối vừa nạp xong
    [grade, version]);
  const [rooms, setRooms] = useState<RoomItem[] | null>(null);
  const [err, setErr] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRooms((await api<{ rooms: RoomItem[] }>(`/api/giao-vien/dau-cap?classId=${classId}`)).rooms); setErr(''); }
    catch (e) { setErr((e as Error).message); setRooms([]); }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  if (openId) return <BattleHost id={openId} grade={grade} onBack={() => { setOpenId(null); void load(); }} />;

  return (
    <>
      <CreateBattle classId={classId} grade={grade} subjects={subjects} onCreated={(id) => { setOpenId(id); }} />
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      <section className="dash-section">
        <h2><DoorOpen aria-hidden="true" /> Phòng đấu của lớp</h2>
        {rooms === null ? <p className="dash-muted">Đang tải…</p> : !rooms.length ? <p className="dash-muted">Chưa có phòng đấu nào. Tạo phòng ở trên.</p> : (
          <ul className="bt-rooms">
            {rooms.map((r) => (
              <li key={r.id}>
                <button type="button" className="bt-room" onClick={() => setOpenId(r.id)}>
                  <b>{r.title}</b>
                  <span>{SUBJECT_NAME[r.subject]} · {r.n_questions} câu/trận · {r.sec_per_q} giây/câu · mã <code>{r.code}</code></span>
                  <em className={`bt-st is-${r.status}`}>{STATUS[r.status] ?? r.status}{r.status === 'playing' ? ` · vòng ${r.round}` : ''}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function CreateBattle({ classId, grade, subjects, onCreated }: { classId: string; grade: number; subjects: SubjectCode[]; onCreated: (id: string) => void }) {
  const def = battleDefaults(grade);
  const [subject, setSubject] = useState<SubjectCode>(subjects[0] ?? 'toan');
  const lessons = useMemo(() => bookLessons(subject, grade), [subject, grade]);
  const units = useMemo(() => {
    const m = new Map<string, { code: string; title: string; ids: string[] }>();
    for (const l of lessons) { const u = m.get(l.unit.code) ?? { code: l.unit.code, title: l.unit.title, ids: [] }; u.ids.push(l.id); m.set(l.unit.code, u); }
    return [...m.values()];
  }, [lessons]);
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [n, setN] = useState(def.n);
  const [sec, setSec] = useState(def.sec);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setPick(new Set()); }, [subject]);
  const toggleUnit = (ids: string[], on: boolean) => setPick((p) => { const s = new Set(p); ids.forEach((x) => (on ? s.add(x) : s.delete(x))); return s; });
  const firstUnit = units.find((u) => u.ids.some((x) => pick.has(x)));

  const create = async () => {
    if (!pick.size) { setErr('Chọn ít nhất một bài (hoặc cả chương).'); return; }
    setBusy(true); setErr('');
    try {
      const t = title.trim() || `Đấu cặp ${SUBJECT_NAME[subject]}${firstUnit ? ` — ${firstUnit.title}` : ''}`;
      const d = await api<{ id: string }>('/api/giao-vien/dau-cap', { method: 'POST', body: JSON.stringify({ classId, title: t, subject, lessons: [...pick], n, sec }) });
      onCreated(d.id);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <section className="dash-section bt-create">
      <h2><Swords aria-hidden="true" /> Tạo phòng Đấu cặp</h2>
      <p className="dash-muted">Sau một chương hoặc cuối tuần: các em nhập mã, cô bốc thăm chia cặp, đấu loại trực tiếp. Đúng nhiều câu hơn thắng; bằng câu thì ai làm nhanh hơn thắng. Không ghi điểm vào sổ.</p>
      <div className="bt-form">
        <label className="bt-f"><span>Môn</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectCode)}>{subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}</select></label>
        <label className="bt-f"><span>Số câu mỗi trận</span><input type="number" min={3} max={10} value={n} onChange={(e) => setN(Math.max(3, Math.min(10, Number(e.target.value) || 3)))} /></label>
        <label className="bt-f"><span>Giây mỗi câu</span><input type="number" min={10} max={180} step={5} value={sec} onChange={(e) => setSec(Math.max(10, Math.min(180, Number(e.target.value) || 30)))} /></label>
        <label className="bt-f bt-title"><span>Tên phòng <small>(không bắt buộc)</small></span><input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Đấu cặp tuần 10" /></label>
      </div>
      <fieldset className="bt-units">
        <legend>Chương / bài ({pick.size} bài đã chọn)</legend>
        {units.map((u) => {
          const on = u.ids.filter((x) => pick.has(x)).length;
          return (
            <details key={u.code} className={on ? 'is-on' : ''}>
              <summary>
                <label onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={on === u.ids.length} ref={(el) => { if (el) el.indeterminate = on > 0 && on < u.ids.length; }}
                    onChange={(e) => toggleUnit(u.ids, e.target.checked)} /> <b>{u.title}</b>
                </label>
                <small>{on ? `${on}/${u.ids.length} bài` : `${u.ids.length} bài`}</small>
              </summary>
              <ul>
                {lessons.filter((l) => l.unit.code === u.code).map((l) => (
                  <li key={l.id}><label><input type="checkbox" checked={pick.has(l.id)} onChange={(e) => toggleUnit([l.id], e.target.checked)} /> {l.title}</label></li>
                ))}
              </ul>
            </details>
          );
        })}
      </fieldset>
      <button type="button" className="btn btn-primary" disabled={busy || !pick.size} onClick={() => void create()}>{busy ? 'Đang tạo…' : 'Tạo phòng & lấy mã'}</button>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
    </section>
  );
}

function BattleHost({ id, grade, onBack }: { id: string; grade: number; onBack: () => void }) {
  const [h, setH] = useState<Host | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const last = useRef('');
  const bank = useMyBank(h?.room.subject ?? 'toan', grade); // Câu của tôi được trộn vào kho chọn câu

  const apply = useCallback((d: Host) => { const j = JSON.stringify(d); if (j !== last.current) { last.current = j; setH(d); } }, []);
  const load = useCallback(async () => {
    try { apply(await api<Host>(`/api/giao-vien/dau-cap/${id}`)); setErr(''); } catch (e) { setErr((e as Error).message); }
  }, [id, apply]);
  useEffect(() => { void load(); const t = setInterval(() => void load(), 2500); return () => clearInterval(t); }, [load]);

  const lessons = useMemo(() => {
    if (!h) return [];
    const s = new Set(h.room.lessons);
    return bookLessons(h.room.subject, grade).filter((l) => s.has(l.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bank.ver: kho câu của tôi vừa nạp
  }, [h?.room.subject, h?.room.lessons.join(','), grade, bank.ver]);

  if (!h) return <p className="dash-muted">{err || 'Đang mở phòng đấu…'}</p>;
  const { room } = h;
  const alive = h.players.filter((p) => p.out === null);
  const cur = h.matches.filter((m) => m.round === room.round);
  const roundDone = cur.length > 0 && cur.every((m) => m.status === 'done');
  const canDraw = (room.status === 'lobby' && h.players.length >= 2) || (room.status === 'playing' && roundDone && alive.length >= 2);
  const rounds = [...new Set(h.matches.map((m) => m.round))].sort((a, b) => a - b);

  const post = async (body: object, label: string) => {
    setBusy(label); setErr('');
    try { apply(await api<Host>(`/api/giao-vien/dau-cap/${id}`, { method: 'POST', body: JSON.stringify(body) })); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(''); }
  };
  const draw = () => {
    const sets = buildSets(lessons, room.n, alive.length, Math.floor(alive.length / 2), h.used);
    if (!sets) { setErr(battleError('bad_sets')); return; }
    void post({ action: 'draw', sets }, 'draw');
  };
  const replay = (m: Match) => {
    if (!window.confirm(`Cho ${m.aName} và ${m.bName} đấu lại trận này với bộ câu mới?`)) return;
    const sets = buildSets(lessons, room.n, alive.length, 1, h.used);
    if (!sets) { setErr(battleError('bad_sets')); return; }
    void post({ action: 'replay', matchId: m.id, set: sets[0] }, m.id);
  };
  const force = (m: Match, winner: string, name: string) => {
    if (window.confirm(`Xử ${name} thắng trận này?`)) void post({ action: 'force', matchId: m.id, winner }, m.id);
  };

  return (
    <div className="bt-host">
      <div className="bt-host-top">
        <button type="button" className="mini-btn" onClick={onBack}>← Danh sách phòng</button>
        <span className={`bt-st is-${room.status}`}>{STATUS[room.status] ?? room.status}</span>
        {room.status !== 'closed' && (
          <button type="button" className="mini-btn" disabled={!!busy} onClick={() => { if (window.confirm('Đóng phòng đấu? Các em sẽ không đấu tiếp được.')) void post({ action: 'close' }, 'close'); }}><Lock aria-hidden="true" /> Đóng phòng</button>
        )}
      </div>
      <header className="bt-banner">
        <div>
          <p className="bt-kicker">{SUBJECT_NAME[room.subject]} · {room.n} câu/trận · {room.sec} giây/câu · {lessons.length} bài</p>
          <h2>{room.title}</h2>
        </div>
        {room.status === 'lobby' && <div className="bt-code" aria-label={`Mã phòng ${room.code}`}><small>Mã phòng</small><b>{room.code}</b></div>}
      </header>

      {room.status === 'done' && room.championName && (
        <div className="bt-champ" role="status"><Crown aria-hidden="true" /> Nhà vô địch: <b>{room.championName}</b> 🎉</div>
      )}

      {room.status === 'lobby' && (
        <section className="bt-lobby">
          <h3><Users aria-hidden="true" /> {h.players.length} em đã vào phòng</h3>
          {!h.players.length && <p className="dash-muted">Các em vào trang của em → ô <b>Vào Đấu cặp</b> → nhập mã <b>{room.code}</b>.</p>}
          <ul className="bt-chips">{h.players.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
        </section>
      )}

      {canDraw && (
        <div className="bt-draw">
          <button type="button" className="btn btn-yellow bt-draw-btn" disabled={!!busy} onClick={draw}>
            <Shuffle aria-hidden="true" /> {busy === 'draw' ? 'Đang bốc thăm…' : `Bốc thăm ${room.status === 'lobby' ? 'vòng 1' : `vòng ${room.round + 1}`} · ${roundName(alive.length)}`}
          </button>
          <small className="dash-muted">{alive.length} em · {Math.floor(alive.length / 2)} trận{alive.length % 2 ? ' · 1 em nhận vé đi tiếp' : ''}</small>
        </div>
      )}
      {room.status === 'playing' && !roundDone && <p className="dash-muted bt-note">Các trận đang đấu. Em nào mất mạng thì đợi máy tự tính hết giờ, hoặc bấm <b>Xử thắng</b> / <b>Đấu lại</b>.</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}

      {rounds.length > 0 && (
        <div className="bt-bracket" aria-label="Sơ đồ nhánh">
          {rounds.map((r) => (
            <section key={r} className="bt-col">
              <h3>Vòng {r}</h3>
              <ol>
                {h.matches.filter((m) => m.round === r).map((m, k) => (
                  <li key={m.id} className={`bt-match is-${m.status}`} style={{ animationDelay: `${Math.min(k, 12) * 80}ms` }}>
                    {!m.b ? (
                      <p className="bt-line is-win"><span>{m.aName}</span><em>🎟️ vé đi tiếp</em></p>
                    ) : (
                      <>
                        <Line name={m.aName} p={m.pa} n={m.n} win={m.winner === m.a} done={m.status === 'done'} />
                        <Line name={m.bName ?? ''} p={m.pb} n={m.n} win={m.winner === m.b} done={m.status === 'done'} />
                        {m.status === 'done' && m.reason && <small className="bt-why">{REASON_LABEL[m.reason]}</small>}
                        {r === room.round && room.status === 'playing' && (
                          <div className="bt-match-tools">
                            {m.status === 'playing' && <>
                              <button type="button" className="mini-btn" disabled={!!busy} onClick={() => force(m, m.a, m.aName)}><Gavel aria-hidden="true" /> {m.aName.split(' ').pop()} thắng</button>
                              <button type="button" className="mini-btn" disabled={!!busy} onClick={() => force(m, m.b!, m.bName ?? '')}><Gavel aria-hidden="true" /> {(m.bName ?? '').split(' ').pop()} thắng</button>
                            </>}
                            <button type="button" className="mini-btn" disabled={!!busy} onClick={() => replay(m)}><RotateCcw aria-hidden="true" /> Đấu lại</button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Line({ name, p, n, win, done }: { name: string; p: P; n: number; win: boolean; done: boolean }) {
  return (
    <p className={`bt-line${done ? (win ? ' is-win' : ' is-stop') : ''}`}>
      <span>{win && '🏅 '}{name}</span>
      {done ? <em>{p ? `${p.correct}/${n} · ${fmtMs(p.ms)}` : ''}</em>
        : <em className="bt-prog"><i style={{ transform: `scaleX(${p ? Math.min(1, p.i / Math.max(1, n)) : 0})` }} /><span>{p?.done ? 'xong' : `${Math.min((p?.i ?? 0) + 1, n)}/${n}`}</span></em>}
    </p>
  );
}
