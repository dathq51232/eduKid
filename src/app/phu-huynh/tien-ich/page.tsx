/* eslint-disable @next/next/no-img-element -- biểu tượng 3D có sẵn trong public */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, Wallet } from 'lucide-react';
import ParentHeader from '@/components/parent/ParentHeader';
import LunarCalendar from '@/components/utils/LunarCalendar';
import PersonalMoney from '@/components/classroom/PersonalMoney';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Tiện ích gia đình · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

const icon = (k: string) => <img src={`/emoji/tool/${k}.webp`} width={36} height={36} alt="" aria-hidden="true" className="ic3d ic3d-title" />;

// Tiện ích cho phụ huynh: Lịch âm dương (tính trên máy) và Thu chi cá nhân (bảng teacher_money, migration 0052 —
// RLS chỉ cho chính tài khoản đang đăng nhập đọc/ghi). Giáo viên, quản trị dùng bản trong khu giáo viên.
export default async function ParentUtilities({ searchParams }: { searchParams: Promise<{ xem?: string }> }) {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') redirect('/phu-huynh');
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/phu-huynh/tien-ich');
  if (viewer.isAdmin || viewer.isTeacher) redirect('/giao-vien');
  const tab = (await searchParams).xem === 'thu-chi' ? 'money' : 'cal';
  const pinSession = viewer.isStudent; // phụ huynh dùng chung mã PIN của con

  return (
    <>
      <ParentHeader childCorner={pinSession} />
      <main className="dash wrap ct-page ph-util">
        <Link href="/phu-huynh" className="dash-back"><ArrowLeft aria-hidden="true" /> Góc phụ huynh</Link>
        <nav className="ct-seg ph-util-tabs" aria-label="Tiện ích">
          <Link href="/phu-huynh/tien-ich" className={tab === 'cal' ? 'is-on' : ''} aria-current={tab === 'cal' ? 'page' : undefined}><CalendarDays aria-hidden="true" /> Lịch âm dương</Link>
          <Link href="/phu-huynh/tien-ich?xem=thu-chi" className={tab === 'money' ? 'is-on' : ''} aria-current={tab === 'money' ? 'page' : undefined}><Wallet aria-hidden="true" /> Thu chi gia đình</Link>
        </nav>
        {tab === 'cal' ? (
          <LunarCalendar title="Lịch âm dương" subtitle="Tiện ích gia đình" icon={icon('lich')} />
        ) : (
          <>
            {pinSession && (
              <p className="adm-alert is-info">Sổ thu chi đang gắn với tài khoản đăng nhập bằng mã PIN của con — ai biết PIN của con cũng mở được. Bấm <b>“Ẩn khi chiếu”</b> khi cho con dùng máy, hoặc đăng ký tài khoản phụ huynh riêng để giữ kín.</p>
            )}
            <PersonalMoney kicker={pinSession ? 'Tiện ích gia đình' : 'Tiện ích gia đình · chỉ tài khoản của bạn xem được'} icon={icon('thu-chi')} />
          </>
        )}
      </main>
    </>
  );
}
