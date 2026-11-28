'use client';

// PHÒNG THI LỚP (chặng “Ra hoa”, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.1) — trang của cô:
// tạo phòng (sinh đề riêng cho từng em ngay trên máy cô), phát mã, xem kết quả, cho làm lại, xem cờ bất thường.
// Hình thức thêm: ĐẤU CẶP (mục 8.2, migration 0073 — BattlePanel) và ĐẤU TỔ (cả lớp một phòng, cộng điểm theo tổ
// của Thi đua tổ — src/lib/classroom/team-battle.ts, không cần bảng mới).
// Bố cục: Phòng thi của lớp (thẻ mã phòng lớn) → Đấu cặp (dải thẻ trượt) → Tạo phòng thi mới (thông tin + hình thức) → Chủ đề kiểm tra.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, BookOpen, CalendarDays, Check, ChevronDown, Clock, Copy, Crown, Eye, FileSpreadsheet, Flag, Link2, ListOrdered,
  Lock, Pencil, Play, Plus, QrCode as QrIcon, RotateCcw, Search, Settings2, Trash2, Unlock, Users,
} from 'lucide-react';
import QrCode from '@/components/billing/QrCode';
import { XS, downloadXlsx, range, type XCell } from '@/lib/xlsx';
import { createClient } from '@/lib/supabase/client';
import { useGradeContent } from '@/components/learn/GradeReady';
import { SUBJECT_NAME, type ExamItem } from '@/lib/classroom/assignments';
import { bookLessons, defaultMatrix, totals, type Matrix, type PaperSlot } from '@/lib/exams/matrix';
import { commonPaperFor, paperByPlan, previewPaper, roomPaper, seedFor, slotItem, type RoomMode, type RoomPlan } from '@/lib/classroom/rooms-build';
import RoomRules, { RATIOS } from './RoomRules';
import RoomPreview, { draftProblems, type RoomDraft } from './RoomPreview';
import TeamQuiz from './TeamQuiz';
import BattlePanel from './BattlePanel';
import { battleError } from '@/lib/classroom/battle';
import { normalizeTeams, teamIconSrc, type Team } from '@/lib/classroom/class-tools';
import { TEAM_AWARD, TEAM_RULE, awardReason, awardedFor, teamScores, teamsOfRoom, type TeamSnap } from '@/lib/classroom/team-battle';
import { unitIcon } from '@/lib/classroom/unit-icons';
import { fold } from '@/lib/classroom/teacher-nav';
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
type Kind = 'phong' | 'cap' | 'to';
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const mins = (ms: number | null) => (ms === null ? '' : `${Math.floor(ms / 60000)}′${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}″`);

function endOfDay() { const d = new Date(); d.setHours(21, 0, 0, 0); if (d.getTime() < Date.now() + 30 * 60_000) d.setTime(Date.now() + 2 * 3600_000); return d; }

/** Hình 3D nhỏ (ảnh webp đã tối ưu sẵn) */
export function Img3d({ src, size = 28, className }: { src: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- ảnh 3D nhỏ đã tối ưu sẵn (webp)
  return <img src={src} width={size} height={size} style={{ width: size, height: size }} alt="" aria-hidden="true" className={`ic3d ${className ?? ''}`.trim()} decoding="async" loading="lazy" />;
}
/** Biểu tượng tổ: hình 3D nếu có, không thì ký tự emoji */
function TeamIcon({ emoji, size = 26 }: { emoji: string; size?: number }) {
  const src = teamIconSrc(emoji);
  return src ? <Img3d src={src} size={size} /> : <span className="room-team-emo" aria-hidden="true">{emoji}</span>;
}

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
  const formRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => Date.now());
  const activeRooms = (rooms ?? []).filter((r) => r.status === 'open' && new Date(r.closes_at).getTime() > now);
  const closedRooms = (rooms ?? []).filter((r) => !activeRooms.includes(r));
  const removeClosed = async () => {
    if (!window.confirm(`Xoá cả ${closedRooms.length} phòng đã đóng và toàn bộ bài làm trong các phòng đó? Không hoàn tác được.`)) return;
    const sb = createClient();
    for (const r of closedRooms) await sb.rpc('teacher_room_delete', { p_room: r.id });
    void load();
  };
  const card = (r: RoomRow) => <RoomCard key={r.id} room={r} classId={classId} open={openId === r.id} onToggle={() => setOpenId((x) => (x === r.id ? null : r.id))} onChanged={load} />;
  const toForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <div ref={topRef} />
      {msg && <p className="adm-alert is-ok" role="status">{msg}</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}

      <section className="room-sec" aria-labelledby="room-h">
        <header className="room-sec-head">
          <Img3d src="/emoji/tool/phong-thi.webp" size={34} />
          <h2 id="room-h">Phòng thi của lớp</h2>
          {activeRooms.length > 0 && <span className="room-sec-n">{activeRooms.length} đang mở</span>}
          <button type="button" className="btn btn-outline btn-sm room-sec-act" onClick={toForm}><Plus aria-hidden="true" /> Tạo phòng mới</button>
        </header>
        {rooms === null ? <p className="dash-muted">Đang tải…</p> : activeRooms.length === 0 ? (
          <div className="room-empty">
            <Img3d src="/emoji/f3d/door.webp" size={44} />
            <p>{rooms.length ? 'Không có phòng nào đang mở hoặc sắp mở.' : 'Lớp chưa có phòng thi nào.'} Tạo phòng ở phần dưới, đọc mã cho các em vào làm.</p>
          </div>
        ) : <ul className="room-list">{activeRooms.map(card)}</ul>}
        {closedRooms.length > 0 && (
          <details className="room-archive">
            <summary>
              <ChevronDown aria-hidden="true" className="room-archive-chev" />
              <b>Phòng thi đã đóng</b> <span className="room-archive-n">{closedRooms.length}</span>
            </summary>
            <div className="room-archive-body">
              <p className="room-archive-tools">
                <span className="dash-muted">Bấm “Kết quả” để xem điểm, tải Excel; “Mở lại” nếu cần cho em làm tiếp.</span>
                {closedRooms.length > 1 && <button type="button" className="mini-btn is-danger" onClick={() => void removeClosed()}><Trash2 aria-hidden="true" /> Xoá cả {closedRooms.length} phòng đã đóng</button>}
              </p>
              <ul className="room-list">{closedRooms.map(card)}</ul>
            </div>
          </details>
        )}
      </section>

      <BattlePanel classId={classId} grade={grade} refresh={battleTick} onChanged={() => void load()} />

      <div ref={formRef} className="room-anchor" />
      <CreateRoom classId={classId} className={className} grade={grade} students={students} subjects={subjects}
        onCreated={(code, kind) => {
          setMsg(kind === 'cap' ? `Đã bốc thăm chia cặp và mở vòng 1. Mã phòng vòng 1: ${code} — các em làm lúc nào cũng được trong giờ mở; cặp nào hai em nộp xong là có kết quả.`
            : kind === 'to' ? `Đã tạo phòng Đấu tổ. Mã phòng: ${code} — bảng xếp hạng tổ hiện ngay dưới thẻ phòng, tự cập nhật khi các em nộp bài.`
              : `Đã tạo phòng thi. Mã phòng: ${code} — đọc hoặc viết mã lên bảng cho các em.`);
          void load(); if (kind === 'cap') setBattleTick((t) => t + 1);
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} />
    </>
  );
}

// ------------------------------------------------------------------------------------------------ Tạo phòng
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function CreateRoom({ classId, className, grade, students, subjects, onCreated }: {
  classId: string; className: string; grade: number; students: Student[]; subjects: SubjectCode[]; onCreated: (code: string, kind: Kind) => void;
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
  const [q, setQ] = useState('');
  const [sem, setSem] = useState<0 | 1 | 2>(0);
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
  // Hình thức: phòng thi thường / Đấu cặp (loại trực tiếp, mỗi vòng một phòng) / Đấu tổ (cả lớp một phòng, xếp hạng theo tổ)
  const [kind, setKind] = useState<Kind>('phong');
  const battle = kind === 'cap';
  // Tổ của lớp (Thi đua tổ) — tải khi cô bật Đấu tổ
  const [teams, setTeams] = useState<Team[] | null>(null);
  // Đấu tổ trên lớp: bộ câu đang chiếu (null: chưa mở màn trình chiếu)
  const [show, setShow] = useState<PaperSlot[] | null>(null);
  // Xếp đề theo dạng (chọn → điền → nối → xếp nhóm, mỗi dạng dễ → khó) như đề thi Tiếng Việt trực tuyến; mặc định bật cho Tiếng Việt
  const [byDang, setByDang] = useState(() => (subjects[0] ?? 'toan') === 'tieng-viet');

  useEffect(() => {
    if (kind !== 'to' || teams) return;
    void createClient().rpc('teacher_tool_get', { p_class: classId, p_tool: 'teams' }).then(({ data }) => {
      setTeams(normalizeTeams((data ?? null) as Parameters<typeof normalizeTeams>[0], students).teams);
    });
  }, [kind, teams, classId, students]);
  const teamSnap: TeamSnap[] = useMemo(() => (teams ?? []).map((t, i) => ({ no: i + 1, name: t.name, emoji: t.emoji, members: t.members })).filter((t) => t.members.length), [teams]);
  const noTeam = useMemo(() => { const inT = new Set(teamSnap.flatMap((t) => t.members)); return students.filter((s) => !inT.has(s.id)).length; }, [teamSnap, students]);

  const chosen = useMemo(() => lessons.filter((l) => picked.includes(l.unit.code)), [lessons, picked]);
  const auto: Matrix | null = useMemo(() => {
    if (!chosen.length) return null;
    return defaultMatrix(chosen, n, RATIOS.find((r) => r.key === ratio)?.r ?? ROOM_RATIO);
  }, [chosen, n, ratio]);
  const matrix = useMemo<Matrix | null>(() => { const m = custom ?? auto; return m ? { ...m, layout: byDang ? 'dang' : undefined } : null; }, [custom, auto, byDang]);
  const t = matrix ? totals(matrix) : null;
  const have = t?.questions ?? 0;
  const kindName = kind === 'cap' ? 'Đấu cặp' : kind === 'to' ? 'Đấu tổ' : 'Phòng thi';
  const autoTitle = `${kindName} ${SUBJECT_NAME[subject]}${chosen.length ? ` – ${units.filter((u) => picked.includes(u.code)).map((u) => u.title).slice(0, 2).join(', ')}` : ''}`;
  const problems = drafts ? draftProblems(drafts) : 0;
  const editedCount = drafts ? drafts.reduce((a, d) => a + d.slots.filter((s) => s.edited).length, 0) : 0;
  const key = fold(q);
  const shown = units.filter((u) => (!sem || u.semester === sem) && (!key || fold(u.title).includes(key)));

  /** Đổi quy tắc thì đề xem trước không còn đúng: hỏi trước nếu cô đã sửa câu */
  const dropDrafts = () => {
    if (editedCount && !window.confirm('Đổi quy tắc sẽ bỏ đề xem trước (kể cả các câu cô đã sửa). Tiếp tục?')) return false;
    setDrafts(null);
    return true;
  };
  const resetRules = () => { setCustom(null); setRatio((r) => (r === 'tu-chinh' ? RATIOS[0].key : r)); };
  const pickKind = (k: Kind) => { const next = kind === k ? 'phong' : k; if (next === kind || !dropDrafts()) return; setKind(next); };

  const makeDrafts = (m: Matrix): RoomDraft[] => {
    const salt = Date.now() >>> 0;
    // Đấu tổ trên lớp: một bộ câu chung để cô chiếu
    return mode === 'chung' || kind === 'to'
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
    if (kind === 'to') {
      // Đấu tổ trên lớp: không tạo phòng — sinh một bộ câu chung (hoặc dùng đề cô đã duyệt) rồi mở màn trình chiếu
      if (teamSnap.length < 2) return setErr('Đấu tổ cần ít nhất 2 tổ có thành viên — xếp tổ ở Thi đua tổ trước.');
      const slots = drafts?.[0]?.student === null ? drafts[0].slots : previewPaper(matrix, newSeed()).slots;
      if (!slots.length) return setErr('Ngân hàng chưa đủ câu cho các chủ đề đã chọn — chọn thêm chủ đề.');
      setShow(slots);
      return;
    }
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
    onCreated(row?.code ?? '', kind);
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
      onCreated(d.code ?? '', 'cap');
    } catch { setErr('Mất kết nối, thử lại sau.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="room-new" onSubmit={create}>
      {/* Khung 1: thông tin phòng + hình thức */}
      <section className="room-box" aria-labelledby="room-new-h">
        <header className="room-box-head">
          <span className="room-plus" aria-hidden="true"><Plus /></span>
          <h2 id="room-new-h">Tạo phòng thi mới – Lớp {className}</h2>
        </header>
        <p className="room-box-lead">Nhập thông tin, chọn chủ đề — máy sinh đề cho từng em, chấm ngay và thống kê kết quả. Mỗi em làm một lần; đáp án hiện sau khi phòng đóng.</p>
        <div className="room-fields">
          <label className="room-f"><span>Môn học</span>
            <span className="room-f-in"><BookOpen aria-hidden="true" />
              <select value={subject} onChange={(e) => { if (!dropDrafts()) return; setSubject(e.target.value as SubjectCode); setByDang(e.target.value === 'tieng-viet'); setPicked([]); resetRules(); }}>
                {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}
              </select></span>
          </label>
          <label className="room-f"><span>Số câu</span>
            <span className="room-f-in"><ListOrdered aria-hidden="true" />
              <input type="number" min={3} max={40} value={n} onChange={(e) => { if (!dropDrafts()) return; setN(Math.max(3, Math.min(40, Number(e.target.value) || def.n))); resetRules(); }} /></span>
          </label>
          {/* Đấu tổ chơi ngay trên lớp: không cần thời gian làm bài, giờ mở – đóng */}
          {kind !== 'to' && <>
            <label className="room-f"><span>{battle ? 'Phút mỗi vòng' : 'Thời gian (phút)'}</span>
              <span className="room-f-in"><Clock aria-hidden="true" />
                <input type="number" min={5} max={90} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(90, Number(e.target.value) || def.minutes)))} /></span>
            </label>
            <label className="room-f is-wide"><span>Mở thi</span>
              <span className="room-f-in"><CalendarDays aria-hidden="true" /><input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} required /></span>
            </label>
            <label className="room-f is-wide"><span>Đóng thi</span>
              <span className="room-f-in"><CalendarDays aria-hidden="true" /><input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} required /></span>
            </label>
          </>}
          <label className="room-f is-full"><span>{kind === 'to' ? 'Tên buổi Đấu tổ (tuỳ chọn)' : 'Tên phòng thi (tuỳ chọn)'}</span>
            <span className="room-f-in"><Pencil aria-hidden="true" /><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={autoTitle} maxLength={200} /></span>
          </label>
        </div>

        <div className="room-kinds" role="group" aria-label="Hình thức thi">
          <label className={`room-kind is-cap${kind === 'cap' ? ' is-on' : ''}`}>
            <Img3d src="/emoji/f3d/sports-medal.webp" size={40} />
            <span><b>Đấu cặp – loại trực tiếp</b>
              <small>Máy chia cặp, mỗi cặp chung một đề; đúng nhiều hơn thắng, bằng câu thì ai nhanh hơn thắng. Em thắng vào vòng sau (đề khó hơn) đến khi có nhà vô địch.</small></span>
            <input type="checkbox" role="switch" className="room-switch" checked={kind === 'cap'} onChange={() => pickKind('cap')} aria-label="Bật Đấu cặp" />
          </label>
          <label className={`room-kind is-to${kind === 'to' ? ' is-on' : ''}`}>
            <Img3d src="/emoji/tool/thi-dua.webp" size={40} />
            <span><b>Đấu tổ – thi trên lớp, cô trình chiếu</b>
              <small>Cô chiếu từng câu, các tổ cùng viết câu trả lời vào bảng con rồi giơ bảng. Tổ đúng +1 điểm, sai không cộng. Cuối buổi cộng điểm Thi đua tổ hạng 1 +3, 2 +2, 3 +1.</small></span>
            <input type="checkbox" role="switch" className="room-switch" checked={kind === 'to'} onChange={() => pickKind('to')} aria-label="Bật Đấu tổ" />
          </label>
        </div>
        {kind === 'to' && (
          <div className="room-teams-pick">
            {teams === null ? <p className="dash-muted">Đang tải tổ của lớp…</p> : teamSnap.length < 2 ? (
              <p className="exam-warn">Lớp chưa xếp đủ 2 tổ có thành viên. <Link href={`/giao-vien/lop/${classId}/thi-dua`}>Mở Thi đua tổ để xếp tổ</Link>, rồi quay lại đây.</p>
            ) : (
              <>
                <ul className="room-team-chips">
                  {teamSnap.map((tm) => <li key={tm.no}><TeamIcon emoji={tm.emoji} size={24} /> <b>{tm.name}</b> <span>{tm.members.length} em</span></li>)}
                </ul>
                <p className="dash-muted">{noTeam ? `${noTeam} em chưa có tổ vẫn làm bài nhưng không tính vào điểm tổ. ` : ''}Đổi tổ ở <Link href={`/giao-vien/lop/${classId}/thi-dua`}>Thi đua tổ</Link>.</p>
              </>
            )}
          </div>
        )}
      </section>

      {/* Khung 2: chủ đề + quy tắc + xem trước */}
      <section className="room-box" aria-labelledby="room-topic-h">
        <header className="room-box-head">
          <Img3d src="/emoji/f3d/books.webp" size={36} />
          <h2 id="room-topic-h">Chủ đề kiểm tra</h2>
          {picked.length > 0 && <span className="room-sec-n">Đã chọn {picked.length}</span>}
          <span className="room-topic-tools">
            <label className="room-search"><Search aria-hidden="true" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chủ đề…" aria-label="Tìm chủ đề" /></label>
            <select value={sem} onChange={(e) => setSem(Number(e.target.value) as 0 | 1 | 2)} aria-label="Lọc học kì">
              <option value={0}>Cả năm</option><option value={1}>Học kì 1</option><option value={2}>Học kì 2</option>
            </select>
          </span>
        </header>
        <fieldset className="room-units" aria-label="Chủ đề kiểm tra">
          {units.length === 0 ? <p className="dash-muted">Đang tải ngân hàng bài…</p> : shown.length === 0 ? <p className="dash-muted">Không có chủ đề khớp.</p> : shown.map((u) => {
            const on = picked.includes(u.code);
            const m = /^(Chủ đề \d+)\.?\s*(.*)$/.exec(u.title);
            return (
              <label key={u.code} className={`room-unit${on ? ' is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={(e) => { if (!dropDrafts()) return; const v = e.target.checked; setPicked((p) => (v ? [...p, u.code] : p.filter((x) => x !== u.code))); resetRules(); }} />
                <Img3d src={unitIcon(u.title, subject)} size={46} className="room-unit-ic" />
                <span>{m ? <><b>{m[1]}</b><em>{m[2]}</em></> : <b>{u.title}</b>}<small>HK{u.semester} · {u.ids.length} bài</small></span>
                {on && <Check aria-hidden="true" className="room-unit-ok" />}
              </label>
            );
          })}
        </fieldset>
        {matrix && <p className={have < n ? 'exam-warn' : 'dash-muted'}>{have < n ? `Quy tắc hiện có ${have} câu (ít hơn ${n}) — chủ đề đã chọn còn ít câu, hoặc cô đã bớt câu.`
          : `Đủ ${have} câu cho ${battle ? 'mỗi cặp' : kind === 'to' ? 'buổi Đấu tổ' : mode === 'chung' ? 'đề chung' : `${students.length} đề riêng`}${t ? ` — ${t.byMuc[1]} câu mức 1, ${t.byMuc[2]} câu mức 2, ${t.byMuc[3]} câu mức 3` : ''}.`}</p>}

        {/* Hai bước luôn hiện để cô thấy có thể chỉnh; cần chọn chủ đề trước mới bấm được */}
        <section className="room-step" aria-label="Quy tắc sinh đề">
          <div className="room-step-head">
            <span className="room-step-ic is-blue" aria-hidden="true"><Settings2 /></span>
            <h3>Quy tắc sinh đề</h3>
            <span className="dash-muted">{!matrix ? 'Tick ít nhất một chủ đề ở trên để đặt quy tắc (đề riêng / đề chung, số câu từng mức, điểm mỗi câu).'
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
            <span className="room-step-ic is-navy" aria-hidden="true"><Eye /></span>
            <h3>Xem trước và sửa đề</h3>
            <span className="dash-muted">{!matrix ? 'Sau khi chọn chủ đề, cô có thể xem trước từng đề, đổi câu, sửa câu hỏi và đáp án.'
              : drafts ? `${drafts.length} đề · ${editedCount} câu cô đã sửa` : 'Không bắt buộc — bỏ qua thì máy sinh đề lúc tạo phòng.'}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={preview} disabled={!have}><Eye aria-hidden="true" /> {drafts ? 'Sinh lại đề' : 'Xem trước đề'}</button>
          </div>
          {matrix && drafts && (
            <RoomPreview drafts={drafts} matrix={matrix} students={students} onChange={setDrafts}
              onRegenerate={(sid) => setDrafts((ds) => ds && ds.map((d) => (d.student === sid ? { student: sid, slots: previewPaper(matrix, newSeed()).slots } : d)))} />
          )}
        </section>}

        {err && <p className="adm-alert is-error" role="alert">{err}</p>}
        <button type="submit" className="btn btn-yellow room-submit" disabled={busy || !picked.length || problems > 0 || (kind === 'to' && teamSnap.length < 2)}>
          <Play aria-hidden="true" /> {busy ? (battle ? 'Đang bốc thăm chia cặp…' : 'Đang tạo đề cho từng em…')
            : battle ? `Bốc thăm chia cặp & mở vòng 1 cho ${students.length} em`
              : kind === 'to' ? `Bắt đầu Đấu tổ trên lớp · ${teamSnap.length || ''} tổ · ${have} câu`
                : `Tạo phòng thi cho ${students.length} em${drafts ? ' với đề đã duyệt' : ''}`}
        </button>
      </section>
      {show && (
        <TeamQuiz classId={classId} title={(title.trim() || autoTitle).slice(0, 120)} teams={teamSnap} questions={show} onClose={() => setShow(null)} />
      )}
    </form>
  );
}

// ------------------------------------------------------------------------------------------------ Một phòng
function RoomCard({ room, classId, open, onToggle, onChanged }: { room: RoomRow; classId: string; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [now] = useState(() => Date.now());
  const live = room.status === 'open' && now >= new Date(room.opens_at).getTime() && now < new Date(room.closes_at).getTime();
  const soon = room.status === 'open' && now < new Date(room.opens_at).getTime();
  const state = live ? 'Đang mở' : soon ? 'Sắp mở' : 'Đã đóng';
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(false);
  const [shared, setShared] = useState(false);
  const teams = useMemo(() => teamsOfRoom(room.matrix), [room.matrix]);
  const isBattle = (room.matrix as { battle?: boolean } | null)?.battle === true;

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
  /** Chia sẻ: chép đường dẫn vào thẳng phòng (dán vào nhóm Zalo phụ huynh) */
  const share = async () => {
    const link = `${window.location.origin}/hoc-sinh?phong=${room.code}`;
    const text = `${room.title} — mã phòng ${room.code}. Vào làm bài: ${link}`;
    try {
      if (navigator.share) await navigator.share({ title: room.title, text });
      else { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 1600); }
    } catch { /* cô bấm huỷ chia sẻ */ }
  };

  return (
    <li className={`room-card is-${live ? 'live' : soon ? 'soon' : 'closed'}`}>
      <div className="room-card-head">
        <div className="room-code-box">
          <span>Mã phòng thi</span>
          <div className="room-code-row">
            <div className="room-code" aria-label={`Mã phòng ${room.code.split('').join(' ')}`}>{room.code}</div>
            <CopyCode code={room.code} />
          </div>
        </div>
        <div className="room-card-info">
          <strong>{room.title}{teams && <em className="room-kind-tag is-to">Đấu tổ</em>}{isBattle && <em className="room-kind-tag is-cap">Đấu cặp</em>}</strong>
          <span className="room-chips">
            <span><BookOpen aria-hidden="true" /> {SUBJECT_NAME[room.subject]}</span>
            <span><ListOrdered aria-hidden="true" /> {room.n_questions} câu</span>
            <span><Clock aria-hidden="true" /> {room.minutes} phút</span>
            <span><CalendarDays aria-hidden="true" /> {whenLabel(room.opens_at)} – {whenLabel(room.closes_at)}</span>
          </span>
          <span className="room-chips">
            <span className={`room-chip is-${live ? 'live' : soon ? 'soon' : 'closed'}`}><i aria-hidden="true" />{state}</span>
            <span><Users aria-hidden="true" /> Đã nộp: {room.done}/{room.assigned}{room.started > room.done ? ` · đang làm ${room.started - room.done}` : ''}</span>
            {room.flagged ? <span className="is-flag"><Flag aria-hidden="true" /> {room.flagged} bài cần xem</span> : null}
          </span>
        </div>
        <div className="room-card-actions">
          <button type="button" className="btn btn-sm room-act-main" onClick={onToggle} aria-expanded={open}><BarChart3 aria-hidden="true" /> {open ? 'Thu gọn' : 'Kết quả'}</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setQr((v) => !v)} aria-expanded={qr}><QrIcon aria-hidden="true" /> Mã QR</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void share()}>{shared ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />} {shared ? 'Đã chép' : 'Chia sẻ'}</button>
          {room.status === 'open'
            ? <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus(false)} disabled={busy}><Lock aria-hidden="true" /> Đóng phòng</button>
            : <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus(true)} disabled={busy}><Unlock aria-hidden="true" /> Mở lại</button>}
          <button type="button" className="mini-btn is-danger room-del" onClick={remove} disabled={busy} aria-label="Xoá phòng" title="Xoá phòng"><Trash2 aria-hidden="true" /></button>
        </div>
      </div>
      {teams && <TeamBoard room={room} classId={classId} teams={teams} live={live} />}
      {qr && <RoomQr code={room.code} title={room.title} />}
      {open && <RoomDetail room={room} onChanged={onChanged} />}
    </li>
  );
}

/** ĐẤU TỔ: bảng xếp hạng tổ của một phòng — tự tải lại mỗi 20 giây khi phòng đang mở; phòng đóng thì cô cộng điểm thi đua */
function TeamBoard({ room, classId, teams, live }: { room: RoomRow; classId: string; teams: TeamSnap[]; live: boolean }) {
  const [rows, setRows] = useState<RoomDetailRow[] | null>(null);
  const [awarded, setAwarded] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const last = useRef('');
  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_room_detail', { p_room: room.id });
    if (error) return setErr(roomError(error.message));
    const j = JSON.stringify((data ?? []).map((r: RoomDetailRow) => [r.student_id, r.done, r.score, r.duration_ms]));
    if (j !== last.current) { last.current = j; setRows((data ?? []) as RoomDetailRow[]); }
  }, [room.id]);
  useEffect(() => { void load(); }, [load, room.done]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 20_000);
    return () => clearInterval(t);
  }, [live, load]);
  // đã cộng điểm thi đua cho phòng này chưa (tìm lý do có mã phòng, từ ngày tạo phòng đến nay)
  const checkAwarded = useCallback(async () => {
    const from = room.created_at.slice(0, 10), to = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const { data } = await createClient().rpc('teacher_team_points', { p_class: classId, p_from: from, p_to: to });
    setAwarded(awardedFor(((data ?? []) as { reason: string | null }[]).map((p) => p.reason), room.code));
  }, [classId, room.code, room.created_at]);
  useEffect(() => { if (!live) void checkAwarded(); }, [live, checkAwarded]);

  const board = rows ? teamScores(teams, rows) : null;
  const top = board?.[0]?.points ? board[0].points : 0;
  const award = async () => {
    if (!board) return;
    const list = board.filter((b) => b.rank <= TEAM_AWARD.length && b.points > 0);
    if (!list.length) return setErr('Chưa tổ nào có điểm để cộng.');
    if (!window.confirm(`Cộng điểm Thi đua tổ: ${list.map((b) => `${b.name} +${TEAM_AWARD[b.rank - 1]}`).join(', ')}?`)) return;
    setBusy(true); setErr('');
    const sb = createClient();
    for (const b of list) {
      const { error } = await sb.rpc('teacher_team_point', { p_class: classId, p_team: b.no, p_delta: TEAM_AWARD[b.rank - 1], p_reason: awardReason(room.code, b.rank) });
      if (error) { setErr('Chưa cộng được điểm thi đua, thử lại sau.'); break; }
    }
    setBusy(false); void checkAwarded();
  };

  return (
    <div className="room-teamboard" aria-label="Bảng xếp hạng tổ">
      <p className="room-teamboard-head"><Img3d src="/emoji/tool/thi-dua.webp" size={22} /> <b>Bảng xếp hạng tổ</b> <span className="dash-muted">{TEAM_RULE}</span></p>
      {!board ? <p className="dash-muted">Đang tải…</p> : (
        <ol className="room-teamlist">
          {board.map((b) => (
            <li key={b.no} className={b.rank === 1 && b.points > 0 ? 'is-top' : undefined}>
              <span className="room-rank">{b.rank === 1 && b.points > 0 ? <Crown aria-label="Hạng 1" /> : b.rank}</span>
              <TeamIcon emoji={b.emoji} size={30} />
              <span className="room-team-name"><b>{b.name}</b><small>{b.done}/{b.size} em đã nộp{b.avgMs !== null ? ` · TB ${mins(b.avgMs)}` : ''}</small></span>
              <span className="room-team-bar" aria-hidden="true"><i style={{ transform: `scaleX(${top ? b.points / 10 : 0})` }} /></span>
              <b className="room-team-pts">{fmt(b.points)}<small>/10</small></b>
            </li>
          ))}
        </ol>
      )}
      {!live && board && (
        <p className="room-teamboard-foot">
          {awarded ? <span className="room-chip is-live"><Check aria-hidden="true" /> Đã cộng điểm thi đua cho các tổ</span>
            : awarded === false && <button type="button" className="btn btn-yellow btn-sm" disabled={busy} onClick={() => void award()}><Crown aria-hidden="true" /> {busy ? 'Đang cộng…' : `Cộng điểm thi đua (hạng 1 +${TEAM_AWARD[0]}, 2 +${TEAM_AWARD[1]}, 3 +${TEAM_AWARD[2]})`}</button>}
        </p>
      )}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
    </div>
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
    <button type="button" className={`room-copy${ok ? ' is-ok' : ''}`} onClick={copy} aria-label={`Chép mã phòng ${code}`} title={ok ? 'Đã chép' : 'Chép mã phòng'}>
      {ok ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
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
