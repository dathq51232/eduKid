// Kế hoạch bài dạy (giáo án) — khung theo cấu trúc kế hoạch bài dạy tiểu học thường dùng:
// I. Yêu cầu cần đạt · II. Đồ dùng dạy học · III. Các hoạt động dạy học chủ yếu
// (Khởi động → Khám phá → Luyện tập, thực hành → Vận dụng, trải nghiệm) · IV. Điều chỉnh sau bài dạy.
// Nội dung gợi ý được ghép từ dữ liệu của app (tên bài, yêu cầu cần đạt, dạng bài, kiến thức cần nhớ,
// dạng lớp hay sai) theo mẫu câu tự viết — KHÔNG chép hoạt động của sách giáo viên. Giáo viên sửa lại theo lớp mình.

// File này không nạp ngân hàng câu hỏi (để trang giáo án nhẹ): dữ liệu bài do máy chủ chuẩn bị sẵn (lessons.ts).
import type { SubjectCode } from '../types';

/** Thông tin một bài để soạn giáo án (máy chủ tạo bằng lessonInfos trong lessons.ts) */
export type LessonInfo = {
  id: string; title: string; description: string; ref: string; semester: number;
  outcomes: string[]; forms: string[]; knowledge: string[]; example: string;
};

export type ActivityKey = 'khoi-dong' | 'kham-pha' | 'luyen-tap' | 'van-dung';
export type PlanActivity = { key: ActivityKey; title: string; minutes: number; goal: string; teacher: string; student: string };

export type LessonPlan = {
  v: 1;
  subject: SubjectCode;
  grade: number;
  className: string;
  /** mã bài trong app (để mở bài luyện tập); '' = bài giáo viên tự nhập */
  lessonId: string;
  title: string;
  week: string;
  /** yyyy-mm-dd; '' = chưa xếp lịch */
  date: string;
  /** tiết thứ mấy trong buổi; 0 = chưa xếp */
  period: number;
  minutes: number;
  goals: { knowledge: string; competence: string; quality: string };
  materials: { teacher: string; student: string };
  activities: PlanActivity[];
  assessment: string;
  adjust: string;
};

export const SUBJECT_NAMES: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
export const ACTIVITY_TITLES: Record<ActivityKey, string> = {
  'khoi-dong': '1. Khởi động',
  'kham-pha': '2. Khám phá',
  'luyen-tap': '3. Luyện tập, thực hành',
  'van-dung': '4. Vận dụng, trải nghiệm',
};

const uniq = <T,>(a: T[]) => [...new Set(a)];
const bullet = (a: string[]) => a.filter(Boolean).map((x) => (x.startsWith('  +') ? x : `- ${x}`)).join('\n');
const noDot = (x: string) => x.trim().replace(/[.;]+$/, '');


const COMPETENCE: Record<SubjectCode, string> = {
  toan: 'Năng lực tư duy và lập luận toán học; giao tiếp toán học; giải quyết vấn đề toán học.',
  'tieng-viet': 'Năng lực ngôn ngữ (đọc, viết, nói và nghe); năng lực văn học ở mức phù hợp lứa tuổi.',
  'tieng-anh': 'Năng lực giao tiếp bằng tiếng Anh ở các kĩ năng nghe, nói, đọc, viết theo chủ đề bài học.',
};
const COMMON_COMPETENCE = 'Năng lực tự chủ và tự học; giao tiếp và hợp tác khi làm việc nhóm đôi, nhóm nhỏ.';
const QUALITY = 'Chăm chỉ: tích cực tham gia các hoạt động học tập. Trách nhiệm: hoàn thành nhiệm vụ được giao. Trung thực: tự đánh giá đúng bài làm của mình và của bạn.';

const MATERIALS: Record<SubjectCode, { teacher: string; student: string }> = {
  toan: { teacher: 'Máy chiếu hoặc bảng phụ; đồ dùng trực quan phù hợp với bài; phiếu bài tập.', student: 'Sách giáo khoa, vở, bộ đồ dùng học Toán, bảng con.' },
  'tieng-viet': { teacher: 'Máy chiếu hoặc tranh ảnh minh hoạ; thẻ chữ, thẻ từ; phiếu học tập.', student: 'Sách giáo khoa, vở ô li / vở Tập viết, bảng con, phấn hoặc bút.' },
  'tieng-anh': { teacher: 'Flashcards, tranh minh hoạ, loa và file nghe; phiếu học tập.', student: 'Sách giáo khoa, vở bài tập, bút màu.' },
};

export type PlanInput = {
  subject: SubjectCode;
  grade: number;
  className: string;
  /** bài đang soạn (null = giáo án trống) và bài liền trước trong sách */
  lesson: LessonInfo | null;
  prevTitle?: string;
  /** dạng bài lớp còn hay sai (từ trang Lỗ hổng kiến thức) — đưa vào phần Luyện tập */
  weakForms?: string[];
  date?: string;
  period?: number;
  week?: string;
};

/** Tạo giáo án gợi ý cho một bài của app */
export function generatePlan(input: PlanInput): LessonPlan {
  const { subject, grade, className, lesson } = input;
  const title = lesson ? lesson.title : 'Bài học';
  const prev = input.prevTitle ?? '';
  const outcomes = uniq(lesson?.outcomes ?? []);
  const forms = uniq(lesson?.forms ?? []).slice(0, 6);
  const know = lesson && lesson.knowledge.length ? { points: lesson.knowledge, example: lesson.example } : undefined;
  const weak = (input.weakForms ?? []).filter(Boolean).slice(0, 4);
  const appLink = lesson ? `bài “${title}” trên EduChain Kids` : 'bài luyện tập trên EduChain Kids';

  const knowledge = bullet([
    ...(outcomes.length ? outcomes : [lesson?.description ?? 'Nêu yêu cầu cần đạt của bài.']),
    ...(know?.points.length ? [`Nắm được: ${know.points.slice(0, 3).map(noDot).join('; ')}.`] : []),
  ]);

  const S = SUBJECT_NAMES[subject];
  const kd: Record<SubjectCode, PlanActivity> = {
    toan: {
      key: 'khoi-dong', title: ACTIVITY_TITLES['khoi-dong'], minutes: 5, goal: 'Tạo hứng thú, ôn kiến thức đã học và dẫn vào bài mới.',
      teacher: bullet([`Tổ chức trò chơi “Ai nhanh – Ai đúng”${prev ? ` ôn lại bài “${prev}”` : ''}.`, 'Nêu một tình huống gần gũi (đồ vật, trò chơi trong lớp) để dẫn vào bài.', `Giới thiệu bài: “${title}”.`]),
      student: bullet(['Tham gia trò chơi, trả lời nhanh.', 'Lắng nghe, nhắc lại tên bài.']),
    },
    'tieng-viet': {
      key: 'khoi-dong', title: ACTIVITY_TITLES['khoi-dong'], minutes: 5, goal: 'Tạo không khí vui vẻ, kết nối với nội dung bài.',
      teacher: bullet(['Cho cả lớp hát hoặc đọc vè ngắn có liên quan đến chủ đề.', 'Cho HS quan sát tranh, nêu điều mình thấy.', `Giới thiệu bài: “${title}”.`]),
      student: bullet(['Hát / đọc theo, quan sát tranh và chia sẻ.', 'Lắng nghe, nhắc lại tên bài.']),
    },
    'tieng-anh': {
      key: 'khoi-dong', title: ACTIVITY_TITLES['khoi-dong'], minutes: 5, goal: 'Warm-up: khởi động bằng tiếng Anh, ôn từ đã học.',
      teacher: bullet(['Chào hỏi, cho cả lớp hát hoặc chant ngắn.', `Trò chơi “Slap the board” với từ vựng${prev ? ` của “${prev}”` : ' đã học'}.`, `Giới thiệu bài: “${title}”.`]),
      student: bullet(['Chào, hát / chant theo GV.', 'Chơi trò chơi, đọc to từ vựng.']),
    },
  };
  const kp: Record<SubjectCode, PlanActivity> = {
    toan: {
      key: 'kham-pha', title: ACTIVITY_TITLES['kham-pha'], minutes: 12, goal: 'HS hình thành kiến thức mới qua quan sát, thao tác.',
      teacher: bullet(['Đưa tình huống hoặc đồ dùng trực quan, yêu cầu HS quan sát và thao tác.', 'Đặt câu hỏi gợi mở để HS tự rút ra kiến thức.', ...(know?.points.length ? ['Chốt kiến thức:', ...know.points.map((p) => `  + ${p}`)] : ['Chốt kiến thức trọng tâm của bài.']), ...(know?.example ? [`Làm mẫu: ${know.example.replace(/\n/g, ' ; ')}`] : [])]),
      student: bullet(['Quan sát, thao tác với đồ dùng, trao đổi nhóm đôi.', 'Nêu nhận xét, nhắc lại kiến thức.']),
    },
    'tieng-viet': {
      key: 'kham-pha', title: ACTIVITY_TITLES['kham-pha'], minutes: 12, goal: 'HS tiếp cận nội dung mới của bài (đọc, âm vần, từ ngữ, câu…).',
      teacher: bullet(['Đọc mẫu / giới thiệu nội dung mới; hướng dẫn cách đọc, cách viết.', 'Giải nghĩa từ khó bằng tranh, vật thật hoặc đặt câu.', 'Nêu câu hỏi tìm hiểu nội dung, giúp HS trả lời trọn câu.']),
      student: bullet(['Lắng nghe, đọc cá nhân – nhóm – cả lớp.', 'Trả lời câu hỏi, nêu ý kiến của mình.']),
    },
    'tieng-anh': {
      key: 'kham-pha', title: ACTIVITY_TITLES['kham-pha'], minutes: 12, goal: 'Presentation: giới thiệu từ vựng / mẫu câu mới.',
      teacher: bullet(['Dùng flashcards giới thiệu từ mới; đọc mẫu, cho HS đọc đồng thanh – cá nhân.', 'Giới thiệu mẫu câu qua tranh hoặc đoạn hội thoại ngắn; đóng vai mẫu cùng 1 HS.', 'Kiểm tra nhanh: “What’s this?” / chỉ tranh – gọi tên.']),
      student: bullet(['Nghe, nhắc lại từ và mẫu câu.', 'Đóng vai theo cặp với mẫu câu mới.']),
    },
  };
  const lt: PlanActivity = {
    key: 'luyen-tap', title: ACTIVITY_TITLES['luyen-tap'], minutes: 13, goal: 'Củng cố kiến thức, rèn kĩ năng qua các dạng bài.',
    teacher: bullet([
      'Giao lần lượt các dạng bài (cá nhân, nhóm đôi):',
      ...(forms.length ? forms.map((f) => `  + ${f}`) : ['  + Các bài tập trong sách giáo khoa']),
      ...(weak.length ? ['Chú ý dạng lớp còn hay sai — cho làm thêm và chữa kĩ:', ...weak.map((w) => `  + ${w}`)] : []),
      'Theo dõi, giúp đỡ HS còn lúng túng; chữa bài, chốt cách làm.',
    ]),
    student: bullet(['Làm bài vào vở / bảng con / phiếu.', 'Trình bày, nhận xét bài bạn; tự sửa lỗi.']),
  };
  const vd: Record<SubjectCode, PlanActivity> = {
    toan: {
      key: 'van-dung', title: ACTIVITY_TITLES['van-dung'], minutes: 5, goal: 'Vận dụng kiến thức vào tình huống thực tế.',
      teacher: bullet(['Nêu một bài toán gắn với cuộc sống hằng ngày của HS để các em giải.', `Giao luyện thêm ở nhà: ${appLink}.`, 'Nhận xét tiết học, dặn dò chuẩn bị bài sau.']),
      student: bullet(['Suy nghĩ, trình bày cách giải.', 'Ghi nhớ nhiệm vụ luyện thêm ở nhà.']),
    },
    'tieng-viet': {
      key: 'van-dung', title: ACTIVITY_TITLES['van-dung'], minutes: 5, goal: 'Liên hệ bản thân, sử dụng từ ngữ / câu đã học.',
      teacher: bullet(['Cho HS nói 1–2 câu về bản thân, gia đình hoặc lớp học có dùng từ ngữ vừa học.', `Giao luyện thêm ở nhà: ${appLink}.`, 'Nhận xét tiết học, dặn dò.']),
      student: bullet(['Nói câu của mình, các bạn nhận xét.', 'Ghi nhớ nhiệm vụ ở nhà.']),
    },
    'tieng-anh': {
      key: 'van-dung', title: ACTIVITY_TITLES['van-dung'], minutes: 5, goal: 'Production: dùng mẫu câu trong tình huống mới.',
      teacher: bullet(['Trò chơi hỏi – đáp theo cặp / nhóm với mẫu câu mới.', `Giao luyện thêm ở nhà: ${appLink}.`, 'Nhận xét, khen ngợi; dặn ôn từ vựng.']),
      student: bullet(['Hỏi – đáp theo cặp, trình bày trước lớp.', 'Ghi nhớ nhiệm vụ ở nhà.']),
    },
  };

  return {
    v: 1, subject, grade, className, lessonId: lesson?.id ?? '', title,
    week: input.week ?? '', date: input.date ?? '', period: input.period ?? 0, minutes: 35,
    goals: { knowledge, competence: `${COMPETENCE[subject]}\n${COMMON_COMPETENCE}`, quality: QUALITY },
    materials: { ...MATERIALS[subject] },
    activities: [kd[subject], kp[subject], lt, vd[subject]],
    assessment: `Đánh giá thường xuyên bằng nhận xét: quan sát, vấn đáp trong giờ; sản phẩm học tập (vở, phiếu, bảng con); kết quả luyện tập trên EduChain Kids (số câu đúng, dạng còn sai). Môn ${S}.`,
    adjust: '',
  };
}

/** Giáo án trống (bài giáo viên tự nhập, không có trong app) */
export function blankPlan(subject: SubjectCode, grade: number, className: string): LessonPlan {
  const p = generatePlan({ subject, grade, className, lesson: null });
  return { ...p, title: '', goals: { ...p.goals, knowledge: '' } };
}

/** Thứ trong tuần của một ngày yyyy-mm-dd */
export function weekdayVi(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
}
export const viDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : '';
};
/** Thứ Hai đầu tuần của một ngày */
export function mondayOf(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
  const off = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Kiểm tra dữ liệu giáo án đọc từ máy chủ (phòng dữ liệu hỏng) */
export function isPlan(x: unknown): x is LessonPlan {
  const p = x as LessonPlan;
  return !!p && p.v === 1 && typeof p.title === 'string' && Array.isArray(p.activities) && !!p.goals && !!p.materials;
}
