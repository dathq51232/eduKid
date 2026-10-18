'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Printer, Save, Sparkles, Wand2 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import { awardLabel, QUALITY_LEVEL_NAME, type Award, type QualityItem, type QualityLevel, type SchoolSubject } from '@/lib/classroom/school';
import {
  APP_SUBJECTS, LEVEL_NAME, SUBJECT_NAME, commentSubjectsFor, generateClassComments, groupLevel, periodsFor,
  type CommentSubject, type Period, type StudentData, type SubjectStats,
} from '@/lib/classroom/comments';

type Student = { id: string; name: string };
type AnyLevel = 'T' | 'H' | 'C' | 'D';
type Cell = { level: AnyLevel | null; comment: string; saved: boolean; dirty: boolean };
type Sheet = Record<string, Partial<Record<CommentSubject, Cell>>>;
type Saved = { student_id: string; subject: CommentSubject; level: AnyLevel | null; comment: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;

const isQuality = (s: CommentSubject) => s === 'pham-chat' || s === 'nang-luc';
const levelOptions = (s: CommentSubject): { v: AnyLevel; label: string }[] =>
  isQuality(s) ? (['T', 'D', 'C'] as QualityLevel[]).map((v) => ({ v, label: `${v === 'D' ? 'Đ' : v} · ${QUALITY_LEVEL_NAME[v]}` }))
    : s === 'chung' ? [] : (['T', 'H', 'C'] as const).map((v) => ({ v, label: `${v} · ${LEVEL_NAME[v]}` }));
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);

/** Kỳ mặc định: kỳ đánh giá định kỳ đang diễn ra */
function defaultPeriod(periods: Period[]): string {
  const now = Date.now();
  const cur = periods.filter((p) => p.exam).find((p) => now < p.to.getTime() && (p.exam === 'gk1' || p.exam === 'ck1' || p.exam === 'gk2' || p.exam === 'ck2'));
  return (cur ?? periods[0]).key;
}

/**
 * Nhận xét học sinh theo kỳ. Gợi ý được viết từ mức đạt + điểm kiểm tra + phẩm chất/năng lực + khen thưởng
 * thầy cô đã nhập, cùng bài luyện tập trong app. Mỗi em một lời nhận xét khác nhau (không trùng trong lớp).
 */
export default function CommentsBoard({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const periods = useMemo(() => periodsFor(), []);
  const [periodKey, setPeriodKey] = useState(() => defaultPeriod(periods));
  const period = periods.find((p) => p.key === periodKey) as Period;
  const subjects = useMemo(() => commentSubjectsFor(grade, period.kind), [grade, period.kind]);
  const [view, setView] = useState<CommentSubject | 'all'>('all');
  const [data, setData] = useState<StudentData[]>([]);
  const [sheet, setSheet] = useState<Sheet>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  /** Mức mặc định của nhóm phẩm chất/năng lực theo các mục đã nhập */
  const defaultLevel = useCallback((sd: StudentData | undefined, subj: CommentSubject): AnyLevel | null =>
    (sd && isQuality(subj) ? groupLevel(sd.qualities, grade, subj as 'pham-chat' | 'nang-luc') : null), [grade]);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const sb = createClient();
    const statsCall = (from: Date, to: Date) => sb.rpc('class_period_stats', { p_class: classId, p_from: from.toISOString(), p_to: to.toISOString() });
    const empty = Promise.resolve({ data: [], error: null });
    const [cur, pv, saved, sc, ql, aw] = await Promise.all([
      statsCall(period.from, period.to),
      period.prevFrom && period.prevTo ? statsCall(period.prevFrom, period.prevTo) : empty,
      sb.rpc('teacher_get_comments', { p_class: classId, p_period: period.key }),
      period.exam ? sb.rpc('teacher_get_scores', { p_class: classId, p_period: period.key }) : empty,
      period.exam ? sb.rpc('teacher_get_qualities', { p_class: classId, p_period: period.key }) : empty,
      sb.rpc('teacher_list_awards', { p_class: classId }),
    ]);
    setBusy(false);
    if (saved.error) {
      setMsg({ kind: 'error', text: notReady(saved.error.message) ? 'Chưa bật tính năng nhận xét: chạy các file supabase/migrations/0013 → 0016 trên Supabase.' : 'Không tải được dữ liệu. Thử tải lại trang.' });
      return;
    }
    const warn: string[] = [];
    if (sc.error || ql.error) warn.push('Chưa đọc được điểm/mức trên trường (cần chạy migration 0016) — gợi ý tạm dựa trên bài luyện tập trong app.');
    const statMap = (rows: SubjectStats[] | null) => new Map((rows ?? []).map((r) => [`${r.student_id}:${r.subject_code}`, r]));
    const st = cur.error ? new Map<string, SubjectStats>() : statMap(cur.data as SubjectStats[]);
    const pm = pv.error ? new Map<string, SubjectStats>() : statMap(pv.data as SubjectStats[]);
    const scores = (sc.error ? [] : (sc.data ?? [])) as { student_id: string; subject: SchoolSubject; score: number | null; level: 'T' | 'H' | 'C' | null }[];
    const quals = (ql.error ? [] : (ql.data ?? [])) as { student_id: string; item: QualityItem; level: QualityLevel }[];
    const awards = (aw.error ? [] : (aw.data ?? [])) as Award[];

    const built: StudentData[] = students.map((s) => {
      const subj: StudentData['subjects'] = {};
      for (const a of APP_SUBJECTS) {
        const x = st.get(`${s.id}:${a}`);
        if (x) subj[a] = { ...(subj[a] ?? {}), stats: x, prev: pm.get(`${s.id}:${a}`) };
      }
      for (const r of scores.filter((r) => r.student_id === s.id)) {
        subj[r.subject] = { ...(subj[r.subject] ?? {}), score: r.score == null ? null : Number(r.score), level: r.level };
      }
      const qualities: StudentData['qualities'] = {};
      for (const q of quals.filter((q) => q.student_id === s.id)) qualities[q.item] = q.level;
      const aws = awards.filter((a) => {
        if (a.student_id !== s.id) return false;
        const t = new Date(`${a.awarded_on}T00:00:00+07:00`);
        return t >= period.from && t < period.to;
      }).map(awardLabel);
      return { id: s.id, subjects: subj, qualities, awards: aws, appStats: APP_SUBJECTS.map((a) => st.get(`${s.id}:${a}`)).filter(Boolean) as SubjectStats[] };
    });
    const sv = new Map(((saved.data ?? []) as Saved[]).map((r) => [`${r.student_id}:${r.subject}`, r]));
    const next: Sheet = {};
    for (const s of students) next[s.id] = {};
    for (const subj of subjects) {
      const reserved = students.map((s) => sv.get(`${s.id}:${subj}`)?.comment).filter(Boolean) as string[];
      const sug = generateClassComments(subj, built.filter((b) => !sv.has(`${b.id}:${subj}`)), period.kind, grade, reserved);
      for (const s of students) {
        const got = sv.get(`${s.id}:${subj}`);
        const g = sug.get(s.id);
        const sd = built.find((b) => b.id === s.id);
        next[s.id][subj] = got
          ? { level: got.level, comment: got.comment, saved: true, dirty: false }
          : { level: g?.level ?? defaultLevel(sd, subj), comment: g?.comment ?? '', saved: false, dirty: false };
      }
    }
    setData(built);
    setSheet(next);
    if (warn.length) setMsg({ kind: 'info', text: warn.join(' ') });
  }, [classId, period, students, subjects, grade, defaultLevel]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setView('all'); }, [periodKey]);

  const cells = Object.values(sheet).flatMap((r) => Object.values(r)) as Cell[];
  const dirtyCount = cells.filter((c) => c.dirty).length;
  const update = (sid: string, subj: CommentSubject, patch: Partial<Cell>) =>
    setSheet((s) => ({ ...s, [sid]: { ...s[sid], [subj]: { ...(s[sid]?.[subj] as Cell), ...patch, dirty: true } } }));

  const regenerate = (all: boolean) => {
    if (all && !window.confirm('Viết lại TẤT CẢ nhận xét (kể cả đã lưu/đã sửa) theo số liệu hiện tại?')) return;
    setSheet((s) => {
      const next: Sheet = {};
      for (const sid of Object.keys(s)) next[sid] = { ...s[sid] };
      for (const subj of subjects) {
        const keep = all ? [] : students.filter((st) => { const c = s[st.id]?.[subj]; return c && (c.saved || c.dirty); });
        const keepIds = new Set(keep.map((k) => k.id));
        const reserved = keep.map((k) => s[k.id]?.[subj]?.comment ?? '').filter(Boolean);
        const sug = generateClassComments(subj, data.filter((d) => !keepIds.has(d.id)), period.kind, grade, reserved);
        for (const [sid, g] of sug) {
          const c = s[sid]?.[subj];
          const sd = data.find((d) => d.id === sid);
          next[sid][subj] = { level: g.level ?? defaultLevel(sd, subj), comment: g.comment, saved: c?.saved ?? false, dirty: Boolean(c?.saved || c?.dirty) };
        }
      }
      return next;
    });
    setMsg({ kind: 'info', text: all ? 'Đã viết lại toàn bộ theo số liệu hiện tại. Bấm "Lưu" để ghi lại.' : 'Đã điền gợi ý cho các ô chưa lưu/chưa sửa.' });
  };

  const save = async () => {
    const rows: Saved[] = [];
    for (const s of students) for (const subj of subjects) {
      const c = sheet[s.id]?.[subj];
      if (c && (c.dirty || (!c.saved && (c.comment || c.level)))) rows.push({ student_id: s.id, subject: subj, level: c.level, comment: c.comment.trim() });
    }
    if (!rows.length) return setMsg({ kind: 'info', text: 'Không có thay đổi để lưu.' });
    setBusy(true);
    const sb = createClient();
    // Lưu theo từng đợt (tối đa 400 ô mỗi lần)
    for (let i = 0; i < rows.length; i += 400) {
      const { error } = await sb.rpc('teacher_save_comments', { p_class: classId, p_period: period.key, p_rows: rows.slice(i, i + 400) });
      if (error) { setBusy(false); return setMsg({ kind: 'error', text: notReady(error.message) || /check constraint/i.test(error.message) ? 'Chưa lưu được: hãy chạy supabase/migrations/0016_class_rules_full_subjects.sql trên Supabase.' : 'Chưa lưu được. Thử lại sau.' }); }
    }
    setBusy(false);
    const savedKeys = new Set(rows.map((r) => `${r.student_id}:${r.subject}`));
    setSheet((s) => {
      const next: Sheet = {};
      for (const sid of Object.keys(s)) {
        next[sid] = { ...s[sid] };
        for (const subj of subjects) if (savedKeys.has(`${sid}:${subj}`) && next[sid][subj]) next[sid][subj] = { ...(next[sid][subj] as Cell), saved: true, dirty: false };
      }
      return next;
    });
    setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} ô nhận xét cho ${period.label}.` });
  };

  const shown = view === 'all' ? subjects : [view];
  const csvHeader = ['STT', 'Học sinh', ...subjects.flatMap((s) => (s === 'chung' ? [SUBJECT_NAME[s]] : [`${SUBJECT_NAME[s]} - Mức`, `${SUBJECT_NAME[s]} - Nhận xét`]))];
  const csvRows = students.map((s, i) => [i + 1, s.name, ...subjects.flatMap((subj) => {
    const c = sheet[s.id]?.[subj];
    const lv = c?.level === 'D' ? 'Đ' : c?.level ?? '';
    return subj === 'chung' ? [c?.comment ?? ''] : [lv, c?.comment ?? ''];
  })]);
  const dup = (() => {
    // kiểm tra trùng trong lớp (mỗi mục)
    let n = 0;
    for (const subj of subjects) {
      const seen = new Set<string>();
      for (const s of students) { const t = sheet[s.id]?.[subj]?.comment?.trim(); if (!t) continue; if (seen.has(t)) n++; seen.add(t); }
    }
    return n;
  })();
  const scoreInfo = (sid: string, subj: CommentSubject) => {
    const d = data.find((x) => x.id === sid);
    const inp = d?.subjects[subj as SchoolSubject];
    const bits: string[] = [];
    if (inp?.score != null) bits.push(`KT: ${String(inp.score).replace('.', ',')}`);
    if (inp?.level) bits.push(`mức nhập: ${inp.level}`);
    if (inp?.stats) bits.push(`app: ${inp.stats.lessons} bài, ${inp.stats.avg_percent}%`);
    if (isQuality(subj) && d) {
      const n = Object.keys(d.qualities).length;
      if (n) bits.push(`${n} mục PC/NL đã đánh giá`);
    }
    return bits.join(' · ');
  };

  return (
    <div className="comments-board">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><ClipboardCheck aria-hidden="true" /> Nhận xét học sinh</h1>
          <p className="dash-muted">
            Gợi ý được viết từ <strong>mức đạt và điểm kiểm tra</strong>, <strong>phẩm chất – năng lực</strong> và <strong>khen thưởng</strong> thầy cô đã nhập ở mục Kết quả học tập trên trường,
            cùng bài luyện tập trên EduChain Kids. Mỗi em một lời nhận xét khác nhau trong lớp. Thầy cô đọc, sửa rồi lưu và tải về.
          </p>
        </div>
      </header>

      <section className="dash-section comments-toolbar no-print" aria-label="Chọn kỳ và thao tác">
        <div className="comments-filters">
          <label className="adm-field comments-period"><span>Kỳ nhận xét</span>
            <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} disabled={busy || dirtyCount > 0} title={dirtyCount > 0 ? 'Lưu trước khi đổi kỳ' : undefined}>
              {periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>
          <label className="adm-field comments-period"><span>Xem</span>
            <select value={view} onChange={(e) => setView(e.target.value as CommentSubject | 'all')}>
              <option value="all">Tất cả các môn (theo từng em)</option>
              {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]} (cả lớp)</option>)}
            </select>
          </label>
        </div>
        <div className="comments-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => regenerate(false)} disabled={busy}><Sparkles aria-hidden="true" /> Điền gợi ý ô chưa sửa</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => regenerate(true)} disabled={busy}><Wand2 aria-hidden="true" /> Viết lại tất cả</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer aria-hidden="true" /> In</button>
          <CsvButton filename={`nhan-xet-${className}-${period.key}.csv`} header={csvHeader} rows={csvRows} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang xử lý…' : `Lưu${dirtyCount ? ` (${dirtyCount})` : ''}`}</button>
        </div>
        {msg && <p className={`adm-alert is-${msg.kind === 'ok' ? 'ok' : msg.kind === 'error' ? 'error' : 'info'}`} role="status">{msg.text}</p>}
        {dup > 0 && <p className="adm-alert is-warn">Có {dup} nhận xét trùng nhau giữa các em (do sửa tay). Thầy cô nên sửa lại cho khác nhau.</p>}
      </section>

      <h2 className="print-only">Nhận xét lớp {className} — {period.label}</h2>
      {students.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : view !== 'all' ? (
        <div className="table-scroll">
          <table className="roster-table comments-table">
            <thead><tr><th>STT</th><th>Học sinh</th>{view !== 'chung' && <th>Mức</th>}<th>Nhận xét · {SUBJECT_NAME[view]}</th></tr></thead>
            <tbody>
              {students.map((s, i) => {
                const c = sheet[s.id]?.[view];
                return (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td className="sr-name">{s.name}<span className="comment-stat">{scoreInfo(s.id, view)}</span></td>
                    {view !== 'chung' && (
                      <td><select aria-label={`Mức ${SUBJECT_NAME[view]} của ${s.name}`} value={c?.level ?? ''} onChange={(e) => update(s.id, view, { level: (e.target.value || null) as AnyLevel | null })}>
                        <option value="">—</option>{levelOptions(view).map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select></td>
                    )}
                    <td><textarea rows={2} maxLength={1000} value={c?.comment ?? ''} aria-label={`Nhận xét ${SUBJECT_NAME[view]} của ${s.name}`} onChange={(e) => update(s.id, view, { comment: e.target.value })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="comments-list">
          {students.map((s, i) => (
            <li key={s.id} className="comment-card">
              <h3><span className="comment-no">{i + 1}</span> {s.name}</h3>
              <div className="comment-grid">
                {shown.map((subj) => {
                  const c = sheet[s.id]?.[subj];
                  const fieldId = `c-${s.id}-${subj}`;
                  const info = scoreInfo(s.id, subj);
                  return (
                    <div key={subj} className={`comment-cell${subj === 'chung' || isQuality(subj) ? ' is-general' : ''}`}>
                      <div className="comment-cell-head">
                        <label htmlFor={fieldId}>{SUBJECT_NAME[subj]}</label>
                        {subj !== 'chung' && (
                          <select aria-label={`Mức ${SUBJECT_NAME[subj]} của ${s.name}`} value={c?.level ?? ''} onChange={(e) => update(s.id, subj, { level: (e.target.value || null) as AnyLevel | null })}>
                            <option value="">—</option>{levelOptions(subj).map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        )}
                        <span className={`comment-tag${c?.dirty ? ' is-dirty' : c?.saved ? ' is-saved' : ''}`}>{c?.dirty ? 'Đã sửa' : c?.saved ? 'Đã lưu' : 'Gợi ý'}</span>
                      </div>
                      {info && <p className="comment-stat">{info}</p>}
                      <textarea id={fieldId} rows={isQuality(subj) || subj === 'chung' ? 2 : 3} maxLength={1000} value={c?.comment ?? ''}
                        placeholder="Chưa có số liệu — thầy cô nhập mức/điểm ở Kết quả học tập trên trường hoặc tự nhận xét"
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
