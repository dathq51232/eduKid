/* eslint-disable @next/next/no-img-element -- hình minh hoạ tĩnh cắt từ bộ ảnh trang chủ (public/brand/home) */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, MessageCircle, Phone, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, CheckCircle2, ChevronRight, Gamepad2, Layers, Play, Star, Users } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import GameArt from '@/components/games/GameArt';
import HomeWelcome from '@/components/home/HomeWelcome';
import ContactFab from '@/components/home/ContactFab';
import { FREE_STUDENT_LIMIT, SITE_CONTACT, TEACHER_TRIAL_DAYS } from '@/lib/contact';
import { GAMES } from '@/lib/games/catalog';
import { CONTENT } from '@/lib/content';
import type { SubjectCode } from '@/lib/types';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import '@/styles/ft.css';
import '@/styles/home.css';
import '@/styles/notebook.css';
import '@/styles/brand.css';
import '@/styles/btn.css';
import '@/styles/grade.css';
import '@/styles/hero.css';
import '@/styles/hm.css';

// Trang chủ EduChain Kids. Ý tưởng giao diện: "vở ô li" của học sinh tiểu học —
// nền giấy kẻ ô, mỗi môn là một cuốn vở có nhãn vở, câu hỏi mẫu viết trên trang vở có lề đỏ.
// Làm mới 10/2026 (Taste Skill, cách "restyle"): giữ bố cục cũ; thêm số liệu thật, Milo theo môn, dải trò chơi,
// danh sách công cụ cho thầy cô; một thang cỡ chữ, một kiểu đổ bóng, tiêu đề ngắn trên điện thoại.
// Hình minh hoạ cắt từ bộ ảnh trang chủ (11/2026) — public/brand/home/*
const IMG = '/brand/home';
const subjects: { code: SubjectCode; title: string; detail: string; tone: string; art: string; alt: string }[] = [
  { code: 'toan', title: 'Toán', detail: 'Làm quen – Luyện tập – Vận dụng linh hoạt', tone: 'blue', art: 'sub-toan', alt: 'Bạn nhỏ cầm máy tính bỏ túi' },
  { code: 'tieng-viet', title: 'Tiếng Việt', detail: 'Đọc hay – Viết đúng – Diễn đạt tự tin', tone: 'pink', art: 'sub-tv', alt: 'Bạn nhỏ ôm cuốn sách' },
  { code: 'tieng-anh', title: 'Tiếng Anh', detail: 'Nghe – Nói – Đọc – Viết qua tình huống gần gũi', tone: 'green', art: 'sub-ta', alt: 'Bạn nhỏ đeo tai nghe nói “Hello!”' },
];

const steps = [
  { title: 'Chọn một môn', text: 'Chọn lớp, rồi chọn Toán, Tiếng Việt hoặc Tiếng Anh. Môn nào cũng bắt đầu từ bài dễ.' },
  { title: 'Học bài ngắn', text: 'Mỗi bài mười câu, vài phút là xong. Có nút nghe đọc đề.' },
  { title: 'Nhận ngôi sao', text: 'Sao và sticker ghi lại những gì em làm được và nhận những món quà nhỏ nhé!' },
];

/** Hình + màu thẻ trò chơi theo thứ tự trong bộ ảnh; trò mới chưa có hình thì dùng GameArt */
const GAME_ART: Record<string, { art: string; tone: string }> = {
  pattern: { art: 'g1', tone: 'sky' },
  memory: { art: 'g2', tone: 'sun' },
  maze: { art: 'g3', tone: 'lilac' },
  sudoku: { art: 'g4', tone: 'mint' },
  balance: { art: 'g5', tone: 'peach' },
};
const GAME_TONES = ['sky', 'sun', 'lilac', 'mint', 'peach'];

const ecosystem = [
  { who: 'Dành cho thầy cô', art: 'eco-gv', tone: 'blue', href: '/giao-vien', cta: 'Khám phá cho giáo viên',
    items: ['Soạn giáo án nhanh, đẹp, đúng chương trình.', 'Phiếu bài tập & đáp án theo từng bài học.', 'Thư khen, nhận xét động viên học sinh.', 'Theo dõi tiến độ, phát hiện lỗ hổng học tập.'] },
  { who: 'Dành cho học sinh', art: 'eco-hs', tone: 'sun', href: '/chon-bai', cta: 'Bắt đầu học ngay',
    items: ['Bài học ngắn, dễ hiểu, sinh động.', 'Học Toán – Tiếng Việt – Tiếng Anh.', 'Trò chơi trí tuệ rèn tư duy.', 'Nhận huy hiệu và tích lũy thành tích.'] },
  { who: 'Dành cho phụ huynh', art: 'eco-ph', tone: 'green', href: '/dang-ky?vai=phu-huynh', cta: 'Khám phá cho phụ huynh',
    items: ['Xem báo cáo tiến độ học tập.', 'Nắm rõ điểm mạnh, điểm cần hỗ trợ.', 'Nhận thông báo và lời nhận xét.', 'Đồng hành cùng con mỗi ngày.'] },
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
// Báo cáo mẫu (ví dụ minh hoạ, không phải số liệu thật)
const REPORT = [{ label: 'Toán', pct: 95, tone: 'blue' }, { label: 'Tiếng Việt', pct: 90, tone: 'pink' }, { label: 'Tiếng Anh', pct: 88, tone: 'green' }];
const SPARK = [[10, 58], [70, 48], [130, 40], [190, 12]];

/** Số bài thật theo môn: "24 bài mỗi lớp" hoặc "30 – 35 bài mỗi lớp" */
function lessonsPerGrade(subject: SubjectCode): string {
  const counts = grades.map((g) => CONTENT.filter((l) => l.subject === subject && l.grade === g).length).filter(Boolean);
  if (!counts.length) return '';
  const lo = Math.min(...counts), hi = Math.max(...counts);
  return lo === hi ? `${lo} bài mỗi lớp` : `${lo} – ${hi} bài mỗi lớp`;
}

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Dữ liệu có cấu trúc (schema.org) cho Google: tổ chức giáo dục + website
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-mark-print.png`,
      description: SITE_DESCRIPTION,
      email: SITE_CONTACT.email,
      telephone: `+84${SITE_CONTACT.phone.replace(/^0/, '')}`,
      areaServed: 'VN',
      audience: { '@type': 'EducationalAudience', educationalRole: ['student', 'teacher', 'parent'] },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'vi-VN',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ],
};

export default function HomePage() {
  const totalLessons = CONTENT.length;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }} />
      <LearnHeader />
      <main className="site-shell home">
        <HomeWelcome />
        {/* ---------------------------------------------- Hero: chữ bên trái, Milo + các bạn bên phải */}
        <section id="home" className="hm-hero wrap">
          <div className="hm-hero-copy">
            <h1>Học theo cách <span className="hm-hl">của em.</span></h1>
            <p className="hm-lead">Mỗi ngày một bài nhỏ, mỗi bài nhỏ mở ra một thế giới lớn.</p>
            <div className="hm-actions">
              <Link href="/chon-bai" className="btn hm-btn-main"><Play aria-hidden="true" /> Bắt đầu học miễn phí</Link>
              <Link href="/tro-choi" className="btn hm-btn-ghost"><Gamepad2 aria-hidden="true" /> Khám phá trò chơi</Link>
            </div>
            <ul className="hm-facts" aria-label="EduChain Kids có gì">
              <li><span className="hm-chip tone-sun"><BookOpen aria-hidden="true" /></span><span><strong>{totalLessons}</strong> bài học</span></li>
              <li><span className="hm-chip tone-blue"><Users aria-hidden="true" /></span><span><strong>Lớp 1 – 5</strong> Tiểu học</span></li>
              <li><span className="hm-chip tone-mint"><Layers aria-hidden="true" /></span><span><strong>3</strong> môn học</span></li>
              <li><span className="hm-chip tone-pink"><Gamepad2 aria-hidden="true" /></span><span><strong>{GAMES.length}</strong> trò chơi</span></li>
            </ul>
          </div>
          <div className="hm-hero-art" aria-hidden="true">
            <span className="hm-hero-blob" />
            <img className="hm-kid hm-kid-girl" src={`${IMG}/girl.webp`} alt="" width={640} height={848} />
            <img className="hm-kid hm-kid-milo" src="/brand/milo-professor.webp" alt="" width={560} height={773} fetchPriority="high" />
            <img className="hm-kid hm-kid-boy" src={`${IMG}/boy.webp`} alt="" width={640} height={852} />
            <span className="hero-bubble hm-bubble">Cố lên<br />bạn nhé!</span>
          </div>
        </section>

        {/* ---------------------------------------------- Môn học: thẻ màu lớn có nhân vật */}
        <section id="subjects" className="hm-section wrap">
          <div className="hm-head">
            <h2><BookOpen className="hm-ic tone-sun" aria-hidden="true" /> Hôm nay <span className="hm-ul">mình</span> học gì?</h2>
            <p className="hm-note"><CalendarDays aria-hidden="true" /> Bài học ngắn 10 – 15 phút mỗi ngày, phù hợp cho học sinh lớp 1 – 5.</p>
          </div>
          <div className="grade-pills hm-grades" role="group" aria-label="Em học lớp mấy?">
            {grades.map((g) => (
              <Link href={`/chon-bai?grade=${g}`} className="grade-pill" key={g}>Lớp {g}</Link>
            ))}
          </div>
          <ul className="hm-subjects">
            {subjects.map(({ code, title, detail, tone, art, alt }) => (
              <li key={code}>
                <Link className={`hm-subject tone-${tone}`} href={`/chon-bai?subject=${code}`}>
                  <span className="hm-subject-text">
                    <strong>{title}</strong>
                    <span>{detail}</span>
                    <small>{lessonsPerGrade(code)}</small>
                    <span className="hm-open">Mở vở <ChevronRight aria-hidden="true" /></span>
                  </span>
                  <img src={`${IMG}/${art}.webp`} alt={alt} width={640} height={860} loading="lazy" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="home-lib-link">Thầy cô, ba mẹ muốn xem trước nội dung? <Link href="/hoc">Thư viện bài học lớp 1–5 <ArrowRight aria-hidden="true" /></Link></p>
        </section>

        {/* ---------------------------------------------- Trò chơi trí tuệ: thẻ ngang màu pastel */}
        <section id="games" className="hm-section wrap">
          <div className="hm-head">
            <h2><Gamepad2 className="hm-ic tone-orange" aria-hidden="true" /> Nghỉ giữa giờ <span className="hm-sub">– Khám phá {GAMES.length} trò chơi trí tuệ</span></h2>
            <Link href="/tro-choi" className="hm-more">Chơi ngay tất cả <ChevronRight aria-hidden="true" /></Link>
          </div>
          <ul className="hm-games">
            {GAMES.map((g, i) => {
              const a = GAME_ART[g.id];
              return (
                <li key={g.id}>
                  <Link href={`/tro-choi/${g.slug}`} className={`hm-game tone-${a?.tone ?? GAME_TONES[i % GAME_TONES.length]}`}>
                    {a ? <img src={`${IMG}/${a.art}.webp`} alt="" width={96} height={82} loading="lazy" /> : <span className="hm-game-art" aria-hidden="true"><GameArt id={g.id} /></span>}
                    <strong>{g.title}</strong>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---------------------------------------------- Hệ sinh thái: thầy cô · học sinh · phụ huynh */}
        <section id="safety" className="hm-section wrap">
          <div className="hm-head">
            <h2><Layers className="hm-ic tone-blue" aria-hidden="true" /> Hệ sinh thái <span className="hm-ul">EduChain Kids</span></h2>
          </div>
          <div className="hm-eco">
            {ecosystem.map(({ who, art, tone, href, cta, items }) => (
              <article className={`hm-eco-card tone-${tone}`} key={who}>
                <img src={`${IMG}/${art}.webp`} alt="" width={640} height={960} loading="lazy" />
                <div>
                  <h3>{who}</h3>
                  <ul>{items.map((t) => <li key={t}><CheckCircle2 aria-hidden="true" /> {t}</li>)}</ul>
                  <Link href={href} className="hm-pill">{cta} <ChevronRight aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- Báo cáo tiến độ (ví dụ minh hoạ, không phải số liệu thật) */}
        <section id="phu-huynh" className="hm-section wrap" aria-labelledby="report-title">
          <div className="hm-report">
            <div className="hm-report-intro">
              <h2 id="report-title"><ChartNoAxesColumnIncreasing className="hm-ic tone-orange" aria-hidden="true" /> Báo cáo tiến độ học tập rõ ràng, dễ theo dõi</h2>
              <p>Giúp thầy cô và phụ huynh nắm bắt quá trình học tập, đồng hành và hỗ trợ con kịp thời.</p>
              <span className="hm-demo">Ví dụ minh hoạ</span>
            </div>
            <div className="hm-report-card hm-report-kid">
              <img src={`${IMG}/avatar.webp`} alt="" width={48} height={48} />
              <div><strong>Bạn nhỏ lớp 4A</strong><span>Tiến độ tuần này</span></div>
              <b>92%</b>
              <span className="hm-bar"><i style={{ width: '92%' }} /></span>
            </div>
            <div className="hm-report-card">
              <p className="hm-report-label">Kết quả 3 môn học</p>
              <div className="hm-scores">
                {REPORT.map((r) => <span className={`tone-${r.tone}`} key={r.label}>{r.label}<b>{r.pct}%</b></span>)}
              </div>
            </div>
            <div className="hm-report-card">
              <p className="hm-report-label">Tiến độ 4 tuần gần nhất</p>
              <svg viewBox="0 0 200 70" className="hm-spark" role="img" aria-label="Tiến độ tăng dần qua 4 tuần">
                <path d="M10 58 L70 48 L130 40 L190 12 L190 70 L10 70 Z" className="hm-spark-area" />
                <polyline points="10,58 70,48 130,40 190,12" />
                {SPARK.map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.5" />)}
              </svg>
            </div>
          </div>
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

        <section id="trial" className="hm-cta wrap" aria-labelledby="final-cta-title">
          <img className="hm-cta-milo" src="/brand/milo.webp" alt="" width={640} height={884} loading="lazy" />
          <div className="hm-cta-copy">
            <h2 id="final-cta-title">Bắt đầu bài học nhỏ đầu tiên hôm nay!</h2>
            <p>Học thử miễn phí 7 ngày – Dễ bắt đầu – Hiệu quả thấy ngay.</p>
          </div>
          <div className="hm-cta-actions">
            <Link href="/chon-bai" className="btn hm-btn-main"><Play aria-hidden="true" /> Bắt đầu học miễn phí <ChevronRight aria-hidden="true" /></Link>
            <Link href="/dang-ky?vai=phu-huynh" className="hm-cta-link"><Users aria-hidden="true" /> Phụ huynh đăng ký cho con</Link>
          </div>
        </section>

        <footer id="footer" className="brand-footer ft">
          <svg className="ft-wave" viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 280 0 560 4 850 22 S 1350 46 1600 8 V 40 Z" /></svg>
          <img className="ft-milo" src="/brand/milo-sm.webp" alt="" width={120} height={165} loading="lazy" />
          <div className="ft-grid wrap">
            <div className="ft-brand">
              <Link href="/" className="ft-logo" aria-label="EduChain Kids — về trang chủ">
                <img src="/brand/logo-full.webp" alt="EduChain Kids" width={250} height={68} loading="lazy" />
              </Link>
              <p className="ft-slogan"><Star aria-hidden="true" />Học hôm nay, <b>tỏa sáng</b> ngày mai</p>
              <p className="ft-about">Ứng dụng ôn luyện cho học sinh tiểu học lớp 1–5, đồng hành cùng thầy cô và phụ huynh.</p>
            </div>
            <nav className="ft-col" aria-label="Học tập">
              <h2><i style={{ background: '#22a447' }} />Học tập</h2>
              <ul>
                <li><a href="#subjects">Toán · Tiếng Việt · Tiếng Anh</a></li>
                <li><Link href="/hoc">Thư viện bài học lớp 1–5</Link></li>
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
