import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, MessageCircle, Pin, School, Star, TrendingUp, UserRound } from 'lucide-react';
import ParentHeader from '@/components/parent/ParentHeader';
import FamilyInfo from '@/components/parent/FamilyInfo';
import MiloMascot from '@/components/mascot/MiloMascot';
import RedeemInviteForm from '@/components/classroom/RedeemInviteForm';
import SignOutButton from '@/components/classroom/SignOutButton';
import { STATUS_LABEL } from '@/lib/classroom/diary';
import type { Contact } from '@/lib/classroom/class-tools';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Phụ huynh · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Child = { id: string; display_name: string; grade: number };
type Result = { student_id: string; lesson_title: string | null; lesson_code: string; score: number; total: number; points: number; created_at: string };
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
const fmtLong = (iso?: string) => {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', ...(iso ? {} : { timeZone: 'Asia/Ho_Chi_Minh' }) });
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
    const [{ data: ov, error: ovErr }, { data: diary }, { data: results }, { data: me }, { data: oldContacts }] = await Promise.all([
      supabase.rpc('parent_overview'), // migration 0033
      supabase.rpc('parent_diary_recent', { p_days: 30 }), // migration 0031
      supabase.from('lesson_results').select('lesson_title, lesson_code, score, total, points, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
      supabase.rpc('parent_my_contacts'),
    ]);
    const o = (ovErr ? null : ov) as Overview | null;
    const childName = o?.child?.name ?? (me as { display_name?: string } | null)?.display_name ?? viewer.displayName;
    const cls = o?.class ?? null;
    const contacts = ((o?.contacts ?? oldContacts ?? []) as Contact[]).filter((c) => c && c.id);
    const days = ((diary ?? []) as DiaryDay[]).filter((d) => d.announcement || d.note || d.tags?.length || (d.status && d.status !== 'present'));
    const latestAnn = days.find((d) => d.announcement);
    const list = (results ?? []) as Result[];
    const lessons = new Set(list.map((r) => r.lesson_code)).size;
    const avg = list.length ? Math.round(list.reduce((s, r) => s + (r.score * 100) / r.total, 0) / list.length) : 0;
    const today = o?.today;
    const month = o?.month;
    const praiseToday = today?.tags?.find((t) => t.startsWith('★'));
    const monthName = `tháng ${new Date().toLocaleDateString('vi-VN', { month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })}`;
    return (
      <>
        <ParentHeader childCorner />
        <main className="ph wrap">
          {ovErr && <p className="adm-alert is-warn">Một số mục chưa bật: hãy chạy <code>supabase/migrations/0033_parent_family.sql</code> trên Supabase.</p>}
          <section className="ph-hero">
            <span className="ph-hero-av"><MiloMascot variant="artist" size={80} /></span>
            <div className="ph-hero-txt">
              <small>Phụ huynh của</small>
              <h1>{childName}</h1>
              <div className="ph-chips">
                {cls && <span><School aria-hidden="true" /> Lớp {cls.name}{cls.school ? ` · ${cls.school}` : ''}</span>}
                {cls?.teacher && <span><UserRound aria-hidden="true" /> GVCN: {cls.teacher}</span>}
                {!cls && <span>Con chưa vào lớp nào</span>}
              </div>
            </div>
            <div className="ph-today">
              <span>Hôm nay · {fmtLong(today?.day)}</span>
              {today?.recorded ? (
                <>
                  <b className={today.status === 'present' ? 'is-ok' : 'is-off'}>{today.status === 'present' ? <><Check aria-hidden="true" /> Có mặt</> : STATUS_LABEL[today.status as 'excused' | 'unexcused'] ?? 'Vắng'}</b>
                  {praiseToday ? <em>⭐ Cô khen: {praiseToday.replace(/^★\s*/, '')}</em> : today.note ? <em>📝 {today.note}</em> : null}
                </>
              ) : <b className="is-wait">Cô chưa ghi Sổ lớp</b>}
            </div>
          </section>

          <ul className="ph-tiles">
            <li><span className="ph-ic is-green" aria-hidden="true">📅</span><div><span>Đi học {monthName}</span><b>{month?.days ? `${month.present}/${month.days} ngày` : '—'}</b></div></li>
            <li><span className="ph-ic is-yellow" aria-hidden="true">⭐</span><div><span>Lời khen của cô</span><b>{month ? month.praise : '—'}</b></div></li>
            <li><span className="ph-ic is-red" aria-hidden="true">🔔</span><div><span>Cô nhắc nhở</span><b>{month ? month.remind : '—'}</b></div></li>
            <li><span className="ph-ic is-purple" aria-hidden="true">🎯</span><div><span>Bài luyện · đúng</span><b>{list.length ? `${lessons} · ${avg}%` : '—'}</b></div></li>
          </ul>

          <div className="ph-grid">
            <section className="ph-card" aria-labelledby="ph-msg-title">
              <div className="ph-card-hd">
                <div><h2 id="ph-msg-title"><MessageCircle aria-hidden="true" /> Tin nhắn từ cô</h2><p className="ph-sub">Thông báo của lớp và nhận xét hằng ngày dành cho con</p></div>
                {cls?.zalo_group && <a className="btn btn-sm ph-zalo" href={cls.zalo_group} target="_blank" rel="noopener noreferrer">Nhóm Zalo lớp</a>}
              </div>
              {latestAnn && (
                <div className="ph-ann"><Pin aria-hidden="true" /><div><b>Thông báo mới nhất · {latestAnn.day === today?.day ? 'hôm nay' : fmtDay(latestAnn.day)}</b>{latestAnn.announcement}</div></div>
              )}
              {days.length === 0 ? <p className="dash-muted">Chưa có tin nhắn nào trong 30 ngày qua. Khi cô ghi Sổ lớp, nhận xét của con sẽ hiện ở đây.</p> : (
                <ul className="ph-tl">
                  {days.slice(0, 12).map((d) => (
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

            <div className="ph-side">
              <FamilyInfo contacts={contacts} address={o?.address ?? null} className={cls?.name ?? null} />
              <section className="ph-card" aria-labelledby="ph-res-title">
                <div className="ph-card-hd"><div><h2 id="ph-res-title"><TrendingUp aria-hidden="true" /> Con luyện tập</h2><p className="ph-sub">{list.length ? `Đúng trung bình ${avg}% · ${list.length} lượt gần nhất` : 'Con chưa làm bài nào'}</p></div></div>
                {list.length > 0 && <div className="ph-bar" aria-hidden="true"><i style={{ width: `${avg}%` }} /></div>}
                {list.length === 0 ? <p className="dash-muted">Kết quả sẽ hiện ở đây sau mỗi bài con luyện tập.</p> : (
                  <ul className="ph-res">
                    {list.slice(0, 5).map((r, i) => <li key={i}><span>{r.lesson_title ?? r.lesson_code}</span><b>{r.score}/{r.total}</b></li>)}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </main>
      </>
    );
  }

  const supabase = await createClient();
  // RLS: phụ huynh chỉ đọc được liên kết của mình và học sinh đã liên kết hợp lệ
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

  return (
    <>
      <ParentHeader signedIn={false} />
      <main className="dash wrap">
        <div className="dash-head">
          <div><p className="dash-kicker">Phụ huynh</p><h1>Chào {viewer.displayName}!</h1></div>
          <SignOutButton />
        </div>

        <section className="dash-card">
          <h2>Liên kết với con</h2>
          <p className="dash-muted">Mỗi học sinh có một mã mời riêng do thầy cô chủ nhiệm cấp. Bạn chỉ xem được tiến độ của con đã liên kết.</p>
          <RedeemInviteForm />
        </section>

        {children.length === 0 ? (
          <p className="dash-muted">Chưa liên kết với học sinh nào.</p>
        ) : children.map((c) => {
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
      </main>
    </>
  );
}
