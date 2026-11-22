// Tự sinh nội dung văn bản theo loại (NĐ30) từ vài thông tin chính — theo quy tắc, không cần AI / mạng.
// Văn phong: câu ngắn, đủ ý, đúng ngữ cảnh từng loại; ô nào bỏ trống thì bỏ câu đó (không để lại [ … ]).
import type { DocKind } from './nd30';

export type FieldKey = 'what' | 'when' | 'where' | 'who' | 'purpose' | 'items' | 'issues' | 'req' | 'basis';
export type Field = { key: FieldKey; label: string; placeholder: string; wide?: boolean };
export type Facts = Partial<Record<FieldKey, string>>;

/** Các ô "Thông tin chính" của từng loại văn bản */
export const FIELDS: Record<DocKind, Field[]> = {
  'thong-bao': [
    { key: 'what', label: 'Thông báo về việc', placeholder: 'tổ chức họp phụ huynh đầu năm', wide: true },
    { key: 'when', label: 'Thời gian', placeholder: '7 giờ 30, Chủ nhật 15/9/2026' },
    { key: 'where', label: 'Địa điểm', placeholder: 'Phòng học lớp 1A1' },
    { key: 'who', label: 'Đối tượng', placeholder: 'phụ huynh học sinh lớp 1A1' },
    { key: 'req', label: 'Đề nghị / lưu ý', placeholder: 'đến đúng giờ, mang theo sổ liên lạc' },
  ],
  'ke-hoach': [
    { key: 'what', label: 'Kế hoạch', placeholder: 'tổ chức Ngày hội đọc sách', wide: true },
    { key: 'purpose', label: 'Mục đích', placeholder: 'khơi dậy niềm yêu thích đọc sách cho học sinh', wide: true },
    { key: 'when', label: 'Thời gian', placeholder: 'từ 21/4 đến 25/4/2026' },
    { key: 'where', label: 'Địa điểm', placeholder: 'thư viện trường' },
    { key: 'items', label: 'Nội dung chính (cách nhau dấu ;)', placeholder: 'trưng bày sách; thi kể chuyện; đổi sách cũ', wide: true },
    { key: 'who', label: 'Người phụ trách', placeholder: 'GVCN lớp 1A1 và Ban đại diện CMHS' },
  ],
  'bao-cao': [
    { key: 'what', label: 'Báo cáo về', placeholder: 'kết quả học tập học kỳ I', wide: true },
    { key: 'when', label: 'Kỳ / thời gian', placeholder: 'học kỳ I năm học 2026–2027' },
    { key: 'basis', label: 'Căn cứ (nếu có)', placeholder: 'Kế hoạch số 12/KH-THTĐ' },
    { key: 'items', label: 'Kết quả đạt được (cách nhau dấu ;)', placeholder: '30/32 em hoàn thành tốt môn Toán; lớp đạt giải Nhì văn nghệ', wide: true },
    { key: 'issues', label: 'Tồn tại, hạn chế', placeholder: '2 em đọc còn chậm', wide: true },
    { key: 'req', label: 'Đề xuất, phương hướng', placeholder: 'tăng cường kèm cặp đầu giờ', wide: true },
  ],
  'bien-ban': [
    { key: 'what', label: 'Biên bản', placeholder: 'họp phụ huynh đầu năm học', wide: true },
    { key: 'when', label: 'Thời gian', placeholder: '7 giờ 30, ngày 15/9/2026' },
    { key: 'where', label: 'Địa điểm', placeholder: 'Phòng học lớp 1A1' },
    { key: 'who', label: 'Thành phần', placeholder: 'GVCN, 30/32 phụ huynh', wide: true },
    { key: 'items', label: 'Nội dung đã bàn (cách nhau dấu ;)', placeholder: 'kế hoạch năm học; bầu Ban đại diện CMHS', wide: true },
    { key: 'req', label: 'Kết luận', placeholder: 'thống nhất kế hoạch, bầu 3 thành viên Ban đại diện', wide: true },
  ],
  'giay-moi': [
    { key: 'what', label: 'Mời dự', placeholder: 'họp phụ huynh đầu năm học', wide: true },
    { key: 'who', label: 'Người được mời', placeholder: 'Quý phụ huynh học sinh lớp 1A1' },
    { key: 'when', label: 'Thời gian', placeholder: '7 giờ 30, Chủ nhật 15/9/2026' },
    { key: 'where', label: 'Địa điểm', placeholder: 'Phòng học lớp 1A1' },
    { key: 'items', label: 'Nội dung (cách nhau dấu ;)', placeholder: 'thông qua kế hoạch năm học; bầu Ban đại diện', wide: true },
  ],
  'to-trinh': [
    { key: 'what', label: 'Đề nghị', placeholder: 'mua bổ sung 10 bộ bàn ghế học sinh', wide: true },
    { key: 'purpose', label: 'Lý do', placeholder: 'bàn ghế cũ hư hỏng, không đảm bảo an toàn', wide: true },
    { key: 'req', label: 'Kinh phí / nguồn (nếu có)', placeholder: '12.000.000 đồng từ nguồn chi thường xuyên', wide: true },
    { key: 'who', label: 'Người phê duyệt', placeholder: 'Hiệu trưởng' },
  ],
  don: [
    { key: 'when', label: 'Nghỉ từ ngày – đến ngày', placeholder: 'từ 20/11 đến hết 22/11/2026 (3 ngày)', wide: true },
    { key: 'purpose', label: 'Lý do', placeholder: 'giải quyết việc gia đình', wide: true },
    { key: 'who', label: 'Người nhận bàn giao', placeholder: 'cô Trần Thị Hoa, GV lớp 1A2' },
  ],
};

const t = (s?: string) => (s ?? '').trim().replace(/[.;,\s]+$/, '');
const cap = (s: string) => (s ? s[0].toLocaleUpperCase('vi') + s.slice(1) : s);
const low = (s: string) => (s ? s[0].toLocaleLowerCase('vi') + s.slice(1) : s);
const list = (s?: string) => (s ?? '').split(/[;\n]+/).map((x) => t(x)).filter(Boolean);

export type Composed = { subject: string; to?: string; body: string };

/** Tên đơn vị in hoa (dòng đầu văn bản) → cách viết trong câu: "TRƯỜNG TIỂU HỌC TÂN ĐỊNH" → "Trường Tiểu học Tân Định" */
export function unitName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s || s !== s.toLocaleUpperCase('vi')) return s;
  return s.toLocaleLowerCase('vi').replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase('vi'))
    .replace(/Tiểu Học/g, 'Tiểu học').replace(/Trung Học Cơ Sở/g, 'Trung học cơ sở').replace(/Trung Học Phổ Thông/g, 'Trung học phổ thông')
    .replace(/Mầm Non/g, 'Mầm non').replace(/^Ubnd /, 'UBND ');
}

/**
 * Sinh trích yếu + nội dung. ctx: tên đơn vị / lớp, họ tên và chức vụ người viết (dùng cho đơn, tờ trình).
 * Kết thúc văn bản bằng "./." theo NĐ30.
 */
export function compose(kind: DocKind, f: Facts, ctx: { unit: string; className: string; signer: string; role: string }): Composed {
  const what = t(f.what), when = t(f.when), where = t(f.where), who = t(f.who), purpose = t(f.purpose), req = t(f.req), basis = t(f.basis), issues = t(f.issues);
  const items = list(f.items);
  const unit = unitName(ctx.unit) || `Lớp ${ctx.className}`;
  const L: string[] = [];
  switch (kind) {
    case 'thong-bao': {
      L.push(`${unit} thông báo ${what ? low(what) : 'nội dung'} như sau:`);
      let n = 0;
      if (when) L.push(`${++n}. Thời gian: ${when}.`);
      if (where) L.push(`${++n}. Địa điểm: ${where}.`);
      if (who) L.push(`${++n}. Đối tượng: ${who}.`);
      if (req) L.push(`Đề nghị ${who ? low(who) : 'các cá nhân có liên quan'} ${low(req)}.`);
      L.push(`Trân trọng thông báo./.`);
      return { subject: what ? `Về việc ${low(what)}` : '', body: L.join('\n') };
    }
    case 'ke-hoach': {
      L.push('I. MỤC ĐÍCH, YÊU CẦU');
      L.push(purpose ? `- ${cap(purpose)}.` : `- Tổ chức ${what ? low(what) : 'hoạt động'} đạt hiệu quả, an toàn, thiết thực.`);
      L.push('- Huy động sự tham gia tích cực của học sinh, phối hợp chặt chẽ với cha mẹ học sinh.');
      L.push('II. THỜI GIAN, ĐỊA ĐIỂM');
      if (when) L.push(`- Thời gian: ${when}.`);
      if (where) L.push(`- Địa điểm: ${where}.`);
      L.push('III. NỘI DUNG');
      (items.length ? items : ['nội dung chính của hoạt động']).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      L.push('IV. TỔ CHỨC THỰC HIỆN');
      L.push(who ? `- ${cap(who)} chịu trách nhiệm triển khai, theo dõi và báo cáo kết quả.` : '- Giáo viên chủ nhiệm triển khai, theo dõi và báo cáo kết quả.');
      L.push(`Trên đây là kế hoạch ${what ? low(what) : 'thực hiện'}. Trong quá trình thực hiện, nếu có vướng mắc sẽ kịp thời báo cáo để điều chỉnh./.`);
      return { subject: what ? cap(what) : '', body: L.join('\n') };
    }
    case 'bao-cao': {
      L.push(`${basis ? `Thực hiện ${basis}, ` : ''}${unit} báo cáo ${what ? low(what) : 'kết quả'}${when ? ` ${when}` : ''} như sau:`);
      L.push('I. KẾT QUẢ ĐẠT ĐƯỢC');
      (items.length ? items : ['kết quả chính']).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      if (issues) { L.push('II. TỒN TẠI, HẠN CHẾ'); list(issues).forEach((x) => L.push(`- ${cap(x)}.`)); }
      if (req) { L.push(`${issues ? 'III' : 'II'}. PHƯƠNG HƯỚNG, ĐỀ XUẤT`); list(req).forEach((x) => L.push(`- ${cap(x)}.`)); }
      L.push(`Trên đây là báo cáo ${what ? low(what) : 'kết quả'} của ${unit}./.`);
      return { subject: what ? cap(what) : '', body: L.join('\n') };
    }
    case 'bien-ban': {
      if (when) L.push(`Thời gian: ${when}.`);
      if (where) L.push(`Địa điểm: ${where}.`);
      L.push(`Thành phần: ${who || '…'}.`);
      L.push(`Chủ trì: ${ctx.signer.trim() || '…'}${ctx.role.trim() ? ` – ${low(ctx.role.trim())}` : ''}.`);
      L.push('Nội dung:');
      (items.length ? items : ['nội dung cuộc họp']).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      L.push('Kết luận:');
      L.push(`- ${req ? cap(req) : 'Các thành viên thống nhất với các nội dung trên'}.`);
      L.push('Buổi họp kết thúc lúc … giờ … cùng ngày. Biên bản đã được đọc lại cho các thành viên cùng nghe và thống nhất thông qua./.');
      return { subject: what ? cap(what) : '', body: L.join('\n') };
    }
    case 'giay-moi': {
      L.push(`${unit} trân trọng kính mời ${who ? who : 'Quý vị'} đến dự ${what ? low(what) : 'buổi làm việc'}.`);
      if (when) L.push(`Thời gian: ${when}.`);
      if (where) L.push(`Địa điểm: ${where}.`);
      if (items.length) L.push(`Nội dung: ${items.map(low).join('; ')}.`);
      L.push('Rất mong Quý vị sắp xếp thời gian đến dự đầy đủ, đúng giờ./.');
      return { subject: what ? `Dự ${low(what)}` : '', to: who || undefined, body: L.join('\n') };
    }
    case 'to-trinh': {
      // chức danh người phê duyệt giữ viết hoa (Hiệu trưởng, Ban giám hiệu…)
      const boss = who ? cap(who) : 'Hiệu trưởng';
      L.push('Căn cứ tình hình thực tế của đơn vị;');
      L.push(`${unit} kính trình ${boss} xem xét việc ${what ? low(what) : 'đề nghị dưới đây'}, cụ thể như sau:`);
      if (purpose) L.push(`1. Lý do: ${cap(purpose)}.`);
      L.push(`${purpose ? 2 : 1}. Nội dung đề nghị: ${what ? cap(what) : '…'}.`);
      if (req) L.push(`${purpose ? 3 : 2}. Kinh phí dự kiến: ${req}.`);
      L.push(`Kính trình ${boss} xem xét, phê duyệt./.`);
      return { subject: what ? `Về việc đề nghị ${low(what)}` : '', to: who ? cap(who) : undefined, body: L.join('\n') };
    }
    case 'don': {
      L.push(`Tôi tên là: ${ctx.signer.trim() || '…'}.`);
      L.push(`Chức vụ: ${ctx.role.trim() ? `${ctx.role.trim()}${ctx.className ? ` lớp ${ctx.className}` : ''}` : '…'}.`);
      L.push(`Nay tôi làm đơn này kính đề nghị Hiệu trưởng cho tôi được nghỉ phép ${when ? when : '…'}.`);
      L.push(`Lý do: ${purpose ? low(purpose) : '…'}.`);
      if (who) L.push(`Trong thời gian nghỉ, tôi đã bàn giao công việc cho ${who}.`);
      L.push('Tôi xin hứa sẽ đi làm lại đúng thời hạn. Kính mong Hiệu trưởng xem xét, chấp thuận./.');
      return { subject: '', body: L.join('\n') };
    }
  }
}
