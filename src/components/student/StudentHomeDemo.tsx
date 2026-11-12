'use client';
/* eslint-disable @next/next/no-img-element -- hình 3D / Milo có sẵn trong public, kích thước tự do */
// Demo trang chủ học sinh (dữ liệu mẫu) — hướng kết hợp:
//  A. Lớp 1–2 "Lớp học của Milo": cảnh để khám phá, đồ vật là lối vào, MỘT nút "Học tiếp" thật to, ít chữ, có loa đọc.
//  B. Lớp 3–5: thẻ học có tiến độ (mục tiêu ngày, học tiếp, bài cô giao, môn học, huy hiệu, thử thách tuần) + thanh tab.
import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Gamepad2, Home, Settings, Trophy, User, Volume2 } from 'lucide-react';

const F = (n: string) => `/emoji/f3d/${n}.webp`;
type Mode = 'nho' | 'lon';

const KID = { name: 'Minh Anh', stars: 128, streak: 5, todayDone: 3, todayGoal: 5 };
const NEXT = { subject: 'Toán', title: 'Phép cộng trong phạm vi 10', lesson: 'Bài 12', done: 3, total: 5 };
const OBJECTS = [
  { k: 'toan', label: 'Toán', icon: F('abacus'), cls: 'is-board' },
  { k: 'tv', label: 'Tiếng Việt', icon: F('books'), cls: 'is-shelf' },
  { k: 'ta', label: 'Tiếng Anh', icon: F('blue-book'), cls: 'is-globe', badge: 'ABC' },
  { k: 'game', label: 'Trò chơi', icon: F('wrapped-gift'), cls: 'is-toy' },
];
const DOCK = [
  { label: 'Toán', icon: F('abacus') }, { label: 'Tiếng Việt', icon: F('open-book') },
  { label: 'Tiếng Anh', icon: F('blue-book') }, { label: 'Luyện chữ', icon: F('pencil') }, { label: 'Trò chơi', icon: F('game-die') },
];

const BIG = { name: 'Minh Anh', grade: 4, stars: 860, streak: 12, todayDone: 3, todayGoal: 5 };
const BIG_NEXT = { subject: 'Toán 4', title: 'Phân số bằng nhau', icon: F('abacus'), done: 6, total: 10 };
const TASKS = [
  { subject: 'Tiếng Việt', title: 'Luyện từ và câu: Danh từ', due: 'Hạn: ngày mai', icon: F('open-book'), urgent: true },
  { subject: 'Tiếng Anh', title: 'Unit 4 · My birthday party', due: 'Hạn: thứ Sáu', icon: F('blue-book'), urgent: false },
];
const SUBJECTS = [
  { name: 'Toán', icon: F('abacus'), done: 18, total: 30, tone: 'is-blue' },
  { name: 'Tiếng Việt', icon: F('open-book'), done: 12, total: 32, tone: 'is-coral' },
  { name: 'Tiếng Anh', icon: F('blue-book'), done: 9, total: 20, tone: 'is-green' },
];
const BADGES = [
  { name: 'Bước đầu', icon: F('star'), got: true }, { name: 'Thần đồng Toán', icon: F('abacus'), got: true },
  { name: 'Mọt sách', icon: F('books'), got: true }, { name: '10 ngày liền', icon: F('fire'), got: false },
];

/** đọc to câu của Milo (giọng tiếng Việt của trình duyệt, nếu có) */
function say(text: string) {
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = 0.95;
    s.speak(u);
  } catch { /* trình duyệt không hỗ trợ đọc */ }
}

export default function StudentHomeDemo() {
  const [mode, setMode] = useState<Mode>('nho');
  useEffect(() => { if (new URLSearchParams(location.search).get('lop') === 'lon') setMode('lon'); }, []);
  return (
    <div className={`hs2 hs2-${mode}`}>
      <div className="hs2-switch" role="group" aria-label="Chọn giao diện demo">
        <span>Demo:</span>
        <button type="button" aria-pressed={mode === 'nho'} onClick={() => setMode('nho')}>Lớp 1–2 · Lớp học của Milo</button>
        <button type="button" aria-pressed={mode === 'lon'} onClick={() => setMode('lon')}>Lớp 3–5 · Thẻ học</button>
      </div>
      {mode === 'nho' ? <SmallKids /> : <BigKids />}
    </div>
  );
}

/* ===================== A. Lớp 1–2: Lớp học của Milo ===================== */
function SmallKids() {
  const line = `Chào ${KID.name}! Hôm nay mình học tiếp ${NEXT.title} nhé!`;
  return (
    <main className="hs2-room" aria-label="Lớp học của Milo">
      <div className="hs2-bunting" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div>
      <header className="hs2-top">
        <span className="hs2-avatar"><img src={F('girl')} alt="" /></span>
        <span className="hs2-pill" aria-label={`${KID.stars} ngôi sao`}><img src={F('star')} alt="" />{KID.stars}</span>
        <span className="hs2-pill is-fire" aria-label={`Học ${KID.streak} ngày liền`}><img src={F('fire')} alt="" />{KID.streak} ngày</span>
        <button type="button" className="hs2-round" aria-label="Cài đặt"><Settings aria-hidden="true" /></button>
      </header>

      <section className="hs2-stage">
        <div className="hs2-milo">
          <img src="/brand/milo-professor.webp" alt="Bạn cú Milo" />
          <div className="hs2-bubble">
            <p>{line}</p>
            <button type="button" className="hs2-speak" onClick={() => say(line)} aria-label="Nghe Milo nói"><Volume2 aria-hidden="true" /></button>
          </div>
        </div>

        <div className="hs2-play-wrap">
          <a className="hs2-play" href="#hoc-tiep" aria-label={`Học tiếp: ${NEXT.title}`}>
            <span className="hs2-play-tri" aria-hidden="true" />
          </a>
          <b className="hs2-play-label">Học tiếp</b>
          <span className="hs2-today" aria-label={`Hôm nay đã học ${KID.todayDone} trên ${KID.todayGoal} bài`}>
            {Array.from({ length: KID.todayGoal }, (_, i) => <img key={i} src={F('star')} alt="" className={i < KID.todayDone ? 'is-on' : ''} />)}
          </span>
        </div>

        <nav className="hs2-objects" aria-label="Các góc trong lớp">
          {OBJECTS.map((o) => (
            <a key={o.k} href={`#${o.k}`} className={`hs2-obj ${o.cls}`}>
              <span className="hs2-obj-art"><img src={o.icon} alt="" />{o.badge && <em>{o.badge}</em>}</span>
              <b>{o.label}</b>
            </a>
          ))}
        </nav>
      </section>

      <footer className="hs2-dock">
        <h2>Môn của em</h2>
        <div className="hs2-dock-row">
          {DOCK.map((d) => (
            <a key={d.label} href="#mon" className="hs2-dock-tile"><img src={d.icon} alt="" /><span>{d.label}</span></a>
          ))}
        </div>
      </footer>
    </main>
  );
}

/* ===================== B. Lớp 3–5: thẻ học có tiến độ ===================== */
function Bar({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <span className="hs2-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label}>
      <i style={{ transform: `scaleX(${done / total})` }} />
    </span>
  );
}
function BigKids() {
  return (
    <div className="hs2-app">
      <main className="hs2-feed">
        <header className="hs2-hello">
          <div>
            <p className="hs2-muted">Lớp {BIG.grade}A · Trường Tiểu học Kim Đồng</p>
            <h1>Chào {BIG.name} 👋</h1>
          </div>
          <div className="hs2-hello-stats">
            <span className="hs2-pill"><img src={F('star')} alt="" />{BIG.stars}</span>
            <span className="hs2-pill is-fire"><img src={F('fire')} alt="" />{BIG.streak}</span>
          </div>
        </header>

        <section className="hs2-goal" aria-label="Mục tiêu hôm nay">
          <div>
            <p className="hs2-goal-k">Mục tiêu hôm nay</p>
            <p className="hs2-goal-v"><b>{BIG.todayDone}</b> / {BIG.todayGoal} bài</p>
            <Bar done={BIG.todayDone} total={BIG.todayGoal} label="Mục tiêu hôm nay" />
            <p className="hs2-goal-hint">Còn {BIG.todayGoal - BIG.todayDone} bài nữa là giữ chuỗi {BIG.streak + 1} ngày!</p>
          </div>
          <img src="/brand/milo-professor.webp" alt="" className="hs2-goal-milo" />
        </section>

        <section aria-labelledby="hs2-next">
          <h2 id="hs2-next" className="hs2-h">Học tiếp</h2>
          <article className="hs2-next">
            <img src={BIG_NEXT.icon} alt="" className="hs2-next-ic" />
            <div className="hs2-next-main">
              <p className="hs2-muted">{BIG_NEXT.subject}</p>
              <h3>{BIG_NEXT.title}</h3>
              <div className="hs2-next-prog"><Bar done={BIG_NEXT.done} total={BIG_NEXT.total} label="Tiến độ bài" /><span>{BIG_NEXT.done}/{BIG_NEXT.total} câu</span></div>
            </div>
            <a href="#hoc-tiep" className="hs2-cta">Học tiếp <ChevronRight aria-hidden="true" /></a>
          </article>
        </section>

        <section aria-labelledby="hs2-tasks">
          <div className="hs2-h-row"><h2 id="hs2-tasks" className="hs2-h">Bài cô giao ({TASKS.length})</h2><a href="#bai-giao" className="hs2-more">Xem hết</a></div>
          <ul className="hs2-tasks">
            {TASKS.map((t) => (
              <li key={t.title}>
                <a href="#bai-giao" className="hs2-task">
                  <img src={t.icon} alt="" />
                  <span><b>{t.title}</b><small>{t.subject}</small></span>
                  <em className={t.urgent ? 'is-urgent' : ''}>{t.due}</em>
                  <ChevronRight aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="hs2-subj">
          <h2 id="hs2-subj" className="hs2-h">Môn học</h2>
          <div className="hs2-subjects">
            {SUBJECTS.map((s) => (
              <a key={s.name} href="#mon" className={`hs2-subj ${s.tone}`}>
                <img src={s.icon} alt="" />
                <b>{s.name}</b>
                <Bar done={s.done} total={s.total} label={`Tiến độ ${s.name}`} />
                <small>{s.done}/{s.total} bài</small>
              </a>
            ))}
          </div>
        </section>

        <div className="hs2-two">
          <section aria-labelledby="hs2-badges" className="hs2-card">
            <div className="hs2-h-row"><h2 id="hs2-badges" className="hs2-h">Huy hiệu</h2><a href="#huy-hieu" className="hs2-more">Xem hết</a></div>
            <ul className="hs2-badges">
              {BADGES.map((b) => <li key={b.name} className={b.got ? '' : 'is-locked'}><img src={b.icon} alt="" /><span>{b.name}</span></li>)}
            </ul>
          </section>
          <section aria-labelledby="hs2-week" className="hs2-card hs2-week">
            <h2 id="hs2-week" className="hs2-h">Thử thách tuần</h2>
            <p>Hoàn thành <b>10 bài</b> trong tuần</p>
            <Bar done={6} total={10} label="Thử thách tuần" />
            <div className="hs2-week-foot"><small>6/10 bài</small><img src={F('wrapped-gift')} alt="Phần quà" /></div>
          </section>
        </div>
      </main>

      <nav className="hs2-tabs" aria-label="Điều hướng chính">
        <a href="#" aria-current="page"><Home aria-hidden="true" />Trang chủ</a>
        <a href="#hoc"><BookOpen aria-hidden="true" />Học</a>
        <a href="#tro-choi"><Gamepad2 aria-hidden="true" />Trò chơi</a>
        <a href="#thuong"><Trophy aria-hidden="true" />Thưởng</a>
        <a href="#em"><User aria-hidden="true" />Em</a>
      </nav>
    </div>
  );
}
