import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import { HOC_GROUPS, hocGroup, hocHref, sections } from '@/lib/hoc/catalog';
import { SITE_URL } from '@/lib/site';
import '@/styles/btn.css';
import '@/styles/hl.css';

type Params = { params: Promise<{ nhom: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return HOC_GROUPS.map((g) => ({ nhom: g.key }));
}

const bookOf = (subject: string) => (subject === 'tieng-anh' ? 'Global Success' : 'Kết nối tri thức');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const g = hocGroup((await params).nhom);
  if (!g) return {};
  return {
    title: `Bài tập ${g.name} theo từng bài (${bookOf(g.subject)}) · EduChain Kids`,
    description: `${g.lessons.length} bài ${g.name} sách ${bookOf(g.subject)}: kiến thức cần nhớ, câu hỏi mẫu có lời giải, luyện tập trắc nghiệm miễn phí theo đúng trình tự học kỳ 1, học kỳ 2 và đề ôn tập.`,
    alternates: { canonical: hocHref(g) },
  };
}

/** Một môn – lớp: các bài nhóm theo học kỳ, chủ đề */
export default async function HocGroupPage({ params }: Params) {
  const g = hocGroup((await params).nhom);
  if (!g) notFound();
  const { semesters, reviews } = sections(g);
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Thư viện bài học', item: `${SITE_URL}/hoc` },
      { '@type': 'ListItem', position: 2, name: g.name, item: `${SITE_URL}${hocHref(g)}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, '\\u003c') }} />
      <LearnHeader />
      <main className="wrap hl">
        <nav className="hl-crumbs" aria-label="Đường dẫn"><Link href="/hoc">Thư viện bài học</Link><ChevronRight aria-hidden="true" /><span>{g.name}</span></nav>
        <header className="hl-head">
          <h1>{g.name}</h1>
          <p>{g.lessons.length} bài theo sách <b>{bookOf(g.subject)}</b>, đúng trình tự năm học. Chọn bài để xem kiến thức cần nhớ, câu hỏi mẫu và luyện tập.</p>
        </header>
        {semesters.map((s) => (
          <section key={s.semester} className="hl-sem" aria-labelledby={`hk-${s.semester}`}>
            <h2 id={`hk-${s.semester}`}>Học kỳ {s.semester}</h2>
            {s.units.map((u, i) => (
              <div key={`${u.title}-${i}`} className="hl-unit">
                <h3>{u.title}</h3>
                <ol className="hl-list">
                  {u.items.map((it) => (
                    <li key={it.slug}><Link href={hocHref(g, it)}><b>{it.lesson.title}</b><small>{it.lesson.description}</small></Link></li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        ))}
        {reviews.length > 0 && (
          <section className="hl-sem" aria-labelledby="on-tap">
            <h2 id="on-tap">Đề ôn tập theo cấp độ</h2>
            <ol className="hl-list">
              {reviews.map((it) => <li key={it.slug}><Link href={hocHref(g, it)}><b>{it.lesson.title}</b><small>{it.lesson.description}</small></Link></li>)}
            </ol>
          </section>
        )}
        <p className="hl-other">Môn, lớp khác: {HOC_GROUPS.filter((x) => x.key !== g.key && (x.grade === g.grade || x.subject === g.subject)).map((x, i) => (
          <span key={x.key}>{i > 0 && ' · '}<Link href={hocHref(x)}>{x.name}</Link></span>
        ))}</p>
      </main>
    </>
  );
}
