'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Dices, RotateCcw, Star } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import LessonToc, { lessonAnchor, lessonBadge, type TocGroup } from '@/components/LessonToc';
import { GRADES, SUBJECTS, countQuestions, getLessons, getSubject, isSubjectCode, lessonTimeLimit, parseGrade } from '@/lib/data';
import { rankFor } from '@/lib/levels';
import { MUC, MUC_LIST, type Muc } from '@/lib/sets';
import { mucFor, readBest, readMucStore, readTotalPoints, saveMucAll, saveMucLesson, starsFor, type BestMap, type MucStore } from '@/lib/progress';
import { TOPICS_BY_GRADE } from '@/lib/curriculum';
import type { Lesson } from '@/lib/types';

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

        <div className="subject-tabs" role="group" aria-label="Chọn môn học">
          {SUBJECTS.map((s) => (
            <button
              key={s.code}
              type="button"
              className={`subject-tab ${s.tone}`}
              aria-pressed={s.code === subjectCode}
              onClick={() => go(s.code, grade)}
            >
              <span className="subject-tab-mark" aria-hidden="true">{s.mark}</span>
              <span>{s.short}</span>
            </button>
          ))}
        </div>

        <section className={`subject-banner ${subject.tone}`}>
          <h1>{subject.name} lớp {grade}</h1>
          <p>Mỗi bài chỉ vài phút. Làm xong bài nào, em nhận sao và điểm cho bài đó.</p>
          <p className="points-chip">{rank.icon} {points} điểm tích luỹ · {rank.name}</p>
          <div className="progress-label">
            <span>Đã học {doneCount}/{lessons.length} bài</span>
            <span>{percent}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ môn học">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </section>

        <section className="muc-all" aria-labelledby="muc-all-title">
          <h2 id="muc-all-title">Mức độ cho tất cả các bài</h2>
          <p>Em học tốt rồi? Chọn <strong>Khá</strong> hoặc <strong>Giỏi</strong> để bỏ bớt câu dễ. Mỗi bài vẫn chọn riêng được ở ô “Mức độ”.</p>
          <div className="muc-picker" role="radiogroup" aria-label="Mức độ cho tất cả các bài">
            {MUC_LIST.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mucStore.all === m} className={`muc-option is-m${m}`} onClick={() => setMucStore(saveMucAll(m))}>
                <strong>{MUC[m].name}</strong>
                <small>{MUC[m].describe}</small>
              </button>
            ))}
          </div>
          <p className="muc-all-note">
            <Dices size={16} aria-hidden="true" /> Nút <strong>Đổi bộ câu hỏi</strong> ở mỗi bài: lấy một bộ 10 câu mới theo mức độ đã chọn.
          </p>
        </section>

        <h2 className="learn-heading">Danh sách bài học</h2>
        {book && <p className="book-note">Theo trình tự sách {subject.name} {grade} — bộ {book}. Câu hỏi do EduChain Kids biên soạn.</p>}

        {lessons.length === 0 ? (
          <div className="empty-state">
            <h1>Bài học đang được soạn</h1>
            <p>{subject.name} lớp {grade} sắp có bài mới. Em thử lớp 1 hoặc môn khác nhé.</p>
          </div>
        ) : (
          <div className={`topic-groups ${subject.tone}`}>
            {groups.map(({ key, title, description, list }) => (
              <section key={key} className="topic-group" aria-label={title ?? 'Bài khác'}>
                {title && (
                  <header className="topic-head">
                    <h3>{title}</h3>
                    {description && <p>{description}</p>}
                  </header>
                )}
                <ol className="lesson-list">
                  {list.map((lesson) => {
              const index = lessons.indexOf(lesson);
              const result = best[lesson.id];
              const isNext = nextLesson?.id === lesson.id;
              const rowClass = `lesson-row${result ? ' is-done' : ''}${isNext ? ' is-next' : ''}`;
              const href = `/lam-bai?lessonId=${lesson.id}&subject=${subjectCode}&grade=${grade}`;
              const m = mucFor(mucStore, lesson.id);
              // Mức Cơ bản: bộ câu gốc của bài; mức Khá/Giỏi: bộ câu mới theo mức đó
              const startHref = m > 1 ? `${href}&muc=${m}` : href;
              return (
                <li key={lesson.id} id={lessonAnchor(lesson.id)} tabIndex={-1} className={rowClass}>
                  <span className="lesson-no" aria-hidden="true">{lessonBadge(lesson.title, index + 1)[0]}</span>
                  <div className="lesson-info">
                    <h3>{lesson.title}</h3>
                    {lesson.description && <p>{lesson.description}</p>}
                    <p className="lesson-meta">
                      {countQuestions(lesson.id)} câu hỏi · tối đa {Math.ceil(lessonTimeLimit(lesson.id) / 60)} phút
                    </p>
                  </div>
                  <div className="lesson-actions">
                    {result ? <Stars count={starsFor(result.score, result.total)} /> : <span className="lesson-meta">Chưa học</span>}
                    <label className="muc-select">
                      <span>Mức độ</span>
                      <select
                        value={mucStore.lessons[lesson.id] ?? 0}
                        onChange={(e) => setMucStore(saveMucLesson(lesson.id, Number(e.target.value) ? (Number(e.target.value) as Muc) : null))}
                      >
                        <option value={0}>Theo mức chung ({MUC[mucStore.all].name})</option>
                        {MUC_LIST.map((x) => <option key={x} value={x}>{MUC[x].name}</option>)}
                      </select>
                    </label>
                    <Link href={startHref} className={`button ${isNext ? 'button-yellow' : 'button-white'}`}>
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
                    <Link href={`${href}&muc=${mucFor(mucStore, lesson.id)}&doi=1`} className="button button-practice" aria-label={`Đổi bộ câu hỏi: ${lesson.title}`}>
                      <Dices size={18} aria-hidden="true" /> Đổi bộ câu hỏi
                    </Link>
                  </div>
                </li>
              );
            })}
                </ol>
              </section>
            ))}
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
