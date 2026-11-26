// Biểu tượng & hình minh hoạ của trang chủ giáo viên (cắt từ ảnh mẫu dashboard 11/2026, nền trong suốt).
// Ảnh ở public/brand/dash/<tên>.webp — đã phóng 3 lần nên hiển thị ở cỡ nhỏ vẫn nét.
import Image from 'next/image';

const SIZE = {
  teacher: [950, 483], 'teacher-male': [952, 955], 'hero-book': [857, 474], 'class-kids': [392, 261],
  'stat-users': [182, 174], 'stat-book': [174, 174], 'stat-cal': [182, 177], 'stat-check': [183, 177],
  'stat-kids': [308, 177], 'stat-cal3d': [190, 178], 'stat-clip3d': [199, 195],
  'h-todo': [80, 84], 'h-week': [84, 83], 'h-class': [101, 83], 'h-tools': [84, 84], 'h-mine': [86, 80],
  'c-users': [79, 85], 'c-target': [83, 73], 'c-alert': [70, 70], 'c-party': [70, 70],
  'l-profile': [63, 58], 'l-comment': [63, 66], 'l-chart': [58, 64], 'l-phone': [60, 66],
  't-lesson': [137, 109], 't-plan': [110, 110], 't-bank': [113, 112], 't-media': [113, 97], 't-game': [136, 97], 't-ai': [101, 92],
  'm-english': [130, 130], 'm-money': [121, 128],
} as const;
export type DashName = keyof typeof SIZE;

/** h: chiều cao hiển thị (px); bề ngang tự tính theo tỉ lệ ảnh */
export function DashIcon({ name, h, className, priority }: { name: DashName; h: number; className?: string; priority?: boolean }) {
  const [w0, h0] = SIZE[name];
  return (
    <Image src={`/brand/dash/${name}.webp`} width={Math.round((w0 * h) / h0)} height={h} alt="" aria-hidden="true"
      className={`dash-ic${className ? ` ${className}` : ''}`} priority={priority} />
  );
}

/** Công cụ có biểu tượng riêng trên trang chủ (giống ảnh mẫu); công cụ khác giữ biểu tượng 3D sẵn có */
export const HOME_TOOL_IMG: Partial<Record<string, DashName>> = {
  'bai-giang-3d': 't-lesson', 'ke-hoach': 't-plan', 'kho-cau-hoi': 't-bank', 'trien-lam': 't-media', 'goi-ten': 't-game',
};
