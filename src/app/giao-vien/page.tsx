import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Clock, School } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { CreateClassForm, TeacherRequestForm } from '@/components/classroom/TeacherForms';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Giáo viên · EduChain Kids' };
export const dynamic = 'force-dynamic';

type ClassRow = { id: string; name: string; grade: number; join_code: string | null; status: string };

export default async function TeacherHome() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Khu vực giáo viên" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/giao-vien');
  if (viewer.isStudent) redirect('/hoc-sinh');

  if (!viewer.isTeacher) {
    return (
      <>
        <LearnHeader />
        <main className="dash wrap">
          <div className="dash-head">
            <div><p className="dash-kicker">Giáo viên</p><h1>Chào {viewer.displayName}!</h1></div>
            <SignOutButton />
          </div>
          {viewer.teacherApplication === 'pending' ? (
            <section className="dash-card dash-notice">
              <Clock aria-hidden="true" />
              <div>
                <h2>Đang chờ quản trị viên duyệt</h2>
                <p>Khi được duyệt, bạn sẽ tạo được lớp và tài khoản cho học sinh. Bạn có thể cập nhật tên trường bên dưới.</p>
                <TeacherRequestForm schoolHint={viewer.schoolNameHint} />
              </div>
            </section>
          ) : (
            <section className="dash-card">
              <h2>{viewer.teacherApplication === 'rejected' ? 'Yêu cầu trước chưa được duyệt' : 'Gửi yêu cầu làm giáo viên'}</h2>
              <p>Quản trị viên sẽ xác minh rồi cấp quyền. Chỉ giáo viên đã được duyệt mới tạo được lớp và tài khoản học sinh.</p>
              <TeacherRequestForm schoolHint={viewer.schoolNameHint} />
            </section>
          )}
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: classes }, { data: members }, { data: school }] = await Promise.all([
    supabase.from('classes').select('id, name, grade, join_code, status').order('created_at'),
    supabase.from('class_memberships').select('class_id').eq('status', 'active'),
    viewer.teacherSchoolId ? supabase.from('schools').select('name').eq('id', viewer.teacherSchoolId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const count = new Map<string, number>();
  for (const m of (members ?? []) as { class_id: string }[]) count.set(m.class_id, (count.get(m.class_id) ?? 0) + 1);
  const list = (classes ?? []) as ClassRow[];

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <div className="dash-head">
          <div>
            <p className="dash-kicker"><School aria-hidden="true" /> {(school as { name?: string } | null)?.name ?? 'Giáo viên'}</p>
            <h1>Lớp của {viewer.displayName}</h1>
          </div>
          <SignOutButton />
        </div>

        {list.some((c) => c.status === 'active') ? (
          <p className="adm-alert is-info">Mỗi giáo viên phụ trách <strong>1 lớp</strong> (tối đa 40 học sinh). Cuối năm học, lưu trữ lớp hiện tại để tạo lớp mới.</p>
        ) : (
          <section className="dash-card">
            <h2>Tạo lớp</h2>
            <p className="dash-muted">Mỗi giáo viên phụ trách 1 lớp, tối đa 40 học sinh.</p>
            <CreateClassForm />
          </section>
        )}

        <section className="dash-section">
          <h2>Các lớp đang quản lý</h2>
          {list.length === 0 ? (
            <p className="dash-muted">Chưa có lớp nào. Tạo lớp đầu tiên ở trên, rồi thêm học sinh và in thẻ đăng nhập.</p>
          ) : (
            <ul className="class-list">
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/giao-vien/lop/${c.id}`} className={`class-tile${c.status !== 'active' ? ' is-archived' : ''}`}>
                    <span className="class-tile-name">Lớp {c.name}</span>
                    <span className="class-tile-meta">Khối {c.grade} · {count.get(c.id) ?? 0} học sinh{c.status !== 'active' ? ' · đã lưu trữ' : ''}</span>
                    <span className="class-tile-code">Mã lớp <strong>{c.join_code}</strong></span>
                    <ChevronRight className="class-tile-go" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
