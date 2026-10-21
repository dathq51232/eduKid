'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Clock, Dices, Gauge, ListChecks, Map as MapIcon, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import Sticker from '@/components/learn/Sticker';
import { SUBJECT_MASCOT } from '@/lib/mascots';
import type { StickerId } from '@/lib/stickers';
import LearnHeader from '@/components/LearnHeader';
import LessonToc, { lessonAnchor, lessonBadge, type TocGroup } from '@/components/LessonToc';
import { GRADES, SUBJECTS, countQuestions, getLessons, getSubject, isSubjectCode, lessonTimeLimit, parseGrade } from '@/lib/data';
import { rankFor } from '@/lib/levels';
import { MUC, MUC_LIST, type Muc } from '@/lib/sets';
import { mucFor, readBest, readMucStore, readTotalPoints, saveMucAll, saveMucLesson, starsFor, type BestMap, type MucStore } from '@/lib/progress';
import { TOPICS_BY_GRADE } from '@/lib/curriculum';
import type { Lesson, SubjectCode } from '@/lib/types';

/** Sticker 3D trang trí theo môn (ảnh có sẵn trong public/stickers) */
const HERO_STICKERS: Record<SubjectCode, StickerId[]> = {
  toan: ['rocket', 'planet', 'balloon'],
  'tieng-viet': ['kite', 'sunflower', 'butterfly'],
  'tieng-anh': ['rainbow', 'whale', 'sun'],
};
const TOPIC_STICKERS: StickerId[] = ['dino', 'whale', 'cat', 'turtle', 'goldfish', 'apple', 'icecream', 'car', 'boat', 'kite', 'tree', 'house', 'cactus', 'moon', 'cloud', 'crown', 'lucky'];

function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} trên 3 ngôi sao`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={24} strokeWidth={2} className={i < count ? 'star-on' : 'star-off'} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Khối của tài khoản học sinh (máy chủ ghi cookie gợi ý, xem middleware) — chỉ để ẩn nút lớp khác */
function useLockedGrade(): number | null {
  const [g, setG] = useState<number | null>(null);
  useEffect(() => {
    const m = /(?:^|;\s*)edukid_grade=([1-5])(?:;|$)/.exec(document.cookie);
    setG(m ? Number(m[1]) : null);
  }, []);
  return g;
}

function ChonBaiContent() {
  const lockedGrade = useLockedGrade();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');
  const subjectCode = isSubjectCode(subjectParam) ? subjectParam : 'toan';
  const grade = parseGrade(searchParams.get('grade'));
  const subject = getSubject(subjectCode);
  const lessons = getLessons(subjectCode, grade);

  const [best, setBest] = useState<BestMap>({});
  const [mucStore, setMucStore] = useState<MucStore>({ all: 1, lessons: {} });
  const [points, setPoints] = useState(0);
  useEffect(() => {
    setBest(readBest());
    setPoints(readTotalPoints());
    setMucStore(readMucStore());
  }, []);
  const rank = rankFor(points);

  // Nhóm bài theo chủ đề/unit của bộ sách (giữ đúng thứ tự trong sách); bài không có unit thì nhóm theo danh mục
  const topics = TOPICS_BY_GRADE[grade]?.[subjectCode] ?? [];
  const groups: { key: string; title?: string; description?: string; list: Lesson[] }[] = [];
  for (const l of lessons) {
    const key = l.unit?.code ?? l.topicCode ?? 'khac';
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const t = l.unit ? undefined : topics.find((x) => x.code === l.topicCode);
      g = { key, title: l.unit?.title ?? t?.title, description: l.unit ? undefined : t?.description, list: [] };
      groups.push(g);
    }
    g.list.push(l);
  }
  const book = lessons.find((l) => l.book && l.kind !== 'review')?.book;

  const doneCount = lessons.filter((l) => best[l.id]).length;
  const nextLesson = lessons.find((l) => !best[l.id]);
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  // Mục lục: số bài theo sách (Bài 27 → 27, Tuần 3 → 3, Unit 2 → 2), tên bài rút gọn
  const tocGroups: TocGroup[] = groups.map((g) => ({
    key: g.key,
    title: g.title,
    items: g.list.map((l) => ({
      id: l.id,
      no: lessonBadge(l.title, lessons.indexOf(l) + 1)[0],
      label: lessonBadge(l.title, lessons.indexOf(l) + 1)[1],
      title: l.title,
      done: !!best[l.id],
      next: nextLesson?.id === l.id,
    })),
  }));

  const starTotal = lessons.reduce((n, l) => n + (best[l.id] ? starsFor(best[l.id].score, best[l.id].total) : 0), 0);
  // Mức Cơ bản: bộ câu gốc của bài; mức Khá/Giỏi: bộ câu mới theo mức đó
  const startHrefFor = (l: Lesson) => {
    const href = `/lam-bai?lessonId=${l.id}&subject=${subjectCode}&grade=${grade}`;
    const m = mucFor(mucStore, l.id);
    return m > 1 ? `${href}&muc=${m}` : href;
  };
  const bubble = !lessons.length ? 'Bài mới sắp có rồi!'
    : !nextLesson ? 'Em học hết rồi, giỏi quá!'
    : doneCount === 0 ? 'Mình cùng học bài đầu tiên nhé!'
    : doneCount * 2 < lessons.length ? `Em đã học ${doneCount} bài rồi. Cố lên!`
    : `Sắp về đích rồi! Còn ${lessons.length - doneCount} bài.`;

  const go = (code: string, g: number) => router.replace(`/chon-bai?subject=${code}&grade=${g}`, { scroll: false });

  return (
    <>
      <LearnHeader />
      <div className="chon-layout">
      {lessons.length > 0 && <LessonToc groups={tocGroups} subjectName={`${subject.name} lớp ${grade}`} />}
      <main className="learn-main chon-main">
        <Link href="/" className="back-link">
          <ArrowLeft size={20} aria-hidden="true" /> Trang chủ
        </Link>

        <div className="grade-row is-learn" role="group" aria-label="Chọn lớp">
          <span className="grade-title">{lockedGrade ? 'Lớp của em' : 'Lớp'}</span>
          {GRADES.filter((g) => !lockedGrade || g === lockedGrade).map((g) => (
            <Link
              key={g}
              href={`/chon-bai?subject=${subjectCode}&grade=${g}`}
              replace
              scroll={false}
              className="grade-chip"
              aria-current={g === grade ? 'true' : undefined}
            >
              Lớp {g}
            </Link>
          ))}
        </div>

        <div className="subject-tabs cb-tabs" role="group" aria-label="Chọn môn học">
          {SUBJECTS.map((s) => (
            <button
              key={s.code}
              type="button"
              className={`subject-tab cb-tab ${s.tone}`}
              aria-pressed={s.code === subjectCode}
              onClick={() => go(s.code, grade)}
            >
              <span className="subject-tab-mark cb-tab-mark" aria-hidden="true">{s.mark}</span>
              <span>{s.short}</span>
            </button>
          ))}
        </div>

        <section className={`subject-banner cb-hero ${subject.tone}`} aria-labelledby="cb-title">
          <div className="cb-hero-deco" aria-hidden="true">
            {HERO_STICKERS[subjectCode].map((id, i) => <span key={id} className={`cb-float is-${i}`}><Sticker id={id} size={i ? 64 : 84} /></span>)}
          </div>
          <div className="cb-hero-text">
            {book && <p className="cb-kicker">Lớp {grade} · Bộ {book}</p>}
            <h1 id="cb-title">{subject.name} lớp {grade}</h1>
            <div className="cb-stats">
              <span className="cb-ring" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ môn học">
                <svg viewBox="0 0 44 44" aria-hidden="true">
                  <circle cx="22" cy="22" r="18" className="cb-ring-bg" />
                  <circle cx="22" cy="22" r="18" className="cb-ring-fg" strokeDasharray={`${(percent / 100) * 113.1} 113.1`} />
                </svg>
                <b>{percent}%</b>
              </span>
              <span className="cb-stat"><strong>{doneCount}/{lessons.length}</strong> bài đã học</span>
              <span className="cb-stat"><Star size={18} className="star-on" aria-hidden="true" /> <strong>{starTotal}</strong>/{lessons.length * 3} sao</span>
              <span className="points-chip cb-points">{rank.icon} {points} điểm · {rank.name}</span>
            </div>
            {nextLesson ? (
              <Link href={startHrefFor(nextLesson)} className="button button-yellow cb-cta">
                <Play size={20} aria-hidden="true" /> {doneCount ? 'Học tiếp' : 'Bắt đầu'}: {nextLesson.title}
              </Link>
            ) : lessons.length > 0 ? (
              <p className="cb-alldone"><Trophy size={20} aria-hidden="true" /> Em đã học hết các bài. Làm lại bài nào để lấy thêm sao nhé!</p>
            ) : null}
          </div>
          <div className="cb-milo" aria-hidden="true">
            <p className="cb-bubble">{bubble}</p>
            <MiloMascot variant={SUBJECT_MASCOT[subjectCode]} size={150} />
          </div>
        </section>

        <section className="muc-all cb-muc" aria-labelledby="muc-all-title">
          <div className="cb-muc-head">
            <h2 id="muc-all-title"><Gauge size={22} aria-hidden="true" /> Mức độ cho tất cả các bài</h2>
            <p>Em học tốt rồi? Chọn <strong>Khá</strong> hoặc <strong>Giỏi</strong> để bỏ bớt câu dễ. Mỗi bài vẫn chọn riêng được ở ô “Mức độ”.</p>
          </div>
          <div className="muc-picker cb-muc-picker" role="radiogroup" aria-label="Mức độ cho tất cả các bài">
            {MUC_LIST.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mucStore.all === m} className={`muc-option is-m${m}`} onClick={() => setMucStore(saveMucAll(m))}>
                <strong><span className="cb-muc-dots" aria-hidden="true">{'●'.repeat(m)}{'○'.repeat(3 - m)}</span> {MUC[m].name}</strong>
                <small>{MUC[m].describe}</small>
              </button>
            ))}
          </div>
          <p className="muc-all-note">
            <Dices size={16} aria-hidden="true" /> Nút <strong>Đổi bộ câu hỏi</strong> ở mỗi bài: lấy một bộ 10 câu mới theo mức độ đã chọn.
          </p>
        </section>

        <h2 className="learn-heading cb-heading"><MapIcon size={24} aria-hidden="true" /> Hành trình bài học</h2>
        {book && <p className="book-note">Theo trình tự sách {subject.name} {grade} — bộ {book}. Câu hỏi do EduChain Kids biên soạn.</p>}

        {lessons.length === 0 ? (
          <div className="empty-state">
            <h1>Bài học đang được soạn</h1>
            <p>{subject.name} lớp {grade} sắp có bài mới. Em thử lớp 1 hoặc môn khác nhé.</p>
          </div>
        ) : (
          <div className={`topic-groups cb-groups ${subject.tone}`}>
            {groups.map(({ key, title, description, list }, gi) => {
              const gDone = list.filter((l) => best[l.id]).length;
              return (
              <section key={key} className="topic-group cb-group" aria-label={title ?? 'Bài khác'}>
                {title && (
                  <header className="topic-head cb-topic">
                    <span className="cb-topic-art" aria-hidden="true"><Sticker id={TOPIC_STICKERS[gi % TOPIC_STICKERS.length]} size={52} /></span>
                    <div>
                      <h3>{title}</h3>
                      {description && <p>{description}</p>}
                    </div>
                    <span className={`cb-topic-count${gDone === list.length ? ' is-full' : ''}`}>{gDone}/{list.length} bài</span>
                  </header>
                )}
                <ol className="lesson-list cb-list">
                  {list.map((lesson) => {
              const index = lessons.indexOf(lesson);
              const result = best[lesson.id];
              const isNext = nextLesson?.id === lesson.id;
              const rowClass = `lesson-row cb-card${result ? ' is-done' : ''}${isNext ? ' is-next' : ''}`;
              const href = `/lam-bai?lessonId=${lesson.id}&subject=${subjectCode}&grade=${grade}`;
              const startHref = startHrefFor(lesson);
              return (
                <li key={lesson.id} id={lessonAnchor(lesson.id)} tabIndex={-1} className={rowClass}>
                  {isNext && (
                    <span className="cb-next-tag"><MiloMascot variant={SUBJECT_MASCOT[subjectCode]} size={44} /> Học tiếp</span>
                  )}
                  <div className="cb-card-top">
                    <span className="lesson-no" aria-hidden="true">{result ? <Check size={26} strokeWidth={3} /> : lessonBadge(lesson.title, index + 1)[0]}</span>
                    {result && <Stars count={starsFor(result.score, result.total)} />}
                  </div>
                  <div className="lesson-info">
                    <h3>{lesson.title}</h3>
                    {lesson.description && <p>{lesson.description}</p>}
                    <p className="lesson-meta">
                      <ListChecks size={15} aria-hidden="true" /> {countQuestions(lesson.id)} câu · <Clock size={15} aria-hidden="true" /> tối đa {Math.ceil(lessonTimeLimit(lesson.id) / 60)} phút
                    </p>
                  </div>
                  <div className="lesson-actions cb-actions">
                    <Link href={startHref} className={`button cb-go ${isNext ? 'button-yellow' : 'button-white'}`}>
                      {result ? (
                        <>
                          <RotateCcw size={18} aria-hidden="true" /> Làm lại
                        </>
                      ) : (
                        <>
                          Học bài này <ArrowRight size={18} aria-hidden="true" />
                        </>
                      )}
                    </Link>
                    <div className="cb-tools">
                      <label className="muc-select">
                        <span>Mức độ</span>
                        <select
                          value={mucStore.lessons[lesson.id] ?? 0}
                          onChange={(e) => setMucStore(saveMucLesson(lesson.id, Number(e.target.value) ? (Number(e.target.value) as Muc) : null))}
                        >
                          <option value={0}>Mức chung · {MUC[mucStore.all].name}</option>
                          {MUC_LIST.map((x) => <option key={x} value={x}>{MUC[x].name}</option>)}
                        </select>
                      </label>
                      <Link href={`${href}&muc=${mucFor(mucStore, lesson.id)}&doi=1`} className="button button-practice cb-swap" aria-label={`Đổi bộ câu hỏi: ${lesson.title}`} title="Đổi bộ câu hỏi">
                        <Dices size={18} aria-hidden="true" /> Đổi bộ câu hỏi
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
                </ol>
              </section>
              );
            })}
          </div>
        )}
      </main>
      </div>
    </>
  );
}

export default function ChonBaiPage() {
  return (
    <Suspense fallback={null}>
      <ChonBaiContent />
    </Suspense>
  );
}
