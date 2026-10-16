import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, Languages, ShieldCheck, Star } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';

// Trang chủ EduChain Kids. Ý tưởng giao diện: "vở ô li" của học sinh tiểu học —
// nền giấy kẻ ô, mỗi môn là một cuốn vở có nhãn vở, câu hỏi mẫu viết trên trang vở có lề đỏ.
const subjects = [
  { code: 'toan', title: 'Toán', detail: 'Số học, hình học, giải toán', tone: 'blue', Icon: Calculator },
  { code: 'tieng-viet', title: 'Tiếng Việt', detail: 'Đọc hiểu, từ vựng, viết câu', tone: 'coral', Icon: BookOpen },
  { code: 'tieng-anh', title: 'Tiếng Anh', detail: 'Từ mới, mẫu câu, giao tiếp', tone: 'green', Icon: Languages },
];

const steps = [
  { title: 'Chọn một môn em thích', text: 'Chọn lớp, rồi chọn Toán, Tiếng Việt hoặc Tiếng Anh. Môn nào cũng bắt đầu từ bài dễ.' },
  { title: 'Học một bài thật ngắn', text: 'Mỗi bài chỉ vài phút, có câu hỏi nhỏ để em thử ngay.' },
  { title: 'Nhận ngôi sao của riêng em', text: 'Sao ghi lại những gì em đã làm được, không so với bạn nào.' },
];

const grades = [1, 2, 3, 4, 5];
const answers = ['6', '7', '8', '9'];

export default function HomePage() {
  return (
    <>
      <LearnHeader />
      <main className="site-shell home">
        {/* ---------------------------------------------- Hero (tranh nền + Milo giữ nguyên) */}
        <section id="home" className="home-hero wrap">
          <div className="home-hero-card">
            <picture>
              <source media="(max-width: 700px)" srcSet="/brand/hero-bg-sm.webp" />
              <img
                src="/brand/hero-bg.webp"
                width={1536}
                height={1024}
                alt="Milo – chú cú đeo kính xanh – ngồi đọc sách trên bãi cỏ cạnh những chồng sách"
                className="hero-photo"
                fetchPriority="high"
              />
            </picture>
            <div className="home-hero-copy">
              <h1>Học theo cách của em.</h1>
              <p className="home-lead">Mỗi ngày một bài nhỏ. Mỗi bài nhỏ mở ra một thế giới lớn.</p>
              <div className="home-actions">
                <Link href="/chon-bai" className="btn btn-yellow">Bắt đầu học <ArrowRight aria-hidden="true" /></Link>
              </div>
            </div>
            <span className="hero-bubble" aria-hidden="true">Cố lên<br />bạn nhé!</span>
          </div>
        </section>

        {/* ---------------------------------------------- Môn học: mỗi môn là một cuốn vở */}
        <section id="subjects" className="home-section wrap">
          <div className="home-section-head">
            <div>
              <h2>Hôm nay mình học gì?</h2>
              <p>Chọn lớp và một môn, học một chút, rồi tự hào về điều mình vừa làm được.</p>
            </div>
            <div className="grade-pills" role="group" aria-label="Em học lớp mấy?">
              {grades.map((g) => (
                <Link href={`/chon-bai?grade=${g}`} className={g === 1 ? 'grade-pill is-on' : 'grade-pill'} key={g}>Lớp {g}</Link>
              ))}
            </div>
          </div>
          <ul className="notebooks">
            {subjects.map(({ code, title, detail, tone, Icon }) => (
              <li key={code}>
                <Link className={`notebook-cover tone-${tone}`} href={`/chon-bai?subject=${code}`}>
                  <Icon className="notebook-icon" aria-hidden="true" />
                  <span className="notebook-label">
                    <span className="notebook-line">Vở <strong>{title}</strong></span>
                    <span className="notebook-line notebook-detail">{detail}</span>
                  </span>
                  <span className="notebook-open">Mở vở <ArrowRight aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------- Cách học + câu hỏi mẫu trên trang vở */}
        <section id="how-it-works" className="home-section wrap">
          <div className="home-how">
            <div>
              <h2>Ba bước nhỏ cho mỗi ngày</h2>
              <ol className="home-steps">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <span className="home-step-no" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="home-sample worksheet" aria-label="Câu hỏi mẫu">
              <p className="worksheet-head">Toán lớp 1, câu mẫu</p>
              <h3>Bé có 4 quả táo, mẹ cho thêm 3 quả. Bé có tất cả mấy quả?</h3>
              <ul className="home-answers">
                {answers.map((a) => (
                  <li key={a} className={a === '7' ? 'is-right' : undefined}>{a}</li>
                ))}
              </ul>
              <div className="home-cheer">
                <MiloMascot mood="cheer" size={64} />
                <p><strong>Đúng rồi!</strong> 4 + 3 = 7. Em nhận được 1 ngôi sao <Star className="inline-star" aria-hidden="true" /></p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- Phụ huynh */}
        <section id="safety" className="home-section wrap">
          <div className="home-safety">
            <ShieldCheck className="home-safety-icon" aria-hidden="true" />
            <div>
              <h2>Dành cho phụ huynh và thầy cô</h2>
              <p>Không có bảng xếp hạng, không so sánh các em với nhau. Thầy cô tạo tài khoản cho cả lớp; phụ huynh chỉ xem được tiến độ của con mình bằng mã mời.</p>
            </div>
            <Link href="/phu-huynh" className="btn btn-outline">Góc phụ huynh</Link>
          </div>
        </section>

        <footer id="footer" className="brand-footer">
          <div className="brand-footer-inner wrap">
            <p className="brand-footer-name"><strong>EduChain Kids</strong> <Star aria-hidden="true" /> Học hôm nay, tỏa sáng ngày mai</p>
            <nav className="footer-links" aria-label="Trên trang này">
              <a href="#subjects">Môn học</a>
              <a href="#how-it-works">Cách học</a>
              <a href="#safety">Phụ huynh</a>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
