// Ngân hàng câu chèn thêm vào giáo án có sẵn của giáo viên ("Bổ sung giáo án cũ"), theo từng hoạt động:
//   - Tích hợp năng lực số: theo các miền của Khung năng lực số cho người học (Thông tư 02/2025/TT-BGDĐT),
//     mức phù hợp học sinh tiểu học — luôn có giáo viên hướng dẫn, thiết bị của lớp, nội dung an toàn;
//   - Hỗ trợ học sinh hoà nhập (học sinh khuyết tật học hoà nhập): cách hỗ trợ trong chính hoạt động đó;
//   - Phân hoá: việc cho em cần hỗ trợ / em hoàn thành tốt.
// Câu do app tự soạn, viết chung cho mọi bài; giáo viên đọc lại, sửa cho đúng bài và lớp mình. Không dùng AI.
import type { ActivityKey, PlanSubject } from './generate';

export type AugmentKind = 'nls' | 'hoa-nhap' | 'phan-hoa';
export const AUGMENT_LABEL: Record<AugmentKind, string> = {
  nls: 'Tích hợp năng lực số',
  'hoa-nhap': 'Hỗ trợ học sinh hoà nhập',
  'phan-hoa': 'Phân hoá',
};

/** Miền năng lực số (Thông tư 02/2025/TT-BGDĐT) gắn với từng câu */
type Nls = { mien: string; text: string };
const M1 = 'Khai thác dữ liệu và thông tin';
const M2 = 'Giao tiếp và hợp tác trong môi trường số';
const M3 = 'Sáng tạo nội dung số';
const M4 = 'An toàn';
const M5 = 'Giải quyết vấn đề';

const NLS: Record<ActivityKey, Nls[]> = {
  'khoi-dong': [
    { mien: M1, text: 'GV trình chiếu tranh / video ngắn (1–2 phút) liên quan đến bài; HS quan sát, nói điều em nhìn thấy, nghe thấy trên màn hình.' },
    { mien: M5, text: 'GV tổ chức trò chơi khởi động trên màn hình (câu hỏi nhanh, vòng quay gọi tên); HS chọn đáp án bằng thẻ hoặc giơ tay, quan sát kết quả hiện trên màn hình.' },
    { mien: M2, text: 'GV chiếu bảng câu hỏi chung của lớp; HS lần lượt trả lời, cả lớp cùng theo dõi câu trả lời hiện trên màn hình và nhận xét lịch sự.' },
  ],
  'kham-pha': [
    { mien: M1, text: 'GV dùng hình ảnh, mô phỏng hoặc video minh hoạ trên máy chiếu để giới thiệu nội dung mới; HS quan sát, tìm thông tin cần thiết trên màn hình theo câu hỏi gợi ý của GV.' },
    { mien: M1, text: 'GV hướng dẫn HS xem và đọc thông tin từ một nguồn số an toàn GV đã chọn sẵn (trang sách điện tử, học liệu số); HS nêu thông tin tìm được.' },
    { mien: M5, text: 'GV dùng bảng tương tác / phần mềm trình chiếu để HS kéo – thả, sắp xếp, ghép đôi khi khám phá kiến thức; HS giải thích vì sao chọn như vậy.' },
  ],
  'luyen-tap': [
    { mien: M5, text: 'HS luyện tập trên ứng dụng học tập của lớp (máy tính / máy tính bảng) với bài tập GV giao; ứng dụng báo đúng – sai ngay để HS tự sửa; GV theo dõi kết quả để hỗ trợ kịp thời.' },
    { mien: M2, text: 'HS làm việc nhóm, chụp ảnh / quay ngắn sản phẩm bằng thiết bị của lớp và chia sẻ lên màn hình chung để cả lớp nhận xét, góp ý.' },
    { mien: M1, text: 'GV chiếu bài làm của một số HS (chụp bằng máy soi / điện thoại của GV) để cả lớp cùng đối chiếu, chữa bài.' },
  ],
  'van-dung': [
    { mien: M3, text: 'HS tạo một sản phẩm số đơn giản dưới sự hướng dẫn của GV (vẽ tranh trên máy, ghi âm lời giới thiệu, chụp ảnh sản phẩm) và giới thiệu với bạn.' },
    { mien: M4, text: 'GV nhắc HS cách dùng thiết bị số an toàn: chỉ xem nội dung thầy cô, bố mẹ cho phép; không chia sẻ thông tin cá nhân; nghỉ mắt sau khoảng 20 phút dùng máy.' },
    { mien: M2, text: 'GV giao bài luyện thêm ở nhà trên ứng dụng học tập; HS làm cùng phụ huynh, GV xem kết quả để nhận xét ở tiết sau.' },
  ],
};

/** Thêm vài câu theo môn (Khám phá / Luyện tập) */
const NLS_SUBJECT: Partial<Record<PlanSubject, Partial<Record<ActivityKey, Nls[]>>>> = {
  toan: {
    'kham-pha': [{ mien: M1, text: 'GV dùng hình vẽ động / mô hình trên màn hình (xếp que tính, chia nhóm đồ vật, ghép hình) để HS quan sát cách làm rồi tự thao tác lại với đồ dùng.' }],
    'luyen-tap': [{ mien: M5, text: 'HS làm bài tập tính, giải toán trên ứng dụng học tập; với câu sai, HS xem gợi ý từng bước rồi làm lại.' }],
  },
  'tieng-viet': {
    'kham-pha': [{ mien: M1, text: 'HS nghe bài đọc mẫu (file âm thanh / video) để nhận biết cách ngắt nghỉ, giọng đọc trước khi luyện đọc.' }],
    'luyen-tap': [{ mien: M3, text: 'HS ghi âm giọng đọc của mình bằng thiết bị của lớp, nghe lại và tự nhận xét tốc độ, ngắt nghỉ; bạn cùng nhóm góp ý.' }],
  },
  'tieng-anh': {
    'kham-pha': [{ mien: M1, text: 'HS nghe file âm thanh / xem video ngắn của bài để nhận biết từ, mẫu câu mới; nhắc lại theo băng.' }],
    'luyen-tap': [{ mien: M3, text: 'HS luyện nói theo cặp và ghi âm đoạn hội thoại ngắn; cả lớp nghe lại một vài đoạn và nhận xét phát âm.' }],
  },
};

const HOA_NHAP: Record<ActivityKey, string[]> = {
  'khoi-dong': [
    'GV xếp HS hoà nhập ngồi gần GV, gần bạn hỗ trợ; dùng tranh, đồ vật thật để HS cùng tham gia trò chơi; cho HS trả lời bằng cách chỉ, chọn thẻ thay cho nói.',
    'GV giao HS hoà nhập một nhiệm vụ vừa sức trong trò chơi (cầm thẻ, giơ biển); khen ngợi ngay khi HS tham gia.',
  ],
  'kham-pha': [
    'GV chia nhỏ yêu cầu thành từng bước ngắn, làm mẫu chậm, kết hợp lời nói với tranh / đồ dùng trực quan; hỏi câu hỏi có lựa chọn ("A hay B?") để HS hoà nhập trả lời được.',
    'GV giao bạn cùng bàn hỗ trợ HS hoà nhập; GV đến kiểm tra, nhắc lại yêu cầu riêng cho HS và ghi nhận phần HS làm được.',
  ],
  'luyen-tap': [
    'HS hoà nhập làm số bài ít hơn hoặc bài tương tự ở mức đơn giản, có gợi ý sẵn (mẫu, tranh, chữ to); GV cho thêm thời gian và không yêu cầu làm hết.',
    'GV chuẩn bị phiếu riêng cho HS hoà nhập (ít câu, có hình minh hoạ, chữ to); khen từng câu làm đúng để HS tự tin.',
  ],
  'van-dung': [
    'GV giao HS hoà nhập nhiệm vụ vận dụng gắn với việc quen thuộc hằng ngày; cho HS trình bày bằng cách chỉ, kể ngắn hoặc làm thao tác; ghi nhận sự tiến bộ của HS.',
    'GV trao đổi với phụ huynh về nội dung HS hoà nhập cần luyện thêm ở nhà, đơn giản và vừa sức.',
  ],
};

const PHAN_HOA: Record<ActivityKey, string[]> = {
  'khoi-dong': [
    'Câu hỏi khởi động có 2 mức: câu nhắc lại kiến thức cũ cho HS cần hỗ trợ; câu "vì sao" cho HS hoàn thành tốt.',
  ],
  'kham-pha': [
    'HS cần hỗ trợ: làm theo mẫu của GV, có đồ dùng trực quan. HS hoàn thành tốt: tự nêu cách làm khác, giải thích cho bạn.',
    'GV hỏi lại HS cần hỗ trợ sau khi giảng; HS hoàn thành tốt làm "trợ giảng nhỏ" hỗ trợ bạn trong nhóm.',
  ],
  'luyen-tap': [
    'Bài tập chia mức: mức cơ bản cho mọi HS; bài thêm (khó hơn, có tình huống mới) cho HS làm xong sớm; HS cần hỗ trợ làm bài cơ bản có gợi ý.',
    'HS cần hỗ trợ làm cùng GV / bạn hỗ trợ; HS hoàn thành tốt tự đặt một bài tương tự rồi đổi cho bạn giải.',
  ],
  'van-dung': [
    'HS hoàn thành tốt: tìm thêm ví dụ trong cuộc sống, trình bày trước lớp; HS cần hỗ trợ: nêu một ví dụ có gợi ý của GV.',
  ],
};

const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

export type AugmentLine = { kind: AugmentKind; label: string; text: string };

/** Các dòng chèn vào cuối một hoạt động. seed: để mỗi hoạt động / mỗi bài nhận phương án khác nhau */
export function augmentLines(key: ActivityKey, subject: PlanSubject | null, kinds: AugmentKind[], seed: number): AugmentLine[] {
  const out: AugmentLine[] = [];
  if (kinds.includes('nls')) {
    const pool = [...NLS[key], ...((subject && NLS_SUBJECT[subject]?.[key]) ?? [])];
    const n = pick(pool, seed);
    out.push({ kind: 'nls', label: `${AUGMENT_LABEL.nls} (${n.mien})`, text: n.text });
  }
  if (kinds.includes('hoa-nhap')) out.push({ kind: 'hoa-nhap', label: AUGMENT_LABEL['hoa-nhap'], text: pick(HOA_NHAP[key], seed >> 1) });
  if (kinds.includes('phan-hoa')) out.push({ kind: 'phan-hoa', label: AUGMENT_LABEL['phan-hoa'], text: pick(PHAN_HOA[key], seed >> 2) });
  return out;
}
