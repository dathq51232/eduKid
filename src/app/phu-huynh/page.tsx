import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Star } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import ParentContactForm from '@/components/classroom/ParentContactForm';
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
        <LearnHeader />
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

  // Phụ huynh dùng chung mã PIN của con nên phiên này là phiên của học sinh: hiện tiến độ của bé, không vào giao diện học
  if (viewer.isStudent && viewer.studentId) {
    const supabase = await createClient();
    // RLS: học sinh chỉ đọc được kết quả của chính mình
    const [{ data: me }, { data: results }, { data: diary }, { data: contactData }] = await Promise.all([
      supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
      supabase.from('lesson_results').select('lesson_title, lesson_code, score, total, points, created_at').order('created_at', { ascending: false }).limit(50),
      // Sổ lớp + danh bạ gia đình (migration 0031): chưa chạy migration thì bỏ qua, trang vẫn hiện
      supabase.rpc('parent_diary_recent', { p_days: 30 }),
      supabase.rpc('parent_my_contacts'),
    ]);
    const childName = (me as { display_name?: string } | null)?.display_name ?? viewer.displayName;
    const childGrade = (me as { grade?: number } | null)?.grade ?? null;
    const list = (results ?? []) as Result[];
    const days = ((diary ?? []) as DiaryDay[]).filter((d) => d.announcement || d.note || d.tags?.length || (d.status && d.status !== 'present'));
    const contacts = ((contactData ?? []) as Contact[]).filter((c) => c && c.id);
    const best = new Map<string, number>();
    for (const r of list) best.set(r.lesson_code, Math.max(best.get(r.lesson_code) ?? 0, r.points));
    const avg = list.length ? Math.round(list.reduce((s, r) => s + (r.score * 100) / r.total, 0) / list.length) : 0;
    return (
      <>
        <LearnHeader />
        <main className="dash wrap">
          <div className="dash-head">
            <div>
              <p className="dash-kicker">Phụ huynh · Xem tiến độ</p>
              <h1>Tiến độ của {childName}{childGrade ? <span className="dash-muted"> · Lớp {childGrade}</span> : null}</h1>
            </div>
            <SignOutButton />
          </div>
          <p className="adm-alert is-info" role="status">
            Bạn đang xem tiến độ của con bằng mã PIN dùng chung. Muốn con học bài trên máy này, chuyển sang góc học của bé: <Link href="/hoc-sinh">Vào góc học của bé →</Link>
          </p>

          {days.length > 0 && (
            <section className="dash-card ph-diary">
              <h2>Tin nhắn từ cô giáo</h2>
              <p className="dash-muted">Thông báo của lớp và nhận xét hằng ngày của cô dành cho con (30 ngày gần nhất).</p>
              <ul className="ph-diary-list">
                {days.map((d) => (
                  <li key={d.day} className="ph-diary-day">
                    <span className="ph-diary-date">{fmtDay(d.day)}</span>
                    <div className="ph-diary-body">
                      {d.announcement && <p className="ph-diary-announce">{d.announcement}</p>}
                      {d.status && d.status !== 'present' && <p className="ph-diary-absence">{STATUS_LABEL[d.status as 'excused' | 'unexcused'] ?? 'Vắng'}</p>}
                      {(d.tags ?? []).length > 0 && (
                        <ul className="ph-diary-tags">
                          {(d.tags ?? []).map((t) => <li key={t} className={t.startsWith('★') ? 'is-praise' : 'is-remind'}>{t}</li>)}
                        </ul>
                      )}
                      {d.note && <p className="ph-diary-note">Cô ghi chú: {d.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="dash-card">
            <h2>Điện thoại &amp; Zalo của gia đình</h2>
            <p className="dash-muted">Cập nhật để cô chủ nhiệm liên hệ khi cần. Mỗi gia đình lưu tối đa 3 số; thầy cô xem số này trong Danh bạ phụ huynh của lớp.</p>
            <ParentContactForm initial={contacts} />
          </section>

          <ul className="stat-row">
            <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{best.size}</strong></li>
            <li className="stat-tile tone-green"><span>Đúng trung bình</span><strong>{list.length ? `${avg}%` : '—'}</strong></li>
            <li className="stat-tile tone-yellow"><span>Điểm tích luỹ</span><strong>{[...best.values()].reduce((a, b) => a + b, 0)}</strong></li>
          </ul>
          {list.length === 0 ? (
            <p className="dash-muted">Con chưa làm bài nào. Kết quả sẽ hiện tại đây sau mỗi bài luyện tập.</p>
          ) : (
            <ul className="result-list">
              {list.slice(0, 10).map((r, i) => (
                <li key={i}>
                  <span className="result-title">{r.lesson_title ?? r.lesson_code}</span>
                  <span className="result-score">{r.score}/{r.total}</span>
                  <span className="result-points"><Star aria-hidden="true" /> {r.points}</span>
                  <span className="result-date">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          )}
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
      <LearnHeader />
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
