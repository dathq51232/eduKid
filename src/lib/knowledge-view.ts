// "Kiến thức cần nhớ" để HIỂN THỊ (thẻ ở trang làm bài, giáo án, slide, thư viện /hoc):
// trong dữ liệu, "{}" là ô trống cần điền (vd "{} + 35 = 80") → hiện thành ô □. Dữ liệu gốc giữ nguyên (bộ kiểm tra dùng).
import type { Knowledge } from '@/lib/content/knowledge';

export const blankText = (s: string) => s.replace(/\{\}/g, '□');

export function knowledgeView<K extends Knowledge | undefined>(k: K): K {
  if (!k) return k;
  return { ...k, points: k.points.map(blankText), example: k.example && blankText(k.example), note: k.note && blankText(k.note) } as K;
}
