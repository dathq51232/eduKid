import Link from 'next/link';
import { ArrowRight, Mail, MessageCircle, Phone, Activity, BookOpen, Calculator, ClipboardList, FileText, Gamepad2, GraduationCap, Languages, ListChecks, Presentation, Star, Timer, Trophy, Users } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import GameArt from '@/components/games/GameArt';
import HomeWelcome from '@/components/home/HomeWelcome';
import ContactFab from '@/components/home/ContactFab';
import { FREE_STUDENT_LIMIT, SITE_CONTACT, TEACHER_TRIAL_DAYS } from '@/lib/contact';
import { GAMES } from '@/lib/games/catalog';
import { SUBJECT_MASCOT } from '@/lib/mascots';
import { CONTENT } from '@/lib/content';
import type { SubjectCode } from '@/lib/types';

// Trang chủ EduChain Kids. Ý tưởng giao diện: "vở ô li" của học sinh tiểu học —
// nền giấy kẻ ô, mỗi môn là một cuốn vở có nhãn vở, câu hỏi mẫu viết trên trang vở có lề đỏ.
// Làm mới 10/2026 (Taste Skill, cách "restyle"): giữ bố cục cũ; thêm số liệu thật, Milo theo môn, dải trò chơi,
// danh sách công cụ cho thầy cô; một thang cỡ chữ, một kiểu đổ bóng, tiêu đề ngắn trên điện thoại.
const subjects: { code: SubjectCode; title: string; detail: string; tone: string; Icon: typeof Calculator }[] = [
  { code: 'toan', title: 'Toán', detail: 'Số học, hình học, giải toán', tone: 'blue', Icon: Calculator },
  { code: 'tieng-viet', title: 'Tiếng Việt', detail: 'Đọc hiểu, từ vựng, viết câu', tone: 'coral', Icon: BookOpen },
  { code: 'tieng-anh', title: 'Tiếng Anh', detail: 'Từ mới, mẫu câu, giao tiếp', tone: 'green', Icon: Languages },
];

const steps = [
  { title: 'Chọn một môn', text: 'Chọn lớp, rồi chọn Toán, Tiếng Việt hoặc Tiếng Anh. Môn nào cũng bắt đầu từ bài dễ.' },
  { title: 'Học bài ngắn', text: 'Mỗi bài mười câu, vài phút là xong. Có nút nghe đọc đề.' },
  { title: 'Nhận ngôi sao', text: 'Sao và sticker ghi lại những gì em làm được và nhận những món quà nhỏ nhé!' },
];

const teacherTools = [
  { Icon: ClipboardList, text: 'Giáo án tự soạn từ lịch báo giảng' },
  { Icon: FileText, text: 'Phiếu bài tập, phiếu chính tả có đáp án' },
  { Icon: Trophy, text: 'Thư khen, nhận xét cuối kì' },
  { Icon: ListChecks, text: 'Theo dõi tiến độ và lỗ hổng từng em' },
];

const parentBenefits = [
  { title: 'Báo cáo tiến độ', text: 'Xem kết quả học tập và những bài con đã hoàn thành.', Icon: Activity, tone: 'green' },
  { title: 'Thông báo cho phụ huynh', text: 'Nhận thông tin tổng kết và lời động viên dành cho con.', Icon: MessageCircle, tone: 'blue' },
  { title: 'Thời gian học hợp lý', text: 'Khuyến khích con học theo từng phiên ngắn, cân bằng thời gian sử dụng thiết bị.', Icon: Timer, tone: 'yellow' },
];

// Câu hỏi thường gặp: chỉ ghi điều app đang làm thật (số ngày dùng thử của giáo viên, gói miễn phí lấy từ src/lib/contact.ts)
const faqs = [
  { question: 'EduChain Kids có thu phí không?', answer: 'Bé được học thử 7 ngày miễn phí trọn bộ 3 môn Toán, Tiếng Việt, Tiếng Anh và Game trí tuệ, không cần nhập thẻ tín dụng. Sau đó phụ huynh chọn gói 1 tháng hoặc gói năm học, chuyển khoản bằng mã VietQR ngay trong app; mức phí hiện ở trang Học phí, hoặc hỏi qua Zalo.' },
  { question: 'Con có cần tài khoản riêng không?', answer: 'Nếu lớp của con dùng EduChain Kids, cô giáo đưa mã lớp và mã PIN: con đăng nhập bằng mã lớp, chọn tên rồi nhập PIN. Nếu lớp chưa dùng, phụ huynh đăng ký cho con ngay trên trang này.' },
  { question: 'Kết quả học của con có được giữ riêng tư không?', answer: 'Kết quả học tập chỉ thầy cô của lớp và phụ huynh của con xem được. Bảng thi đua chỉ hiện trong lớp, cho các bạn cùng lớp và thầy cô.' },
  { question: 'Thầy cô dùng có mất phí không?', answer: `Thầy cô mới được dùng thử đủ lớp (tối đa 40 học sinh) trong ${TEACHER_TRIAL_DAYS} ngày. Sau đó gói miễn phí dùng được với ${FREE_STUDENT_LIMIT} học sinh; muốn mở thêm chỗ, thầy cô liên hệ EduChain Kids.` },
  { question: 'Bài học theo chương trình nào?', answer: 'Toán và Tiếng Việt đi theo trình tự sách Kết nối tri thức với cuộc sống, Tiếng Anh theo Global Success. Câu hỏi do EduChain Kids tự biên soạn, có lời giải từng bước.' },
  { question: 'Có thể dùng trên thiết bị nào?', answer: 'EduChain Kids chạy trên trình duyệt web của điện thoại, máy tính bảng và máy tính, không cần cài thêm ứng dụng.' },
];

const grades = [1, 2, 3, 4, 5];
const answers = ['6', '7', '8', '9'];

/** Số bài thật theo môn: "24 bài mỗi lớp" hoặc "30 – 35 bài mỗi lớp" */
function lessonsPerGrade(subject: SubjectCode): string {
  const counts = grades.map((g) => CONTENT.filter((l) => l.subject === subject && l.grade === g).length).filter(Boolean);
  if (!counts.length) return '';
  const lo = Math.min(...counts), hi = Math.max(...counts);
  return lo === hi ? `${lo} bài mỗi lớp` : `${lo} – ${hi} bài mỗi lớp`;
}

export default function HomePage() {
  const totalLessons = CONTENT.length;
  return (
    <>
      <LearnHeader />
      <main className="site-shell home">
        <HomeWelcome />
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
              <p className="home-lead">Giúp con học tốt hơn mỗi ngày với những bài học ngắn. Mỗi ngày một bài nhỏ, mỗi bài nhỏ mở ra một thế giới lớn.</p>
              <div className="home-actions">
                <Link href="/chon-bai" className="btn btn-yellow">Bắt đầu học <ArrowRight aria-hidden="true" /></Link>
                <Link href="/tro-choi" className="btn home-btn-ghost"><Gamepad2 aria-hidden="true" /> Chơi game trí tuệ</Link>
              </div>
              <nav className="home-roles" aria-label="Tôi là">
                <span>Tôi là</span>
                <Link href="/dang-ky?vai=phu-huynh"><Users aria-hidden="true" /> Phụ huynh</Link>
                <Link href="/dang-nhap?vai=nguoi-lon"><Presentation aria-hidden="true" /> Giáo viên</Link>
                <Link href="/dang-nhap"><GraduationCap aria-hidden="true" /> Học sinh</Link>
              </nav>
              <ul className="home-facts" aria-label="EduChain Kids có gì">
                <li><strong>{totalLessons}</strong> bài học</li>
                <li><strong>Lớp 1 – 5</strong></li>
                <li><strong>3</strong> môn</li>
                <li><strong>{GAMES.length}</strong> trò chơi</li>
              </ul>
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
                    <span className="notebook-line notebook-count">{lessonsPerGrade(code)}</span>
                  </span>
                  <MiloMascot variant={SUBJECT_MASCOT[code]} size={96} className="notebook-milo" />
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
              <h2>Ba bước nhỏ mỗi ngày</h2>
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
              <p className="worksheet-q">Bé có 4 quả táo, mẹ cho thêm 3 quả. Bé có tất cả mấy quả?</p>
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

        {/* ---------------------------------------------- Trò chơi trí tuệ */}
        <section id="games" className="home-section wrap">
          <div className="home-section-head">
            <div>
              <h2>Nghỉ giữa giờ</h2>
              <p>{GAMES.length} trò chơi trí tuệ, mỗi trò 5 – 10 phút, có 5 cấp độ từ dễ đến khó.</p>
            </div>
            <Link href="/tro-choi" className="btn btn-outline">Xem tất cả <ArrowRight aria-hidden="true" /></Link>
          </div>
          <ul className="home-games">
            {GAMES.map((g) => (
              <li key={g.id}>
                <Link href={`/tro-choi/${g.slug}`} className="home-game">
                  <span className="home-game-art" aria-hidden="true"><GameArt id={g.id} /></span>
                  <strong>{g.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------- Thầy cô */}
        <section id="safety" className="home-section wrap">
          <div className="home-safety">
            <div>
              <h2>Dành cho thầy cô</h2>
              <p>Thầy cô tạo tài khoản và PIN cho cả lớp. Bảng điểm cao chỉ hiện trong lớp, cho các bạn cùng lớp và thầy cô.</p>
              <ul className="home-tools">
                {teacherTools.map(({ Icon, text }) => <li key={text}><Icon aria-hidden="true" /> {text}</li>)}
              </ul>
            </div>
            <Link href="/giao-vien" className="btn btn-outline">Góc thầy cô <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>

        <section id="phu-huynh" className="home-section wrap home-parent-section" aria-labelledby="parent-title">
          <div className="home-section-head home-parent-head">
            <div>
              <h2 id="parent-title">Đồng hành cùng con mỗi ngày</h2>
              <p>Dù bận rộn, phụ huynh vẫn có thể nắm rõ tiến độ học tập của con qua điện thoại.</p>
            </div>
          </div>
          <div className="home-parent-grid">
            {parentBenefits.map(({ title, text, Icon, tone }) => (
              <article className={`home-parent-card tone-${tone}`} key={title}>
                <span className="home-parent-icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-faq home-section wrap" aria-labelledby="faq-title">
          <div className="home-section-head">
            <div>
              <h2 id="faq-title">Phụ huynh thường muốn biết gì?</h2>
              <p>Chưa thấy câu mình cần? Hỏi EduChain Kids qua Zalo hoặc số điện thoại ở cuối trang.</p>
            </div>
          </div>
          <div className="home-faq-list">
            {faqs.map(({ question, answer }) => (
              <details className="home-faq-card" key={question}>
                <summary><h3>{question}</h3></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="trial" className="home-final-cta wrap" aria-labelledby="final-cta-title">
          <div>
            <h2 id="final-cta-title">Học thử miễn phí 7 ngày cùng Milo</h2>
            <p>Đăng ký miễn phí, không cần thẻ ngân hàng. Con học được ngay bài đầu tiên hôm nay.</p>
          </div>
          <div className="home-final-cta-actions">
            <Link href="/chon-bai" className="btn btn-yellow">Bắt đầu học <ArrowRight aria-hidden="true" /></Link>
            <Link href="/dang-ky?vai=phu-huynh" className="btn home-final-cta-secondary"><Users aria-hidden="true" /> Phụ huynh đăng ký cho con</Link>
          </div>
        </section>

        <footer id="footer" className="brand-footer ft">
          <svg className="ft-wave" viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 280 0 560 4 850 22 S 1350 46 1600 8 V 40 Z" /></svg>
          {/* eslint-disable-next-line @next/next/no-img-element -- linh vật trang trí */}
          <img className="ft-milo" src="/brand/milo-sm.webp" alt="" width={120} height={165} loading="lazy" />
          <div className="ft-grid wrap">
            <div className="ft-brand">
              <Link href="/" className="ft-logo" aria-label="EduChain Kids — về trang chủ">
                {/* eslint-disable-next-line @next/next/no-img-element -- logo */}
                <img src="/brand/logo-full.webp" alt="EduChain Kids" width={250} height={68} loading="lazy" />
              </Link>
              <p className="ft-slogan"><Star aria-hidden="true" />Học hôm nay, <b>tỏa sáng</b> ngày mai</p>
              <p className="ft-about">Ứng dụng ôn luyện cho học sinh tiểu học lớp 1–5, đồng hành cùng thầy cô và phụ huynh.</p>
            </div>
            <nav className="ft-col" aria-label="Học tập">
              <h2><i style={{ background: '#22a447' }} />Học tập</h2>
              <ul>
                <li><a href="#subjects">Toán · Tiếng Việt · Tiếng Anh</a></li>
                <li><a href="#how-it-works">Cách học 10 phút mỗi ngày</a></li>
                <li><Link href="/tro-choi">Trò chơi trí tuệ</Link></li>
                <li><Link href="/thanh-tich">Thành tích &amp; huy hiệu</Link></li>
              </ul>
            </nav>
            <nav className="ft-col" aria-label="Dành cho">
              <h2><i style={{ background: '#f5c330' }} />Dành cho</h2>
              <ul>
                <li><Link href="/dang-nhap">Học sinh</Link></li>
                <li><Link href="/dang-ky?vai=phu-huynh">Phụ huynh đăng ký cho con</Link></li>
                <li><Link href="/dang-nhap?vai=nguoi-lon">Thầy cô</Link></li>
                <li><a href="#safety">Nhà trường</a></li>
              </ul>
            </nav>
            <address className="ft-col ft-contact" aria-label="Liên hệ">
              <h2><i style={{ background: '#f08a1c' }} />Liên hệ</h2>
              <a href={`mailto:${SITE_CONTACT.email}`}><span style={{ background: '#2563eb' }}><Mail aria-hidden="true" /></span>{SITE_CONTACT.email}</a>
              <a href={`tel:${SITE_CONTACT.phone}`}><span style={{ background: '#22a447' }}><Phone aria-hidden="true" /></span>{SITE_CONTACT.phoneDisplay}</a>
              <a href={`https://zalo.me/${SITE_CONTACT.zalo}`} target="_blank" rel="noopener noreferrer"><span style={{ background: '#f08a1c' }}><MessageCircle aria-hidden="true" /></span>Zalo {SITE_CONTACT.zaloName}</a>
            </address>
          </div>
          <div className="ft-bottom wrap">
            <span>© {new Date().getFullYear()} EduChain Kids · Học vui – Tiến bộ mỗi ngày</span>
            <span className="ft-dots" aria-hidden="true">{['#2563eb', '#22a447', '#f5c330', '#f08a1c', '#7c4dd6', '#e2437f'].map((c) => <i key={c} style={{ background: c }} />)}</span>
          </div>
          <span className="ft-stripe" aria-hidden="true" />
        </footer>
        <ContactFab />
      </main>
    </>
  );
}
