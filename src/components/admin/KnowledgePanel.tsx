'use client';

// Ô "Kiến thức cần nhớ & cấp bài" trong trang soạn bài Quản trị (quy tắc: docs/QUY-TAC-CAP-NHAT-KIEN-THUC.md).
//  - Chọn cấp Cơ bản / Nâng cao; bài nâng cao chọn bài cơ bản cần học trước.
//  - Soạn 2–4 ý (mỗi dòng một ý), ví dụ, ghi chú — máy kiểm ngay khi gõ (validateKnowledge), lỗi thì không lưu được.
//  - Bảng "Điều kiện gửi duyệt" (validateLessonBank) báo cho trang soạn bài để khoá nút Gửi duyệt / Xuất bản khi chưa đạt.
// Chưa chạy migration 0070/0071: hiện hướng dẫn và KHÔNG khoá nút (giữ cách làm cũ).
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LEVEL_LABEL, LEVEL_RULES, validateKnowledge, validateLessonBank, type KnowledgeLevel, type Verdict } from '@/lib/content/rules';
import type { QuestionDraft } from '@/lib/admin/types';
import { errorText } from '@/lib/admin/questions';
import '@/styles/adm.css';

type Row = { points: string[]; example: string; note: string; checked_at: string | null };
type Lite = { id: string; title: string };
/** Kết quả gửi lên trang soạn bài: available = đã chạy migration; errors = lí do chưa được gửi duyệt */
export type BankGate = { available: boolean; errors: string[] };

const MISSING = /lesson_knowledge|level|prerequisite_lesson_id|does not exist|schema cache|42P01|42703|PGRST20[04]/i;

export default function KnowledgePanel({ supabase, lessonId, subjectId, editable, drafts, onGate }: {
  supabase: SupabaseClient; lessonId: string; subjectId: string | null; editable: boolean; drafts: QuestionDraft[];
  onGate: (g: BankGate) => void;
}) {
  const [state, setState] = useState<'loading' | 'missing' | 'ready'>('loading');
  const [saved, setSaved] = useState<{ level: KnowledgeLevel; prereq: string | null; k: Row | null }>({ level: 'co_ban', prereq: null, k: null });
  const [level, setLevel] = useState<KnowledgeLevel>('co_ban');
  const [prereq, setPrereq] = useState('');
  const [text, setText] = useState({ points: '', example: '', note: '' });
  const [basics, setBasics] = useState<Lite[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const [l, k] = await Promise.all([
        supabase.from('lessons').select('level, prerequisite_lesson_id').eq('id', lessonId).maybeSingle(),
        supabase.from('lesson_knowledge').select('points, example, note, checked_at').eq('lesson_id', lessonId).maybeSingle(),
      ]);
      if (off) return;
      const err = l.error ?? k.error;
      if (err) { setState(MISSING.test(`${err.code} ${err.message}`) ? 'missing' : 'ready'); if (!MISSING.test(`${err.code} ${err.message}`)) setMsg({ ok: false, text: errorText(err) }); return; }
      const lv = ((l.data as { level?: KnowledgeLevel } | null)?.level ?? 'co_ban') as KnowledgeLevel;
      const pr = (l.data as { prerequisite_lesson_id?: string | null } | null)?.prerequisite_lesson_id ?? null;
      const row = (k.data ?? null) as Row | null;
      setSaved({ level: lv, prereq: pr, k: row });
      setLevel(lv); setPrereq(pr ?? '');
      setText({ points: (row?.points ?? []).join('\n'), example: row?.example ?? '', note: row?.note ?? '' });
      setState('ready');
    })();
    return () => { off = true; };
  }, [supabase, lessonId]);

  // bài cơ bản cùng môn để chọn "bài cần học trước"
  useEffect(() => {
    if (state !== 'ready' || !subjectId) return;
    let off = false;
    void supabase.from('lessons').select('id, title').eq('subject_id', subjectId).eq('level', 'co_ban').neq('id', lessonId).neq('status', 'archived')
      .order('sort_order').limit(300).then(({ data }) => { if (!off) setBasics((data ?? []) as Lite[]); });
    return () => { off = true; };
  }, [supabase, state, subjectId, lessonId]);

  const draft = useMemo(() => ({ points: text.points.split('\n').map((x) => x.trim()).filter(Boolean), example: text.example.trim(), note: text.note.trim() }), [text]);
  const live: Verdict = useMemo(() => validateKnowledge(draft, level), [draft, level]);
  const dirty = level !== saved.level || (prereq || null) !== saved.prereq
    || draft.points.join('\n') !== (saved.k?.points ?? []).join('\n') || draft.example !== (saved.k?.example ?? '') || draft.note !== (saved.k?.note ?? '');

  // điều kiện gửi duyệt tính trên bản ĐÃ LƯU (bản đang sửa chưa lưu thì chưa tính)
  const bank: Verdict = useMemo(() => validateLessonBank({
    level: saved.level,
    knowledge: saved.k ? { points: saved.k.points, example: saved.k.example, note: saved.k.note } : null,
    questions: drafts.map((d) => ({ difficulty: d.difficulty, solution: d.solution })),
    prerequisiteId: saved.prereq,
  }), [saved, drafts]);

  // chỉ báo lên khi kết quả thật sự đổi (tránh vòng lặp vẽ lại khi trang cha truyền mảng câu hỏi mới mỗi lần)
  const gateRef = useRef('');
  useEffect(() => {
    const g: BankGate = state === 'ready' ? { available: true, errors: dirty ? ['Còn thay đổi ở “Kiến thức cần nhớ” chưa lưu.', ...bank.errors] : bank.errors } : { available: false, errors: [] };
    const key = JSON.stringify(g);
    if (key === gateRef.current) return;
    gateRef.current = key;
    onGate(g);
  }, [state, bank, dirty, onGate]);

  const save = async () => {
    if (live.errors.length) return;
    setBusy(true); setMsg(null);
    const now = new Date().toISOString();
    const r1 = await supabase.from('lessons').update({ level, prerequisite_lesson_id: level === 'nang_cao' ? prereq || null : null }).eq('id', lessonId);
    const r2 = r1.error ? r1 : draft.points.length
      ? await supabase.from('lesson_knowledge').upsert({ lesson_id: lessonId, points: draft.points, example: draft.example, note: draft.note, checked_at: now, updated_at: now })
      : await supabase.from('lesson_knowledge').delete().eq('lesson_id', lessonId);
    setBusy(false);
    if (r2.error) { setMsg({ ok: false, text: errorText(r2.error) }); return; }
    setSaved({ level, prereq: level === 'nang_cao' ? prereq || null : null, k: draft.points.length ? { ...draft, checked_at: now } : null });
    setMsg({ ok: true, text: 'Đã lưu — máy đã kiểm kiến thức đạt.' });
  };

  if (state === 'loading') return <section className="adm-card"><p className="adm-muted">Đang tải kiến thức cần nhớ…</p></section>;
  if (state === 'missing') return (
    <section className="adm-card">
      <h2 className="adm-kn-h"><BookOpenCheck size={20} aria-hidden="true" /> Kiến thức cần nhớ &amp; cấp bài</h2>
      <p className="adm-setup">Chưa bật: chạy migration <code>0070_lesson_knowledge.sql</code> và <code>0071_lesson_level_grant.sql</code> trên Supabase rồi tải lại trang.
        Trong lúc chưa bật, bài vẫn gửi duyệt / xuất bản như cũ.</p>
    </section>
  );

  const rule = LEVEL_RULES[level];
  return (
    <section className="adm-card adm-kn" aria-labelledby="adm-kn-h">
      <div className="adm-card-head">
        <h2 id="adm-kn-h" className="adm-kn-h"><BookOpenCheck size={20} aria-hidden="true" /> Kiến thức cần nhớ &amp; cấp bài</h2>
        <span className={`adm-tag${saved.level === 'nang_cao' ? ' is-ext' : ''}`}>{LEVEL_LABEL[saved.level]}</span>
        {saved.k?.checked_at && !dirty && <span className="adm-tag is-ok"><CircleCheck size={14} aria-hidden="true" /> Máy đã kiểm</span>}
      </div>

      <fieldset className="adm-fieldset" disabled={!editable || busy}>
        <div className="adm-grid">
          <label className="adm-field">
            <span>Cấp bài</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as KnowledgeLevel)}>
              <option value="co_ban">Cơ bản — theo sách, câu L1–L3</option>
              <option value="nang_cao">Nâng cao — chuyên đề, câu L3–L5</option>
            </select>
          </label>
          {level === 'nang_cao' && (
            <label className="adm-field is-wide">
              <span>Bài cơ bản cần học trước</span>
              <select value={prereq} onChange={(e) => setPrereq(e.target.value)}>
                <option value="">— Chọn bài —</option>
                {basics.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </label>
          )}
        </div>
        <p className="adm-muted adm-kn-hint">{rule.hint}</p>

        <label className="adm-field">
          <span>Ý chính — mỗi dòng một ý (2–4 ý, câu ngắn)</span>
          <textarea rows={4} value={text.points} onChange={(e) => setText({ ...text, points: e.target.value })}
            placeholder={'Hai số hạng đổi chỗ thì tổng không đổi.\nMuốn tìm số hạng chưa biết, lấy tổng trừ số hạng đã biết.'} />
        </label>
        <div className="adm-grid">
          <label className="adm-field is-wide">
            <span>Ví dụ mẫu {level === 'nang_cao' ? '(bắt buộc)' : '(nên có)'} — viết phép tính bằng số</span>
            <textarea rows={2} value={text.example} maxLength={600} onChange={(e) => setText({ ...text, example: e.target.value })} placeholder="… + 3 = 8 → 8 − 3 = 5." />
          </label>
          <label className="adm-field is-wide">
            <span>Ghi chú (không bắt buộc)</span>
            <textarea rows={2} value={text.note} maxLength={600} onChange={(e) => setText({ ...text, note: e.target.value })} />
          </label>
        </div>
      </fieldset>

      {(live.errors.length > 0 || live.warnings.length > 0) && (
        <ul className="adm-kn-list" aria-label="Máy kiểm kiến thức">
          {live.errors.map((e) => <li key={e} className="is-bad"><CircleX size={15} aria-hidden="true" /> {e}</li>)}
          {live.warnings.map((w) => <li key={w} className="is-warn"><TriangleAlert size={15} aria-hidden="true" /> {w}</li>)}
        </ul>
      )}
      {editable && (
        <div className="adm-actions">
          <button type="button" className="adm-btn is-primary" disabled={busy || !dirty || live.errors.length > 0} onClick={save}>
            {busy ? 'Đang lưu…' : 'Lưu kiến thức & cấp bài'}
          </button>
          {live.errors.length > 0 && <span className="adm-muted">Sửa các lỗi máy báo để lưu.</span>}
        </div>
      )}
      {msg && <p className={`adm-alert ${msg.ok ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      <div className="adm-kn-gate">
        <p><b>Điều kiện gửi duyệt / xuất bản</b> ({LEVEL_LABEL[saved.level].toLowerCase()}, theo bản đã lưu)</p>
        {bank.errors.length === 0
          ? <p className="adm-kn-ok"><CircleCheck size={16} aria-hidden="true" /> Đạt — có thể gửi duyệt.</p>
          : <ul className="adm-kn-list">{bank.errors.map((e) => <li key={e} className="is-bad"><CircleX size={15} aria-hidden="true" /> {e}</li>)}</ul>}
        {bank.warnings.filter((w) => !live.warnings.includes(w)).map((w) => <p key={w} className="adm-kn-warn"><TriangleAlert size={15} aria-hidden="true" /> {w}</p>)}
      </div>
    </section>
  );
}
