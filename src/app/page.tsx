import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, ClipboardList, FileText, Gamepad2, GraduationCap, Languages, ListChecks, Presentation, ShieldCheck, Star, Trophy, UsersRound } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import GameArt from '@/components/games/GameArt';
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
                <Link href="/tro-choi" className="btn home-btn-ghost"><Gamepad2 aria-hidden="true" /> Chơi game trí tuệ</Link>
              </div>
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

        {/* ---------------------------------------------- Kết nối giáo viên và học sinh (bộ nhận diện 10/2026) */}
        <section className="home-connect wrap" aria-labelledby="connect-title">
          <div className="home-connect-card">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh minh hoạ đã tối ưu sẵn */}
            <img src="/brand/hero-team-sm.webp" width={520} height={362} alt="Cô giáo, Milo và bạn học sinh cùng đọc sách" className="home-connect-img" loading="lazy" />
            <div className="home-connect-copy">
              <h2 id="connect-title">Kết nối giáo viên và học sinh</h2>
              <p className="home-connect-sub">Cùng học – Cùng phát triển</p>
              <p>Thầy cô giao bài, chấm và theo dõi tiến bộ của cả lớp; các em luyện tập mỗi ngày, nhận sao và sticker cho từng cố gắng nhỏ.</p>
              <div className="auth-roles">
                <Link href="/dang-nhap?vai=nguoi-lon" className="auth-role is-teacher"><Presentation aria-hidden="true" /><span><small>Dành cho</small><b>Giáo viên</b></span></Link>
                <Link href="/dang-nhap" className="auth-role is-student"><GraduationCap aria-hidden="true" /><span><small>Dành cho</small><b>Học sinh</b></span></Link>
                <Link href="/phu-huynh" className="auth-role is-parent"><UsersRound aria-hidden="true" /><span><small>Dành cho</small><b>Phụ huynh</b></span></Link>
              </div>
            </div>
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
            <ShieldCheck className="home-safety-icon" aria-hidden="true" />
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

        <footer id="footer" className="brand-footer">
          <div className="brand-footer-inner wrap">
            <p className="brand-footer-name"><strong>EduChain Kids</strong> <Star aria-hidden="true" /> Học hôm nay, tỏa sáng ngày mai</p>
            <nav className="footer-links" aria-label="Trên trang này">
              <a href="#subjects">Môn học</a>
              <a href="#how-it-works">Cách học</a>
              <a href="#games">Trò chơi</a>
              <a href="#safety">Thầy cô</a>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
