// Định dạng một bài giảng 3D (lưu trong cột data jsonb của bảng lessons3d — migration 0034).
// Chỉ lưu danh sách đồ vật, cảnh, đường nối, điều khiển, câu hỏi: một bài thường chỉ vài KB.

export type FxType = '' | 'up' | 'rain' | 'snow' | 'wind' | 'spin' | 'pulse' | 'orbit' | 'bob' | 'blink' | 'traffic' | 'wave' | 'heat' | 'tilt' | 'clock';
export type BaseType = 'grass' | 'desk' | 'space' | 'water' | 'road';

export type Obj3D = {
  id: string;
  type: string;
  x: number; y: number; z: number;
  ry: number; s: number;
  color: string;
  /** Tên hiện cho học sinh; với bảng chữ / thẻ số là chữ in trên mặt */
  name: string;
  spot: { on: boolean; title: string; text: string };
  fx: { type: FxType; speed: number };
  /** Bật/tắt (bóng đèn sáng, đèn giao thông chạy…) */
  on?: boolean;
  /** Tách rời các bộ phận (đồ vật có nhiều bộ phận) */
  split?: boolean;
  /** Xuất hiện từ cảnh số mấy khi trình chiếu (0 = luôn có) — dùng cho lắp ráp từng bước */
  appear?: number;
};

export type Link3D = { id: string; from: string; to: string; kind: 'arrow' | 'measure' | 'wire'; label: string };
export type Control3D = { id: string; label: string; kind: 'switch' | 'slider'; action: 'on' | 'speed' | 'split' | 'show'; targets: string[] };
export type Scene3D = { caption: string; cam: number[]; tgt: number[]; focus: string };
export type Quiz3D =
  | { type: 'spot'; q: string; target: string }
  | { type: 'choice'; q: string; opts: string[]; a: number };

export type Lesson3D = {
  v: 1;
  title: string;
  grade: number;
  subject: string;
  /** Bài STEM gốc dạng "lớp-bài", ví dụ "5-13" */
  stem?: string;
  base: BaseType;
  objects: Obj3D[];
  links: Link3D[];
  controls: Control3D[];
  scenes: Scene3D[];
  quiz: Quiz3D[];
};

export const MAX_OBJECTS = 80;
export const uid = () => Math.random().toString(36).slice(2, 9);
export const emptyLesson = (grade = 1, title = 'Bài giảng 3D mới'): Lesson3D => ({ v: 1, title, grade, subject: '', base: 'grass', objects: [], links: [], controls: [], scenes: [], quiz: [] });

/** Chuẩn hoá dữ liệu đọc từ database (bài cũ thiếu trường mới vẫn mở được) */
export function normalizeLesson(raw: unknown, fallbackTitle = 'Bài giảng 3D'): Lesson3D {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Lesson3D>;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    v: 1,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : fallbackTitle,
    grade: Number(r.grade) >= 1 && Number(r.grade) <= 5 ? Number(r.grade) : 1,
    subject: typeof r.subject === 'string' ? r.subject : '',
    stem: typeof r.stem === 'string' ? r.stem : undefined,
    base: (['grass', 'desk', 'space', 'water', 'road'] as const).includes(r.base as BaseType) ? (r.base as BaseType) : 'grass',
    objects: arr<Obj3D>(r.objects).filter((o) => o && typeof o.id === 'string' && typeof o.type === 'string').slice(0, MAX_OBJECTS)
      .map((o) => ({ ...o, spot: o.spot ?? { on: false, title: '', text: '' }, fx: o.fx ?? { type: '', speed: 1 } })),
    links: arr<Link3D>(r.links),
    controls: arr<Control3D>(r.controls),
    scenes: arr<Scene3D>(r.scenes),
    quiz: arr<Quiz3D>(r.quiz),
  };
}
