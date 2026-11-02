// Biểu tượng 3D nhiều màu cho công cụ giáo viên (public/emoji/tool, Fluent Emoji 3D – MIT).
// Dùng như một component biểu tượng: <Icon aria-hidden="true" /> — giống biểu tượng nét cũ, chỉ đổi hình.
import type { ComponentType } from 'react';

export type IconComp = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

const cache = new Map<string, IconComp>();
export function icon3d(name: string): IconComp {
  const hit = cache.get(name);
  if (hit) return hit;
  function Icon3D({ className }: { className?: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- ảnh 96px đã tối ưu sẵn (webp)
    return <img src={`/emoji/tool/${name}.webp`} width={24} height={24} alt="" aria-hidden="true" className={`ic3d ${className ?? ''}`.trim()} decoding="async" loading="lazy" />;
  }
  Icon3D.displayName = `Icon3D(${name})`;
  cache.set(name, Icon3D);
  return Icon3D;
}

/** Biểu tượng 3D đặt cạnh tiêu đề trang công cụ (cỡ theo chữ tiêu đề) */
export function ToolIcon({ k }: { k: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- ảnh 96px đã tối ưu sẵn (webp)
  return <img src={`/emoji/tool/${k}.webp`} width={40} height={40} alt="" aria-hidden="true" className="ic3d ic3d-title" decoding="async" />;
}
