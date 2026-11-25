import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, Lightbulb, Play } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import { HOC_GROUPS, answerLabel, blank, hocGroup, hocHref, hocLesson, practiceHref, samples } from '@/lib/hoc/catalog';
import { knowledgeFor } from '@/lib/content/knowledge';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import '@/styles/btn.css';
import '@/styles/hl.css';

type Params = { params: Promise<{ nhom: string; bai: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return HOC_GROUPS.flatMap((g) => g.lessons.map((l) => ({ nhom: g.key, bai: l.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { nhom, bai } = await params;
  const g = hocGroup(nhom);
  const it = hocLesson(nhom, bai);
  if (!g || !it) return {};
  const l = it.lesson;
  return {
    title: `${l.title} — ${g.name} (${l.book}) · Bài tập có lời giải`,
    description: `${l.description} ${g.name}, ${l.ref}. Kiến thức cần nhớ, câu hỏi mẫu có lời giải và ${l.questions.length} câu luyện tập trắc nghiệm cùng Milo.`.slice(0, 300),
    alternates: { canonical: hocHref(g, it) },
    openGraph: { title: `${l.title} — ${g.name}`, description: l.description, url: hocHref(g, it) },
  };
}

const LETTERS = 'ABCDEFGH';

/** Một bài: kiến thức cần nhớ + câu mẫu có lời giải + nút luyện tập (trang tĩnh, dựng sẵn lúc build) */
export default async function HocLessonPage({ params }: Params) {
  const { nhom, bai } = await params;
  const g = hocGroup(nhom);
  const it = hocLesson(nhom, bai);
  if (!g || !it) notFound();
  const l = it.lesson;
  const k = knowledgeFor(l.id);
  const { passage, items: qs } = samples(l);
  const idx = g.lessons.indexOf(it);
  const prev = g.lessons[idx - 1];
  const next = g.lessons[idx + 1];
  const url = `${SITE_URL}${hocHref(g, it)}`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'LearningResource',
      name: l.title, description: l.description, url, inLanguage: 'vi-VN',
      learningResourceType: l.kind === 'review' ? 'Đề ôn tập' : 'Bài tập',
      educationalLevel: `Lớp ${l.grade}`, about: g.name, isAccessibleForFree: true,
      provider: { '@type': 'EducationalOrganization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Thư viện bài học', item: `${SITE_URL}/hoc` },
        { '@type': 'ListItem', position: 2, name: g.name, item: `${SITE_URL}${hocHref(g)}` },
        { '@type': 'ListItem', position: 3, name: l.title, item: url },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <LearnHeader />
      <main className="wrap hl hl-lesson">
        <nav className="hl-crumbs" aria-label="Đường dẫn">
          <Link href="/hoc">Thư viện bài học</Link><ChevronRight aria-hidden="true" />
          <Link href={hocHref(g)}>{g.name}</Link><ChevronRight aria-hidden="true" /><span>{l.ref}</span>
        </nav>
        <header className="hl-head">
          <p className="hl-eyebrow">{g.name} · {l.book} · Học kỳ {l.semester} · {l.unit.title}</p>
          <h1>{l.title}</h1>
          <p>{l.description}</p>
          <Link href={practiceHref(l)} className="btn btn-primary hl-cta"><Play aria-hidden="true" /> Luyện tập bài này ({l.questions.length} câu)</Link>
        </header>

        {k && (
          <section className="hl-box hl-know" aria-labelledby="kien-thuc">
            <h2 id="kien-thuc"><Lightbulb aria-hidden="true" /> Kiến thức cần nhớ</h2>
            <ul>{k.points.map((p, i) => <li key={i}>{blank(p)}</li>)}</ul>
            {k.example && <pre className="hl-example">{blank(k.example)}</pre>}
            {k.note && <p className="hl-note">{blank(k.note)}</p>}
          </section>
        )}

        {qs.length > 0 && (
          <section className="hl-box" aria-labelledby="cau-mau">
            <h2 id="cau-mau">Câu hỏi mẫu có lời giải</h2>
            {passage && <blockquote className="hl-passage">{passage}</blockquote>}
            <ol className="hl-qs">
              {qs.map((q, i) => (
                <li key={i}>
                  <p className="hl-q">{q.prompt}</p>
                  {q.options.length > 0 && (
                    <ul className="hl-opts">{q.options.map((o, j) => <li key={j}><b>{LETTERS[j]}.</b> {o}</li>)}</ul>
                  )}
                  <details className="hl-ans">
                    <summary>Xem đáp án</summary>
                    <p><b>Đáp án:</b> {answerLabel(q)}</p>
                    {q.explanation && <p>{q.explanation}</p>}
                  </details>
                </li>
              ))}
            </ol>
            <p className="hl-more">Khi luyện tập, Milo trộn câu hỏi mới mỗi lần làm, từ dễ đến khó (L1–L5), chấm ngay và giải thích từng câu.</p>
          </section>
        )}

        <div className="hl-cta-box">
          <p><b>Sẵn sàng chưa?</b> Làm {l.questions.length} câu của bài này cùng Milo — miễn phí, không cần cài đặt.</p>
          <Link href={practiceHref(l)} className="btn btn-primary"><Play aria-hidden="true" /> Bắt đầu luyện tập</Link>
        </div>

        <nav className="hl-pager" aria-label="Bài trước, bài sau">
          {prev ? <Link href={hocHref(g, prev)} className="hl-prev"><ArrowLeft aria-hidden="true" /><span><small>Bài trước</small>{prev.lesson.title}</span></Link> : <span />}
          {next ? <Link href={hocHref(g, next)} className="hl-next"><span><small>Bài sau</small>{next.lesson.title}</span><ArrowRight aria-hidden="true" /></Link> : <span />}
        </nav>
      </main>
    </>
  );
}
