// Hình minh hoạ cho câu hỏi, vẽ bằng SVG/HTML trong src/components/Figure.tsx (không dùng ảnh ngoài).
// Bộ sinh bài luyện tập (src/lib/practice) tạo các hình này theo số ngẫu nhiên; mỗi hình có `alt` để đọc màn hình.

export type ShapeName = 'circle' | 'square' | 'triangle' | 'rectangle';
export type BlockName = 'cube' | 'box';

export const SHAPE_LABEL: Record<ShapeName, string> = {
  circle: 'hình tròn',
  square: 'hình vuông',
  triangle: 'hình tam giác',
  rectangle: 'hình chữ nhật',
};
export const BLOCK_LABEL: Record<BlockName, string> = {
  cube: 'khối lập phương',
  box: 'khối hộp chữ nhật',
};

/** Một hình phẳng đặt trong khung (x, y, w, h) của tranh; tam giác vẽ đỉnh ở giữa cạnh trên. */
export type ScenePart = { shape: ShapeName; x: number; y: number; w: number; h: number; color: string };

export type Figure =
  // Các nhóm đồ vật (emoji), mỗi nhóm một hàng
  | { kind: 'objects'; groups: { icon: string; count: number }[]; alt: string }
  // Hai hàng xếp thẳng cột để so sánh nhiều hơn / ít hơn
  | { kind: 'compare'; rows: { icon: string; count: number }[]; alt: string }
  // Một hàng hình phẳng
  | { kind: 'shapes'; items: { shape: ShapeName; color: string }[]; alt: string }
  // Tranh ghép từ hình phẳng (nhà, cây, ô tô...)
  | { kind: 'scene'; w: number; h: number; parts: ScenePart[]; alt: string }
  // Hình xếp bằng que tính: mỗi que là một đoạn [x1, y1, x2, y2]
  | { kind: 'sticks'; w: number; h: number; segs: [number, number, number, number][]; color: string; alt: string }
  // Lưới quy luật, ô "?" cần tìm
  | { kind: 'pattern'; cols: number; cells: (ShapeName | '?')[]; alt: string }
  // Dãy ô số (ô "?" hoặc "…" là ô cần điền)
  | { kind: 'sequence'; cells: string[]; alt: string }
  // Sơ đồ tách – gộp số
  | { kind: 'bond'; whole: string; parts: [string, string]; alt: string }
  // Khối lập phương / khối hộp chữ nhật, hoặc các cột khối lập phương xếp chồng (stacks = chiều cao từng cột)
  | { kind: 'blocks'; items?: BlockName[]; stacks?: number[]; alt: string }
  // Lưới ô (giá sách, hàng ghế) đặt đồ vật để hỏi vị trí
  | { kind: 'grid'; rows: number; cols: number; cells: (string | null)[]; alt: string }
  // ---- Học kì 2 ----
  // Que tính: các bó một chục và que lẻ (chục – đơn vị)
  | { kind: 'tens'; tens: number; ones: number; alt: string }
  // Đồng hồ kim, chỉ giờ đúng (kim dài chỉ số 12)
  | { kind: 'clock'; hour: number; minute?: number; alt: string } // minute: lớp 2 trở lên (mặc định 0 = giờ đúng)
  // Các băng / đồ vật đặt thẳng từ vạch 0; ruler = có thước chia xăng-ti-mét bên dưới (max = số vạch cuối)
  | { kind: 'ruler'; items: { label: string; length: number; color: string }[]; max: number; ruler: boolean; alt: string }
  // Tờ lịch một ngày
  | { kind: 'calendar'; month: number; day: number; weekday: string; alt: string }
  // Đặt tính theo cột (cộng, trừ); ô "?" là ô cần tìm
  | { kind: 'column'; a: string; b: string; op: '+' | '−'; result: string; alt: string };
