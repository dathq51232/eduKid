// Gợi ý NHẬN XÉT học sinh — viết theo mẫu câu, KHÔNG dùng AI, không gửi dữ liệu ra ngoài.
// Nguồn số liệu: mức đạt + điểm kiểm tra giáo viên nhập (Kết quả học tập trên trường), phẩm chất – năng lực,
// khen thưởng, và bài luyện tập trong EduChain Kids (Toán, Tiếng Việt, Tiếng Anh).
// Mỗi em một lời nhận xét KHÁC NHAU trong cùng lớp (generateClassComments bảo đảm không trùng câu).
// Đây chỉ là GỢI Ý — giáo viên đọc, sửa rồi mới lưu/xuất.

import {
  QUALITIES, SCHOOL_SUBJECT_NAME, levelFromScore, qualitiesFor, schoolSubjects,
  type ExamCode, type QualityItem, type QualityLevel, type SchoolSubject,
} from './school';

export type Level = 'T' | 'H' | 'C';
export type CommentSubject = SchoolSubject | 'chung' | 'pham-chat' | 'nang-luc';
export const SUBJECT_NAME: Record<CommentSubject, string> = { ...SCHOOL_SUBJECT_NAME, chung: 'Nhận xét chung', 'pham-chat': 'Phẩm chất', 'nang-luc': 'Năng lực' };
export const LEVEL_NAME: Record<Level, string> = { T: 'Hoàn thành tốt', H: 'Hoàn thành', C: 'Chưa hoàn thành' };
/** Môn có dữ liệu luyện tập trong app */
export const APP_SUBJECTS: SchoolSubject[] = ['toan', 'tieng-viet', 'tieng-anh'];

export type PeriodKind = 'week' | 'term' | 'year';

/** Số liệu luyện tập trong app của một em, một môn trong kỳ (hàm class_period_stats, migration 0013) */
export type SubjectStats = {
  student_id: string; display_name: string; subject_code: string;
  lessons: number; attempts: number; avg_percent: number; perfect: number; active_days: number;
  weak_lessons: string[] | null; strong_lessons: string[] | null;
};
export type Suggestion = { level: Level | null; comment: string };

const MIN_LESSONS: Record<PeriodKind, number> = { week: 2, term: 8, year: 15 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = <T,>(arr: readonly T[], seed: string): T => arr[hash(seed) % arr.length];
const quote = (titles: string[] | null | undefined, n = 2) =>
  (titles ?? []).slice(0, n).map((t) => `“${t.replace(/^Bài\s*\d+[.:]\s*/i, '').trim()}”`).join(', ');
const fmtScore = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ','));

/** Mức theo bài luyện tập trong app */
export function levelFor(s: SubjectStats | undefined, kind: PeriodKind): Level | null {
  if (!s || s.lessons === 0) return null;
  if (s.avg_percent >= 85 && s.lessons >= MIN_LESSONS[kind]) return 'T';
  if (s.avg_percent >= 50) return 'H';
  return 'C';
}

// ------------------------------------------------------------------ Ngân hàng mẫu câu theo môn
type Bank = { T: string[]; H: string[]; C: string[]; work: string[] };
const BANK: Record<SchoolSubject, Bank> = {
  'tieng-viet': {
    T: ['đọc to, rõ ràng, lưu loát và hiểu nội dung bài đọc', 'đọc diễn cảm, trả lời câu hỏi đọc hiểu đầy đủ', 'viết đúng chính tả, chữ viết đều và đẹp', 'dùng từ chính xác, đặt câu đúng và hay', 'viết đoạn văn có ý, diễn đạt mạch lạc', 'nắm vững kiến thức về từ và câu'],
    H: ['đọc đúng, trả lời được các câu hỏi đọc hiểu cơ bản', 'viết đúng chính tả phần lớn bài viết', 'biết dùng từ và đặt câu theo yêu cầu', 'viết được đoạn văn ngắn theo gợi ý', 'đọc trôi chảy các bài đã học'],
    C: ['đọc còn chậm, chưa hiểu hết nội dung bài đọc', 'viết còn sai chính tả, chữ viết chưa đều', 'còn lúng túng khi đặt câu và viết đoạn văn', 'chưa nắm chắc kiến thức về từ và câu'],
    work: ['luyện đọc to mỗi ngày', 'luyện viết chính tả thêm', 'đọc kĩ câu hỏi trước khi trả lời', 'luyện đặt câu và viết đoạn văn ngắn', 'chú ý viết hoa và dấu câu'],
  },
  toan: {
    T: ['nắm vững kiến thức, tính toán nhanh và chính xác', 'vận dụng tốt kiến thức vào giải toán có lời văn', 'làm bài cẩn thận, trình bày sạch đẹp', 'tính nhẩm nhanh, biết nhiều cách giải', 'hiểu bài và giải được các bài toán nâng cao'],
    H: ['thực hiện được các phép tính đã học', 'giải được bài toán có lời văn cơ bản', 'nắm được kiến thức cơ bản của môn học', 'làm đúng phần lớn các bài tập trên lớp', 'biết vận dụng kiến thức vào bài tập quen thuộc'],
    C: ['còn chậm khi thực hiện phép tính', 'còn nhầm lẫn khi giải bài toán có lời văn', 'chưa nắm chắc một số kiến thức cơ bản', 'còn thiếu cẩn thận khi làm bài'],
    work: ['luyện thêm các phép tính', 'đọc kĩ đề và kiểm tra lại kết quả', 'luyện giải toán có lời văn', 'học thuộc bảng nhân, bảng chia', 'cẩn thận hơn khi đặt tính'],
  },
  'tieng-anh': {
    T: ['nhớ từ vựng tốt, phát âm rõ ràng', 'nghe hiểu và trả lời được các câu hỏi đơn giản', 'dùng đúng các mẫu câu đã học', 'đọc hiểu đoạn văn ngắn và viết đúng câu', 'tự tin giao tiếp bằng tiếng Anh trong lớp'],
    H: ['nhớ được phần lớn từ vựng đã học', 'nói được các mẫu câu cơ bản', 'nghe hiểu được những câu đơn giản', 'đọc và viết được từ, câu ngắn'],
    C: ['còn quên nhiều từ vựng đã học', 'còn lúng túng khi nói mẫu câu', 'chưa nghe hiểu được câu hỏi đơn giản', 'phát âm chưa rõ một số từ'],
    work: ['ôn từ vựng mỗi ngày', 'luyện nói các mẫu câu', 'nghe và nhắc lại theo băng', 'luyện đọc to và viết từ mới'],
  },
  'dao-duc': {
    T: ['thực hiện tốt các chuẩn mực hành vi đã học', 'lễ phép với thầy cô, hòa nhã với bạn bè', 'biết nhận ra việc đúng, việc sai và làm theo điều đúng', 'tích cực tham gia các việc làm tốt ở lớp'],
    H: ['biết các chuẩn mực hành vi đã học', 'lễ phép, biết giúp đỡ bạn', 'thực hiện được các việc làm tốt theo bài học'],
    C: ['chưa thường xuyên thực hiện các hành vi đã học', 'đôi khi chưa giữ trật tự trong lớp', 'chưa mạnh dạn nhận lỗi khi làm sai'],
    work: ['thực hiện nội quy lớp học tốt hơn', 'mạnh dạn nhận lỗi và sửa lỗi', 'quan tâm, giúp đỡ bạn bè'],
  },
  tnxh: {
    T: ['hiểu bài, nêu được nhiều hiểu biết về tự nhiên và xã hội', 'quan sát tốt, biết liên hệ thực tế', 'biết giữ gìn sức khỏe và bảo vệ môi trường', 'tích cực trao đổi, chia sẻ trong giờ học'],
    H: ['nắm được kiến thức cơ bản về con người và môi trường xung quanh', 'biết quan sát và trả lời câu hỏi', 'thực hiện được các việc giữ vệ sinh cơ thể'],
    C: ['chưa nhớ hết kiến thức đã học', 'còn ít phát biểu, quan sát chưa kĩ', 'chưa liên hệ được bài học với thực tế'],
    work: ['quan sát kĩ hơn', 'mạnh dạn chia sẻ hiểu biết của mình', 'ôn lại kiến thức đã học'],
  },
  'khoa-hoc': {
    T: ['nắm vững kiến thức, giải thích được các hiện tượng đơn giản', 'tích cực làm thí nghiệm, quan sát cẩn thận', 'biết vận dụng kiến thức để bảo vệ sức khỏe và môi trường', 'trả lời câu hỏi rõ ràng, có hiểu biết rộng'],
    H: ['nắm được kiến thức cơ bản của bài học', 'biết quan sát và nêu kết quả thí nghiệm đơn giản', 'hiểu và trả lời được phần lớn câu hỏi'],
    C: ['chưa nắm chắc kiến thức đã học', 'còn lúng túng khi giải thích hiện tượng', 'chưa tích cực tham gia hoạt động nhóm'],
    work: ['ôn lại các bài đã học', 'tích cực tham gia thí nghiệm', 'đặt câu hỏi khi chưa hiểu'],
  },
  'lich-su-dia-li': {
    T: ['nắm vững các sự kiện, nhân vật lịch sử đã học', 'đọc và sử dụng tốt bản đồ, lược đồ', 'kể lại được các câu chuyện lịch sử hấp dẫn', 'hiểu đặc điểm tự nhiên và dân cư các vùng đã học'],
    H: ['nhớ được các sự kiện lịch sử chính', 'biết chỉ vị trí trên bản đồ', 'nêu được đặc điểm cơ bản của các vùng đã học'],
    C: ['còn nhầm lẫn các sự kiện lịch sử', 'chưa đọc được bản đồ, lược đồ', 'chưa nhớ đặc điểm các vùng đã học'],
    work: ['ôn lại các mốc lịch sử', 'luyện đọc bản đồ', 'đọc thêm sách lịch sử, địa lí'],
  },
  'tin-hoc-cong-nghe': {
    T: ['sử dụng máy tính thành thạo, thực hành nhanh', 'hiểu bài, làm tốt các sản phẩm công nghệ', 'biết sử dụng an toàn các thiết bị số', 'sáng tạo khi thực hành'],
    H: ['thực hành được các thao tác cơ bản trên máy tính', 'làm được sản phẩm theo hướng dẫn', 'biết giữ an toàn khi dùng thiết bị'],
    C: ['còn chậm khi thực hành trên máy tính', 'chưa hoàn thành sản phẩm đúng thời gian', 'chưa nhớ các thao tác đã học'],
    work: ['luyện thêm thao tác với chuột và bàn phím', 'chú ý quan sát hướng dẫn', 'hoàn thành sản phẩm đúng thời gian'],
  },
  gdtc: {
    T: ['thực hiện đúng và đẹp các động tác', 'tích cực tập luyện, có thể lực tốt', 'chơi trò chơi vận động nhanh nhẹn, khéo léo', 'có ý thức tự tập luyện thường xuyên'],
    H: ['thực hiện được các động tác cơ bản', 'tham gia đầy đủ các giờ học', 'biết chơi các trò chơi vận động'],
    C: ['thực hiện động tác chưa đúng kĩ thuật', 'chưa tích cực tham gia tập luyện', 'còn chậm trong các trò chơi vận động'],
    work: ['tập luyện thêm ở nhà', 'chú ý quan sát và tập theo mẫu', 'tích cực tham gia vận động'],
  },
  'am-nhac': {
    T: ['hát đúng giai điệu, thuộc lời và biểu diễn tự tin', 'cảm nhận tốt âm nhạc, gõ đệm đúng nhịp', 'mạnh dạn biểu diễn trước lớp', 'yêu thích và tích cực trong giờ âm nhạc'],
    H: ['hát được các bài hát đã học', 'biết gõ đệm theo nhịp', 'tham gia hoạt động âm nhạc đầy đủ'],
    C: ['chưa thuộc lời một số bài hát', 'gõ đệm chưa đúng nhịp', 'còn rụt rè khi hát trước lớp'],
    work: ['ôn lại lời bài hát', 'mạnh dạn hát trước lớp', 'luyện gõ đệm theo nhịp'],
  },
  'mi-thuat': {
    T: ['vẽ đẹp, phối màu hài hòa và sáng tạo', 'sản phẩm mĩ thuật có ý tưởng độc đáo', 'biết giới thiệu và nhận xét sản phẩm', 'khéo léo trong các hoạt động thực hành'],
    H: ['hoàn thành sản phẩm theo yêu cầu', 'biết sử dụng màu sắc phù hợp', 'tham gia các hoạt động mĩ thuật đầy đủ'],
    C: ['chưa hoàn thành sản phẩm đúng thời gian', 'sử dụng màu sắc chưa hợp lí', 'còn ngại giới thiệu sản phẩm của mình'],
    work: ['hoàn thành sản phẩm đúng thời gian', 'quan sát kĩ mẫu trước khi vẽ', 'mạnh dạn chia sẻ ý tưởng'],
  },
  hdtn: {
    T: ['tích cực, chủ động tham gia các hoạt động trải nghiệm', 'biết hợp tác tốt với bạn trong nhóm', 'mạnh dạn chia sẻ, thể hiện bản thân', 'thực hiện tốt các việc tự phục vụ bản thân'],
    H: ['tham gia đầy đủ các hoạt động của lớp', 'biết làm việc cùng bạn', 'thực hiện được các nhiệm vụ được giao'],
    C: ['chưa tích cực tham gia hoạt động chung', 'còn rụt rè khi làm việc nhóm', 'chưa hoàn thành nhiệm vụ được giao'],
    work: ['mạnh dạn tham gia hoạt động chung', 'hợp tác với bạn nhiều hơn', 'hoàn thành nhiệm vụ được giao'],
  },
};

const OPEN: Record<Level, string[]> = {
  T: ['Em', 'Em học tập tích cực,', 'Em tiếp thu bài nhanh,', 'Trong kỳ, em', 'Em chăm chỉ,', 'Em tự giác học tập,'],
  H: ['Em', 'Trong kỳ, em', 'Em chăm chỉ,', 'Em có cố gắng,', 'Em tích cực,'],
  C: ['Em', 'Trong kỳ, em', 'Em đã cố gắng nhưng'],
};
const CLOSE: Record<Level, string[]> = {
  T: ['Tiếp tục phát huy nhé!', 'Thầy cô khen em!', 'Rất đáng khen!', 'Em hãy giữ vững thành tích nhé!', 'Thầy cô rất tự hào về em!', 'Cố gắng hơn nữa em nhé!'],
  H: ['Em cố gắng hơn nữa nhé!', 'Thầy cô tin em sẽ tiến bộ hơn!', 'Cố lên em nhé!', 'Em hãy tiếp tục cố gắng nhé!', ''],
  C: ['Thầy cô tin em sẽ tiến bộ!', 'Em cố gắng luyện tập thêm nhé!', 'Gia đình và thầy cô sẽ cùng giúp em!', 'Cố lên em nhé!'],
};
const SCORE_LINE: Record<Level, string[]> = {
  T: ['Bài kiểm tra đạt {s} điểm.', 'Điểm kiểm tra định kỳ: {s}.', 'Kết quả bài kiểm tra: {s} điểm, rất tốt.'],
  H: ['Bài kiểm tra đạt {s} điểm.', 'Điểm kiểm tra định kỳ: {s}.', 'Bài kiểm tra định kỳ được {s} điểm.'],
  C: ['Bài kiểm tra được {s} điểm.', 'Điểm kiểm tra định kỳ: {s}, cần cố gắng thêm.'],
};
const WORK_LINE = ['Cần {w}.', 'Em cần {w}.', 'Em nên {w} nhé.', 'Em cố gắng {w} nhé.'];

export type SubjectInput = {
  level?: Level | null; // mức giáo viên đã nhập
  score?: number | null; // điểm kiểm tra định kỳ
  stats?: SubjectStats; // luyện tập trong app
  prev?: SubjectStats;
};

/**
 * Nhận xét một môn. Mức: giáo viên nhập > theo điểm kiểm tra > theo luyện tập trong app.
 * `salt` thay đổi cách chọn câu (dùng khi cần tránh trùng với bạn khác).
 */
export function suggestSubject(subject: SchoolSubject, input: SubjectInput, kind: PeriodKind, sid: string, salt = 0): Suggestion {
  const { score, stats, prev } = input;
  const hasScore = typeof score === 'number';
  const level: Level | null = input.level ?? (hasScore ? levelFromScore(score) : levelFor(stats, kind));
  if (!level) return { level: null, comment: '' };
  const b = BANK[subject];
  const seed = `${sid}:${subject}:${salt}`;
  const parts: string[] = [];
  // 1–2 ý chính theo mức (mức T/H có thể ghép 2 ý khác nhau)
  const s1 = pick(b[level], seed + 'a');
  let main = s1;
  if (level !== 'C' && hash(seed + 'n') % 3 !== 0) {
    const others = b[level].filter((x) => x !== s1);
    if (others.length) main = `${s1}; ${pick(others, seed + 'b')}`;
  }
  const open = pick(OPEN[level], seed + 'o');
  const okOpen = open.endsWith('nhưng') && !/^(còn|chưa)/.test(main) ? 'Em' : open;
  parts.push(`${okOpen} ${main}.`);
  if (hasScore) parts.push(pick(SCORE_LINE[level], seed + 's').replace('{s}', fmtScore(score)));
  if (stats && stats.lessons > 0) {
    const strong = quote(stats.strong_lessons, 1);
    const weak = quote(stats.weak_lessons, level === 'C' ? 2 : 1);
    if (strong && level !== 'C' && hash(seed + 'st') % 2 === 0) parts.push(`Làm tốt bài ${strong} trên EduChain.`);
    if (weak) parts.push(`Cần luyện thêm ${weak}.`);
    if (prev && prev.lessons > 0) {
      const d = stats.avg_percent - prev.avg_percent;
      if (d >= 10) parts.push(pick(['Có tiến bộ rõ so với kỳ trước.', 'Kết quả tiến bộ hơn kỳ trước.'], seed + 'p'));
      else if (d <= -10) parts.push('Kết quả giảm so với kỳ trước.');
    }
  }
  if (level !== 'T') parts.push(pick(WORK_LINE, seed + 'w').replace('{w}', pick(b.work, seed + 'ww')));
  // tránh hai câu liền nhau cùng kết thúc bằng "nhé"
  const lastNhe = /nhé[.!]?$/.test(parts[parts.length - 1] ?? '');
  const closers = lastNhe ? CLOSE[level].filter((c) => c && !/nhé/.test(c)) : CLOSE[level];
  const close = closers.length ? pick(closers, seed + 'c') : '';
  if (close) parts.push(close);
  return { level, comment: parts.join(' ').replace(/\s+/g, ' ').trim() };
}

// ------------------------------------------------------------------ Phẩm chất, năng lực
const Q_GOOD: Record<QualityItem, string[]> = {
  'pc-yeu-nuoc': ['yêu quê hương, kính trọng thầy cô và người lớn', 'tham gia tốt các hoạt động của trường, lớp', 'biết ơn những người có công với quê hương', 'yêu thiên nhiên, có ý thức bảo vệ môi trường'],
  'pc-nhan-ai': ['biết quan tâm, giúp đỡ bạn bè', 'hòa đồng, thân thiện với mọi người', 'biết chia sẻ với bạn gặp khó khăn', 'yêu thương, kính trọng ông bà, cha mẹ'],
  'pc-cham-chi': ['chăm chỉ, chuẩn bị bài đầy đủ', 'đi học đều, chăm làm việc nhà', 'chăm học, ham tìm hiểu', 'thường xuyên tự ôn bài ở nhà'],
  'pc-trung-thuc': ['trung thực, thật thà trong học tập', 'dũng cảm nhận lỗi và sửa lỗi', 'nói đúng sự thật, không lấy đồ của người khác', 'thật thà, đáng tin cậy'],
  'pc-trach-nhiem': ['có trách nhiệm với việc được giao', 'biết giữ gìn đồ dùng và bảo vệ của chung', 'giữ lời hứa, làm tròn phần việc của mình', 'có ý thức giữ gìn vệ sinh lớp học'],
  'nl-tu-chu': ['tự giác học tập, tự làm việc của mình', 'biết tự chuẩn bị đồ dùng học tập', 'biết sắp xếp thời gian học và chơi', 'tự hoàn thành bài tập ở nhà'],
  'nl-giao-tiep': ['mạnh dạn giao tiếp, hợp tác tốt trong nhóm', 'biết lắng nghe và trình bày ý kiến rõ ràng', 'tích cực trao đổi cùng bạn', 'biết chia sẻ nhiệm vụ trong nhóm'],
  'nl-gqvd': ['biết tìm cách giải quyết vấn đề trong học tập', 'có nhiều ý tưởng sáng tạo', 'biết đặt câu hỏi khi chưa hiểu', 'linh hoạt tìm nhiều cách làm bài'],
  'nl-ngon-ngu': ['diễn đạt rõ ràng, mạch lạc', 'đọc, viết, nói tốt', 'dùng từ chính xác khi trình bày', 'kể chuyện hấp dẫn'],
  'nl-tinh-toan': ['tính toán nhanh, tư duy toán học tốt', 'vận dụng toán học vào thực tế', 'tính nhẩm nhanh và chính xác', 'biết suy luận logic'],
  'nl-khoa-hoc': ['ham tìm hiểu tự nhiên và xã hội', 'biết quan sát, đặt câu hỏi khoa học', 'thích khám phá thế giới xung quanh', 'giải thích được hiện tượng đơn giản'],
  'nl-cong-nghe': ['sử dụng đồ dùng, thiết bị đúng cách', 'làm được sản phẩm công nghệ đơn giản', 'khéo léo khi thực hành'],
  'nl-tin-hoc': ['sử dụng máy tính và thiết bị số an toàn', 'thực hành tin học thành thạo', 'biết tìm kiếm thông tin phù hợp'],
  'nl-tham-mi': ['cảm nhận được cái đẹp trong cuộc sống', 'yêu thích nghệ thuật, sáng tạo', 'có óc thẩm mĩ tốt', 'trình bày sản phẩm đẹp mắt'],
  'nl-the-chat': ['có ý thức rèn luyện sức khỏe', 'tích cực vận động, thể lực tốt', 'nhanh nhẹn trong các hoạt động thể thao', 'giữ gìn vệ sinh cá nhân tốt'],
};
const Q_WORK: Record<QualityItem, string> = {
  'pc-yeu-nuoc': 'tham gia tích cực hơn các hoạt động của trường, lớp', 'pc-nhan-ai': 'quan tâm, giúp đỡ bạn nhiều hơn',
  'pc-cham-chi': 'chăm chỉ hơn, chuẩn bị bài đầy đủ trước khi đến lớp', 'pc-trung-thuc': 'thật thà, mạnh dạn nhận lỗi',
  'pc-trach-nhiem': 'có trách nhiệm hơn với việc được giao', 'nl-tu-chu': 'tự giác hơn trong học tập',
  'nl-giao-tiep': 'mạnh dạn giao tiếp và hợp tác với bạn', 'nl-gqvd': 'chủ động tìm cách giải quyết khi gặp khó khăn',
  'nl-ngon-ngu': 'luyện nói và viết rõ ràng hơn', 'nl-tinh-toan': 'luyện tính toán cẩn thận hơn', 'nl-khoa-hoc': 'quan sát và tìm hiểu nhiều hơn',
  'nl-cong-nghe': 'chú ý thực hành với đồ dùng, thiết bị', 'nl-tin-hoc': 'luyện thêm thao tác trên máy tính',
  'nl-tham-mi': 'mạnh dạn thể hiện ý tưởng trong các giờ nghệ thuật', 'nl-the-chat': 'tích cực tập luyện thể dục thể thao',
};
const Q_OPEN_GOOD = ['Em', 'Em luôn', 'Ở lớp, em', 'Em ngoan,', 'Em rất'];
const Q_MID_PC = ['Em thực hiện tốt nội quy lớp học.', 'Em lễ phép với thầy cô.', 'Em đoàn kết với bạn bè.', 'Em giữ gìn vệ sinh chung.', 'Em đi học đầy đủ, đúng giờ.', 'Em biết chào hỏi lễ phép.', 'Em giữ gìn sách vở sạch đẹp.', 'Em mặc đồng phục gọn gàng.'];
const Q_MID_NL = ['Em biết tự học ở nhà.', 'Em mạnh dạn phát biểu xây dựng bài.', 'Em biết hợp tác cùng bạn trong nhóm.', 'Em hoàn thành nhiệm vụ được giao.', 'Em biết tự chuẩn bị đồ dùng học tập.', 'Em biết lắng nghe ý kiến của bạn.', 'Em có nhiều ý tưởng hay trong học tập.', 'Em tích cực tham gia hoạt động nhóm.'];

/** Nhận xét phẩm chất hoặc năng lực từ các mức Tốt/Đạt/Cần cố gắng */
export function suggestQualities(group: 'pham-chat' | 'nang-luc', levels: Partial<Record<QualityItem, QualityLevel>>, grade: number, sid: string, awards: string[] = [], salt = 0): Suggestion {
  const items = qualitiesFor(grade).filter((q) => (group === 'pham-chat' ? q.group === 'pham-chat' : q.group !== 'pham-chat'));
  const got = items.filter((q) => levels[q.item]);
  if (!got.length && !awards.length) return { level: null, comment: '' };
  const seed = `${sid}:${group}:${salt}`;
  const good = got.filter((q) => levels[q.item] === 'T');
  const weak = got.filter((q) => levels[q.item] === 'C');
  const parts: string[] = [];
  const mid = group === 'pham-chat' ? Q_MID_PC : Q_MID_NL;
  const shuffled = [...good].sort((a, b) => hash(seed + a.item) - hash(seed + b.item)).slice(0, 2);
  if (shuffled.length) {
    const phrases = shuffled.map((q, i) => pick(Q_GOOD[q.item], seed + q.item + i));
    parts.push(`${pick(Q_OPEN_GOOD, seed + 'og')} ${phrases.join(', ')}.`);
    if (hash(seed + 'm') % 2 === 0) parts.push(pick(mid, seed + 'mid'));
  } else {
    const a = pick(mid, seed + 'm1');
    const b = pick(mid.filter((x) => x !== a), seed + 'm2');
    parts.push(a, b);
  }
  if (weak.length) parts.push(`Em cần ${weak.slice(0, 2).map((q) => Q_WORK[q.item]).join(' và ')}.`);
  if (group === 'pham-chat' && awards.length) parts.push(`Thành tích: ${awards.slice(0, 3).join('; ')}.`);
  const anyC = weak.length > 0;
  const allGood = good.length >= Math.max(1, Math.ceil(got.length / 2)) && !anyC;
  parts.push(pick(allGood ? CLOSE.T : anyC ? CLOSE.C : CLOSE.H.filter(Boolean), seed + 'c'));
  // Mức chung của nhóm (để xuất): Tốt nếu đa số Tốt và không có Cần cố gắng; Cần cố gắng nếu có từ 2 mục C; còn lại Đạt
  return { level: null, comment: parts.join(' ') };
}
export function groupLevel(levels: Partial<Record<QualityItem, QualityLevel>>, grade: number, group: 'pham-chat' | 'nang-luc'): QualityLevel | null {
  const items = qualitiesFor(grade).filter((q) => (group === 'pham-chat' ? q.group === 'pham-chat' : q.group !== 'pham-chat'));
  const vals = items.map((q) => levels[q.item]).filter(Boolean) as QualityLevel[];
  if (!vals.length) return null;
  const c = vals.filter((v) => v === 'C').length;
  const t = vals.filter((v) => v === 'T').length;
  if (c >= 2) return 'C';
  if (t > vals.length / 2 && c === 0) return 'T';
  return 'D';
}

/** Nhận xét chung theo tuần: chuyên cần luyện tập trong app */
export function suggestGeneral(all: SubjectStats[], kind: PeriodKind, sid: string, awards: string[] = [], salt = 0): Suggestion {
  const lessons = all.reduce((a, s) => a + s.lessons, 0);
  const award = awards.length ? ` Thành tích: ${awards.slice(0, 3).join('; ')}.` : '';
  if (lessons === 0) return { level: null, comment: (award ? award.trim() + ' ' : '') + 'Chưa có dữ liệu luyện tập trên EduChain Kids trong kỳ này.' };
  const days = Math.max(...all.map((s) => s.active_days));
  const attempts = all.reduce((a, s) => a + s.attempts, 0);
  const seed = `${sid}:chung:${kind}:${salt}`;
  const steady = kind === 'week' ? days >= 3 : kind === 'term' ? days >= 20 : days >= 40;
  const parts = [
    steady
      ? pick(['Em chăm chỉ, tự giác luyện tập đều đặn.', 'Em có ý thức tự học tốt, luyện tập thường xuyên.', 'Em luyện tập đều đặn mỗi ngày.'], seed)
      : pick(['Em đã tham gia luyện tập.', 'Em có tham gia luyện tập trên EduChain Kids.', 'Em đã làm bài luyện tập.'], seed),
    `Đã làm ${lessons} bài trong ${days} ngày.`,
  ];
  if (attempts > lessons) parts.push(pick(['Em biết làm lại bài để sửa lỗi sai.', 'Em kiên trì làm lại những bài chưa tốt.'], seed + 'r'));
  if (!steady) parts.push(pick(['Em nên luyện tập đều đặn hơn mỗi tuần.', 'Em cố gắng luyện tập thường xuyên hơn nhé.'], seed + 'n'));
  return { level: null, comment: parts.join(' ') + award };
}

// ------------------------------------------------------------------ Tạo cho cả lớp, KHÔNG TRÙNG
export type StudentData = {
  id: string;
  subjects: Partial<Record<SchoolSubject, SubjectInput>>;
  qualities: Partial<Record<QualityItem, QualityLevel>>;
  awards: string[];
  appStats: SubjectStats[];
};

/**
 * Sinh nhận xét cho cả lớp một môn/mục. Hai bạn trùng câu thì đổi cách chọn câu (salt) đến khi khác nhau;
 * vẫn trùng sau nhiều lần (hiếm, khi ngân hàng câu quá nhỏ) thì thêm một chi tiết riêng của em.
 */
export function generateClassComments(subject: CommentSubject, students: StudentData[], kind: PeriodKind, grade: number, reserved: Iterable<string> = []): Map<string, Suggestion> {
  const out = new Map<string, Suggestion>();
  const used = new Set<string>(reserved);
  const one = (s: StudentData, salt: number): Suggestion => {
    if (subject === 'pham-chat' || subject === 'nang-luc') return suggestQualities(subject, s.qualities, grade, s.id, s.awards, salt);
    if (subject === 'chung') return suggestGeneral(s.appStats, kind, s.id, s.awards, salt);
    return suggestSubject(subject, s.subjects[subject] ?? {}, kind, s.id, salt);
  };
  for (const s of students) {
    let sug = one(s, 0);
    for (let salt = 1; sug.comment && used.has(sug.comment) && salt < 40; salt++) sug = one(s, salt);
    if (sug.comment && used.has(sug.comment)) {
      const base = sug.comment;
      for (let i = 0; i < EXTRA.length * EXTRA.length && used.has(sug.comment); i++) {
        const e1 = EXTRA[(hash(s.id) + i) % EXTRA.length];
        const e2 = i >= EXTRA.length ? ' ' + EXTRA[Math.floor(i / EXTRA.length) % EXTRA.length] : '';
        sug = { ...sug, comment: `${base} ${e1}${e2}` };
      }
    }
    if (sug.comment) used.add(sug.comment);
    out.set(s.id, sug);
  }
  return out;
}

const EXTRA = ['Em hãy giữ vững tinh thần học tập.', 'Cả lớp luôn ủng hộ em.', 'Em hãy đọc thêm sách mỗi ngày.', 'Em nhớ ôn bài đều đặn nhé.', 'Em hãy mạnh dạn phát biểu hơn.', 'Thầy cô luôn đồng hành cùng em.', 'Em hãy giúp đỡ các bạn cùng tiến bộ.', 'Em nhớ giữ gìn sức khỏe nhé.', 'Em hãy luôn vui vẻ khi đến lớp.', 'Em cố gắng hoàn thành bài tập về nhà.'];

/** Các mục nhận xét của một kỳ */
export function commentSubjectsFor(grade: number, kind: PeriodKind): CommentSubject[] {
  if (kind === 'week') return [...APP_SUBJECTS, 'chung'];
  return [...schoolSubjects(grade), 'pham-chat', 'nang-luc'];
}

// ------------------------------------------------------------------ Kỳ nhận xét
export type Period = { key: string; label: string; kind: PeriodKind; from: Date; to: Date; prevFrom?: Date; prevTo?: Date; exam?: ExamCode };

const VN_OFFSET = 7 * 3600_000;
const vnDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d) - VN_OFFSET);

/** Năm học chứa ngày `now` (năm học bắt đầu 1/9; từ tháng 8 tính năm học mới) */
export function schoolYearOf(now = new Date()): number {
  const vn = new Date(now.getTime() + VN_OFFSET);
  return vn.getUTCMonth() + 1 >= 8 ? vn.getUTCFullYear() : vn.getUTCFullYear() - 1;
}

/**
 * Kỳ nhận xét: tuần này, tuần trước, và 4 kỳ đánh giá định kỳ (giữa/cuối học kỳ I, giữa học kỳ II, cuối năm).
 * Khoảng ngày dùng để lấy dữ liệu luyện tập trong app (gần đúng theo năm học thông thường).
 */
export function periodsFor(now = new Date()): Period[] {
  const vn = new Date(now.getTime() + VN_OFFSET);
  const dow = (vn.getUTCDay() + 6) % 7;
  const monday = vnDate(vn.getUTCFullYear(), vn.getUTCMonth() + 1, vn.getUTCDate() - dow);
  const week = 7 * 86400_000;
  const prevMonday = new Date(monday.getTime() - week);
  const y = schoolYearOf(now);
  const start = vnDate(y, 9, 1), midI = vnDate(y, 11, 1), endI = vnDate(y + 1, 1, 16), midII = vnDate(y + 1, 3, 25), end = vnDate(y + 1, 6, 1);
  const fmt = (d: Date) => { const x = new Date(d.getTime() + VN_OFFSET); return `${x.getUTCDate()}/${x.getUTCMonth() + 1}`; };
  const wk = (d: Date) => { const x = new Date(d.getTime() + VN_OFFSET); return `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, '0')}${String(x.getUTCDate()).padStart(2, '0')}`; };
  const yl = `${y}–${y + 1}`;
  return [
    { key: `tuan-${wk(monday)}`, label: `Tuần này (${fmt(monday)}–${fmt(new Date(monday.getTime() + week - 1))})`, kind: 'week', from: monday, to: new Date(monday.getTime() + week), prevFrom: prevMonday, prevTo: monday },
    { key: `tuan-${wk(prevMonday)}`, label: `Tuần trước (${fmt(prevMonday)}–${fmt(new Date(monday.getTime() - 1))})`, kind: 'week', from: prevMonday, to: monday, prevFrom: new Date(prevMonday.getTime() - week), prevTo: prevMonday },
    { key: `gk1-${y}`, label: `Giữa học kỳ I (${yl})`, kind: 'term', from: start, to: midI, exam: 'gk1' },
    { key: `ck1-${y}`, label: `Cuối học kỳ I (${yl})`, kind: 'term', from: start, to: endI, exam: 'ck1' },
    { key: `gk2-${y}`, label: `Giữa học kỳ II (${yl})`, kind: 'term', from: endI, to: midII, prevFrom: start, prevTo: endI, exam: 'gk2' },
    { key: `ck2-${y}`, label: `Cuối năm học (${yl})`, kind: 'year', from: start, to: end, prevFrom: start, prevTo: endI, exam: 'ck2' },
  ];
}

export { QUALITIES };
