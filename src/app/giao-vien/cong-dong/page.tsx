import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Copy, MessageCircle, Presentation, Search, Sparkles, Upload } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ResourceCard from '@/components/community/ResourceCard';
import CommunityTabs, { tabHref } from '@/components/community/CommunityTabs';
import PublishFile from '@/components/community/PublishFile';
import { getViewer } from '@/lib/auth/viewer';
import { listResources } from '@/lib/community/data';
import { KIND_LABEL, TAB_LABEL, type CommunityTab, type ResourceKind } from '@/lib/community/types';
import { teacherClasses } from '@/lib/classroom/teacher-home';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import '@/styles/dash.css';
import '@/styles/cdg.css';

export const metadata: Metadata = { title: 'Cộng đồng giáo viên · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Nhánh Cộng đồng trong luồng giáo viên (EduChainKids Community): kho chia sẻ, đã đăng, đã lưu, đăng tài liệu (file), tin nhắn.
// Dữ liệu: hàm community_list (migration 0079). Nút "Chia sẻ" trong trình soạn bài giảng / giáo án: giai đoạn 1.
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const TABS: CommunityTab[] = ['kho', 'da_dang', 'da_luu'];
const SUBJECTS = Object.entries(SUBJECT_NAMES).filter(([k]) => k !== 'khac') as [string, string][];
const KIND_ORDER: ResourceKind[] = ['bai_giang', 'giao_an', 'tai_lieu', 'lien_ket', 'de_kiem_tra', 'phieu'];

export default async function CommunityPage({ searchParams }: { searchParams: SP }) {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Cộng đồng giáo viên" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/giao-vien/cong-dong');
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');

  const sp = await searchParams;
  const tab = (TABS as string[]).includes(one(sp.tab)) ? (one(sp.tab) as CommunityTab) : 'kho';
  const q = one(sp.q).trim().slice(0, 80);
  const subject = SUBJECT_NAMES[one(sp.mon) as keyof typeof SUBJECT_NAMES] ? one(sp.mon) : '';
  const g = Number(one(sp.khoi));
  const grade = g >= 1 && g <= 5 ? g : null;
  const kind = (one(sp.loai) in KIND_LABEL ? one(sp.loai) : '') as ResourceKind | '';
  const [res, classes] = await Promise.all([listResources({ tab, q, subject, grade, kind }), teacherClasses().catch(() => [])]);
  const classGrade = (classes.find((c) => c.status === 'active') ?? classes[0])?.grade ?? null;
  const filtered = Boolean(q || subject || grade || kind);
  // giữ các điều kiện lọc khi bấm chip loại tài nguyên
  const kindHref = (k: ResourceKind | '') => {
    const u = new URLSearchParams();
    if (tab !== 'kho') u.set('tab', tab);
    if (q) u.set('q', q);
    if (subject) u.set('mon', subject);
    if (grade) u.set('khoi', String(grade));
    if (k) u.set('loai', k);
    const s = u.toString();
    return `/giao-vien/cong-dong${s ? `?${s}` : ''}`;
  };

  return (
    <main className="cdg">
      <header className="cdg-head">
        <div>
          <p className="cdg-kicker">EduChainKids Community</p>
          <h1>Cộng đồng giáo viên</h1>
          <p className="cdg-lead">Tài liệu đồng nghiệp chia sẻ — tìm theo môn, khối, bài; mở ra sửa được ngay, luôn ghi tên tác giả.</p>
        </div>
        <div className="cdg-head-acts">
          <PublishFile meId={viewer.userId} subjects={SUBJECTS} grade={classGrade} />
          <Link href="/giao-vien/cong-dong/tin-nhan" className="cdg-btn is-ghost"><MessageCircle aria-hidden="true" /> Tin nhắn</Link>
        </div>
      </header>

      <CommunityTabs on={tab} />

      <form className="cdg-filter" action="/giao-vien/cong-dong" role="search">
        {tab !== 'kho' && <input type="hidden" name="tab" value={tab} />}
        {kind && <input type="hidden" name="loai" value={kind} />}
        <label className="cdg-q">
          <Search aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Tìm tên bài, chủ đề…" aria-label="Tìm tài nguyên" />
        </label>
        <select name="mon" defaultValue={subject} aria-label="Môn học">
          <option value="">Mọi môn</option>
          {SUBJECTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="khoi" defaultValue={grade ?? ''} aria-label="Khối lớp">
          <option value="">Mọi khối</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Lớp {n}</option>)}
        </select>
        <button type="submit" className="cdg-btn">Tìm</button>
      </form>
      <nav className="cdg-chips" aria-label="Loại tài nguyên">
        {(['', ...KIND_ORDER] as (ResourceKind | '')[]).map((k) => (
          <Link key={k || 'all'} href={kindHref(k)} className={kind === k ? 'is-on' : ''} aria-current={kind === k ? 'true' : undefined}>{k ? KIND_LABEL[k] : 'Tất cả'}</Link>
        ))}
        {filtered && <Link href={tabHref(tab)} className="cdg-clear">Bỏ lọc</Link>}
      </nav>

      {!res.ready ? (
        <section className="cdg-empty" role="status">
          <h2>{res.reason === 'chua_cai' ? 'Cộng đồng chưa được bật trên máy chủ' : 'Chưa tải được kho chia sẻ'}</h2>
          <p>{res.reason === 'chua_cai'
            ? 'Quản trị cần chạy các migration 0079–0081 (thư mục supabase/migrations) trên Supabase, rồi tải lại trang.'
            : 'Thầy cô thử tải lại trang sau ít phút.'}</p>
        </section>
      ) : res.items.length ? (
        <section className="cdg-grid" aria-label={TAB_LABEL[tab]}>
          {res.items.map((r) => <ResourceCard key={r.id} r={r} subjectName={SUBJECT_NAMES[r.subject as keyof typeof SUBJECT_NAMES] ?? ''} />)}
        </section>
      ) : filtered ? (
        <section className="cdg-empty" role="status"><h2>Không có tài nguyên khớp bộ lọc</h2><p>Thầy cô thử bỏ bớt điều kiện lọc.</p></section>
      ) : tab === 'da_luu' ? (
        <section className="cdg-empty" role="status"><h2>Chưa lưu tài nguyên nào</h2><p>Gặp bài hay trong Kho chia sẻ, bấm lưu để tìm lại nhanh ở đây.</p></section>
      ) : (
        <section className="cdg-empty is-start" role="status">
          <Sparkles className="cdg-empty-ic" aria-hidden="true" />
          <h2>{tab === 'da_dang' ? 'Thầy cô chưa chia sẻ bài nào' : 'Kho đang chờ bài chia sẻ đầu tiên'}</h2>
          <ol className="cdg-steps">
            <li><Presentation aria-hidden="true" /><span><b>Từ trình soạn</b>Bài giảng hoặc Kế hoạch bài dạy → nút “Chia sẻ”.</span></li>
            <li><Upload aria-hidden="true" /><span><b>Tài liệu sẵn có</b>Nút “Đăng tài liệu”: file ≤ 20 MB hoặc liên kết Drive, YouTube.</span></li>
            <li><Copy aria-hidden="true" /><span><b>Đồng nghiệp sao chép về sửa</b>Bản sửa luôn ghi tên tác giả gốc.</span></li>
          </ol>
        </section>
      )}
    </main>
  );
}
