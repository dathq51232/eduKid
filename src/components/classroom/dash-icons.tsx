// Biểu tượng & hình minh hoạ của trang chủ giáo viên (cắt từ ảnh mẫu dashboard 11/2026, nền trong suốt).
// Icon phẳng vẽ bằng SVG (dash-svg.tsx) hoặc icon nét Lucide; hình minh hoạ 3D là ảnh public/brand/dash/<tên>.webp.
import Image from 'next/image';
import { ChartColumn, MessageCircleMore, PartyPopper, Phone, Target, TriangleAlert, UsersRound } from 'lucide-react';
import { DASH_SVG } from '@/components/classroom/dash-svg';

/** Icon nét (vector) cho thẻ Lớp học — màu lấy từ CSS (--c / màu xanh của nút lối tắt) */
const LUCIDE = {
  'c-users': UsersRound, 'c-target': Target, 'c-alert': TriangleAlert, 'c-party': PartyPopper,
  'l-profile': UsersRound, 'l-comment': MessageCircleMore, 'l-chart': ChartColumn, 'l-phone': Phone,
} as const;

const SIZE = {
  teacher: [833, 480], 'teacher-male': [484, 480], 'hero-book': [811, 500], 'class-kids': [566, 420], 'stat-kids': [517, 300], 'stat-cal3d': [300, 300], 'stat-clip3d': [259, 300],
} as const;
export type DashName = keyof typeof SIZE | keyof typeof DASH_SVG | keyof typeof LUCIDE;

/** h: chiều cao hiển thị (px); bề ngang tự tính theo tỉ lệ ảnh */
export function DashIcon({ name, h, className, priority }: { name: DashName; h: number; className?: string; priority?: boolean }) {
  // icon phẳng: vẽ bằng SVG (nét ở mọi cỡ); hình minh hoạ 3D: ảnh webp
  if (name in DASH_SVG) { const Svg = DASH_SVG[name as keyof typeof DASH_SVG]; return <Svg size={h} className={className} />; }
  if (name in LUCIDE) { const Ic = LUCIDE[name as keyof typeof LUCIDE]; return <Ic width={h} height={h} className={`dash-ic${className ? ` ${className}` : ''}`} aria-hidden="true" />; }
  const [w0, h0] = SIZE[name as keyof typeof SIZE];
  return (
    <Image src={`/brand/dash/${name}.webp`} width={Math.round((w0 * h) / h0)} height={h} alt="" aria-hidden="true"
      className={`dash-ic${className ? ` ${className}` : ''}`} priority={priority} />
  );
}

/** Công cụ có biểu tượng riêng trên trang chủ (giống ảnh mẫu); công cụ khác giữ biểu tượng 3D sẵn có */
export const HOME_TOOL_IMG: Partial<Record<string, DashName>> = {
  'bai-giang-3d': 't-lesson', 'ke-hoach': 't-plan', 'kho-cau-hoi': 't-bank', 'trien-lam': 't-media', 'goi-ten': 't-game',
};
