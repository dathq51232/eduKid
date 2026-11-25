import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import { HOC_GROUPS, SUBJECT_NAME, SUBJECT_ORDER, hocHref } from '@/lib/hoc/catalog';
import { GRADES } from '@/lib/data';
import '@/styles/btn.css';
import '@/styles/hl.css';

export const metadata: Metadata = {
  title: 'Thư viện bài học tiểu học lớp 1–5 · Toán, Tiếng Việt, Tiếng Anh · EduChain Kids',
  description: 'Bài tập Toán, Tiếng Việt (Kết nối tri thức) và Tiếng Anh (Global Success) lớp 1, 2, 3, 4, 5 theo từng bài trong sách: kiến thức cần nhớ, câu hỏi mẫu có lời giải, luyện tập miễn phí.',
  alternates: { canonical: '/hoc' },
};

const TONE: Record<string, string> = { toan: 'is-math', 'tieng-viet': 'is-viet', 'tieng-anh': 'is-eng' };

/** Thư viện bài học: lưới lớp × môn */
export default function HocIndex() {
  const total = HOC_GROUPS.reduce((n, g) => n + g.lessons.length, 0);
  return (
    <>
      <LearnHeader />
      <main className="wrap hl">
        <nav className="hl-crumbs" aria-label="Đường dẫn"><Link href="/">Trang chủ</Link><ChevronRight aria-hidden="true" /><span>Thư viện bài học</span></nav>
        <header className="hl-head">
          <h1>Thư viện bài học lớp 1–5</h1>
          <p>{total} bài theo đúng trình tự sách: Toán, Tiếng Việt (Kết nối tri thức), Tiếng Anh (Global Success). Mỗi bài có kiến thức cần nhớ, câu hỏi mẫu có lời giải và bài luyện tập cùng Milo.</p>
        </header>
        {GRADES.map((grade) => (
          <section key={grade} className="hl-grade" aria-labelledby={`lop-${grade}`}>
            <h2 id={`lop-${grade}`}>Lớp {grade}</h2>
            <div className="hl-cards">
              {SUBJECT_ORDER.map((s) => {
                const g = HOC_GROUPS.find((x) => x.grade === grade && x.subject === s);
                if (!g) return null;
                return (
                  <Link key={g.key} href={hocHref(g)} className={`hl-card ${TONE[s]}`}>
                    <BookOpen aria-hidden="true" />
                    <span><b>{SUBJECT_NAME[s]} lớp {grade}</b><small>{g.lessons.length} bài</small></span>
                    <ChevronRight aria-hidden="true" className="hl-go" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
