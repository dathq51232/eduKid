// Trợ lý soạn bài (giai đoạn 1: không dùng AI, không cần mạng): sinh đoạn soạn sẵn theo bài, môn, khối,
// nội dung tích hợp và dữ liệu lớp (dạng bài còn hay sai). Mỗi gợi ý có nhiều biến thể ("Đổi gợi ý khác"),
// thầy cô xem trước rồi mới chèn vào đúng hoạt động. Câu mẫu do app tự soạn, không chép SGK.
import type { ActivityKey, LessonPlan, PlanActivity } from './generate';

export type AssistKind =
  | 'pd-chua-dat' | 'pd-nang-khieu' | 'pd-kho-khan'
  | 'ht-nhom-doi' | 'ht-tro-choi' | 'ht-thi-dua' | 'ht-goc'
  | 'kd-ai-nhanh' | 'kd-truyen-dien' | 'kd-hop-qua' | 'kd-van-dong'
  | 'ch-nhan-biet' | 'ch-hieu' | 'ch-van-dung'
  | 'th-qpan' | 'th-qcn' | 'th-bvmt' | 'th-nls' | 'th-atgt' | 'th-ltcm'
  | 'sau-dieu-chinh';

export const ASSIST_GROUPS: { label: string; items: [AssistKind, string][] }[] = [
  { label: 'Phân hoá', items: [['pd-chua-dat', 'HS chưa đạt'], ['pd-nang-khieu', 'HS năng khiếu'], ['pd-kho-khan', 'HS khó khăn học tập']] },
  { label: 'Hình thức tổ chức', items: [['ht-nhom-doi', 'Nhóm đôi'], ['ht-tro-choi', 'Trò chơi'], ['ht-thi-dua', 'Thi đua tổ'], ['ht-goc', 'Góc học tập']] },
  { label: 'Khởi động 3–5 phút', items: [['kd-ai-nhanh', 'Ai nhanh hơn'], ['kd-truyen-dien', 'Truyền điện'], ['kd-hop-qua', 'Hộp quà bí mật'], ['kd-van-dong', 'Bài hát vận động']] },
  { label: 'Câu hỏi theo mức', items: [['ch-nhan-biet', 'Nhận biết'], ['ch-hieu', 'Hiểu'], ['ch-van-dung', 'Vận dụng']] },
  { label: 'Tích hợp', items: [['th-qpan', 'QP-AN'], ['th-qcn', 'QCN'], ['th-bvmt', 'BVMT'], ['th-nls', 'NLS'], ['th-atgt', 'ATGT'], ['th-ltcm', 'LTCM-ĐĐLS']] },
  { label: 'Sau bài dạy', items: [['sau-dieu-chinh', 'Viết điều chỉnh sau bài dạy']] },
];

export type Suggestion = {
  kind: AssistKind;
  title: string;
  /** hoạt động được chèn (chỉ số trong plan.activities); -1 = mục IV điều chỉnh */
  target: number;
  teacher: string[];
  student: string[];
  /** ghi chú nguồn dữ liệu (vd "lấy từ kết quả bài tập của lớp") */
  data?: string;
  /** số biến thể có thể đổi */
  variants: number;
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const pick = <T,>(list: T[], v: number) => list[((v % list.length) + list.length) % list.length];

/** Chủ đề ngắn của bài: "Bài 46: ac ăc âc - Tiết 1" → "ac ăc âc" */
export function topicOf(title: string): string {
  return title.replace(/^\s*(bài|chủ đề|unit)\s*\d+\s*[:.\-–]?\s*/i, '').replace(/\s*[-–(]\s*tiết\s*\d+\)?\s*$/i, '').replace(/\s*\(tiết\s*\d+\)\s*$/i, '').trim() || title.trim();
}
/** Các vần / âm của bài Tiếng Việt lớp 1: "ac ăc âc" → ["ac","ăc","âc"] (chỉ khi tên bài toàn từ ngắn) */
function rhymes(topic: string): string[] {
  const w = topic.split(/[\s,]+/).filter(Boolean);
  return w.length >= 1 && w.length <= 4 && w.every((x) => x.length <= 4 && /^\p{L}+$/u.test(x)) ? w : [];
}

/** Hoạt động đích theo loại gợi ý (theo mã hoạt động, không có thì theo vị trí) */
function targetOf(acts: PlanActivity[], key: ActivityKey, fallback: number): number {
  const i = acts.findIndex((a) => a.key === key || fold(a.title).includes(fold({ 'khoi-dong': 'khoi dong', 'kham-pha': 'kham pha', 'luyen-tap': 'luyen tap', 'van-dung': 'van dung' }[key])));
  return i >= 0 ? i : Math.min(Math.max(0, fallback < 0 ? acts.length + fallback : fallback), Math.max(0, acts.length - 1));
}

/** Mã tích hợp đã ghi trong giáo án (để chọn sẵn nút tích hợp) */
export function integrationKinds(text: string): AssistKind[] {
  const f = fold(text);
  const out: AssistKind[] = [];
  if (/qp\s*-?\s*an|quoc phong/.test(f)) out.push('th-qpan');
  if (/qcn|quyen con nguoi/.test(f)) out.push('th-qcn');
  if (/bvmt|moi truong/.test(f)) out.push('th-bvmt');
  if (/nls|nang luc so|thiet bi so|\bai\b/.test(f)) out.push('th-nls');
  if (/atgt|giao thong/.test(f)) out.push('th-atgt');
  if (/ltcm|ly tuong|dd\s*ls|dao duc,? loi song/.test(f)) out.push('th-ltcm');
  return out;
}

/** Sinh gợi ý cho một nút của trợ lý. v: biến thể (0, 1, 2…). active: hoạt động đang mở (để chèn hình thức tổ chức) */
export function suggest(kind: AssistKind, plan: LessonPlan, ctx: { weak: string[]; active: number; v: number }): Suggestion {
  const acts = plan.activities;
  const topic = topicOf(plan.title);
  const tv = plan.subject === 'tieng-viet', toan = plan.subject === 'toan';
  const rh = tv ? rhymes(topic) : [];
  const v = ctx.v;
  const weak = ctx.weak.filter(Boolean);
  const S = (title: string, target: number, teacher: string[], student: string[], variants: number, data?: string): Suggestion => ({ kind, title, target, teacher, student, variants, data });
  const lt = targetOf(acts, 'luyen-tap', -2), kp = targetOf(acts, 'kham-pha', 1), kd = targetOf(acts, 'khoi-dong', 0), vd = targetOf(acts, 'van-dung', -1);
  const cur = ctx.active >= 0 && ctx.active < acts.length ? ctx.active : kp;
  const what = rh.length ? `vần ${rh.join(', ')}` : toan ? `nội dung “${topic}”` : `“${topic}”`;

  switch (kind) {
    case 'pd-chua-dat': {
      const w = weak.length ? pick(weak, v) : '';
      const variants = [
        [`- Phân hoá: nhóm HS chưa đạt${w ? ` (còn sai dạng “${w}”)` : ''} làm lại cùng GV với ${rh.length ? 'thẻ chữ, đánh vần chậm từng vần' : toan ? 'que tính / đồ dùng trực quan, bài tương tự số nhỏ hơn' : 'câu hỏi gợi ý từng bước'}; HS làm tốt làm thêm ${rh.length ? 'tìm tiếng có vần vừa học' : 'bài mở rộng'}.`],
        [`- Phân hoá: GV ngồi cùng nhóm HS còn lúng túng${w ? ` ở dạng “${w}”` : ''}, hướng dẫn mẫu 1 bài rồi cho HS tự làm bài tương tự; bạn giỏi trong tổ kèm bạn.`],
        [`- Phân hoá: chia 2 mức bài tập — mức 1 (củng cố${w ? `, dạng “${w}”` : ''}) cho HS chưa đạt; mức 2 (nâng cao) cho HS đã làm xong.`],
      ];
      return S(`Phân hoá — HS chưa đạt (${acts[lt]?.title ?? 'Luyện tập'})`, lt, pick(variants, v), ['- Nhóm hỗ trợ làm bài cùng GV; HS làm tốt làm bài nâng cao.'], variants.length,
        weak.length ? `Lấy từ kết quả bài tập của lớp: dạng còn hay sai — ${weak.slice(0, 3).join('; ')}` : undefined);
    }
    case 'pd-nang-khieu': {
      const variants = [
        [`- HS năng khiếu: ${rh.length ? `tìm thêm 3–4 tiếng, từ có ${what} và đặt câu với 1 từ` : toan ? 'tự đặt đề toán tương tự rồi đố bạn' : `trình bày lại ${what} bằng lời của mình, nêu ví dụ`}.`],
        ['- HS năng khiếu làm “trợ giảng nhỏ”: kiểm tra, giúp bạn cùng bàn sau khi hoàn thành bài của mình.'],
      ];
      return S('Phân hoá — HS năng khiếu', lt, pick(variants, v), ['- HS năng khiếu làm bài mở rộng / giúp bạn.'], variants.length);
    }
    case 'pd-kho-khan': {
      const variants = [
        ['- HS khó khăn học tập: giao bài ngắn hơn, có hình minh hoạ; GV nhắc lại yêu cầu riêng, khen ngợi từng bước tiến bộ.'],
        ['- HS khó khăn học tập: ngồi gần GV, làm theo mẫu có sẵn, được dùng đồ dùng trực quan suốt hoạt động.'],
      ];
      return S('Phân hoá — HS khó khăn học tập', lt, pick(variants, v), ['- Làm bài theo mẫu, có GV hỗ trợ.'], variants.length);
    }
    case 'ht-nhom-doi':
      return S(`Nhóm đôi (${acts[cur]?.title ?? ''})`, cur, [pick([`- Tổ chức nhóm đôi: bạn A ${rh.length ? 'đọc' : 'hỏi'}, bạn B ${rh.length ? 'nghe, sửa' : 'trả lời'}, rồi đổi vai (2 phút).`, '- Nhóm đôi cùng bàn: thảo luận, thống nhất kết quả rồi chia sẻ trước lớp.'], v)], ['- Làm việc nhóm đôi, đổi vai.'], 2);
    case 'ht-tro-choi':
      return S(`Trò chơi (${acts[cur]?.title ?? ''})`, cur, [pick([
        `- Trò chơi “Ai nhanh, ai đúng”: GV đưa thẻ ${rh.length ? 'tiếng / từ' : 'câu hỏi'}, đội nào giơ bảng đúng trước được 1 điểm.`,
        `- Trò chơi “Câu cá”: HS câu thẻ ${rh.length ? `có ${what}` : 'câu hỏi'}, đọc / trả lời đúng thì được giữ thẻ.`,
        '- Trò chơi “Tiếp sức”: mỗi tổ lần lượt lên bảng làm một phần, tổ xong trước và đúng thắng.',
      ], v)], ['- Tham gia trò chơi theo đội.'], 3);
    case 'ht-thi-dua':
      return S(`Thi đua tổ (${acts[cur]?.title ?? ''})`, cur, ['- Thi đua tổ: mỗi câu trả lời đúng cộng 1 điểm cho tổ trên Bảng thi đua; tổng kết, tuyên dương tổ thắng cuối tiết.'], ['- Các tổ thi đua, cổ vũ bạn.'], 1);
    case 'ht-goc':
      return S(`Góc học tập (${acts[cur]?.title ?? ''})`, cur, [`- Chia 3 góc: góc Đọc (${rh.length ? 'thẻ chữ' : 'phiếu đọc'}), góc Làm (phiếu bài tập), góc Sáng tạo (vẽ / ghép hình); HS luân chuyển mỗi góc 4 phút.`], ['- Hoạt động theo góc, luân chuyển.'], 1);
    case 'kd-ai-nhanh':
      return S('Khởi động — Ai nhanh hơn', kd, [`- Trò chơi “Ai nhanh hơn”: GV chiếu nhanh ${rh.length ? 'các tiếng có vần đã học ở bài trước' : 'câu hỏi ôn bài cũ'}, HS giơ tay trả lời; GV dẫn vào bài “${topic}”.`], ['- Tham gia trò chơi, trả lời nhanh.'], 1);
    case 'kd-truyen-dien':
      return S('Khởi động — Truyền điện', kd, [`- Trò chơi “Truyền điện”: HS nối tiếp ${rh.length ? 'đọc từ có vần đã học' : toan ? 'nêu kết quả phép tính' : 'nêu điều đã biết về bài trước'}; bạn trả lời đúng được chỉ định bạn tiếp theo. GV giới thiệu bài mới.`], ['- Chơi truyền điện.'], 1);
    case 'kd-hop-qua':
      return S('Khởi động — Hộp quà bí mật', kd, ['- Trò chơi “Hộp quà bí mật”: chuyền hộp quà theo nhạc, nhạc dừng ở bạn nào thì bạn đó mở 1 câu hỏi ôn bài cũ; trả lời đúng nhận quà (sticker).', `- GV dẫn dắt vào bài “${topic}”.`], ['- Chuyền hộp quà, trả lời câu hỏi.'], 1);
    case 'kd-van-dong':
      return S('Khởi động — Bài hát vận động', kd, ['- Cả lớp hát và vận động theo một bài hát thiếu nhi quen thuộc (2–3 phút).', `- GV hỏi nhanh 1–2 câu liên quan, giới thiệu bài “${topic}”.`], ['- Hát, vận động theo nhạc.'], 1);
    case 'ch-nhan-biet': {
      const qs = rh.length
        ? [`Vần ${rh[0]} gồm những âm nào?`, `Tiếng nào trong các tiếng sau có vần ${pick(rh, v)}?`, `Đọc lại các vần vừa học: ${rh.join(', ')}.`]
        : toan ? [`Bài “${topic}” hôm nay học gì?`, 'Nêu lại cách làm vừa học.', 'Đọc kết quả của phép tính trên bảng.'] : [`Bài “${topic}” nói về điều gì?`, 'Em thấy những gì trong tranh?', 'Nhắc lại ý chính GV vừa nêu.'];
      return S('Câu hỏi mức Nhận biết', kp, qs.map((q) => `- Hỏi: ${q}`), ['- Trả lời cá nhân.'], 1);
    }
    case 'ch-hieu': {
      const qs = rh.length
        ? [`Vần ${rh[0]} và vần ${rh[1] ?? 'đã học'} giống, khác nhau ở điểm nào?`, `Vì sao tiếng “…” viết với vần ${pick(rh, v)}?`, 'Ghép âm đầu với vần để được tiếng mới.']
        : toan ? ['Vì sao em làm như vậy?', 'Có cách nào khác để tìm kết quả không?', 'Em kiểm tra lại kết quả bằng cách nào?'] : [`Vì sao cần ${topic.toLowerCase()}?`, 'Bạn trong tranh đã làm gì? Việc đó đúng hay chưa đúng?', 'Em hiểu câu này như thế nào?'];
      return S('Câu hỏi mức Hiểu', kp, qs.map((q) => `- Hỏi: ${q}`), ['- Thảo luận nhóm đôi, trả lời.'], 1);
    }
    case 'ch-van-dung': {
      const qs = rh.length
        ? [`Nói một câu có tiếng chứa ${pick(rh, v)}.`, `Tìm đồ vật trong lớp có tên chứa ${what}.`]
        : toan ? ['Nêu một bài toán trong thực tế có thể dùng cách tính vừa học.', 'Ở nhà, em dùng phép tính này khi nào?'] : ['Nếu gặp tình huống như trong tranh, em sẽ làm gì?', 'Kể một việc em đã làm liên quan đến bài học.'];
      return S('Câu hỏi mức Vận dụng', vd, qs.map((q) => `- Hỏi: ${q}`), ['- Liên hệ, chia sẻ trước lớp.'], 1);
    }
    case 'th-qpan':
      return S('Tích hợp Quốc phòng và an ninh', vd, [`- Tích hợp QP-AN: cho HS xem tranh chú bộ đội ${rh.length ? `(“canh gác”, “bác bộ đội”…), nói câu có tiếng chứa ${what}` : 'làm nhiệm vụ'}; giáo dục HS yêu quý, biết ơn chú bộ đội.`], ['- Quan sát tranh, nói câu / chia sẻ cảm nghĩ.'], 1);
    case 'th-qcn':
      return S('Tích hợp Quyền con người', vd, [pick(['- Tích hợp QCN: giúp HS biết trẻ em có quyền được học tập, vui chơi, được yêu thương chăm sóc; nhắc HS tôn trọng quyền của bạn.', '- Tích hợp QCN: qua tình huống, HS nhận biết quyền được bày tỏ ý kiến và bổn phận lắng nghe người khác.'], v)], ['- Chia sẻ điều mình biết về quyền trẻ em.'], 2);
    case 'th-bvmt':
      return S('Tích hợp Bảo vệ môi trường', vd, ['- Tích hợp BVMT: liên hệ giữ gìn lớp học, sân trường sạch đẹp; bỏ rác đúng nơi quy định, tiết kiệm giấy, nước.'], ['- Nêu việc làm bảo vệ môi trường.'], 1);
    case 'th-nls':
      return S('Tích hợp Năng lực số', vd, ['- Tích hợp NLS: HS quan sát / thao tác cùng GV trên thiết bị số (chọn đáp án, kéo thả); nhắc HS không chia sẻ thông tin cá nhân khi dùng thiết bị số.'], ['- Thao tác theo hướng dẫn trên thiết bị.'], 1);
    case 'th-atgt':
      return S('Tích hợp An toàn giao thông', vd, ['- Tích hợp ATGT: nhắc HS đội mũ bảo hiểm khi ngồi sau xe máy, đi bộ sát lề bên phải, qua đường có người lớn dắt.'], ['- Nêu cách đi đường an toàn.'], 1);
    case 'th-ltcm':
      return S('Tích hợp Lý tưởng cách mạng, đạo đức, lối sống', vd, [pick(['- Tích hợp LTCM-ĐĐLS: giáo dục HS biết yêu thương, kính trọng ông bà, cha mẹ, thầy cô; làm việc tốt phù hợp lứa tuổi.', '- Tích hợp LTCM-ĐĐLS: liên hệ thực hiện Năm điều Bác Hồ dạy thiếu niên, nhi đồng.'], v)], ['- Liên hệ bản thân, chia sẻ.'], 2);
    case 'sau-dieu-chinh': {
      const w = weak.length ? ` HS còn sai dạng “${weak[0]}” → tiết sau luyện thêm.` : '';
      const variants = [
        `- Tiết học đạt yêu cầu; đa số HS ${rh.length ? `đọc, viết được ${what}` : `nắm được ${what}`}.${w}\n- Cần điều chỉnh: tăng thời gian luyện tập, giảm thời gian khám phá.`,
        `- Một số HS còn chậm ở phần ${acts[lt]?.title.replace(/^\d+\.\s*/, '').toLowerCase() ?? 'luyện tập'}; tiết sau dành 5 phút kèm riêng.${w}\n- Trò chơi khởi động hiệu quả, giữ lại.`,
      ];
      return S('Điều chỉnh sau bài dạy (mục IV)', -1, [pick(variants, v)], [], variants.length, weak.length ? 'Dựa trên dạng bài lớp còn hay sai' : undefined);
    }
  }
}

/** Chèn gợi ý vào giáo án (nối thêm dòng vào cuối hoạt động / mục IV) */
export function applySuggestion(plan: LessonPlan, s: Suggestion): LessonPlan {
  const add = (old: string, lines: string[]) => [old.trim(), ...lines].filter(Boolean).join('\n');
  if (s.target < 0) return { ...plan, adjust: add(plan.adjust, s.teacher) };
  return { ...plan, activities: plan.activities.map((a, i) => (i === s.target ? { ...a, teacher: add(a.teacher, s.teacher), student: add(a.student, s.student) } : a)) };
}

/** Bỏ đoạn vừa chèn (hoàn tác riêng gợi ý này, không đụng các sửa khác) */
export function removeSuggestion(plan: LessonPlan, s: Suggestion): LessonPlan {
  const drop = (text: string, lines: string[]) => {
    let out = text;
    for (const l of lines) { const k = out.lastIndexOf(l); if (k >= 0) out = (out.slice(0, k) + out.slice(k + l.length)).replace(/\n{2,}/g, '\n').trim(); }
    return out;
  };
  if (s.target < 0) return { ...plan, adjust: drop(plan.adjust, s.teacher) };
  return { ...plan, activities: plan.activities.map((a, i) => (i === s.target ? { ...a, teacher: drop(a.teacher, s.teacher), student: drop(a.student, s.student) } : a)) };
}
