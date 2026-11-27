'use client';

// PHÒNG THI LỚP (chặng “Ra hoa”, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.1) — trang của cô:
// tạo phòng (sinh đề riêng cho từng em ngay trên máy cô), phát mã, xem kết quả, cho làm lại, xem cờ bất thường.
// Tuỳ chọn ĐẤU CẶP (mục 8.2, migration 0073): bốc thăm chia cặp, mỗi vòng một phòng thi, loại trực tiếp (BattlePanel).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, DoorOpen, Eye, FileSpreadsheet, Flag, Lock, QrCode as QrIcon, RotateCcw, Settings2, Swords, Trash2, Unlock, Users } from 'lucide-react';
import QrCode from '@/components/billing/QrCode';
import { XS, downloadXlsx, range, type XCell } from '@/lib/xlsx';
import { createClient } from '@/lib/supabase/client';
import { useGradeContent } from '@/components/learn/GradeReady';
import { SUBJECT_NAME, type ExamItem } from '@/lib/classroom/assignments';
import { bookLessons, defaultMatrix, totals, type Matrix } from '@/lib/exams/matrix';
import { commonPaperFor, paperByPlan, previewPaper, roomPaper, seedFor, slotItem, type RoomMode, type RoomPlan } from '@/lib/classroom/rooms-build';
import RoomRules, { RATIOS } from './RoomRules';
import RoomPreview, { draftProblems, type RoomDraft } from './RoomPreview';
import BattlePanel from './BattlePanel';
import { battleError } from '@/lib/classroom/battle';
import {
  FLAG_LABEL, ROOM_RATIO, lessonStats, owlOf, roomDefaults, roomError, toLocalInput, whenLabel,
  type RoomDetailRow, type RoomRow,
} from '@/lib/classroom/rooms';
import type { SubjectCode } from '@/lib/types';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/room.css';
import '@/styles/bt.css';

type Student = { id: string; name: string };
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const mins = (ms: number | null) => (ms === null ? '' : `${Math.floor(ms / 60000)}′${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}″`);

function endOfDay() { const d = new Date(); d.setHours(21, 0, 0, 0); if (d.getTime() < Date.now() + 30 * 60_000) d.setTime(Date.now() + 2 * 3600_000); return d; }

export default function ExamRooms({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const { version } = useGradeContent(grade);
  const subjects = useMemo(() => (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => bookLessons(s, grade).length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tính lại khi kho bài của khối vừa nạp xong
    [grade, version]);
  const [rooms, setRooms] = useState<RoomRow[] | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [battleTick, setBattleTick] = useState(0); // tạo đấu cặp mới → khung Đấu cặp tải lại

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_rooms', { p_class: classId });
    if (error) { setErr(roomError(error.message)); setRooms([]); return; }
    setRooms((data ?? []) as RoomRow[]);
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const topRef = useRef<HTMLDivElement>(null);
  // Danh sách phòng ở đầu trang (cô mở trang chủ yếu để xem mã, kết quả); khung tạo phòng ở dưới
  return (
    <>
      <div ref={topRef} />
      {msg && <p className="adm-alert is-ok" role="status">{msg}</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      <section className="dash-section">
        <h2><DoorOpen aria-hidden="true" /> Phòng thi của lớp</h2>
        {rooms === null ? <p className="dash-muted">Đang tải…</p> : rooms.length === 0 ? <p className="dash-muted">Chưa có phòng thi nào. Tạo phòng ở phần dưới.</p> : (
          <ul className="room-list">
            {rooms.map((r) => (
              <RoomCard key={r.id} room={r} open={openId === r.id} onToggle={() => setOpenId((x) => (x === r.id ? null : r.id))} onChanged={load} />
            ))}
          </ul>
        )}
      </section>
      <BattlePanel classId={classId} grade={grade} refresh={battleTick} onChanged={() => void load()} />
      <CreateRoom classId={classId} className={className} grade={grade} students={students} subjects={subjects}
        onCreated={(code, battle) => {
          setMsg(battle ? `Đã bốc thăm chia cặp và mở vòng 1. Mã phòng vòng 1: ${code} — các em làm lúc nào cũng được trong giờ mở; cặp nào hai em nộp xong là có kết quả.`
            : `Đã tạo phòng thi. Mã phòng: ${code} — đọc hoặc viết mã lên bảng cho các em.`);
          void load(); if (battle) setBattleTick((t) => t + 1);
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} />
    </>
  );
}

// ------------------------------------------------------------------------------------------------ Tạo phòng
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function CreateRoom({ classId, className, grade, students, subjects, onCreated }: {
  classId: string; className: string; grade: number; students: Student[]; subjects: SubjectCode[]; onCreated: (code: string, battle?: boolean) => void;
}) {
  const def = roomDefaults(grade);
  const [subject, setSubject] = useState<SubjectCode>(subjects[0] ?? 'toan');
  const lessons = useMemo(() => bookLessons(subject, grade), [subject, grade]);
  const units = useMemo(() => {
    const m = new Map<string, { code: string; title: string; semester: number; ids: string[] }>();
    for (const l of lessons) {
      const u = m.get(l.unit.code) ?? { code: l.unit.code, title: l.unit.title, semester: l.semester, ids: [] };
      u.ids.push(l.id); m.set(l.unit.code, u);
    }
    return [...m.values()];
  }, [lessons]);
  const [picked, setPicked] = useState<string[]>([]);
  const [n, setN] = useState(def.n);
  const [minutes, setMinutes] = useState(def.minutes);
  const [opens, setOpens] = useState(() => toLocalInput(new Date()));
  const [closes, setCloses] = useState(() => toLocalInput(endOfDay()));
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Quy tắc sinh đề (cô tự đặt) + đề xem trước (cô duyệt, sửa)
  const [mode, setMode] = useState<RoomMode>('rieng');
  const [ratio, setRatio] = useState(RATIOS[0].key);
  const [custom, setCustom] = useState<Matrix | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [drafts, setDrafts] = useState<RoomDraft[] | null>(null);
  // Đấu cặp: bốc thăm chia cặp, mỗi cặp chung một đề, loại trực tiếp qua từng vòng (mỗi vòng một phòng thi)
  const [battle, setBattle] = useState(false);
  // Xếp đề theo dạng (chọn → điền → nối → xếp nhóm, mỗi dạng dễ → khó) như đề thi Tiếng Việt trực tuyến; mặc định bật cho Tiếng Việt
  const [byDang, setByDang] = useState(() => (subjects[0] ?? 'toan') === 'tieng-viet');

  const chosen = useMemo(() => lessons.filter((l) => picked.includes(l.unit.code)), [lessons, picked]);
  const auto: Matrix | null = useMemo(() => {
    if (!chosen.length) return null;
    return defaultMatrix(chosen, n, RATIOS.find((r) => r.key === ratio)?.r ?? ROOM_RATIO);
  }, [chosen, n, ratio]);
  const matrix = useMemo<Matrix | null>(() => { const m = custom ?? auto; return m ? { ...m, layout: byDang ? 'dang' : undefined } : null; }, [custom, auto, byDang]);
  const t = matrix ? totals(matrix) : null;
  const have = t?.questions ?? 0;
  const autoTitle = `${battle ? 'Đấu cặp' : 'Phòng thi'} ${SUBJECT_NAME[subject]}${chosen.length ? ` – ${units.filter((u) => picked.includes(u.code)).map((u) => u.title).slice(0, 2).join(', ')}` : ''}`;
  const problems = drafts ? draftProblems(drafts) : 0;
  const editedCount = drafts ? drafts.reduce((a, d) => a + d.slots.filter((s) => s.edited).length, 0) : 0;

  /** Đổi quy tắc thì đề xem trước không còn đúng: hỏi trước nếu cô đã sửa câu */
  const dropDrafts = () => {
    if (editedCount && !window.confirm('Đổi quy tắc sẽ bỏ đề xem trước (kể cả các câu cô đã sửa). Tiếp tục?')) return false;
    setDrafts(null);
    return true;
  };
  const resetRules = () => { setCustom(null); setRatio((r) => (r === 'tu-chinh' ? RATIOS[0].key : r)); };

  const makeDrafts = (m: Matrix): RoomDraft[] => {
    const salt = Date.now() >>> 0;
    return mode === 'chung'
      ? [{ student: null, slots: previewPaper(m, newSeed()).slots }]
      : students.map((s) => ({ student: s.id, slots: previewPaper(m, seedFor(s.id, salt)).slots }));
  };
  const preview = () => {
    setErr('');
    if (!matrix || !have) return setErr('Chọn chủ đề và đặt ít nhất một câu trong quy tắc.');
    if (mode === 'rieng' && !students.length) return setErr('Lớp chưa có học sinh.');
    if (drafts && !dropDrafts()) return;
    setDrafts(makeDrafts(matrix));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!matrix || !chosen.length) return setErr('Chọn ít nhất một chủ đề.');
    if (!have) return setErr('Quy tắc sinh đề chưa có câu nào.');
    if (!students.length) return setErr('Lớp chưa có học sinh.');
    if (problems) return setErr(`Còn ${problems} câu trong đề xem trước có đáp án chưa chấm được — sửa lại hoặc đổi câu đó.`);
    const o = new Date(opens), c = new Date(closes);
    if (Number.isNaN(o.getTime()) || Number.isNaN(c.getTime()) || c <= o) return setErr('Giờ đóng phải sau giờ mở.');
    if (battle) return void createBattle(o, c);
    setBusy(true);
    const salt = Date.now() >>> 0;
    const plan: RoomPlan = { ...matrix, mode };
    let papers: { student: string; questions: ExamItem[] }[];
    if (mode === 'chung') {
      const base = (drafts?.[0]?.slots ?? previewPaper(matrix, salt).slots).map((s) => slotItem(s, matrix.points));
      plan.base = base;
      papers = students.map((s) => ({ student: s.id, questions: commonPaperFor(base, seedFor(s.id, salt), matrix.layout) }));
    } else {
      papers = students.map((s) => {
        const d = drafts?.find((x) => x.student === s.id);
        return { student: s.id, questions: d ? d.slots.map((x) => slotItem(x, matrix.points)) : roomPaper(matrix, seedFor(s.id, salt)).items };
      });
    }
    if (papers.some((p) => p.questions.length < Math.min(3, have))) { setBusy(false); return setErr('Ngân hàng chưa đủ câu cho các chủ đề đã chọn — chọn thêm chủ đề hoặc giảm số câu.'); }
    const { data, error } = await createClient().rpc('teacher_create_room', {
      p_class: classId, p_title: (title.trim() || autoTitle).slice(0, 200), p_subject: subject,
      p_n: Math.max(...papers.map((p) => p.questions.length)), p_minutes: minutes,
      p_opens: o.toISOString(), p_closes: c.toISOString(), p_matrix: plan, p_papers: papers,
    });
    setBusy(false);
    if (error) return setErr(roomError(error.message));
    const row = ((data ?? []) as { id: string; code: string }[])[0];
    setPicked([]); setTitle(''); setDrafts(null); setCustom(null);
    onCreated(row?.code ?? '');
  };

  /** Đấu cặp: máy cô sinh một đề cho mỗi cặp theo quy tắc; máy chủ bốc thăm, tạo phòng vòng 1 và gán đề cho từng cặp */
  const createBattle = async (o: Date, c: Date) => {
    if (!matrix) return;
    if (students.length < 2) return setErr('Cần ít nhất 2 em để chia cặp.');
    const sets = Array.from({ length: Math.floor(students.length / 2) }, () => roomPaper(matrix, newSeed()).items);
    if (sets.some((s) => s.length < Math.min(3, have))) return setErr('Ngân hàng chưa đủ câu cho các chủ đề đã chọn — chọn thêm chủ đề hoặc giảm số câu.');
    setBusy(true);
    try {
      const res = await fetch('/api/giao-vien/dau-cap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        classId, title: (title.trim() || autoTitle).slice(0, 180), subject, minutes, opens: o.toISOString(), closes: c.toISOString(),
        plan: matrix, students: students.map((s) => s.id), sets,
      }) });
      const d = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
      if (!res.ok) return setErr(battleError(d.error ?? ''));
      setPicked([]); setTitle(''); setDrafts(null); setCustom(null);
      onCreated(d.code ?? '', true);
    } catch { setErr('Mất kết nối, thử lại sau.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="dash-card room-create" onSubmit={create}>
      <h2>🌼 Tạo phòng thi mới · lớp {className}</h2>
      <p className="dash-muted">
        {mode === 'chung' ? <>Cả lớp làm <b>chung một đề</b> cô đã duyệt (mỗi em đảo thứ tự câu và phương án)</> : <>Mỗi em nhận <b>một đề riêng</b> theo cùng quy tắc</>}
        {t && t.questions > 0 ? <> — {t.byMuc[1]} câu mức 1, {t.byMuc[2]} câu mức 2, {t.byMuc[3]} câu mức 3</> : null}, làm <b>một lần</b>, máy chấm ngay. Em chỉ thấy kết quả của mình; đáp án hiện sau khi phòng đóng.
      </p>
      <div className="room-form">
        <label className="adm-field"><span>Môn</span>
          <select value={subject} onChange={(e) => { if (!dropDrafts()) return; setSubject(e.target.value as SubjectCode); setByDang(e.target.value === 'tieng-viet'); setPicked([]); resetRules(); }}>
            {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}
          </select>
        </label>
        <label className="adm-field"><span>Số câu</span>
          <input type="number" min={3} max={40} value={n} onChange={(e) => { if (!dropDrafts()) return; setN(Math.max(3, Math.min(40, Number(e.target.value) || def.n))); resetRules(); }} />
        </label>
        <label className="adm-field"><span>Thời gian (phút)</span>
          <input type="number" min={5} max={90} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(90, Number(e.target.value) || def.minutes)))} />
        </label>
        <label className="adm-field"><span>Mở lúc</span><input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} required /></label>
        <label className="adm-field"><span>Đóng lúc</span><input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} required /></label>
        <label className="adm-field room-title"><span>Tên phòng (tuỳ chọn)</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={autoTitle} maxLength={200} /></label>
      </div>
      <label className={`bt-toggle${battle ? ' is-on' : ''}`}>
        <input type="checkbox" checked={battle} onChange={(e) => { if (!dropDrafts()) return; setBattle(e.target.checked); }} />
        <Swords aria-hidden="true" />
        <span><b>Đấu cặp — bốc thăm chia cặp, loại trực tiếp</b>
          <small>Máy bốc thăm chia cặp, mỗi cặp làm chung một đề (mỗi em đảo thứ tự câu, phương án). Các em làm lúc nào cũng được trong giờ mở — không cần vào cùng lúc. Đúng nhiều câu hơn thắng; bằng câu thì ai làm nhanh hơn thắng. Em thắng vào vòng sau (đề mới, khó hơn) đến khi có nhà vô địch.</small></span>
      </label>
      <fieldset className="room-units">
        <legend>Chủ đề kiểm tra</legend>
        {units.length === 0 ? <p className="dash-muted">Đang tải ngân hàng bài…</p> : units.map((u) => (
          <label key={u.code} className={`room-unit${picked.includes(u.code) ? ' is-on' : ''}`}>
            <input type="checkbox" checked={picked.includes(u.code)} onChange={(e) => { if (!dropDrafts()) return; const on = e.target.checked; setPicked((p) => (on ? [...p, u.code] : p.filter((x) => x !== u.code))); resetRules(); }} />
            <span><b>{u.title}</b><small>HK{u.semester} · {u.ids.length} bài</small></span>
          </label>
        ))}
      </fieldset>
      {matrix && <p className={have < n ? 'exam-warn' : 'dash-muted'}>{have < n ? `Quy tắc hiện có ${have} câu (ít hơn ${n}) — chủ đề đã chọn còn ít câu, hoặc cô đã bớt câu.` : `Đủ ${have} câu cho ${mode === 'chung' ? 'đề chung' : `${students.length} đề riêng`}.`}</p>}

      {/* Hai bước luôn hiện để cô thấy có thể chỉnh; cần chọn chủ đề trước mới bấm được */}
      <section className="room-step" aria-label="Quy tắc sinh đề">
        <div className="room-step-head">
          <h3><span className="room-step-no">1</span><Settings2 aria-hidden="true" /> Quy tắc sinh đề</h3>
          <span className="dash-muted">{!matrix ? 'Tick ít nhất một chủ đề ở trên để đặt quy tắc: đề riêng / đề chung, số câu từng mức, điểm mỗi câu.'
            : `${mode === 'chung' ? 'Đề chung' : 'Đề riêng từng em'} · ${ratio === 'tu-chinh' ? 'cô tự chỉnh' : RATIOS.find((r) => r.key === ratio)?.name}${t ? ` · ${t.questions} câu · ${t.score} đ` : ''}`}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowRules((v) => !v)} aria-expanded={showRules && !!matrix} disabled={!matrix}><Settings2 aria-hidden="true" /> {showRules && matrix ? 'Thu gọn' : 'Chỉnh quy tắc'}</button>
        </div>
        {matrix && showRules && (
            <RoomRules matrix={matrix} subject={subject} mode={mode} ratio={ratio} nStudents={students.length}
              byDang={byDang} onByDang={(v) => { if (v === byDang || !dropDrafts()) return; setByDang(v); }}
              onMode={(m) => { if (m === mode || !dropDrafts()) return; setMode(m); }}
              onRatio={(k) => { if (!dropDrafts()) return; setCustom(null); setRatio(k); }}
              onMatrix={(m) => { if (!dropDrafts()) return; setCustom(m); setRatio('tu-chinh'); }} />
        )}
      </section>

      {!battle && <section className="room-step" aria-label="Xem trước đề">
        <div className="room-step-head">
          <h3><span className="room-step-no">2</span><Eye aria-hidden="true" /> Xem trước và sửa đề</h3>
          <span className="dash-muted">{!matrix ? 'Sau khi chọn chủ đề, bấm “Xem trước đề” để xem từng đề, đổi câu, sửa câu hỏi và đáp án.'
            : drafts ? `${drafts.length} đề · ${editedCount} câu cô đã sửa` : 'Không bắt buộc — bỏ qua thì máy sinh đề lúc tạo phòng.'}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={preview} disabled={!have}><Eye aria-hidden="true" /> {drafts ? 'Sinh lại đề' : 'Xem trước đề'}</button>
        </div>
        {matrix && drafts && (
          <RoomPreview drafts={drafts} matrix={matrix} students={students} onChange={setDrafts}
            onRegenerate={(sid) => setDrafts((ds) => ds && ds.map((d) => (d.student === sid ? { student: sid, slots: previewPaper(matrix, newSeed()).slots } : d)))} />
        )}
      </section>}

      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      <button type="submit" className="btn btn-yellow" disabled={busy || !picked.length || problems > 0}>
        {battle ? <Swords aria-hidden="true" /> : <DoorOpen aria-hidden="true" />} {busy ? (battle ? 'Đang bốc thăm chia cặp…' : 'Đang tạo đề cho từng em…')
          : battle ? `Bốc thăm chia cặp & mở vòng 1 cho ${students.length} em` : `Tạo phòng cho ${students.length} em${drafts ? ' với đề đã duyệt' : ''}`}
      </button>
    </form>
  );
}

// ------------------------------------------------------------------------------------------------ Một phòng
function RoomCard({ room, open, onToggle, onChanged }: { room: RoomRow; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const now = Date.now();
  const live = room.status === 'open' && now >= new Date(room.opens_at).getTime() && now < new Date(room.closes_at).getTime();
  const soon = room.status === 'open' && now < new Date(room.opens_at).getTime();
  const state = live ? 'Đang mở' : soon ? 'Sắp mở' : 'Đã đóng';
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(false);

  const setStatus = async (o: boolean) => {
    setBusy(true);
    await createClient().rpc('teacher_room_status', { p_room: room.id, p_open: o });
    setBusy(false); onChanged();
  };
  const remove = async () => {
    if (!window.confirm(`Xoá phòng “${room.title}” và toàn bộ bài làm trong phòng? Không hoàn tác được.`)) return;
    setBusy(true);
    await createClient().rpc('teacher_room_delete', { p_room: room.id });
    setBusy(false); onChanged();
  };

  return (
    <li className={`room-card is-${live ? 'live' : soon ? 'soon' : 'closed'}`}>
      <div className="room-card-head">
        <div className="room-code-wrap">
          <div className="room-code" aria-label={`Mã phòng ${room.code.split('').join(' ')}`}>{room.code}</div>
          <CopyCode code={room.code} />
        </div>
        <div className="room-card-info">
          <strong>{room.title}</strong>
          <span>{SUBJECT_NAME[room.subject]} · {room.n_questions} câu · {room.minutes} phút · {whenLabel(room.opens_at)} → {whenLabel(room.closes_at)}</span>
          <span><span className={`room-chip is-${live ? 'live' : soon ? 'soon' : 'closed'}`}>{state}</span> <Users aria-hidden="true" /> Đã nộp {room.done}/{room.assigned}{room.started > room.done ? ` · đang làm ${room.started - room.done}` : ''}{room.flagged ? <> · <Flag aria-hidden="true" /> {room.flagged} bài cần xem</> : null}</span>
        </div>
        <div className="room-card-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onToggle} aria-expanded={open}>{open ? 'Thu gọn' : 'Kết quả'}</button>
          <button type="button" className="mini-btn" onClick={() => setQr((v) => !v)} aria-expanded={qr}><QrIcon aria-hidden="true" /> Mã QR</button>
          {room.status === 'open'
            ? <button type="button" className="mini-btn" onClick={() => setStatus(false)} disabled={busy}><Lock aria-hidden="true" /> Đóng phòng</button>
            : <button type="button" className="mini-btn" onClick={() => setStatus(true)} disabled={busy}><Unlock aria-hidden="true" /> Mở lại</button>}
          <button type="button" className="mini-btn is-danger" onClick={remove} disabled={busy} aria-label="Xoá phòng"><Trash2 aria-hidden="true" /></button>
        </div>
      </div>
      {qr && <RoomQr code={room.code} title={room.title} />}
      {open && <RoomDetail room={room} onChanged={onChanged} />}
    </li>
  );
}

/** Mã QR vào phòng: cô chiếu lên bảng, học sinh quét bằng máy tính bảng / điện thoại → vào thẳng phòng (đăng nhập trước nếu chưa) */
function RoomQr({ code, title }: { code: string; title: string }) {
  const [link, setLink] = useState('');
  useEffect(() => { setLink(`${window.location.origin}/hoc-sinh?phong=${code}`); }, [code]);
  if (!link) return null;
  return (
    <div className="room-qr">
      <QrCode text={link} size={240} label={`Mã QR vào phòng ${code}`} />
      <div>
        <p><b>Quét để vào phòng “{title}”</b></p>
        <p className="room-qr-code">{code}</p>
        <p className="dash-muted">Em quét mã bằng máy tính bảng / điện thoại (đã đăng nhập tài khoản của em) là vào thẳng phòng; máy không quét được thì vào Trang của em, gõ mã phòng.</p>
        <p className="dash-muted room-qr-link">{link}</p>
      </div>
    </div>
  );
}

/** Nút chép nhanh mã phòng (dán vào nhóm phụ huynh, tin nhắn…) */
function CopyCode({ code }: { code: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1500); } catch { window.prompt('Chép mã phòng:', code); }
  };
  return (
    <button type="button" className={`room-copy${ok ? ' is-ok' : ''}`} onClick={copy} aria-label={`Chép mã phòng ${code}`} title="Chép mã phòng">
      {ok ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span>{ok ? 'Đã chép' : 'Chép mã'}</span>
    </button>
  );
}

function RoomDetail({ room, onChanged }: { room: RoomRow; onChanged: () => void }) {
  const [rows, setRows] = useState<RoomDetailRow[] | null>(null);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_room_detail', { p_room: room.id });
    if (error) return setErr(roomError(error.message));
    setRows((data ?? []) as RoomDetailRow[]);
  }, [room.id]);
  useEffect(() => { void load(); }, [load]);

  const newPaper = async (r: RoomDetailRow) => {
    const retake = r.done || r.started_at;
    if (retake && !window.confirm(`Cho ${r.display_name} làm lại với đề mới? Kết quả cũ được lưu vào nhật ký.`)) return;
    // đề mới theo đúng quy tắc của phòng: đề chung → đảo lại đề chung; đề riêng → sinh theo ma trận
    const plan = room.matrix as unknown as RoomPlan;
    if (!plan?.rows?.length && !plan?.base?.length) return setErr('Phòng này thiếu quy tắc sinh đề để tạo đề mới.');
    setBusyId(r.student_id);
    const p = paperByPlan(plan, seedFor(r.student_id, Date.now() >>> 0));
    const { error } = await createClient().rpc('teacher_room_set_paper', { p_room: room.id, p_student: r.student_id, p_questions: p.items });
    setBusyId(null);
    if (error) return setErr(roomError(error.message));
    void load(); onChanged();
  };

  if (err) return <p className="adm-alert is-error">{err}</p>;
  if (!rows) return <p className="dash-muted">Đang tải kết quả…</p>;
  const done = rows.filter((r) => r.done);
  const avg = done.length ? done.reduce((a, r) => a + Number(r.score), 0) / done.length : null;
  const owls = { gold: 0, silver: 0, bronze: 0, try: 0 };
  for (const r of done) owls[owlOf(Number(r.score)).key]++;
  const weak = lessonStats(done.map((r) => r.answers)).filter((s) => s.n >= 2).slice(0, 5);

  /** Bảng điểm Excel: mỗi em một dòng, điểm trung bình / cao nhất / thấp nhất bằng công thức */
  const excel = () => {
    const H = 3, first = H + 1, last = H + rows.length;
    const head = ['STT', 'Học sinh', 'Trạng thái', 'Điểm', 'Huy hiệu', 'Sao', 'Thời gian làm', 'Cần xem'];
    const out: XCell[][] = [
      [{ v: room.title.toUpperCase(), s: XS.title }],
      [{ v: `Mã phòng ${room.code} · ${SUBJECT_NAME[room.subject]} · ${room.n_questions} câu · ${room.minutes} phút`, s: XS.italic }],
      [],
      head.map((h) => ({ v: h, s: XS.headFill })),
      ...rows.map((r, i): XCell[] => {
        const owl = r.done ? owlOf(Number(r.score)) : null;
        return [
          { v: i + 1, s: XS.center }, { v: r.display_name, s: XS.text },
          { v: !r.has_paper ? 'Chưa có đề' : r.done ? 'Đã nộp' : r.started_at ? 'Đang làm' : 'Chưa vào', s: XS.text },
          { v: r.done ? Number(r.score) : '', s: XS.center },
          { v: owl && owl.key !== 'try' ? owl.name : '', s: XS.text },
          { v: r.done ? `${r.stars}/${r.max_stars}` : '', s: XS.center },
          { v: r.done ? mins(r.duration_ms) : '', s: XS.center },
          { v: r.flags.map((f) => FLAG_LABEL[f] ?? f).join('; '), s: XS.text },
        ];
      }),
    ];
    const col = `D${first + 1}:D${last + 1}`;
    const stat = (label: string, f: string): XCell[] => [{ v: label, s: XS.boldText }, { v: '', s: XS.boldText }, { v: '', s: XS.boldText }, { f: `IF(COUNT(${col})=0,"",${f}(${col}))`, s: XS.centerBold }];
    const sr = out.length;
    out.push(stat('Điểm trung bình', 'AVERAGE'), stat('Điểm cao nhất', 'MAX'), stat('Điểm thấp nhất', 'MIN'));
    out.push([{ f: `"Đã nộp: "&COUNT(${col})&"/${rows.length} em"`, s: XS.note }]);
    downloadXlsx(`diem-phong-${room.code}.xlsx`, [{
      name: `Phong ${room.code}`, rows: out, cols: [5, 26, 12, 8, 12, 8, 12, 22],
      merges: [range(0, 0, 0, 7), range(1, 0, 1, 7), ...[0, 1, 2].map((k) => range(sr + k, 0, sr + k, 2)), range(sr + 3, 0, sr + 3, 7)],
      freeze: { rows: H + 1, cols: 2 }, printTitleRows: [H, H], center: true,
    }]);
  };

  return (
    <div className="room-detail">
      {done.length > 0 && (
        <div className="room-summary">
          <p><b>{done.length}</b> em đã nộp · điểm trung bình <b>{fmt(avg ?? 0)}</b>/10</p>
          <p>🦉 Cú Vàng <b>{owls.gold}</b> · Cú Bạc <b>{owls.silver}</b> · Cú Đồng <b>{owls.bronze}</b> · dưới 7 điểm <b>{owls.try}</b></p>
          {weak.length > 0 && (
            <div className="room-weak">
              <span>Kỹ năng cả lớp cần ôn (tỉ lệ đúng thấp nhất):</span>
              <ul>{weak.map((w) => <li key={w.lesson}><span>{w.lesson}</span><meter min={0} max={1} value={w.ok / w.n} /><b>{Math.round((w.ok / w.n) * 100)}%</b></li>)}</ul>
            </div>
          )}
        </div>
      )}
      <p className="room-excel"><button type="button" className="btn btn-outline btn-sm" onClick={excel} disabled={!rows.length}><FileSpreadsheet aria-hidden="true" /> Tải Excel bảng điểm</button></p>
      <div className="adm-table-wrap">
        <table className="adm-table room-table">
          <thead><tr><th>Học sinh</th><th>Trạng thái</th><th>Điểm</th><th>Huy hiệu</th><th>Sao</th><th>Thời gian</th><th>Cần xem</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => {
              const owl = r.done ? owlOf(Number(r.score)) : null;
              return (
                <tr key={r.student_id} className={r.flags.length ? 'is-flag' : undefined}>
                  <td>{r.display_name}{r.retakes > 0 && <small className="dash-muted"> · làm lại {r.retakes}</small>}</td>
                  <td>{!r.has_paper ? 'Chưa có đề' : r.done ? 'Đã nộp' : r.started_at ? 'Đang làm' : 'Chưa vào'}</td>
                  <td>{r.done ? <b>{fmt(Number(r.score))}</b> : '—'}</td>
                  <td>{owl ? (owl.key === 'try' ? '—' : owl.name) : ''}</td>
                  <td>{r.done ? `${r.stars}/${r.max_stars}` : ''}</td>
                  <td>{r.done ? mins(r.duration_ms) : ''}</td>
                  <td>{r.flags.map((f) => <span key={f} className="room-flag" title={FLAG_LABEL[f] ?? f}><Flag aria-hidden="true" /> {FLAG_LABEL[f] ?? f}</span>)}</td>
                  <td>
                    {(!r.has_paper || r.done || r.started_at) && (
                      <button type="button" className="mini-btn" onClick={() => newPaper(r)} disabled={busyId === r.student_id}>
                        <RotateCcw aria-hidden="true" /> {!r.has_paper ? 'Tạo đề cho em' : 'Cho làm lại'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="dash-muted">Cờ chỉ để cô xem lại — hệ thống không tự trừ điểm hay huỷ bài. “Cho làm lại” giao đề mới theo đúng quy tắc của phòng (đề chung thì đảo lại đề chung); kết quả cũ lưu trong nhật ký.</p>
    </div>
  );
}
