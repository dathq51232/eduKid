import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { BarChart3, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, Clock, Home, ListTodo, MessageCircle, Moon, Pin, Send, Settings2, Sparkles, Star, TrendingUp, Trophy, Users } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/brand/ThemeToggle';
import SideToggle from '@/components/parent/SideToggle';
import { LUNAR_MONTH_NAME, canChiYear, solarToLunar } from '@/lib/utils/lunar';
import ParentHeader from '@/components/parent/ParentHeader';
import FamilyInfo from '@/components/parent/FamilyInfo';
import ParentMessages from '@/components/parent/ParentMessages';
import GalleryTeaser from '@/components/gallery/GalleryTeaser';
import MiniCalendar from '@/components/utils/MiniCalendar';
import MoneyCard from '@/components/utils/MoneyCard';
import type { ParentMsg } from '@/lib/classroom/messages';
import MiloMascot from '@/components/mascot/MiloMascot';
import RedeemInviteForm from '@/components/classroom/RedeemInviteForm';
import FamilyPanel, { type FamilyChild } from '@/components/parent/FamilyPanel';
import { headers } from 'next/headers';
import SignOutButton from '@/components/classroom/SignOutButton';
import { STATUS_LABEL } from '@/lib/classroom/diary';
import type { Contact } from '@/lib/classroom/class-tools';
import { getViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import TuitionCard from '@/components/parent/TuitionCard';
import ShareApp from '@/components/ShareApp';
import { progressRecap } from '@/lib/parent/recap';
import type { BillingOffer, BillingPublic } from '@/lib/billing';
import GuidedTour, { TourHelpButton } from '@/components/tour/GuidedTour';
import { createClient } from '@/lib/supabase/server';
import { KIND_INFO, KIND_ORDER, buildActivities, type ChessRow, type GameRow, type LessonRow, type RecentRow } from '@/lib/parent/activity';
import '@/styles/adm.css';
import '@/styles/fam.css';
import '@/styles/gt.css';
import '@/styles/ph.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/games.css';
import '@/styles/parent.css';
import '@/styles/result.css';
import '@/styles/tone.css';
import '@/styles/phx.css';

export const metadata: Metadata = { title: 'Phụ huynh · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Child = { id: string; display_name: string; grade: number };
type Result = { student_id: string; lesson_title: string | null; lesson_code: string; subject_code?: string | null; score: number; total: number; points: number; created_at: string };
const SUBJ: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
/** Một ngày Sổ lớp của con: thông báo cả lớp + dòng riêng của em (migration 0031) */
type DiaryDay = { day: string; announcement: string | null; status: string; tags: string[]; note: string | null };

/** Tổng quan phụ huynh (migration 0033) */
type Overview = {
  child?: { name: string; grade: number };
  class?: { name: string; grade: number; school: string | null; teacher: string | null; zalo_group: string | null } | null;
  today?: { day: string; recorded: boolean; status: string; tags: string[]; note: string | null } | null;
  month?: { days: number; present: number; praise: number; remind: number } | null;
  address?: string | null;
  contacts?: Contact[];
};
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const weekday = (iso: string) => WD[new Date(`${iso}T00:00:00`).getDay()];
const VN_TZ = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
/** hạn nộp: "T6, 21/11" */
const fmtDue = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', ...VN_TZ });
/** lúc làm: "14:05 · 18/11" */
const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', ...VN_TZ })} · ${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', ...VN_TZ })}`;
};
const fmtDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
};

export default async function ParentsPage() {
  const viewer = await getViewer();

  if (viewer.state === 'not_configured') {
    // Chưa kết nối Supabase: giữ trang giới thiệu như bản thử nghiệm
    return (
      <>
        <ParentHeader signedIn={false} />
        <main className="games-main wrap">
          <section className="parent-status" aria-labelledby="parent-title">
            <MiloMascot mood="think" size={104} />
            <div>
              <p className="status-label">Chưa kết nối máy chủ</p>
              <h1 id="parent-title">Khu vực phụ huynh</h1>
              <p>Bản đang chạy chưa kết nối Supabase nên chưa có tài khoản phụ huynh và chưa lưu kết quả học tập thật.</p>
              <p>Khi kết nối, phụ huynh nhập mã mời do thầy cô gửi để xem tiến độ của chính con mình. EduChain Kids không có bảng xếp hạng công khai.</p>
              <div className="parent-actions">
                <Link href="/#safety" className="button button-white">Cam kết an toàn</Link>
                <Link href="/thanh-tich" className="button button-blue">Xem mẫu trang Thành tích</Link>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/phu-huynh');
  // Thầy cô và quản trị đã có trang riêng
  if (viewer.isAdmin) redirect('/quan-tri');
  if (viewer.isTeacher || viewer.teacherApplication || viewer.wantsTeacher) redirect('/giao-vien');

  // Phụ huynh dùng chung mã PIN của con nên phiên này là phiên của học sinh: dashboard phụ huynh, không có tab học / game
  if (viewer.isStudent && viewer.studentId) {
    const supabase = await createClient();
    const sid = viewer.studentId;
    const [{ data: ov, error: ovErr }, { data: diary }, { data: results }, { data: me }, { data: oldContacts }, { data: msgs, error: msgErr },
      { data: games }, { data: chess }, { data: recent, error: recentErr }, { data: homework }, gate, { data: offerRows }, { data: pubRows }] = await Promise.all([
      supabase.rpc('parent_overview'), // migration 0033
      supabase.rpc('parent_diary_recent', { p_days: 30 }), // migration 0031
      supabase.from('lesson_results').select('lesson_title, lesson_code, subject_code, score, total, points, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
      supabase.rpc('parent_my_contacts'),
      supabase.rpc('parent_messages_mine', { p_limit: 20 }), // migration 0037
      // "Con luyện tập" gộp mọi hoạt động: trò chơi + cờ với máy, cờ online, bài cô giao + phòng thi (0067), bài cô giao chưa làm (0017)
      supabase.from('game_results').select('game_id, level, score, max_score, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('chess_games').select('variant, white, black, result, finished_at, created_at').eq('status', 'finished').or(`white.eq.${sid},black.eq.${sid}`).order('finished_at', { ascending: false }).limit(30),
      supabase.rpc('student_recent_results', { p_days: 30 }),
      supabase.rpc('student_my_assignments'),
      // Học phí (0018, 0074–0075): thẻ thông báo của EduChain Kids — chỉ ba mẹ thấy, trang của em không nói chuyện tiền
      learningGate(supabase, viewer.userId),
      supabase.rpc('student_billing_offer'),
      supabase.rpc('billing_public'), // tài khoản nhận tiền cho khung Thanh toán (QR)
    ]);
    const offer = ((offerRows ?? []) as BillingOffer[])[0] ?? null;
    const payInfo = ((pubRows ?? []) as BillingPublic[])[0] ?? null;
    const o = (ovErr ? null : ov) as Overview | null;
    const childName = o?.child?.name ?? (me as { display_name?: string } | null)?.display_name ?? viewer.displayName;
    const cls = o?.class ?? null;
    const contacts = ((o?.contacts ?? oldContacts ?? []) as Contact[]).filter((c) => c && c.id);
    const days = ((diary ?? []) as DiaryDay[]).filter((d) => d.announcement || d.note || d.tags?.length || (d.status && d.status !== 'present'));
    const latestAnn = days.find((d) => d.announcement);
    // ngày của thông báo mới nhất đã hiện ở khung vàng: chỉ giữ trong dòng thời gian nếu còn nhận xét / vắng
    const timeline = days.filter((d) => d !== latestAnn || d.note || d.tags?.length || (d.status && d.status !== 'present'));
    const list = (results ?? []) as Result[];
    const acts = buildActivities({
      studentId: sid, lessons: list as LessonRow[], games: (games ?? []) as GameRow[], chess: (chess ?? []) as ChessRow[],
      recent: recentErr ? [] : ((recent ?? []) as RecentRow[]),
    });
    // bài cô giao còn mở, con chưa làm (hạn gần nhất trước)
    const pending = ((homework ?? []) as { title: string; due_at: string; status: string; done: boolean }[])
      .filter((a) => a.status === 'open' && !a.done && Date.parse(a.due_at) > Date.now()).sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at));
    const today = o?.today;
    const month = o?.month;
    const praiseToday = today?.tags?.find((t) => t.startsWith('★'));
    const monthName = `tháng ${new Date().toLocaleDateString('vi-VN', { month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })}`;
    const messages = msgErr ? null : ((msgs ?? []) as ParentMsg[]);
    // Cô trả lời trong 3 ngày gần đây: báo ngay đầu trang
    const newReplies = (messages ?? []).filter((m) => m.reply && m.replied_at && Date.now() - Date.parse(m.replied_at) < 3 * 86400_000).length;
    // Luyện tập 7 ngày (giờ Việt Nam) và độ đúng theo môn
    const vn = (t: string | number) => new Date(new Date(t).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
    const todayVn = vn(Date.now());
    const last7 = Array.from({ length: 7 }, (_, i) => vn(Date.now() - (6 - i) * 86400_000));
    const perDay = last7.map((d) => acts.filter((a) => vn(a.at) === d).length);
    const maxDay = Math.max(1, ...perDay);
    const week = acts.filter((a) => vn(a.at) >= last7[0]);
    const byKind = KIND_ORDER.map((k) => ({ k, n: week.filter((a) => a.kind === k).length }));
    // độ đúng theo môn: luyện bài + bài cô giao + phòng thi
    const bySubj = Object.keys(SUBJ).map((k) => {
      const rs = acts.filter((a) => a.subject === k && a.pct !== null);
      return { k, n: rs.length, pct: rs.length ? Math.round(rs.reduce((t, a) => t + (a.pct ?? 0), 0) / rs.length) : null };
    }).filter((x) => x.n > 0);
    // đầu trang: ngày dương + âm lịch (giờ Việt Nam), tên gọi ngắn của con, số tin mới cho chuông
    const DAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dateLabel = `${DAYS[new Date(`${todayVn}T00:00:00Z`).getUTCDay()]}, ${todayVn.slice(8)}/${todayVn.slice(5, 7)}/${todayVn.slice(0, 4)}`;
    const lunar = solarToLunar(+todayVn.slice(8), +todayVn.slice(5, 7), +todayVn.slice(0, 4));
    const shortName = childName.trim().split(/\s+/).slice(-1)[0] || childName;
    const annToday = Boolean(latestAnn && latestAnn.day === today?.day);
    const bellCount = newReplies + (annToday ? 1 : 0);
    const weak = bySubj.filter((x) => (x.pct ?? 100) < 70).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0];
    // ---- Bố cục mới (phx-): số liệu cho thẻ tổng quan, đề xuất, lịch tuần, bài tập, thành tích ----
    const graded = acts.filter((a) => a.pct !== null);
    const avgPct = graded.length ? Math.round(graded.reduce((t, a) => t + (a.pct ?? 0), 0) / graded.length) : null;
    const hw = ((homework ?? []) as { title: string; due_at: string; status: string; done: boolean }[])
      .filter((a) => a.status === 'open' || a.done)
      .map((a) => ({ ...a, late: !a.done && Date.parse(a.due_at) < Date.now() }))
      .sort((a, b) => Number(a.done) - Number(b.done) || Date.parse(a.due_at) - Date.parse(b.due_at));
    // tuần học (thứ Hai → Chủ nhật) chứa hôm nay, theo giờ Việt Nam
    const dow = (new Date(`${todayVn}T00:00:00Z`).getUTCDay() + 6) % 7;
    const weekDays = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(`${todayVn}T00:00:00Z`) + (i - dow) * 86400_000).toISOString().slice(0, 10));
    const WD_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const events = [
      ...hw.filter((a) => !a.done).map((a) => ({ day: vn(a.due_at), icon: '📝', text: `Hạn nộp: ${a.title}` })),
      ...days.filter((d) => d.announcement).map((d) => ({ day: d.day, icon: '📢', text: d.announcement as string })),
    ].filter((e) => weekDays.includes(e.day)).sort((a, b) => a.day.localeCompare(b.day));
    const eventDays = new Set(events.map((e) => e.day));
    // lời khen của cô trong 30 ngày (thẻ ★ trong Sổ lớp) → ô thành tích
    const praiseCount = new Map<string, number>();
    for (const d of days) for (const t of d.tags ?? []) if (t.startsWith('★')) { const k = t.replace(/^★\s*/, ''); praiseCount.set(k, (praiseCount.get(k) ?? 0) + 1); }
    const praises = [...praiseCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const AWARD_IC = ['🏅', '🏆', '🎯', '⭐', '🛡️'];
    // đề xuất cho con (quy tắc, không dùng AI): bài chưa làm, môn còn yếu, luyện đều mỗi ngày
    const suggest: string[] = [];
    if (pending[0]) suggest.push(`Làm bài cô giao “${pending[0].title}” (hạn ${fmtDue(pending[0].due_at)})`);
    if (weak) suggest.push(`Ôn lại môn ${SUBJ[weak.k]} — con đang đúng ${weak.pct}%`);
    const missing = Object.keys(SUBJ).find((k) => !bySubj.some((x) => x.k === k));
    if (missing) suggest.push(`Thử một bài ${SUBJ[missing]} đầu tiên trong tuần`);
    if (week.length < 5) suggest.push('Luyện 10 phút mỗi ngày để giữ nhịp học');
    if (!suggest.length) suggest.push('Con đang học rất đều — thử một trò chơi trí tuệ để thư giãn nhé');
    const teacherShort = cls?.teacher ? cls.teacher.trim().split(/\s+/).slice(-2).join(' ') : null;
    return (
      <>
        <div className="phx">
        <ParentHeader childCorner />
        {/* Thanh bên kiểu trang giáo viên (máy tính); điện thoại dùng thanh trên ParentHeader */}
        <aside className="phx-side" aria-label="Góc phụ huynh">
          <div className="phx-side-hd">
            <Link href="/phu-huynh" className="phx-brand" aria-label="EduChain Kids — Góc phụ huynh"><BrandLogo size={32} /></Link>
            <SideToggle />
          </div>
          <span className="phx-role"><Users aria-hidden="true" /> Phụ huynh</span>
          <nav className="phx-nav">
            <a href="#tien-do" title="Tiến độ học tập"><BarChart3 aria-hidden="true" /> Tiến độ học tập</a>
            <a href="#bai-tap" title="Bài cô giao"><ClipboardList aria-hidden="true" /> Bài cô giao</a>
            <a href="#lich" title="Lịch & sự kiện"><CalendarDays aria-hidden="true" /> Lịch &amp; sự kiện</a>
            <a href="#thanh-tich" title="Thành tích"><Trophy aria-hidden="true" /> Thành tích</a>
            <a href="#ph-msg-title" title="Tin nhắn từ cô"><MessageCircle aria-hidden="true" /> Tin nhắn từ cô{bellCount > 0 && <em>{bellCount}</em>}</a>
            <a href="#pm-title" title="Nhắn cô"><Send aria-hidden="true" /> Nhắn cô</a>
            <a href="#ph-fam-title" title="Thông tin gia đình"><Home aria-hidden="true" /> Thông tin gia đình</a>
          </nav>
          <div className="phx-side-ft">
            <Link href="/hoc-sinh" className="phx-side-go" title="Cho con vào học"><BookOpen aria-hidden="true" /> Cho con vào học</Link>
            <Link href="/phu-huynh/tien-ich" className="phx-side-link" title="Tiện ích gia đình"><Settings2 aria-hidden="true" /> Tiện ích gia đình</Link>
            <TourHelpButton className="phx-side-link" label="Hướng dẫn" />
            <SignOutButton className="phx-side-link" />
          </div>
        </aside>
        <main className="ph phx-main">
          <GuidedTour id="ph-con-v1" />
          {ovErr && <p className="adm-alert is-warn">Một số mục chưa bật: hãy chạy <code>supabase/migrations/0033_parent_family.sql</code> trên Supabase.</p>}
          {/* ① Thanh trên: ngày · Chia sẻ · chuông · ba mẹ của con */}
          <header className="phx-bar">
            <p className="phx-date">
              <CalendarDays aria-hidden="true" /> {dateLabel}
              <span className="phx-lunar" title={`Ngày ${lunar.day} tháng ${LUNAR_MONTH_NAME[lunar.month]} năm ${canChiYear(lunar.year)}`}><Moon aria-hidden="true" /> {lunar.day}/{lunar.month}{lunar.leap ? ' nhuận' : ''}</span>
            </p>
            <span className="phx-bar-sp" />
            <ShareApp who="parent" className="phx-share" />
            <ThemeToggle className="phx-theme" />
            <a href="#ph-msg-title" className={`phx-bell${bellCount ? ' is-hot' : ''}`} aria-label={bellCount ? `${bellCount} tin mới từ cô` : 'Tin nhắn từ cô'}>
              <Bell aria-hidden="true" />{bellCount > 0 && <span>{bellCount > 9 ? '9+' : bellCount}</span>}
            </a>
            <a href="#ph-fam-title" className="phx-me" title="Thông tin gia đình">
              <span className="phx-me-av" aria-hidden="true">👪</span>
              <span className="phx-me-tx"><small>Ba mẹ của</small><b>{shortName}</b></span>
            </a>
          </header>

          {/* ② Lời chào + tranh + thẻ con + 4 số liệu */}
          <section className="phx-hero" id="tong-quan" data-tour="hom-nay">
            <div className="phx-hello">
              <h1>Chào ba mẹ {shortName}! <span aria-hidden="true">👋</span></h1>
              <p>Cùng con học tập, tiến bộ mỗi ngày với EduChain Kids.</p>
            </div>
            <Image className="phx-hero-art" src="/brand/home/eco-ph.webp" alt="" width={640} height={709} priority aria-hidden="true" />
            <div className="phx-kid">
              <span className="phx-kid-av" aria-hidden="true">{shortName.charAt(0).toUpperCase()}</span>
              <div className="phx-kid-tx">
                <b>{childName}</b>
                <span>{cls ? `Lớp ${cls.name}${cls.teacher ? ` · GVCN ${cls.teacher}` : ''}` : 'Con chưa vào lớp nào'}</span>
                <small className={today?.recorded ? (today.status === 'present' ? 'is-ok' : 'is-off') : 'is-wait'}>
                  {today?.recorded
                    ? (today.status === 'present' ? <><Check aria-hidden="true" /> Hôm nay con có mặt{praiseToday ? ` · ⭐ ${praiseToday.replace(/^★\s*/, '')}` : ''}</> : `Hôm nay con ${(STATUS_LABEL[today.status as 'excused' | 'unexcused'] ?? 'vắng').toLowerCase()}`)
                    : 'Cô chưa ghi Sổ lớp hôm nay'}
                </small>
              </div>
            </div>
            <ul className="phx-stats" data-tour="thang-nay">
              <li className="is-green"><span className="phx-stat-ic" aria-hidden="true"><CheckCircle2 /></span><b>{avgPct === null ? '—' : `${avgPct}%`}</b><small>Đúng trung bình</small></li>
              <li className="is-blue"><span className="phx-stat-ic" aria-hidden="true"><Clock /></span><b>{week.length}</b><small>Hoạt động 7 ngày</small></li>
              <li className="is-yellow"><span className="phx-stat-ic" aria-hidden="true"><Trophy /></span><b>{month ? month.praise : '—'}</b><small>Lần cô khen {monthName}</small></li>
              <li className="is-pink"><span className="phx-stat-ic" aria-hidden="true"><ListTodo /></span><b>{pending.length}</b><small>Bài cần làm</small></li>
            </ul>
          </section>

          <TuitionCard gate={gate} offer={offer} info={payInfo} childName={childName} recap={gate.reason === 'trial' || gate.reason === 'expired' ? progressRecap(acts, 14) : null} />

          {newReplies > 0 && (
            <a href="#pm-title" className="ph-alert"><Bell aria-hidden="true" /> <span><b>{teacherShort ? `Cô ${teacherShort}` : 'Cô'} vừa trả lời {newReplies} tin nhắn</b> của gia đình · Xem ngay</span></a>
          )}

          {/* ③ Tiến độ học tập | Đề xuất cho con */}
          <div className="phx-row is-2">
            <section className="phx-card" id="tien-do" aria-labelledby="phx-prog-t">
              <h2 id="phx-prog-t"><BarChart3 aria-hidden="true" /> Tiến độ học tập <a href="#ph-res-title">Xem chi tiết <ChevronRight aria-hidden="true" /></a></h2>
              <div className="phx-prog">
                <ul className="phx-subj">
                  {Object.keys(SUBJ).map((k, i) => {
                    const x = bySubj.find((s) => s.k === k);
                    return (
                      <li key={k} className={`tone-${['blue', 'pink', 'violet'][i]}`}>
                        <span className="phx-subj-ic" aria-hidden="true">{['🔢', '📖', '🔤'][i]}</span>
                        <span className="phx-subj-tx"><b>{SUBJ[k]}</b><i aria-hidden="true"><i style={{ width: `${x?.pct ?? 0}%` }} /></i></span>
                        <strong className={x ? undefined : 'is-none'}>{x ? `${x.pct}%` : 'Chưa làm'}</strong>
                      </li>
                    );
                  })}
                </ul>
                <div className="phx-chart" aria-label={`Số hoạt động 7 ngày qua: ${perDay.join(', ')}`}>
                  <p>Hoạt động trong tuần</p>
                  {week.length === 0 ? <p className="phx-empty">7 ngày qua con chưa làm bài nào. Khi con luyện bài, chơi trò trí tuệ hay làm bài cô giao, biểu đồ sẽ hiện ở đây.</p> : (
                  <div className="phx-bars">
                    {last7.map((d, i) => (
                      <div key={d} className={d === todayVn ? 'is-today' : undefined}>
                        {d === todayVn && perDay[i] > 0 && <em>{perDay[i]} hoạt động</em>}
                        <span><i style={{ height: `${perDay[i] ? 16 + (perDay[i] / maxDay) * 84 : 6}%` }} /></span>
                        <small>{weekday(d)}</small>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </section>
            <section className="phx-card phx-suggest" aria-labelledby="phx-sug-t">
              <h2 id="phx-sug-t"><Sparkles aria-hidden="true" /> Đề xuất cho con</h2>
              <p className="phx-sub">Dựa trên kết quả học tập tuần này</p>
              <Image className="phx-suggest-art" src="/brand/milo-robot.webp" alt="" width={560} height={744} aria-hidden="true" />
              <ul>{suggest.slice(0, 3).map((t) => <li key={t}><CheckCircle2 aria-hidden="true" /> {t}</li>)}</ul>
              <Link href="/hoc-sinh" className="phx-suggest-go">Cho con vào học ngay <Sparkles aria-hidden="true" /></Link>
            </section>
          </div>

          {/* ④ Lịch tuần | Bài cô giao | Thành tích */}
          <div className="phx-row is-3">
            <section className="phx-card" id="lich" aria-labelledby="phx-cal-t">
              <h2 id="phx-cal-t"><CalendarDays aria-hidden="true" /> Lịch &amp; sự kiện <Link href="/phu-huynh/tien-ich">Mở lịch <ChevronRight aria-hidden="true" /></Link></h2>
              <ol className="phx-week">
                {weekDays.map((d, i) => (
                  <li key={d} className={`${d === todayVn ? 'is-today' : ''}${i === 6 ? ' is-sun' : ''}`}>
                    <small>{WD_SHORT[i]}</small><b>{Number(d.slice(8))}</b>{eventDays.has(d) && <i aria-label="có sự kiện" />}
                  </li>
                ))}
              </ol>
              {events.length ? (
                <ul className="phx-events">
                  {events.slice(0, 4).map((e, i) => <li key={i}><span>{WD_SHORT[weekDays.indexOf(e.day)]} · {Number(e.day.slice(8))}/{Number(e.day.slice(5, 7))}</span><p>{e.icon} {e.text}</p></li>)}
                </ul>
              ) : <p className="phx-empty">Tuần này chưa có hạn nộp bài hay thông báo nào của lớp.</p>}
            </section>
            <section className="phx-card" id="bai-tap" aria-labelledby="phx-hw-t">
              <h2 id="phx-hw-t"><ClipboardList aria-hidden="true" /> Bài cô giao</h2>
              {hw.length ? (
                <ul className="phx-hw">
                  {hw.slice(0, 4).map((a, i) => (
                    <li key={i}>
                      <span className="phx-hw-ic" aria-hidden="true">📝</span>
                      <span className="phx-hw-tx"><b>{a.title}</b><small>Hạn: {fmtDue(a.due_at)}</small></span>
                      <em className={a.done ? 'is-done' : a.late ? 'is-late' : 'is-todo'}>{a.done ? <><Check aria-hidden="true" /> Đã làm</> : a.late ? 'Quá hạn' : 'Chưa làm'}</em>
                    </li>
                  ))}
                </ul>
              ) : <p className="phx-empty">Cô chưa giao bài nào. Bài cô giao sẽ hiện ở đây kèm hạn nộp.</p>}
            </section>
            {/* ⑤ Thành tích của con: lời khen của cô trong 30 ngày */}
            <section className="phx-card phx-awards is-card" id="thanh-tich" aria-labelledby="phx-aw-t">
              <div className="phx-awards-hd">
                <span className="phx-awards-cup" aria-hidden="true">🏆</span>
                <div><h2 id="phx-aw-t">Thành tích của con</h2><p>Cùng nhìn lại những nỗ lực và tiến bộ của {shortName} nhé!</p></div>
              </div>
              {praises.length ? (
                <ul className="phx-badges">
                  {praises.map(([t, n], i) => <li key={t} className={`tone-${i % 5}`}><span aria-hidden="true">{AWARD_IC[i % AWARD_IC.length]}</span><b>{t}</b>{n > 1 && <small>×{n}</small>}</li>)}
                </ul>
              ) : <p className="phx-empty">Lời khen của cô trong Sổ lớp (⭐) sẽ thành huy hiệu ở đây.</p>}
              <Link href="/thanh-tich" className="phx-awards-total"><b>{month?.praise ?? 0}</b><span>lần cô khen<br />{monthName}</span></Link>
            </section>
          </div>

          {/* ⑤ Tin nhắn từ cô (Sổ lớp từng ngày) | Nhắn cô */}
          <div className="phx-row is-2w">
            <section className="ph-card" aria-labelledby="ph-msg-title" data-tour="tin-tu-co">
              <div className="ph-card-hd">
                <div><h2 id="ph-msg-title"><MessageCircle aria-hidden="true" /> Tin nhắn từ cô</h2><p className="ph-sub">Thông báo của lớp và nhận xét hằng ngày dành cho con</p></div>
                {cls?.zalo_group && <a className="btn btn-sm ph-zalo" href={cls.zalo_group} target="_blank" rel="noopener noreferrer">Nhóm Zalo lớp</a>}
              </div>
              {latestAnn && (
                <div className="ph-ann"><Pin aria-hidden="true" /><div><b>Thông báo mới nhất · {latestAnn.day === today?.day ? 'hôm nay' : fmtDay(latestAnn.day)}</b>{latestAnn.announcement}</div></div>
              )}
              {days.length === 0 ? <p className="dash-muted">Chưa có tin nhắn nào trong 30 ngày qua. Khi cô ghi Sổ lớp, nhận xét của con sẽ hiện ở đây.</p> : (
                <ul className="ph-tl">
                  {timeline.slice(0, 12).map((d) => (
                    <li key={d.day}>
                      <span className="ph-date"><b>{Number(d.day.slice(8))}</b>{weekday(d.day)} · {Number(d.day.slice(5, 7))}</span>
                      <div>
                        {(d.tags?.length || (d.status && d.status !== 'present')) ? (
                          <div className="ph-tags">
                            {d.status && d.status !== 'present' && <span className="is-abs">{STATUS_LABEL[d.status as 'excused' | 'unexcused'] ?? 'Vắng'}</span>}
                            {(d.tags ?? []).map((t) => <span key={t} className={t.startsWith('★') ? 'is-praise' : 'is-remind'}>{t}</span>)}
                          </div>
                        ) : null}
                        {d.note && <p className="ph-note"><em>Cô ghi chú:</em> {d.note}</p>}
                        {d.announcement && d !== latestAnn && <p className="ph-note"><em>Thông báo:</em> {d.announcement}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <ParentMessages
              people={contacts.map((c) => ({ name: c.name, relation: c.relation }))}
              teacher={cls?.teacher ?? null}
              childName={childName}
              initial={messages}
            />
          </div>

          {/* ⑥ Con luyện tập (chi tiết) | Thông tin gia đình */}
          <div className="phx-row is-2w">
              <section className="ph-card" aria-labelledby="ph-res-title" data-tour="luyen-tap">
                <div className="ph-card-hd"><div>
                  <h2 id="ph-res-title"><TrendingUp aria-hidden="true" /> Con luyện tập</h2>
                  <p className="ph-sub">{acts.length ? `${week.length} hoạt động 7 ngày qua · luyện bài, bài cô giao, phòng thi, trò chơi trí tuệ, chơi cờ` : 'Con chưa làm bài nào'}</p>
                </div></div>
                {pending.length > 0 && (
                  <div className="ph-due">
                    <b>📝 Con còn {pending.length} bài cô giao chưa làm</b>
                    <ul>{pending.slice(0, 3).map((a, i) => <li key={i}>{a.title} <small>· hạn {fmtDue(a.due_at)}</small></li>)}</ul>
                  </div>
                )}
                {acts.length === 0 ? <p className="dash-muted">Kết quả luyện bài, bài cô giao, phòng thi, trò chơi trí tuệ và các ván cờ sẽ hiện ở đây. Gia đình nhắc con học một bài nhỏ mỗi ngày nhé!</p> : (
                  <>
                    <ul className="ph-kinds" aria-label="Hoạt động 7 ngày qua theo loại">
                      {byKind.map((x) => <li key={x.k} className={x.n ? undefined : 'is-zero'}><span aria-hidden="true">{KIND_INFO[x.k].icon}</span>{KIND_INFO[x.k].name}<b>{x.n}</b></li>)}
                    </ul>
                    <div className="ph-week" aria-label={`Số hoạt động 7 ngày qua: ${perDay.join(', ')}`}>
                      {last7.map((d, i) => (
                        <div key={d} className={d === todayVn ? 'is-today' : undefined}>
                          <span><i style={{ height: `${perDay[i] ? 18 + (perDay[i] / maxDay) * 82 : 4}%` }} /></span>
                          <b>{perDay[i] || ''}</b><small>{weekday(d)}</small>
                        </div>
                      ))}
                    </div>
                    {bySubj.length > 0 && (
                      <ul className="ph-subj">
                        {bySubj.map((x) => <li key={x.k}><span>{SUBJ[x.k]}</span><i aria-hidden="true"><i style={{ width: `${x.pct}%` }} className={(x.pct ?? 0) >= 80 ? 'is-good' : (x.pct ?? 0) >= 60 ? 'is-mid' : 'is-low'} /></i><b>{x.pct}%</b></li>)}
                      </ul>
                    )}
                    {weak && <p className="ph-tip">💡 Con còn chưa chắc môn <b>{SUBJ[weak.k]}</b> (đúng {weak.pct}%). Gia đình động viên con làm lại các bài môn này nhé.</p>}
                    <ul className="ph-feed">
                      {acts.slice(0, 8).map((a, i) => (
                        <li key={i}>
                          <span className="ph-feed-ic" aria-hidden="true">{KIND_INFO[a.kind].icon}</span>
                          <span className="ph-feed-tx"><b>{a.title}</b><small>{KIND_INFO[a.kind].name} · {fmtWhen(a.at)}</small></span>
                          <span className={`ph-feed-rs ${a.pct === null ? '' : a.pct >= 80 ? 'is-good' : a.pct >= 50 ? 'is-mid' : 'is-low'}`}>{a.result}</span>
                        </li>
                      ))}
                    </ul>
                    {recentErr && <p className="dash-muted">Bài cô giao và phòng thi sẽ hiện ở đây khi nhà trường cập nhật hệ thống (migration 0067).</p>}
                  </>
                )}
              </section>
            <FamilyInfo contacts={contacts} address={o?.address ?? null} className={cls?.name ?? null} />
          </div>

          {/* ⑦ Thu chi gia đình | Phòng triển lãm (lịch đã có ở "Lịch & sự kiện" nên bỏ "Lịch hôm nay" trùng) */}
          <div className="phx-row is-2r" data-tour="tien-ich">
            <MoneyCard href="/phu-huynh/tien-ich?xem=thu-chi" title="Thu chi gia đình" />
            <GalleryTeaser variant="parent" />
          </div>
        </main>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  // RLS: phụ huynh chỉ đọc được liên kết của mình và học sinh đã liên kết hợp lệ
  // Học tại nhà (migration 0047): danh sách con kèm PIN / học phí, mã gia đình — hỏi song song với liên kết con
  const famP = supabase.rpc('parent_children').then(async ({ data: fam, error: famErr }) => {
    const famKids = famErr ? [] : ((fam ?? []) as FamilyChild[]);
    const { data: fc } = famKids.some((k) => k.own) ? await supabase.rpc('parent_family_class') : { data: null };
    return { famKids, famErr, famCode: ((fc ?? []) as { join_code: string }[])[0]?.join_code ?? null };
  });
  const { data: links } = await supabase.from('parent_student_links').select('student_id').eq('parent_id', viewer.userId).eq('status', 'active');
  const ids = ((links ?? []) as { student_id: string }[]).map((l) => l.student_id);
  const [{ data: kids }, { data: results }] = ids.length
    ? await Promise.all([
        supabase.from('students').select('id, display_name, grade').in('id', ids),
        supabase.from('lesson_results').select('student_id, lesson_title, lesson_code, score, total, points, created_at').in('student_id', ids).order('created_at', { ascending: false }).limit(100),
      ])
    : [{ data: [] }, { data: [] }];
  const children = (kids ?? []) as Child[];
  const all = (results ?? []) as Result[];
  const { famKids, famErr, famCode } = await famP;
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host') ?? 'educhainkids.vn'}`;

  return (
    <>
      <ParentHeader signedIn={false} />
      <main className="dash wrap">
        <div className="dash-head">
          <div><p className="dash-kicker">Phụ huynh</p><h1>Chào {viewer.displayName}!</h1></div>
          <div className="gt-head-btns"><TourHelpButton label="Hướng dẫn" /><SignOutButton /></div>
        </div>
        <GuidedTour id="ph-tai-khoan-v1" />

        {famErr ? <p className="adm-alert is-warn">Chưa bật “Học tại nhà”: hãy chạy <code>supabase/migrations/0047_family_accounts.sql</code> trên Supabase.</p>
          : <FamilyPanel kids={famKids} code={famCode} origin={origin} />}

        <section className="dash-card" data-tour="ma-moi">
          <h2>Con học ở trường có dùng EduChain Kids?</h2>
          <p className="dash-muted">Nhập mã mời do thầy cô chủ nhiệm cấp để xem tiến độ của con ở lớp. Bạn chỉ xem được tiến độ của con đã liên kết.</p>
          <RedeemInviteForm />
        </section>

        {children.length > 0 && <h2 className="fam-progress-h" data-tour="tien-do">Tiến độ học tập</h2>}
        {children.map((c) => {
          const mine = all.filter((r) => r.student_id === c.id);
          const best = new Map<string, number>();
          for (const r of mine) best.set(r.lesson_code, Math.max(best.get(r.lesson_code) ?? 0, r.points));
          const avg = mine.length ? Math.round(mine.reduce((s, r) => s + (r.score * 100) / r.total, 0) / mine.length) : 0;
          return (
            <section key={c.id} className="dash-section child-block">
              <h2>{c.display_name} <span className="dash-muted">· Lớp {c.grade}</span></h2>
              <ul className="stat-row">
                <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{best.size}</strong></li>
                <li className="stat-tile tone-green"><span>Đúng trung bình</span><strong>{mine.length ? `${avg}%` : '—'}</strong></li>
                <li className="stat-tile tone-yellow"><span>Điểm tích luỹ</span><strong>{[...best.values()].reduce((a, b) => a + b, 0)}</strong></li>
              </ul>
              {mine.length === 0 ? <p className="dash-muted">Con chưa làm bài nào khi đăng nhập.</p> : (
                <ul className="result-list">
                  {mine.slice(0, 10).map((r, i) => (
                    <li key={i}>
                      <span className="result-title">{r.lesson_title ?? r.lesson_code}</span>
                      <span className="result-score">{r.score}/{r.total}</span>
                      <span className="result-points"><Star aria-hidden="true" /> {r.points}</span>
                      <span className="result-date">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {/* Tiện ích gia đình (lịch, thu chi) để cuối trang */}
        <div className="ph-utils-live" aria-label="Tiện ích gia đình" data-tour="tien-ich">
          <MiniCalendar href="/phu-huynh/tien-ich" />
          <MoneyCard href="/phu-huynh/tien-ich?xem=thu-chi" title="Thu chi gia đình" />
        </div>
      </main>
    </>
  );
}
