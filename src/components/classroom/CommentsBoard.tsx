'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Printer, Save, Sparkles, Wand2 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { awardLabel, type Award } from '@/lib/classroom/school';
import { createClient } from '@/lib/supabase/client';
import {
  COMMENT_SUBJECTS, LEVEL_NAME, SUBJECT_NAME, periodsFor, suggestGeneral, suggestSubject,
  type CommentSubject, type Level, type Period, type SubjectStats,
} from '@/lib/classroom/comments';

type Student = { id: string; name: string };
type Cell = { level: Level | null; comment: string; saved: boolean; dirty: boolean };
type Sheet = Record<string, Record<CommentSubject, Cell>>; // studentId -> subject -> ô nhận xét
type Saved = { student_id: string; subject: CommentSubject; level: Level | null; comment: string };

const SUBJ = COMMENT_SUBJECTS.filter((s): s is Exclude<CommentSubject, 'chung'> => s !== 'chung');

/** Nhận xét học sinh theo kỳ: gợi ý tự sinh từ dữ liệu học, giáo viên sửa, lưu và tải về Excel. */
export default function CommentsBoard({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const periods = useMemo(() => periodsFor(), []);
  const [periodKey, setPeriodKey] = useState(periods[0].key);
  const period = periods.find((p) => p.key === periodKey) as Period;
  // Lớp 1–2: Tiếng Anh là môn tự chọn; vẫn hiện nếu em có làm bài
  const [stats, setStats] = useState<Map<string, SubjectStats>>(new Map());
  const [prev, setPrev] = useState<Map<string, SubjectStats>>(new Map());
  const [sheet, setSheet] = useState<Sheet>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);

  // Điểm kiểm tra định kỳ (studentId:môn -> điểm) và khen thưởng trong kỳ (studentId -> nhãn) nhập ở "Kết quả học tập trên trường"
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [awards, setAwards] = useState<Map<string, string[]>>(new Map());

  const suggestFor = useCallback((sid: string, subj: CommentSubject, st: Map<string, SubjectStats>, pv: Map<string, SubjectStats>, p: Period, sc: Map<string, number>, aw: Map<string, string[]>) => {
    if (subj === 'chung') return suggestGeneral(SUBJ.map((s) => st.get(`${sid}:${s}`)).filter(Boolean) as SubjectStats[], p.kind, sid, aw.get(sid) ?? []);
    return suggestSubject(subj, st.get(`${sid}:${subj}`), p.kind, pv.get(`${sid}:${subj}`), sc.get(`${sid}:${subj}`) ?? null, sid);
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const sb = createClient();
    const statsCall = (from: Date, to: Date) => sb.rpc('class_period_stats', { p_class: classId, p_from: from.toISOString(), p_to: to.toISOString() });
    // Học kỳ I -> điểm cuối HK I; học kỳ II / cả năm -> điểm cuối năm. Tuần: không dùng điểm kiểm tra.
    const [pk, py] = period.key.split('-');
    const examKey = pk === 'hk1' ? `ck1-${py}` : pk === 'hk2' || pk === 'cn' ? `ck2-${py}` : null;
    const [cur, pv, saved, sc, aw] = await Promise.all([
      statsCall(period.from, period.to),
      period.prevFrom && period.prevTo ? statsCall(period.prevFrom, period.prevTo) : Promise.resolve({ data: [], error: null }),
      sb.rpc('teacher_get_comments', { p_class: classId, p_period: period.key }),
      examKey ? sb.rpc('teacher_get_scores', { p_class: classId, p_period: examKey }) : Promise.resolve({ data: [], error: null }),
      sb.rpc('teacher_list_awards', { p_class: classId }),
    ]);
    setBusy(false);
    const err = cur.error ?? pv.error ?? saved.error;
    if (err) {
      setMsg({ kind: 'error', text: /function|does not exist|schema cache/i.test(err.message) ? 'Chưa bật tính năng nhận xét: hãy chạy supabase/migrations/0013_student_comments.sql trên Supabase.' : 'Không tải được dữ liệu. Thử tải lại trang.' });
      return;
    }
    const toMap = (rows: SubjectStats[] | null) => new Map((rows ?? []).map((r) => [`${r.student_id}:${r.subject_code}`, r]));
    const st = toMap(cur.data as SubjectStats[]);
    const pm = toMap(pv.data as SubjectStats[]);
    const sv = new Map(((saved.data ?? []) as Saved[]).map((r) => [`${r.student_id}:${r.subject}`, r]));
    // Chưa chạy migration 0014 thì bỏ qua điểm/khen thưởng (vẫn gợi ý từ bài luyện tập)
    const scm = new Map<string, number>();
    if (!sc.error) for (const r of (sc.data ?? []) as { student_id: string; subject: string; score: number | null }[]) if (r.score != null) scm.set(`${r.student_id}:${r.subject}`, Number(r.score));
    const awm = new Map<string, string[]>();
    if (!aw.error) for (const a of (aw.data ?? []) as Award[]) {
      const t = new Date(`${a.awarded_on}T00:00:00+07:00`);
      if (t >= period.from && t < period.to) awm.set(a.student_id, [...(awm.get(a.student_id) ?? []), awardLabel(a)]);
    }
    const next: Sheet = {};
    for (const s of students) {
      next[s.id] = {} as Record<CommentSubject, Cell>;
      for (const subj of COMMENT_SUBJECTS) {
        const got = sv.get(`${s.id}:${subj}`);
        const sug = suggestFor(s.id, subj, st, pm, period, scm, awm);
        next[s.id][subj] = got ? { level: got.level, comment: got.comment, saved: true, dirty: false } : { ...sug, saved: false, dirty: false };
      }
    }
    setStats(st);
    setPrev(pm);
    setScores(scm);
    setAwards(awm);
    setSheet(next);
  }, [classId, period, students, suggestFor]);

  useEffect(() => { void load(); }, [load]);

  const dirtyCount = Object.values(sheet).reduce((a, row) => a + Object.values(row).filter((c) => c.dirty).length, 0);
  const update = (sid: string, subj: CommentSubject, patch: Partial<Cell>) =>
    setSheet((s) => ({ ...s, [sid]: { ...s[sid], [subj]: { ...s[sid][subj], ...patch, dirty: true } } }));

  /** Viết lại gợi ý: chỉ ô chưa lưu (an toàn) hoặc tất cả */
  const regenerate = (all: boolean) => {
    if (all && !window.confirm('Thay TẤT CẢ nhận xét (kể cả đã lưu/đã sửa) bằng gợi ý mới?')) return;
    setSheet((s) => {
      const next: Sheet = {};
      for (const sid of Object.keys(s)) {
        next[sid] = { ...s[sid] };
        for (const subj of COMMENT_SUBJECTS) {
          const c = s[sid][subj];
          if (!all && (c.saved || c.dirty)) continue;
          const sug = suggestFor(sid, subj, stats, prev, period, scores, awards);
          next[sid][subj] = { ...sug, saved: c.saved, dirty: c.saved || c.dirty ? true : false };
        }
      }
      return next;
    });
    setMsg({ kind: 'info', text: all ? 'Đã thay bằng gợi ý mới. Bấm "Lưu" để ghi lại.' : 'Đã điền gợi ý cho các ô chưa sửa.' });
  };

  const save = async () => {
    const rows: Saved[] = [];
    for (const s of students) for (const subj of COMMENT_SUBJECTS) {
      const c = sheet[s.id]?.[subj];
      // Lưu ô đã sửa, và cả gợi ý chưa lưu (để kỳ sau mở lại vẫn còn đúng nội dung đã xuất)
      if (c && (c.dirty || (!c.saved && (c.comment || c.level)))) rows.push({ student_id: s.id, subject: subj, level: c.level, comment: c.comment.trim() });
    }
    if (rows.length === 0) return setMsg({ kind: 'info', text: 'Không có thay đổi để lưu.' });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_save_comments', { p_class: classId, p_period: period.key, p_rows: rows });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: 'Chưa lưu được. Thử lại sau.' });
    setSheet((s) => {
      const next: Sheet = {};
      for (const sid of Object.keys(s)) {
        next[sid] = {} as Record<CommentSubject, Cell>;
        for (const subj of COMMENT_SUBJECTS) {
          const c = s[sid][subj];
          next[sid][subj] = rows.some((r) => r.student_id === sid && r.subject === subj) ? { ...c, saved: true, dirty: false } : c;
        }
      }
      return next;
    });
    setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} ô nhận xét cho ${period.label}.` });
  };

  const csvHeader = ['STT', 'Học sinh', ...SUBJ.flatMap((s) => [`${SUBJECT_NAME[s]} - Mức đạt`, `${SUBJECT_NAME[s]} - Nhận xét`]), 'Nhận xét chung'];
  const csvRows = students.map((s, i) => [
    i + 1, s.name,
    ...SUBJ.flatMap((subj) => { const c = sheet[s.id]?.[subj]; return [c?.level ?? '', c?.comment ?? '']; }),
    sheet[s.id]?.chung?.comment ?? '',
  ]);

  const withData = students.filter((s) => SUBJ.some((subj) => stats.has(`${s.id}:${subj}`) || scores.has(`${s.id}:${subj}`))).length;

  return (
    <div className="comments-board">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><ClipboardCheck aria-hidden="true" /> Nhận xét học sinh</h1>
          <p className="dash-muted">
            Gợi ý được tự viết từ điểm kiểm tra định kỳ và khen thưởng thầy cô đã nhập (mục Kết quả học tập trên trường), cùng bài luyện tập của từng em trên EduChain Kids trong kỳ (số bài, % đúng, bài làm tốt, bài cần luyện thêm, tiến bộ so với kỳ trước). Có điểm kiểm tra thì mức đạt gợi ý theo điểm: ≥ 9 là T, 5–8,75 là H, dưới 5 là C.
            Mức: <strong>T</strong> = Hoàn thành tốt, <strong>H</strong> = Hoàn thành, <strong>C</strong> = Chưa hoàn thành. Thầy cô đọc, sửa cho đúng với quá trình học trên lớp rồi lưu và tải về.
          </p>
        </div>
      </header>

      <section className="dash-section comments-toolbar no-print" aria-label="Chọn kỳ và thao tác">
        <label className="adm-field comments-period">
          <span>Kỳ nhận xét</span>
          <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} disabled={busy || dirtyCount > 0} title={dirtyCount > 0 ? 'Lưu trước khi đổi kỳ' : undefined}>
            {periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <div className="comments-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => regenerate(false)} disabled={busy}><Sparkles aria-hidden="true" /> Điền gợi ý ô trống</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => regenerate(true)} disabled={busy}><Wand2 aria-hidden="true" /> Viết lại tất cả</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer aria-hidden="true" /> In</button>
          <CsvButton filename={`nhan-xet-${className.replace(/[^\p{L}\p{N}]+/gu, '-')}-${period.key}.csv`} header={csvHeader} rows={csvRows} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang xử lý…' : `Lưu${dirtyCount ? ` (${dirtyCount})` : ''}`}</button>
        </div>
        {msg && <p className={`adm-alert is-${msg.kind === 'ok' ? 'ok' : msg.kind === 'error' ? 'error' : 'info'}`} role="status">{msg.text}</p>}
        <p className="dash-muted">{withData}/{students.length} em có điểm kiểm tra hoặc bài luyện tập trong kỳ này. Em chưa có dữ liệu thì để trống mức, thầy cô tự nhận xét.</p>
      </section>

      <h2 className="print-only">Nhận xét lớp {className} — {period.label}</h2>
      {students.length === 0 ? (
        <p className="dash-muted">Lớp chưa có học sinh.</p>
      ) : (
        <ol className="comments-list">
          {students.map((s, i) => (
            <li key={s.id} className="comment-card">
              <h3><span className="comment-no">{i + 1}</span> {s.name}</h3>
              <div className="comment-grid">
                {COMMENT_SUBJECTS.map((subj) => {
                  const c = sheet[s.id]?.[subj];
                  const st = subj === 'chung' ? undefined : stats.get(`${s.id}:${subj}`);
                  const fieldId = `c-${s.id}-${subj}`;
                  return (
                    <div key={subj} className={`comment-cell${subj === 'chung' ? ' is-general' : ''}`}>
                      <div className="comment-cell-head">
                        <label htmlFor={fieldId}>{SUBJECT_NAME[subj]}</label>
                        {subj !== 'chung' && (
                          <select aria-label={`Mức đạt ${SUBJECT_NAME[subj]} của ${s.name}`} value={c?.level ?? ''} onChange={(e) => update(s.id, subj, { level: (e.target.value || null) as Level | null })}>
                            <option value="">—</option>
                            {(['T', 'H', 'C'] as Level[]).map((l) => <option key={l} value={l}>{l} · {LEVEL_NAME[l]}</option>)}
                          </select>
                        )}
                        <span className={`comment-tag${c?.dirty ? ' is-dirty' : c?.saved ? ' is-saved' : ''}`}>{c?.dirty ? 'Đã sửa' : c?.saved ? 'Đã lưu' : 'Gợi ý'}</span>
                      </div>
                      {(st || scores.has(`${s.id}:${subj}`)) && (
                        <p className="comment-stat">
                          {st ? `${st.lessons} bài · đúng TB ${st.avg_percent}% · ${st.active_days} ngày` : 'Chưa luyện tập trong app'}
                          {scores.has(`${s.id}:${subj}`) && ` · KT định kỳ: ${String(scores.get(`${s.id}:${subj}`)).replace('.', ',')}`}
                        </p>
                      )}
                      <textarea id={fieldId} rows={subj === 'chung' ? 2 : 3} maxLength={1000} value={c?.comment ?? ''} placeholder={subj === 'chung' ? 'Nhận xét chung…' : 'Chưa có bài luyện tập — thầy cô tự nhận xét'}
                        onChange={(e) => update(s.id, subj, { comment: e.target.value })} />
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
