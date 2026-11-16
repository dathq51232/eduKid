'use client';

// Tiếng Anh sư phạm cho giáo viên (Teacher English Academy):
//   • Lộ trình 24 tuần — 6 giai đoạn, mỗi bài: Objectives → Warm-up → Vocabulary → Useful Expressions →
//     Listening → Speaking/AI role-play → Teaching Challenge → Review. Đánh dấu từng phần, tự đánh giá 1–4.
//   • Ngân hàng mẫu câu Classroom English: lọc theo khối 1–5 (bám Unit sách Global Success), tình huống, chủ đề.
//   • Ôn mỗi ngày: thẻ lật từ vựng / mẫu câu theo lịch nhắc lại (src/lib/teacher-english/review.ts, migration 0060).
//   • Tiến độ: tỉ lệ hoàn thành, mốc đánh giá, lỗi cần cải thiện.
// Toàn bộ song ngữ Anh–Việt; nghe mẫu bằng giọng đọc của trình duyệt (src/lib/speech.ts, tự chuyển /api/tts khi thiếu giọng).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Check, ChevronDown, Cloud, Copy, Flag, HardDrive, Languages, ListChecks,
  Layers, MessagesSquare, Search, Snail, Star, Target, TrendingUp, Volume2, X,
} from 'lucide-react';
import { ToolIcon } from '@/components/classroom/tool-icons';
import { speakSegments, stopSpeaking } from '@/lib/speech';
import {
  DAILY_PLAN, LESSONS, PRINCIPLES, RATING_SCALE, SECTIONS, STAGES, TOOLS_HINT, WEEK_PLAN, WEIGHTS, aiPrompt, lessonsOfStage,
  type Bi, type Lesson, type SectionKey,
} from '@/lib/teacher-english/roadmap';
import { PHRASES, SITUATIONS, TEXTBOOK_UNITS, TOPICS, situationOf, topicOf, unitOf, type Phrase, type SituationKey, type TopicKey } from '@/lib/teacher-english/classroom-bank';
import { f3dSrc, phraseImage } from '@/lib/teacher-english/phrase-images';
import { emptyProgress, useTeacherEnglish, type LessonProgress, type ProgressMap } from '@/lib/teacher-english/progress';
import { fold } from '@/lib/classroom/teacher-nav';
import { buildDeck, todayQueue, useReview } from '@/lib/teacher-english/review';
import DailyReview from '@/components/teacher-english/DailyReview';
import '@/styles/ct.css';
import '@/styles/te.css';
import '@/styles/btn.css';

type Tab = 'lo-trinh' | 'on-tap' | 'mau-cau' | 'tien-do';
const TABS: { key: Tab; en: string; vi: string; Icon: typeof Flag }[] = [
  { key: 'lo-trinh', en: 'Roadmap', vi: 'Lộ trình', Icon: Flag },
  { key: 'on-tap', en: 'Daily review', vi: 'Ôn mỗi ngày', Icon: Layers },
  { key: 'mau-cau', en: 'Classroom English', vi: 'Ngân hàng mẫu câu', Icon: MessagesSquare },
  { key: 'tien-do', en: 'Progress', vi: 'Tiến độ', Icon: TrendingUp },
];
const VI_KEY = 'gv-ta-an-nghia';

/* ───────────── Nghe mẫu ───────────── */
function useSpeaker() {
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => stopSpeaking(), []);
  const play = useCallback((id: string, text: string, slow = false) => {
    if (playing === id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(id);
    void speakSegments([{ text, lang: 'en' }], { rate: slow ? 0.7 : 0.92, onEnd: () => setPlaying((p) => (p === id ? null : p)) })
      .then((r) => { if (!r.ok) setPlaying(null); });
  }, [playing]);
  return { playing, play };
}
type Speaker = ReturnType<typeof useSpeaker>;

function Listen({ id, text, sp, slow = true }: { id: string; text: string; sp: Speaker; slow?: boolean }) {
  return (
    <span className="te-listen">
      <button type="button" className={`te-ic${sp.playing === id ? ' is-on' : ''}`} onClick={() => sp.play(id, text)} aria-label={`Nghe: ${text}`} title="Nghe · Listen"><Volume2 aria-hidden="true" /></button>
      {slow && <button type="button" className={`te-ic${sp.playing === `${id}~` ? ' is-on' : ''}`} onClick={() => sp.play(`${id}~`, text, true)} aria-label={`Nghe chậm: ${text}`} title="Nghe chậm · Slow"><Snail aria-hidden="true" /></button>}
    </span>
  );
}

/** Một dòng song ngữ: tiếng Anh đậm, tiếng Việt nhỏ bên dưới (ẩn được để tự kiểm tra) */
function BiLine({ b, hideVi, sp, id, big = false }: { b: Bi; hideVi: boolean; sp?: Speaker; id?: string; big?: boolean }) {
  return (
    <div className={`te-bi${big ? ' is-big' : ''}`}>
      <div className="te-bi-txt">
        <p className="te-en" lang="en">{b[0]}</p>
        <p className={`te-vi${hideVi ? ' is-hidden' : ''}`} lang="vi">{b[1]}</p>
      </div>
      {sp && id && <Listen id={id} text={b[0]} sp={sp} />}
    </div>
  );
}

const pctOf = (lessons: Lesson[], p: ProgressMap) => {
  const total = lessons.length * SECTIONS.length;
  const done = lessons.reduce((n, l) => n + (p[l.id]?.sections.length ?? 0), 0);
  return total ? Math.round((done / total) * 100) : 0;
};

/* ───────────── Trang chính ───────────── */
export default function TeacherEnglish({ grade }: { grade?: number }) {
  const [tab, setTab] = useState<Tab>('lo-trinh');
  const [hideVi, setHideVi] = useState(false);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const store = useTeacherEnglish();
  // Ôn mỗi ngày: bộ thẻ từ các bài đã bắt đầu + Câu của tôi; số trên tab = thẻ cần ôn hôm nay
  const review = useReview();
  const deck = useMemo(() => buildDeck(store.progress, store.saved), [store.progress, store.saved]);
  const dueCount = useMemo(() => todayQueue(deck, review.map, review.newToday).queue.length, [deck, review.map, review.newToday]);
  const sp = useSpeaker();

  useEffect(() => {
    try { setHideVi(localStorage.getItem(VI_KEY) === '1'); } catch { /* bỏ qua */ }
    const h = window.location.hash.slice(1);
    if (h === 'mau-cau' || h === 'tien-do' || h === 'lo-trinh' || h === 'on-tap') setTab(h);
    else if (/^w\d{2}$/.test(h)) setOpenLesson(h);
  }, []);
  const go = (t: Tab) => { setTab(t); setOpenLesson(null); stopSpeaking(); try { history.replaceState(null, '', `#${t}`); } catch { /* bỏ qua */ } };
  const open = (id: string | null) => {
    setOpenLesson(id); setTab('lo-trinh'); stopSpeaking();
    try { history.replaceState(null, '', `#${id ?? 'lo-trinh'}`); } catch { /* bỏ qua */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleVi = () => setHideVi((v) => { try { localStorage.setItem(VI_KEY, v ? '0' : '1'); } catch { /* bỏ qua */ } return !v; });

  const lesson = openLesson ? LESSONS.find((l) => l.id === openLesson) ?? null : null;
  const overall = pctOf(LESSONS, store.progress);

  return (
    <div className="ct te">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Teacher English Academy · Dạy học</p>
          <h1><ToolIcon k="tieng-anh" /> Tiếng Anh sư phạm <span className="te-h1-en" lang="en">· Teaching English</span></h1>
        </div>
        <div className="ct-actions">
          <span className={`te-sync is-${store.sync}`} title={store.sync === 'cloud' ? 'Tiến độ lưu vào tài khoản' : 'Chưa bật lưu trên tài khoản (migration 0056): tạm lưu trên máy này'}>
            {store.sync === 'cloud' ? <Cloud aria-hidden="true" /> : <HardDrive aria-hidden="true" />}
            {store.sync === 'loading' ? 'Đang tải…' : store.sync === 'cloud' ? 'Đã đồng bộ' : 'Lưu trên máy'}
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={toggleVi} aria-pressed={hideVi}>
            <Languages aria-hidden="true" /> {hideVi ? 'Hiện nghĩa tiếng Việt' : 'Ẩn nghĩa (tự kiểm tra)'}
          </button>
        </div>
      </div>

      <nav className="te-tabs" aria-label="Khu luyện tập">
        {TABS.map(({ key, en, vi, Icon }) => (
          <button key={key} type="button" className={tab === key ? 'is-on' : ''} aria-current={tab === key ? 'page' : undefined} onClick={() => go(key)}>
            <Icon aria-hidden="true" /><span><b>{vi}</b><small lang="en">{en}</small></span>
            {key === 'tien-do' && <em className="te-badge">{overall}%</em>}
            {key === 'on-tap' && dueCount > 0 && <em className="te-badge is-due" aria-label={`${dueCount} thẻ cần ôn hôm nay`}>{dueCount}</em>}
          </button>
        ))}
      </nav>

      {tab === 'lo-trinh' && (lesson
        ? <LessonView lesson={lesson} store={store} sp={sp} hideVi={hideVi} onOpen={open} />
        : <Roadmap progress={store.progress} onOpen={open} />)}
      {tab === 'on-tap' && <DailyReview deck={deck} review={review} />}
      {tab === 'mau-cau' && <PhraseBank sp={sp} hideVi={hideVi} saved={store.saved} toggleSaved={store.toggleSaved} defaultGrade={grade} />}
      {tab === 'tien-do' && <ProgressView progress={store.progress} onOpen={open} />}
    </div>
  );
}

/* ───────────── Lộ trình ───────────── */
function Roadmap({ progress, onOpen }: { progress: ProgressMap; onOpen: (id: string) => void }) {
  // giai đoạn đang học: giai đoạn đầu tiên còn bài chưa xong
  const firstOpen = STAGES.find((s) => lessonsOfStage(s.no).some((l) => !progress[l.id]?.completedAt))?.no ?? 1;
  const [stage, setStage] = useState<number | null>(null);
  const cur = stage ?? firstOpen;
  const st = STAGES[cur - 1];
  const next = LESSONS.find((l) => !progress[l.id]?.completedAt);
  return (
    <div className="te-road">
      {next && (
        <button type="button" className="te-next" onClick={() => onOpen(next.id)}>
          <span className="te-next-k">Bài tiếp theo · Up next</span>
          <b>Tuần {next.week} · {next.title[1]}</b>
          <small lang="en">{next.title[0]}</small>
          <ArrowRight aria-hidden="true" />
        </button>
      )}
      <ol className="te-stages" aria-label="Sáu giai đoạn">
        {STAGES.map((s) => {
          const pct = pctOf(lessonsOfStage(s.no), progress);
          return (
            <li key={s.no}>
              <button type="button" className={`te-stage tone-${s.tone}${cur === s.no ? ' is-on' : ''}`} onClick={() => setStage(s.no)} aria-pressed={cur === s.no}>
                <span className="te-stage-no">GĐ {s.no}</span>
                <b>{s.title[1]}</b>
                <small lang="en">{s.title[0]}</small>
                <span className="te-stage-wk">Tuần {s.no * 4 - 3}–{s.no * 4}</span>
                <span className="te-bar" aria-label={`Đã học ${pct}%`}><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className={`te-stage-card tone-${st.tone}`}>
        <h2>Giai đoạn {st.no}: {st.title[1]} <span lang="en">· {st.title[0]}</span></h2>
        <div className="te-two">
          <div><p className="te-lbl"><Target aria-hidden="true" /> Mục tiêu · Goal</p><p>{st.goal[1]}</p><p className="te-en-sm" lang="en">{st.goal[0]}</p></div>
          <div><p className="te-lbl"><BookOpenCheck aria-hidden="true" /> Đầu ra · Outcome</p><p>{st.outcome[1]}</p><p className="te-en-sm" lang="en">{st.outcome[0]}</p></div>
        </div>
        <ul className="te-weeks">
          {lessonsOfStage(st.no).map((l) => {
            const p = progress[l.id] ?? emptyProgress();
            return (
              <li key={l.id}>
                <button type="button" className={`te-week${p.completedAt ? ' is-done' : ''}`} onClick={() => onOpen(l.id)}>
                  <span className="te-week-no">{p.completedAt ? <Check aria-hidden="true" /> : l.week}</span>
                  <span className="te-week-txt">
                    <b>{l.title[1]}</b>
                    <small lang="en">{l.title[0]}</small>
                    {l.milestone && <em><Flag aria-hidden="true" /> {l.milestone[1]}</em>}
                  </span>
                  <span className="te-week-pct">{p.sections.length}/{SECTIONS.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <details className="te-more">
        <summary><ChevronDown aria-hidden="true" /> Lịch học gợi ý, công cụ và nguyên tắc · Study plan, tools & principles</summary>
        <div className="te-more-grid">
          <div>
            <h3>Mỗi ngày 60 phút · 60 minutes a day</h3>
            <ul className="te-plan">
              {DAILY_PLAN.map((d) => <li key={d.title[0]}><b>{d.minutes}′</b><span>{d.title[1]} <small lang="en">· {d.title[0]}</small><br />{d.how[1]}</span></li>)}
            </ul>
          </div>
          <div>
            <h3>Trong tuần · Weekly focus</h3>
            <ul className="te-simple">{WEEK_PLAN.map((w) => <li key={w[0]}>{w[1]}<small lang="en">{w[0]}</small></li>)}</ul>
          </div>
          <div>
            <h3>Công cụ hỗ trợ · Tools</h3>
            <ul className="te-simple">{TOOLS_HINT.map((t) => <li key={t.name}><b>{t.name}</b>: {t.role[1]}<small lang="en">{t.role[0]}</small></li>)}</ul>
          </div>
          <div>
            <h3>Nguyên tắc · Principles</h3>
            <ul className="te-simple">{PRINCIPLES.map((p) => <li key={p[0]}>{p[1]}<small lang="en">{p[0]}</small></li>)}</ul>
          </div>
        </div>
      </details>
    </div>
  );
}

/** Một phần của bài học, có nút đánh dấu đã xong (đặt ngoài LessonView để ô ghi chú không bị dựng lại khi gõ) */
function Sec({ k, lid, p, toggle, children }: { k: SectionKey; lid: string; p: LessonProgress; toggle: (lessonId: string, key: SectionKey) => void; children: React.ReactNode }) {
  const meta = SECTIONS.find((s) => s.key === k)!;
  const done = p.sections.includes(k);
  const n = SECTIONS.findIndex((s) => s.key === k) + 1;
  return (
    <section className={`te-sec${done ? ' is-done' : ''}`} aria-labelledby={`${lid}-${k}`}>
      <header>
        <span className="te-sec-no">{n}</span>
        <h3 id={`${lid}-${k}`}>{meta.vi} <span lang="en">· {meta.en}</span></h3>
        <button type="button" className="te-done" onClick={() => toggle(lid, k)} aria-pressed={done}>
          <Check aria-hidden="true" /> {done ? 'Đã xong' : 'Đánh dấu xong'}
        </button>
      </header>
      <div className="te-sec-body">{children}</div>
    </section>
  );
}

/* ───────────── Một bài học ───────────── */
function LessonView({ lesson: l, store, sp, hideVi, onOpen }: {
  lesson: Lesson; store: ReturnType<typeof useTeacherEnglish>; sp: Speaker; hideVi: boolean; onOpen: (id: string | null) => void;
}) {
  const p = store.progress[l.id] ?? emptyProgress();
  const st = STAGES[l.stage - 1];
  const [note, setNote] = useState(p.note);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setNote(store.progress[l.id]?.note ?? ''); }, [l.id]); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ nạp lại khi đổi bài
  const idx = LESSONS.findIndex((x) => x.id === l.id);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(aiPrompt(l)); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* trình duyệt chặn */ }
  };
  const playDialogue = () => {
    const id = `${l.id}-dlg`;
    if (sp.playing === id) { sp.play(id, ''); return; }
    sp.play(id, l.listening.lines.map((x) => x.en).join(' … '));
  };

  return (
    <article className={`te-lesson tone-${st.tone}`}>
      <div className="te-lesson-nav">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpen(null)}><ArrowLeft aria-hidden="true" /> Lộ trình</button>
        <span className="te-lesson-pos">Giai đoạn {l.stage} · Tuần {l.week}/24</span>
      </div>
      <header className="te-lesson-hd">
        <p className="te-kick">{st.title[1]} · <span lang="en">{st.title[0]}</span></p>
        <h2 lang="en">Week {l.week}: {l.title[0]}</h2>
        <p className="te-lesson-vi">{l.title[1]}</p>
        {l.milestone && <p className="te-milestone"><Flag aria-hidden="true" /> <b>Mốc đánh giá · Checkpoint:</b> {l.milestone[1]} <span lang="en">({l.milestone[0]})</span></p>}
        <div className="te-progress-row">
          <span className="te-bar is-lg"><i style={{ transform: `scaleX(${p.sections.length / SECTIONS.length})` }} /></span>
          <b>{p.sections.length}/{SECTIONS.length} phần</b>
          {p.completedAt && <span className="te-chip is-ok"><Check aria-hidden="true" /> Hoàn thành</span>}
        </div>
      </header>

      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="objectives">
        <ul className="te-list">{l.objectives.map((o, i) => <li key={i}><BiLine b={o} hideVi={hideVi} /></li>)}</ul>
      </Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="warmup"><BiLine b={l.warmUp} hideVi={hideVi} big /></Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="vocabulary">
        <ul className="te-vocab">
          {l.vocabulary.map((v) => (
            <li key={v.word}>
              <div><b lang="en">{v.word}</b>{v.ipa && <code>{v.ipa}</code>}<span className={hideVi ? 'is-hidden' : ''}>{v.vi}</span></div>
              <Listen id={`${l.id}-v-${v.word}`} text={v.word} sp={sp} />
            </li>
          ))}
        </ul>
      </Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="expressions">
        <ul className="te-list">{l.expressions.map((e, i) => <li key={i}><BiLine b={e} hideVi={hideVi} sp={sp} id={`${l.id}-e${i}`} /></li>)}</ul>
      </Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="listening">
        <div className="te-dlg-hd">
          <p><b>Tình huống:</b> {l.listening.scene[1]} <span lang="en" className="te-en-sm">{l.listening.scene[0]}</span></p>
          <button type="button" className={`btn btn-sm ${sp.playing === `${l.id}-dlg` ? 'btn-primary' : 'btn-outline'}`} onClick={playDialogue}>
            <Volume2 aria-hidden="true" /> {sp.playing === `${l.id}-dlg` ? 'Dừng' : 'Nghe cả đoạn'}
          </button>
        </div>
        <ol className="te-dlg">
          {l.listening.lines.map((x, i) => (
            <li key={i} className={x.who === 'T' || x.who === 'A' ? 'is-a' : 'is-b'}>
              <span className="te-who">{x.who === 'T' ? 'Teacher' : x.who === 'S' ? 'Pupil' : x.who}</span>
              <BiLine b={[x.en, x.vi]} hideVi={hideVi} sp={sp} id={`${l.id}-d${i}`} />
            </li>
          ))}
        </ol>
        <p className="te-tip">Cách luyện: nghe → nhắc lại từng câu (chú ý trọng âm, ngữ điệu) → che phần tiếng Việt và nói lại cả đoạn → đổi tên, chi tiết để tạo câu mới.</p>
      </Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="speaking">
        <ul className="te-list">{l.speaking.map((s, i) => <li key={i}><BiLine b={s} hideVi={hideVi} /></li>)}</ul>
        <div className="te-ai">
          <p className="te-lbl"><MessagesSquare aria-hidden="true" /> Đóng vai với AI · AI role-play</p>
          <BiLine b={l.rolePlay} hideVi={hideVi} />
          <details>
            <summary>Xem câu lệnh mẫu cho trợ lý AI</summary>
            <pre className="te-prompt">{aiPrompt(l)}</pre>
          </details>
          <button type="button" className="btn btn-outline btn-sm" onClick={copyPrompt}>{copied ? <><Check aria-hidden="true" /> Đã chép</> : <><Copy aria-hidden="true" /> Chép câu lệnh</>}</button>
        </div>
      </Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="challenge"><BiLine b={l.challenge} hideVi={hideVi} big /></Sec>
      <Sec lid={l.id} p={p} toggle={store.toggleSection} k="review">
        <ul className="te-list">{l.review.map((r, i) => <li key={i}><BiLine b={r} hideVi={hideVi} /></li>)}</ul>
        <div className="te-self">
          <p className="te-lbl"><ListChecks aria-hidden="true" /> Tự đánh giá · Self-assessment (1–4)</p>
          <div className="te-rates" role="radiogroup" aria-label="Tự đánh giá">
            {RATING_SCALE.map((r) => (
              <button key={r.level} type="button" role="radio" aria-checked={p.rating === r.level} className={p.rating === r.level ? 'is-on' : ''}
                onClick={() => store.update(l.id, { rating: p.rating === r.level ? null : r.level })} title={r.desc[1]}>
                <b>{r.level}</b><span>{r.title[1]}</span><small lang="en">{r.title[0]}</small>
              </button>
            ))}
          </div>
          <label className="te-note">
            <span>Lỗi cần cải thiện · Errors to work on</span>
            <textarea rows={3} maxLength={1000} value={note} placeholder="Ví dụ: hay bỏ âm cuối /s/; câu giao nhiệm vụ còn dài…" onChange={(e) => setNote(e.target.value)}
              onBlur={() => { if (note !== p.note) store.update(l.id, { note }); }} />
          </label>
        </div>
      </Sec>

      <div className="te-lesson-foot">
        {prev ? <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpen(prev.id)}><ArrowLeft aria-hidden="true" /> Tuần {prev.week}</button> : <span />}
        {next && <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpen(next.id)}>Tuần {next.week} <ArrowRight aria-hidden="true" /></button>}
      </div>
    </article>
  );
}

/* ───────────── Ngân hàng mẫu câu ───────────── */
type GradeFilter = 'all' | 0 | 1 | 2 | 3 | 4 | 5;
const PAGE = 60;

function PhraseBank({ sp, hideVi, saved, toggleSaved, defaultGrade }: { sp: Speaker; hideVi: boolean; saved: string[]; toggleSaved: (id: string) => void; defaultGrade?: number }) {
  const [grade, setGrade] = useState<GradeFilter>(defaultGrade && defaultGrade >= 1 && defaultGrade <= 5 ? (defaultGrade as GradeFilter) : 'all');
  const [situation, setSituation] = useState<SituationKey | ''>('');
  const [topic, setTopic] = useState<TopicKey | ''>('');
  const [unit, setUnit] = useState<number | ''>('');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => { setLimit(PAGE); }, [grade, situation, topic, unit, q, mine]);

  const units = useMemo(() => (typeof grade === 'number' && grade > 0 ? TEXTBOOK_UNITS.filter((u) => u.grade === grade) : []), [grade]);
  const savedSet = useMemo(() => new Set(saved), [saved]);
  const list = useMemo(() => {
    const needle = fold(q);
    return PHRASES.filter((p) => {
      if (mine && !savedSet.has(p.id)) return false;
      if (grade !== 'all') {
        // chọn một khối: hiện câu của khối đó + câu dùng chung (trừ khi đang lọc theo Unit/chủ đề)
        if (grade === 0 ? p.grade !== 0 : (p.grade !== grade && !(p.grade === 0 && !unit && !topic))) return false;
      }
      if (unit && p.unit !== unit) return false;
      if (situation && p.situation !== situation) return false;
      if (topic && p.topic !== topic) return false;
      if (needle && !fold(`${p.en} ${p.vi}`).includes(needle)) return false;
      return true;
    }).sort((a, b) => (a.grade === 0 ? 0 : 1) - (b.grade === 0 ? 0 : 1) || a.grade - b.grade || (a.unit ?? 0) - (b.unit ?? 0));
  }, [grade, situation, topic, unit, q, mine, savedSet]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: PHRASES.length };
    for (const p of PHRASES) c[p.grade] = (c[p.grade] ?? 0) + 1;
    return c;
  }, []);
  const copy = async (p: Phrase) => {
    try { await navigator.clipboard.writeText(`${p.en}\n${p.vi}`); setCopied(p.id); window.setTimeout(() => setCopied(null), 1500); } catch { /* bị chặn */ }
  };
  const reset = () => { setGrade('all'); setSituation(''); setTopic(''); setUnit(''); setQ(''); setMine(false); };
  const unitInfo = typeof grade === 'number' && grade > 0 && unit ? unitOf(grade, unit) : null;

  return (
    <div className="te-bank">
      <div className="te-filters">
        <div className="te-grades" role="group" aria-label="Lọc theo khối">
          {(['all', 0, 1, 2, 3, 4, 5] as GradeFilter[]).map((g) => (
            <button key={String(g)} type="button" className={grade === g ? 'is-on' : ''} aria-pressed={grade === g} onClick={() => { setGrade(g); setUnit(''); }}>
              {g === 'all' ? 'Tất cả' : g === 0 ? 'Dùng chung' : `Lớp ${g}`}<small>{g === 'all' ? counts.all : counts[g] ?? 0}</small>
            </button>
          ))}
        </div>
        <div className="te-frow">
          <label className="te-search">
            <Search aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm câu tiếng Anh hoặc tiếng Việt…" aria-label="Tìm mẫu câu" />
          </label>
          <select value={situation} onChange={(e) => setSituation(e.target.value as SituationKey | '')} aria-label="Tình huống">
            <option value="">Mọi tình huống · All situations</option>
            {SITUATIONS.map((s) => <option key={s.key} value={s.key}>{s.emoji} {s.vi} · {s.en}</option>)}
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value as TopicKey | '')} aria-label="Chủ đề">
            <option value="">Mọi chủ đề · All topics</option>
            {TOPICS.map((t) => <option key={t.key} value={t.key}>{t.vi} · {t.en}</option>)}
          </select>
          {units.length > 0 && (
            <select value={unit} onChange={(e) => setUnit(e.target.value ? Number(e.target.value) : '')} aria-label="Unit sách giáo khoa">
              <option value="">Mọi Unit lớp {grade}</option>
              {units.map((u) => <option key={u.unit} value={u.unit}>Unit {u.unit}. {u.en} — {u.vi}</option>)}
            </select>
          )}
          <button type="button" className={`te-mine${mine ? ' is-on' : ''}`} aria-pressed={mine} onClick={() => setMine((v) => !v)}><Star aria-hidden="true" /> Câu của tôi ({saved.length})</button>
        </div>
        <div className="te-sit-chips" role="group" aria-label="Tình huống nhanh">
          {SITUATIONS.map((s) => (
            <button key={s.key} type="button" className={situation === s.key ? 'is-on' : ''} aria-pressed={situation === s.key} onClick={() => setSituation(situation === s.key ? '' : s.key)}>
              <span aria-hidden="true">{s.emoji}</span> {s.vi}
            </button>
          ))}
        </div>
      </div>

      {unitInfo && (
        <p className="te-unit-hd">📘 Lớp {unitInfo.grade} · <b lang="en">Unit {unitInfo.unit}. {unitInfo.en}</b> — {unitInfo.vi} <span className="te-chip">{topicOf(unitInfo.topic).vi}</span></p>
      )}
      <p className="te-count" aria-live="polite">
        {list.length} mẫu câu{grade !== 'all' && grade !== 0 && !unit && !topic ? ` (gồm câu dùng chung và câu theo Unit lớp ${grade})` : ''}
        {(grade !== 'all' || situation || topic || unit || q || mine) && <button type="button" className="te-link" onClick={reset}><X aria-hidden="true" /> Bỏ lọc</button>}
      </p>

      {list.length === 0 ? (
        <p className="te-empty">{mine ? 'Chưa có câu nào trong "Câu của tôi". Bấm ☆ ở mẫu câu để lưu.' : 'Không có mẫu câu khớp bộ lọc.'}</p>
      ) : (
        <ul className="te-phrases">
          {list.slice(0, limit).map((p) => {
            const s = situationOf(p.situation);
            const on = savedSet.has(p.id);
            return (
              <li key={p.id} className="te-phrase">
                {/* eslint-disable-next-line @next/next/no-img-element -- hình 3D webp nhỏ đã tối ưu sẵn */}
                <img className="te-phrase-img" src={f3dSrc(phraseImage(p))} width={56} height={56} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <div className="te-phrase-main">
                  <p className="te-en" lang="en">{p.en}</p>
                  <p className={`te-vi${hideVi ? ' is-hidden' : ''}`} lang="vi">{p.vi}</p>
                  <p className="te-tags">
                    <span className="te-chip">{s.emoji} {s.vi}</span>
                    {p.grade > 0 ? <span className="te-chip is-grade">Lớp {p.grade} · Unit {p.unit}</span> : <span className="te-chip is-all">Mọi khối</span>}
                    {p.topic && <span className="te-chip is-topic">{topicOf(p.topic).vi}</span>}
                  </p>
                </div>
                <div className="te-phrase-act">
                  <Listen id={p.id} text={p.en} sp={sp} />
                  <button type="button" className={`te-ic${on ? ' is-star' : ''}`} onClick={() => toggleSaved(p.id)} aria-pressed={on} aria-label={on ? 'Bỏ khỏi Câu của tôi' : 'Lưu vào Câu của tôi'} title="Câu của tôi"><Star aria-hidden="true" /></button>
                  <button type="button" className="te-ic" onClick={() => copy(p)} aria-label="Chép câu" title="Chép">{copied === p.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > limit && <button type="button" className="btn btn-outline btn-sm te-moreb" onClick={() => setLimit((n) => n + PAGE)}>Xem thêm {Math.min(PAGE, list.length - limit)} câu</button>}
      <p className="te-tip">Cách học mỗi nhóm câu: nghe mẫu → nhắc lại nhiều lần (trọng âm, ngữ điệu) → nói cả câu → thay từ để tạo câu mới → đóng vai giáo viên – học sinh → ghi âm 1–2 phút để tự đánh giá.</p>
    </div>
  );
}

/* ───────────── Tiến độ ───────────── */
function ProgressView({ progress, onOpen }: { progress: ProgressMap; onOpen: (id: string) => void }) {
  const done = LESSONS.filter((l) => progress[l.id]?.completedAt).length;
  const started = LESSONS.filter((l) => (progress[l.id]?.sections.length ?? 0) > 0).length;
  const rated = LESSONS.map((l) => progress[l.id]?.rating).filter((r): r is number => typeof r === 'number');
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
  const notes = LESSONS.filter((l) => progress[l.id]?.note.trim());
  const milestones = LESSONS.filter((l) => l.milestone);
  return (
    <div className="te-prog">
      <div className="te-kpis">
        <div><b>{pctOf(LESSONS, progress)}%</b><span>Hoàn thành lộ trình</span><small lang="en">Roadmap completed</small></div>
        <div><b>{done}/24</b><span>Bài đã xong</span><small lang="en">Weeks completed</small></div>
        <div><b>{started}</b><span>Bài đã bắt đầu</span><small lang="en">Weeks started</small></div>
        <div><b>{avg ? avg.toFixed(1) : '–'}</b><span>Tự đánh giá TB (1–4)</span><small lang="en">Average self-rating</small></div>
      </div>

      <section className="te-card">
        <h2>Theo giai đoạn · By stage</h2>
        <ul className="te-stagebars">
          {STAGES.map((s) => {
            const pct = pctOf(lessonsOfStage(s.no), progress);
            return <li key={s.no} className={`tone-${s.tone}`}><span>GĐ {s.no}. {s.title[1]}</span><span className="te-bar is-lg"><i style={{ transform: `scaleX(${pct / 100})` }} /></span><b>{pct}%</b></li>;
          })}
        </ul>
      </section>

      <section className="te-card">
        <h2>Mốc đánh giá · Checkpoints</h2>
        <ul className="te-miles">
          {milestones.map((l) => {
            const p = progress[l.id];
            return (
              <li key={l.id}>
                <button type="button" onClick={() => onOpen(l.id)} className={p?.completedAt ? 'is-done' : ''}>
                  <span className="te-week-no">{p?.completedAt ? <Check aria-hidden="true" /> : l.week}</span>
                  <span><b>Tuần {l.week}: {l.milestone![1]}</b><small lang="en">{l.milestone![0]}</small></span>
                  <em>{p?.rating ? `Mức ${p.rating}` : 'Chưa chấm'}</em>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="te-card">
        <h2>Lỗi cần cải thiện · Errors to work on</h2>
        {notes.length === 0 ? <p className="te-empty">Chưa có ghi chú. Ở phần Review của mỗi bài, ghi lại lỗi hay mắc để theo dõi tiến bộ.</p> : (
          <ul className="te-notes">
            {notes.map((l) => <li key={l.id}><button type="button" className="te-link" onClick={() => onOpen(l.id)}>Tuần {l.week}</button> {progress[l.id]!.note}</li>)}
          </ul>
        )}
      </section>

      <div className="te-two">
        <section className="te-card">
          <h2>Thang đánh giá thực hành · Rating scale</h2>
          <ul className="te-scale">{RATING_SCALE.map((r) => <li key={r.level}><b>{r.level}</b><span><b>{r.title[1]}</b> <small lang="en">({r.title[0]})</small><br />{r.desc[1]}</span></li>)}</ul>
        </section>
        <section className="te-card">
          <h2>Trọng số đánh giá năng lực · Weighting</h2>
          <ul className="te-weights">{WEIGHTS.map((w) => <li key={w.title[0]}><span>{w.title[1]} <small lang="en">· {w.title[0]}</small></span><b>{w.pct}%</b></li>)}</ul>
          <p className="te-tip">Nên lưu bản ghi âm hoặc video ở các mốc tuần 1, 4, 8, 12, 16, 20, 24 để so sánh tiến bộ thực tế.</p>
        </section>
      </div>
    </div>
  );
}
