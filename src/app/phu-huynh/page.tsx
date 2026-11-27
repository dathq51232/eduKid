import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Bell, BellRing, CalendarCheck, CalendarDays, Check, ChevronRight, MessageCircle, Moon, Pin, School, Send, Star, Target, TrendingUp, UserRound } from 'lucide-react';
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
import type { BillingOffer } from '@/lib/billing';
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
import '@/styles/phd.css';

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
      { data: games }, { data: chess }, { data: recent, error: recentErr }, { data: homework }, gate, { data: offerRows }] = await Promise.all([
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
    ]);
    const offer = ((offerRows ?? []) as BillingOffer[])[0] ?? null;
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
    return (
      <>
        <ParentHeader childCorner />
        <main className="ph ph-v2 wrap">
          <GuidedTour id="ph-con-v1" />
          {ovErr && <p className="adm-alert is-warn">Một số mục chưa bật: hãy chạy <code>supabase/migrations/0033_parent_family.sql</code> trên Supabase.</p>}
          {/* ① Đầu trang kiểu trang chủ giáo viên: trái = ngày, lời chào, Milo; phải = Chia sẻ, chuông, ảnh đại diện + thẻ lớn "Hôm nay của con" */}
          <div className="phd-top">
            <div className="phd-top-l">
              <p className="phd-date">
                <CalendarDays aria-hidden="true" className="phd-date-ic" /> {dateLabel}
                <span className="phd-lunar" title={`Ngày ${lunar.day} tháng ${LUNAR_MONTH_NAME[lunar.month]} năm ${canChiYear(lunar.year)}`}><Moon aria-hidden="true" /> {lunar.day}/{lunar.month}{lunar.leap ? ' nhuận' : ''}</span>
              </p>
              <h1>Chào ba mẹ {shortName}! <span aria-hidden="true">👋</span></h1>
              <p className="phd-wish">Cùng {shortName} học một bài nhỏ mỗi ngày nhé!</p>
              <div className="phd-chips">
                {cls && <span><School aria-hidden="true" /> Lớp {cls.name}{cls.school ? ` · ${cls.school}` : ''}</span>}
                {cls?.teacher && <span><UserRound aria-hidden="true" /> GVCN: {cls.teacher}</span>}
                {!cls && <span>Con chưa vào lớp nào</span>}
              </div>
              <Image className="phd-mascot" src="/brand/milo-artist.webp" alt="" width={560} height={749} priority aria-hidden="true" />
            </div>
            <div className="phd-top-r">
              <div className="phd-topbar">
                <ShareApp who="parent" className="phd-share" />
                <a href="#ph-msg-title" className={`phd-bell${bellCount ? ' is-hot' : ''}`} aria-label={bellCount ? `${bellCount} tin mới từ cô` : 'Tin nhắn từ cô'}>
                  <Bell aria-hidden="true" />{bellCount > 0 && <span>{bellCount > 9 ? '9+' : bellCount}</span>}
                </a>
                <a href="#ph-fam-title" className="phd-av" title={`${childName} — thông tin gia đình`} aria-label="Thông tin gia đình">{shortName.charAt(0).toUpperCase()}</a>
              </div>
              <section className="phd-today" data-tour="hom-nay" aria-label="Hôm nay của con">
                <span className="phd-pill"><CalendarCheck aria-hidden="true" /> Hôm nay của {shortName}</span>
                {today?.recorded ? (
                  <>
                    <p className="phd-today-title">{today.status === 'present' ? <><Check aria-hidden="true" /> Con có mặt ở lớp</> : `Con ${(STATUS_LABEL[today.status as 'excused' | 'unexcused'] ?? 'vắng').toLowerCase()}`}</p>
                    {praiseToday ? <p className="phd-today-sub">⭐ Cô khen: {praiseToday.replace(/^★\s*/, '')}</p> : today.note ? <p className="phd-today-sub">📝 {today.note}</p> : null}
                  </>
                ) : <p className="phd-today-title is-wait">Cô chưa ghi Sổ lớp hôm nay</p>}
                {pending.length > 0 && <p className="phd-today-sub">📝 Còn {pending.length} bài cô giao chưa làm · hạn gần nhất {fmtDue(pending[0].due_at)}</p>}
                <div className="phd-acts">
                  <a href="#ph-msg-title" className="phd-go"><MessageCircle aria-hidden="true" /> Tin nhắn từ cô <ChevronRight aria-hidden="true" className="phd-arrow" /></a>
                  <a href="#pm-title" className="phd-alt"><Send aria-hidden="true" /> Nhắn cô</a>
                </div>
                <Image className="phd-today-art" src="/emoji/f3d/books.webp" alt="" width={160} height={160} aria-hidden="true" />
              </section>
            </div>
          </div>

          <TuitionCard gate={gate} offer={offer} childName={childName} recap={gate.reason === 'trial' || gate.reason === 'expired' ? progressRecap(acts, 14) : null} />

          {newReplies > 0 && (
            <a href="#pm-title" className="ph-alert"><Bell aria-hidden="true" /> <span><b>{cls?.teacher ? `Cô ${cls.teacher.trim().split(/\s+/).slice(-1)[0]}` : 'Cô'} vừa trả lời {newReplies} tin nhắn</b> của gia đình · Xem ngay</span></a>
          )}

          {/* ② 4 ô số liệu (giống trang giáo viên) */}
          <ul className="phd-stats" data-tour="thang-nay">
            <li className="phd-stat is-green"><span className="phd-stat-ic" aria-hidden="true"><CalendarCheck /></span><b>{month?.days ? `${month.present}/${month.days}` : '—'}</b><small>{month?.days ? `Ngày đi học ${monthName}` : 'Cô chưa ghi Sổ lớp'}</small></li>
            <li className="phd-stat is-yellow"><span className="phd-stat-ic" aria-hidden="true"><Star /></span><b>{month ? month.praise : '—'}</b><small>Lần cô khen</small></li>
            <li className="phd-stat is-coral"><span className="phd-stat-ic" aria-hidden="true"><BellRing /></span><b>{month ? month.remind : '—'}</b><small>Lần cô nhắc nhở</small></li>
            <li className="phd-stat is-violet"><span className="phd-stat-ic" aria-hidden="true"><Target /></span><b>{week.length}</b><small>{week.length ? 'Hoạt động 7 ngày qua' : 'Chưa làm bài tuần này'}</small></li>
          </ul>

          <div className="ph-grid">
            <div className="ph-side">
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
            </div>

            <div className="ph-side">
              <ParentMessages
                people={contacts.map((c) => ({ name: c.name, relation: c.relation }))}
                teacher={cls?.teacher ?? null}
                childName={childName}
                initial={messages}
              />
              <FamilyInfo contacts={contacts} address={o?.address ?? null} className={cls?.name ?? null} />
            </div>
          </div>

          <GalleryTeaser variant="parent" />

          {/* Tiện ích gia đình (lịch, thu chi): việc riêng của gia đình, ít gấp → để cuối trang */}
          <div className="ph-utils-live" aria-label="Tiện ích gia đình" data-tour="tien-ich">
            <MiniCalendar href="/phu-huynh/tien-ich" />
            <MoneyCard href="/phu-huynh/tien-ich?xem=thu-chi" title="Thu chi gia đình" />
          </div>
        </main>
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
