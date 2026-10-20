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

/** Môn của giáo án: 3 môn có ngân hàng câu hỏi trong app + các môn khác (khung chung) */
export type OtherSubject = 'dao-duc' | 'tnxh' | 'khoa-hoc' | 'ls-dl' | 'hdtn' | 'am-nhac' | 'mi-thuat' | 'gdtc' | 'tin-hoc' | 'cong-nghe' | 'khac';
export type PlanSubject = SubjectCode | OtherSubject;
export const isAppSubject = (s: PlanSubject): s is SubjectCode => s === 'toan' || s === 'tieng-viet' || s === 'tieng-anh';

export type LessonPlan = {
  v: 1;
  subject: PlanSubject;
  /** tên môn như trong lịch báo giảng (vd "HĐTN1", "Toán (BS)") — để hiện đúng như trường dùng */
  subjectLabel?: string;
  /** buổi (Sáng / Chiều) và số tiết theo phân phối chương trình — khi tạo từ lịch báo giảng */
  session?: string;
  ppct?: string;
  /** nội dung tích hợp / đồ dùng dạy học ghi trong lịch báo giảng */
  integration?: string;
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

export const SUBJECT_NAMES: Record<PlanSubject, string> = {
  toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh', 'dao-duc': 'Đạo đức', tnxh: 'Tự nhiên và Xã hội', 'khoa-hoc': 'Khoa học',
  'ls-dl': 'Lịch sử và Địa lí', hdtn: 'Hoạt động trải nghiệm', 'am-nhac': 'Âm nhạc', 'mi-thuat': 'Mĩ thuật', gdtc: 'Giáo dục thể chất',
  'tin-hoc': 'Tin học', 'cong-nghe': 'Công nghệ', khac: 'Môn khác',
};
/** Tên môn hiển thị của một giáo án */
export const subjectNameOf = (p: Pick<LessonPlan, 'subject' | 'subjectLabel'>) => p.subjectLabel?.trim() || SUBJECT_NAMES[p.subject] || 'Môn học';
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

// ------------------------------------------------------------------ khung chung cho môn không có ngân hàng câu hỏi trong app
const OTHER: Record<OtherSubject, { competence: string; teacher: string; student: string; explore: string; practice: string; apply: string }> = {
  'dao-duc': { competence: 'Năng lực điều chỉnh hành vi; năng lực phát triển bản thân.', teacher: 'Tranh tình huống, câu chuyện ngắn, phiếu học tập.', student: 'Sách giáo khoa, vở bài tập Đạo đức.', explore: 'Kể chuyện / cho HS quan sát tranh tình huống; hỏi để HS nhận ra hành vi đúng, chưa đúng.', practice: 'Thảo luận nhóm xử lí tình huống; bày tỏ ý kiến đồng tình / không đồng tình.', apply: 'HS liên hệ bản thân, nêu việc sẽ làm ở nhà, ở trường.' },
  tnxh: { competence: 'Năng lực nhận thức khoa học; tìm hiểu môi trường tự nhiên và xã hội xung quanh; vận dụng kiến thức, kĩ năng đã học.', teacher: 'Tranh ảnh, vật thật / mô hình, phiếu học tập.', student: 'Sách giáo khoa, vở bài tập Tự nhiên và Xã hội.', explore: 'Cho HS quan sát tranh, vật thật; đặt câu hỏi để HS tự phát hiện, nêu nhận xét.', practice: 'Làm việc nhóm: hoàn thành phiếu, chia sẻ trước lớp.', apply: 'HS liên hệ thực tế gia đình, trường học, địa phương.' },
  'khoa-hoc': { competence: 'Năng lực nhận thức khoa học tự nhiên; tìm hiểu tự nhiên; vận dụng kiến thức vào thực tiễn.', teacher: 'Dụng cụ thí nghiệm đơn giản, tranh ảnh, phiếu học tập.', student: 'Sách giáo khoa, vở bài tập Khoa học.', explore: 'Tổ chức quan sát / thí nghiệm đơn giản; HS dự đoán, kiểm chứng, rút ra kết luận.', practice: 'Hoàn thành phiếu học tập, trả lời câu hỏi củng cố.', apply: 'Vận dụng giải thích hiện tượng gần gũi trong đời sống.' },
  'ls-dl': { competence: 'Năng lực nhận thức khoa học lịch sử và địa lí; tìm hiểu lịch sử và địa lí; vận dụng kiến thức, kĩ năng đã học.', teacher: 'Lược đồ, bản đồ, tranh ảnh tư liệu, phiếu học tập.', student: 'Sách giáo khoa, vở bài tập Lịch sử và Địa lí.', explore: 'Khai thác lược đồ, tranh ảnh, tư liệu; HS trả lời câu hỏi để rút ra nội dung chính.', practice: 'Làm việc nhóm hoàn thành phiếu, chỉ trên bản đồ / lược đồ.', apply: 'Liên hệ địa phương; sưu tầm tư liệu liên quan.' },
  hdtn: { competence: 'Năng lực thích ứng với cuộc sống; năng lực thiết kế và tổ chức hoạt động; định hướng nghề nghiệp ở mức đơn giản.', teacher: 'Tranh ảnh, video ngắn, phiếu, đồ dùng cho trò chơi.', student: 'Sách / vở Hoạt động trải nghiệm, bút màu.', explore: 'Tổ chức hoạt động trải nghiệm: chia sẻ, đóng vai, trò chơi theo chủ đề.', practice: 'Thực hành theo nhóm; chia sẻ cảm nhận sau hoạt động.', apply: 'Cam kết hành động nhỏ ở nhà, ở trường; nhờ phụ huynh hỗ trợ.' },
  'am-nhac': { competence: 'Năng lực thể hiện âm nhạc; cảm thụ và hiểu biết âm nhạc; ứng dụng và sáng tạo âm nhạc.', teacher: 'Nhạc cụ, loa, file nhạc, tranh minh hoạ.', student: 'Sách giáo khoa Âm nhạc, nhạc cụ gõ (nếu có).', explore: 'Nghe mẫu; hướng dẫn hát từng câu / gõ đệm theo phách, nhịp.', practice: 'Hát cả bài theo tổ, nhóm, cá nhân; kết hợp vận động phụ hoạ.', apply: 'Biểu diễn trước lớp; hát cho người thân nghe.' },
  'mi-thuat': { competence: 'Năng lực quan sát và nhận thức thẩm mĩ; sáng tạo và ứng dụng thẩm mĩ; phân tích và đánh giá thẩm mĩ.', teacher: 'Tranh mẫu, sản phẩm mẫu, giấy, màu.', student: 'Vở / giấy vẽ, bút chì, màu vẽ, kéo, hồ dán.', explore: 'Cho HS quan sát tranh / sản phẩm mẫu; nêu cách thực hiện.', practice: 'HS thực hành tạo sản phẩm cá nhân hoặc nhóm; GV gợi ý, hỗ trợ.', apply: 'Trưng bày, giới thiệu sản phẩm; nhận xét, chia sẻ.' },
  gdtc: { competence: 'Năng lực chăm sóc sức khoẻ; vận động cơ bản; hoạt động thể dục thể thao.', teacher: 'Sân tập, còi, cờ, bóng / dụng cụ phù hợp.', student: 'Trang phục gọn gàng, giày dép phù hợp.', explore: 'Khởi động chung; GV làm mẫu, phân tích động tác.', practice: 'Tập đồng loạt, theo tổ; thi đua giữa các tổ; trò chơi vận động.', apply: 'Thả lỏng, hồi tĩnh; nhận xét; nhắc tập luyện ở nhà.' },
  'tin-hoc': { competence: 'Năng lực sử dụng và quản lí phương tiện công nghệ thông tin; giải quyết vấn đề với sự hỗ trợ của máy tính.', teacher: 'Máy tính, máy chiếu, phần mềm / bài thực hành.', student: 'Sách giáo khoa Tin học, máy tính phòng máy.', explore: 'Trình chiếu, làm mẫu thao tác; HS quan sát và nêu các bước.', practice: 'Thực hành trên máy theo nhóm đôi; GV theo dõi, hỗ trợ.', apply: 'Vận dụng làm sản phẩm nhỏ; nhắc an toàn khi dùng máy tính.' },
  'cong-nghe': { competence: 'Năng lực nhận thức công nghệ; sử dụng công nghệ; thiết kế kĩ thuật ở mức đơn giản.', teacher: 'Bộ lắp ghép / vật liệu, sản phẩm mẫu, tranh quy trình.', student: 'Sách giáo khoa Công nghệ, bộ đồ dùng.', explore: 'Quan sát sản phẩm mẫu, quy trình; nêu các bước thực hiện.', practice: 'Thực hành làm / lắp ghép sản phẩm theo nhóm.', apply: 'Trưng bày, đánh giá sản phẩm; liên hệ sử dụng an toàn.' },
  khac: { competence: 'Năng lực đặc thù của môn học theo yêu cầu cần đạt của bài.', teacher: 'Đồ dùng dạy học phù hợp với bài.', student: 'Sách giáo khoa, vở, đồ dùng học tập.', explore: 'Hình thành kiến thức mới qua quan sát, trao đổi.', practice: 'Luyện tập, thực hành theo cá nhân / nhóm.', apply: 'Vận dụng vào tình huống thực tế.' },
};

/**
 * Giáo án khung cho môn không có ngân hàng câu hỏi trong app, hoặc tiết ôn tập / bổ sung (BS):
 * giữ đúng tên bài theo lịch báo giảng, phần yêu cầu cần đạt để giáo viên điền theo sách.
 */
export function genericPlan(input: { subject: PlanSubject; grade: number; className: string; title: string; review?: boolean; appLesson?: { id: string; title: string } | null }): LessonPlan {
  const { subject, grade, className, title } = input;
  if (isAppSubject(subject) && !input.review) {
    const p = generatePlan({ subject, grade, className, lesson: null });
    return { ...p, title, goals: { ...p.goals, knowledge: '- (Thầy cô ghi yêu cầu cần đạt của bài theo sách giáo khoa / kế hoạch dạy học.)' } };
  }
  const o = isAppSubject(subject) ? null : OTHER[subject];
  const app = input.appLesson;
  const review = !!input.review;
  const comp = isAppSubject(subject) ? COMPETENCE[subject] : o!.competence;
  const mat = isAppSubject(subject) ? MATERIALS[subject] : { teacher: o!.teacher, student: o!.student };
  const act = (key: ActivityKey, minutes: number, goal: string, teacher: string[], student: string[]): PlanActivity => ({ key, title: ACTIVITY_TITLES[key], minutes, goal, teacher: bullet(teacher), student: bullet(student) });
  return {
    v: 1, subject, grade, className, lessonId: app?.id ?? '', title,
    week: '', date: '', period: 0, minutes: 35,
    goals: {
      knowledge: review
        ? bullet([`Củng cố kiến thức, kĩ năng đã học trong tuần${app ? ` (trọng tâm: ${app.title})` : ''}.`, 'Phát hiện và bù đắp chỗ học sinh còn hổng.'])
        : '- (Thầy cô ghi yêu cầu cần đạt của bài theo sách giáo khoa / kế hoạch dạy học.)',
      competence: `${comp}\n${COMMON_COMPETENCE}`,
      quality: QUALITY,
    },
    materials: { ...mat },
    activities: review ? [
      act('khoi-dong', 5, 'Tạo hứng thú, nhắc lại nội dung đã học trong tuần.', ['Trò chơi hỏi nhanh – đáp nhanh về các bài đã học trong tuần.'], ['Tham gia trò chơi.']),
      act('kham-pha', 8, 'Hệ thống lại kiến thức trọng tâm.', ['Cùng HS nhắc lại kiến thức trọng tâm của tuần; chốt lại những điểm dễ nhầm.'], ['Nhắc lại, nêu ví dụ.']),
      act('luyen-tap', 17, 'Luyện tập theo mức độ, kèm cặp HS còn chậm.', ['Chia nhóm theo mức: nhóm củng cố, nhóm nâng cao.', ...(app ? [`Cho HS luyện trên EduChain Kids: bài “${app.title}” (máy / máy tính bảng của lớp hoặc giao về nhà).`] : []), 'Theo dõi, kèm riêng HS còn lúng túng.'], ['Làm bài theo nhóm / cá nhân; tự sửa lỗi.']),
      act('van-dung', 5, 'Vận dụng và dặn dò.', ['Nhận xét tiết học; dặn ôn luyện ở nhà.'], ['Nghe nhận xét, ghi nhớ nhiệm vụ.']),
    ] : [
      act('khoi-dong', 5, 'Tạo hứng thú, kết nối vào bài.', ['Tổ chức trò chơi / bài hát ngắn liên quan đến chủ đề.', `Giới thiệu bài: “${title}”.`], ['Tham gia, lắng nghe.']),
      act('kham-pha', 12, 'Hình thành kiến thức, kĩ năng mới.', [o?.explore ?? 'Hình thành kiến thức mới qua quan sát, trao đổi.'], ['Quan sát, trao đổi nhóm đôi, trình bày.']),
      act('luyen-tap', 13, 'Luyện tập, thực hành.', [o?.practice ?? 'Luyện tập, thực hành.', 'Theo dõi, giúp đỡ HS; nhận xét, tuyên dương.'], ['Thực hành cá nhân / nhóm; nhận xét bạn.']),
      act('van-dung', 5, 'Vận dụng, liên hệ thực tế.', [o?.apply ?? 'Vận dụng vào thực tế.', 'Nhận xét tiết học, dặn dò.'], ['Liên hệ bản thân; ghi nhớ nhiệm vụ.']),
    ],
    assessment: 'Đánh giá thường xuyên bằng nhận xét: quan sát, vấn đáp, sản phẩm học tập của học sinh.',
    adjust: '',
  };
}
