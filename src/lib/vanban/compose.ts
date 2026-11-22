// Tự sinh nội dung văn bản theo loại (NĐ30) từ vài thông tin chính — theo quy tắc, không cần AI / mạng.
// Văn phong: câu ngắn, đủ ý, đúng ngữ cảnh từng loại; ô nào bỏ trống thì bỏ câu đó (không để lại [ … ]).
import type { DocKind } from './nd30';

export type FieldKey = 'what' | 'when' | 'where' | 'who' | 'purpose' | 'items' | 'issues' | 'req' | 'basis';
export type Field = { key: FieldKey; label: string; placeholder: string; wide?: boolean; extra?: boolean };
export type Facts = Partial<Record<FieldKey, string>>;

const WHEN_WHERE = 'Thời gian & địa điểm';
/**
 * Các ô của từng loại văn bản: chỉ 2–3 ô chính hiện sẵn; ô `extra` nằm trong "Thêm chi tiết (không bắt buộc)".
 * Ô "Thời gian & địa điểm" gõ tự nhiên: "7 giờ 30, Chủ nhật 15/9 tại phòng học lớp 1A1" — tự tách ở chữ "tại".
 */
export const FIELDS: Record<DocKind, Field[]> = {
  'thong-bao': [
    { key: 'what', label: 'Thông báo về việc', placeholder: 'tổ chức họp phụ huynh đầu năm', wide: true },
    { key: 'when', label: WHEN_WHERE, placeholder: '7 giờ 30, Chủ nhật 15/9/2026 tại phòng học lớp 1A1', wide: true },
    { key: 'purpose', label: 'Mục đích', placeholder: 'tạo sân chơi lành mạnh, rèn luyện sức khoẻ cho học sinh', extra: true },
    { key: 'who', label: 'Đối tượng', placeholder: 'phụ huynh học sinh lớp 1A1', extra: true },
    { key: 'req', label: 'Đề nghị / lưu ý', placeholder: 'đến đúng giờ, mang theo sổ liên lạc', extra: true },
  ],
  'ke-hoach': [
    { key: 'what', label: 'Kế hoạch', placeholder: 'tổ chức Ngày hội đọc sách', wide: true },
    { key: 'items', label: 'Các việc chính (cách nhau dấu ;)', placeholder: 'trưng bày sách; thi kể chuyện; đổi sách cũ', wide: true },
    { key: 'when', label: WHEN_WHERE, placeholder: 'từ 21/4 đến 25/4/2026 tại thư viện trường', wide: true },
    { key: 'purpose', label: 'Mục đích', placeholder: 'khơi dậy niềm yêu thích đọc sách', extra: true },
    { key: 'who', label: 'Người phụ trách', placeholder: 'GVCN và Ban đại diện CMHS', extra: true },
  ],
  'bao-cao': [
    { key: 'what', label: 'Báo cáo về', placeholder: 'kết quả học tập học kỳ I năm học 2026–2027', wide: true },
    { key: 'items', label: 'Kết quả đạt được (cách nhau dấu ;)', placeholder: '30/32 em hoàn thành tốt môn Toán; lớp đạt giải Nhì văn nghệ', wide: true },
    { key: 'issues', label: 'Tồn tại, hạn chế', placeholder: '2 em đọc còn chậm', extra: true },
    { key: 'req', label: 'Đề xuất', placeholder: 'tăng cường kèm cặp đầu giờ', extra: true },
    { key: 'basis', label: 'Căn cứ', placeholder: 'Kế hoạch số 12/KH-THTĐ', extra: true },
  ],
  'bien-ban': [
    { key: 'what', label: 'Biên bản', placeholder: 'họp phụ huynh đầu năm học', wide: true },
    { key: 'when', label: WHEN_WHERE, placeholder: '7 giờ 30, ngày 15/9/2026 tại phòng học lớp 1A1', wide: true },
    { key: 'items', label: 'Nội dung đã bàn (cách nhau dấu ;)', placeholder: 'kế hoạch năm học; bầu Ban đại diện CMHS', wide: true },
    { key: 'who', label: 'Thành phần', placeholder: 'GVCN, 30/32 phụ huynh', extra: true },
    { key: 'req', label: 'Kết luận', placeholder: 'thống nhất kế hoạch, bầu 3 thành viên Ban đại diện', extra: true },
  ],
  'giay-moi': [
    { key: 'what', label: 'Mời dự', placeholder: 'họp phụ huynh đầu năm học', wide: true },
    { key: 'when', label: WHEN_WHERE, placeholder: '7 giờ 30, Chủ nhật 15/9/2026 tại phòng học lớp 1A1', wide: true },
    { key: 'who', label: 'Người được mời', placeholder: 'Quý phụ huynh học sinh lớp 1A1', extra: true },
    { key: 'items', label: 'Nội dung (cách nhau dấu ;)', placeholder: 'thông qua kế hoạch năm học; bầu Ban đại diện', extra: true },
    { key: 'purpose', label: 'Mục đích', placeholder: 'trao đổi, thống nhất kế hoạch phối hợp giáo dục', extra: true },
  ],
  'to-trinh': [
    { key: 'what', label: 'Đề nghị', placeholder: 'mua bổ sung 10 bộ bàn ghế học sinh', wide: true },
    { key: 'purpose', label: 'Lý do', placeholder: 'bàn ghế cũ hư hỏng, không đảm bảo an toàn', wide: true },
    { key: 'req', label: 'Kinh phí dự kiến', placeholder: '12.000.000 đồng', extra: true },
    { key: 'who', label: 'Người phê duyệt', placeholder: 'Hiệu trưởng', extra: true },
  ],
  don: [
    { key: 'when', label: 'Nghỉ ngày nào', placeholder: 'từ 20/11 đến hết 22/11/2026 (3 ngày)', wide: true },
    { key: 'purpose', label: 'Lý do', placeholder: 'giải quyết việc gia đình', wide: true },
    { key: 'who', label: 'Người nhận bàn giao', placeholder: 'cô Trần Thị Hoa, GV lớp 1A2', extra: true },
  ],
};

/** "7 giờ 30, Chủ nhật 15/9 tại phòng học lớp 1A1" → thời gian + địa điểm (tách ở chữ "tại" cuối cùng) */
export function splitWhenWhere(s: string): { when: string; where: string } {
  const m = /^(.*\S)\s*,?\s+tại\s+(.+)$/i.exec(s.trim());
  return m ? { when: m[1].replace(/,$/, ''), where: m[2] } : { when: s.trim(), where: '' };
}

const t = (s?: string) => (s ?? '').trim().replace(/[.;,\s]+$/, '');
const cap = (s: string) => (s ? s[0].toLocaleUpperCase('vi') + s.slice(1) : s);
const low = (s: string) => (s ? s[0].toLocaleLowerCase('vi') + s.slice(1) : s);
const list = (s?: string) => (s ?? '').split(/[;\n]+/).map((x) => t(x)).filter(Boolean);

export type Composed = { subject: string; to?: string; body: string };


/** Tên riêng (tên trường, địa danh) gõ toàn chữ thường hoặc toàn IN HOA → viết hoa đúng:
 *  "trường tiểu học tôn đức thắng" / "TRƯỜNG TIỂU HỌC TÔN ĐỨC THẮNG" → "Trường Tiểu học Tôn Đức Thắng"; gõ đúng sẵn thì giữ nguyên */
export function unitName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s || (s !== s.toLocaleUpperCase('vi') && s !== s.toLocaleLowerCase('vi'))) return s;
  return s.toLocaleLowerCase('vi').replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase('vi'))
    .replace(/Tiểu Học/g, 'Tiểu học').replace(/Trung Học Cơ Sở/g, 'Trung học cơ sở').replace(/Trung Học Phổ Thông/g, 'Trung học phổ thông')
    .replace(/Mầm Non/g, 'Mầm non').replace(/^Ubnd /, 'UBND ');
}

/** Năm học theo ngày văn bản: từ tháng 8 sang năm học mới (vd 22/11/2026 → "2026–2027") */
function schoolYearOf(iso: string) {
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return '';
  const a = m >= 8 ? y : y - 1;
  return `${a}–${a + 1}`;
}

/**
 * Sinh trích yếu + nội dung đúng bố cục văn bản hành chính. Chỉ thêm câu chung, đúng thể thức (căn cứ, mục đích,
 * tổ chức thực hiện…) — không bịa số liệu. ctx: tên đơn vị, lớp, người ký, chức vụ, ngày văn bản (để ghi năm học).
 * Kết thúc bằng "./." theo NĐ30.
 */
export function compose(kind: DocKind, f: Facts, ctx: { unit: string; className: string; signer: string; role: string; date?: string }): Composed {
  const ww = kind === 'don' ? { when: t(f.when), where: '' } : splitWhenWhere(t(f.when));
  const what = t(f.what), when = ww.when, where = cap(t(f.where) || ww.where), who = t(f.who), purpose = t(f.purpose), req = t(f.req), basis = t(f.basis), issues = t(f.issues);
  const items = list(f.items);
  const isClass = !ctx.unit.trim();
  const unit = unitName(ctx.unit) || `Lớp ${ctx.className}`;
  const year = schoolYearOf(ctx.date ?? '');
  const plan = `Kế hoạch giáo dục năm học${year ? ` ${year}` : ''}${isClass ? ' của nhà trường' : ` của ${unit}`}`;
  const W = what ? low(what) : '';
  // "tổ chức thi đua…" đã có động từ; "họp phụ huynh…" thì thêm "tổ chức"
  const act = /^(tổ chức|thực hiện|triển khai|phát động|tham gia)\s/i.test(W) ? W : `tổ chức ${W || 'hoạt động'}`;
  const L: string[] = [];
  switch (kind) {
    case 'thong-bao': {
      L.push(`Căn cứ ${plan};`);
      L.push(`Nhằm ${purpose ? low(purpose) : 'triển khai thực hiện tốt các hoạt động giáo dục theo kế hoạch, tạo môi trường học tập, rèn luyện tích cực cho học sinh'}, ${unit} thông báo ${act} như sau:`);
      let n = 0;
      if (when) L.push(`${++n}. Thời gian: ${when}.`);
      if (where) L.push(`${++n}. Địa điểm: ${where}.`);
      L.push(`${++n}. Đối tượng tham gia: ${who ? who : isClass ? `học sinh ${low(unit)}` : 'học sinh các lớp và các cá nhân có liên quan'}.`);
      L.push(`${++n}. Nội dung: ${cap(act)}${items.length ? ` (${items.map(low).join('; ')})` : ''}.`);
      L.push(`${++n}. Tổ chức thực hiện:`);
      L.push(`- Giáo viên chủ nhiệm phổ biến nội dung thông báo đến học sinh và cha mẹ học sinh; hướng dẫn học sinh chuẩn bị chu đáo, tham gia đầy đủ.`);
      L.push(`- Các bộ phận liên quan phối hợp chuẩn bị cơ sở vật chất, đảm bảo an toàn, trật tự trong quá trình tổ chức.`);
      if (req) L.push(`- ${cap(req)}.`);
      L.push(`Đề nghị các cá nhân, bộ phận có liên quan nghiêm túc thực hiện. Trân trọng thông báo./.`);
      return { subject: what ? `Về việc ${act}` : '', body: L.join('\n') };
    }
    case 'ke-hoach': {
      L.push(`Căn cứ ${plan};`);
      L.push(`${unit} xây dựng kế hoạch ${act} như sau:`);
      L.push('I. MỤC ĐÍCH, YÊU CẦU');
      L.push('1. Mục đích');
      L.push(purpose ? `- ${cap(purpose)}.` : `- ${cap(act)} nhằm tạo sân chơi bổ ích, góp phần giáo dục toàn diện cho học sinh.`);
      L.push('- Phát huy tính tích cực, chủ động của học sinh; tăng cường phối hợp giữa nhà trường, giáo viên và cha mẹ học sinh.');
      L.push('2. Yêu cầu');
      L.push('- Tổ chức nghiêm túc, đúng kế hoạch, đảm bảo an toàn, tiết kiệm, hiệu quả.');
      L.push('- Có sự phân công cụ thể, phối hợp chặt chẽ giữa các cá nhân, bộ phận liên quan.');
      if (when || where) {
        L.push('II. THỜI GIAN, ĐỊA ĐIỂM');
        if (when) L.push(`- Thời gian: ${when}.`);
        if (where) L.push(`- Địa điểm: ${where}.`);
      }
      const r = (i: number) => ['I', 'II', 'III', 'IV', 'V', 'VI'][i];
      let k = when || where ? 2 : 1;
      L.push(`${r(k++)}. NỘI DUNG`);
      (items.length ? items : [act]).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      L.push(`${r(k++)}. TỔ CHỨC THỰC HIỆN`);
      L.push(who ? `- ${cap(who)}: chịu trách nhiệm triển khai, theo dõi và tổng hợp kết quả.` : '- Giáo viên chủ nhiệm: triển khai kế hoạch đến học sinh, theo dõi và tổng hợp kết quả.');
      L.push('- Các bộ phận liên quan: phối hợp chuẩn bị điều kiện, cơ sở vật chất theo phân công.');
      L.push('- Cha mẹ học sinh: phối hợp động viên, hỗ trợ học sinh tham gia.');
      L.push(`Trên đây là kế hoạch ${act}. Trong quá trình thực hiện, nếu có vướng mắc, các cá nhân, bộ phận kịp thời báo cáo để điều chỉnh cho phù hợp./.`);
      return { subject: what ? cap(act) : '', body: L.join('\n') };
    }
    case 'bao-cao': {
      L.push(basis ? `Thực hiện ${basis};` : `Căn cứ ${plan};`);
      L.push(`${unit} báo cáo ${W || 'kết quả thực hiện nhiệm vụ'} như sau:`);
      L.push('I. KẾT QUẢ ĐẠT ĐƯỢC');
      (items.length ? items : ['kết quả chính']).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      L.push('II. TỒN TẠI, HẠN CHẾ VÀ NGUYÊN NHÂN');
      (issues ? list(issues) : ['một số nội dung còn cần tiếp tục theo dõi, hỗ trợ trong thời gian tới']).forEach((x) => L.push(`- ${cap(x)}.`));
      L.push('III. PHƯƠNG HƯỚNG, ĐỀ XUẤT');
      (req ? list(req) : ['tiếp tục phát huy kết quả đạt được, khắc phục tồn tại, hạn chế', 'tăng cường phối hợp với cha mẹ học sinh trong giáo dục học sinh']).forEach((x) => L.push(`- ${cap(x)}.`));
      L.push(`Trên đây là báo cáo ${W || 'kết quả thực hiện nhiệm vụ'} của ${unit}./.`);
      return { subject: what ? cap(what) : '', body: L.join('\n') };
    }
    case 'bien-ban': {
      if (when) L.push(`Thời gian: ${when}.`);
      if (where) L.push(`Địa điểm: ${where}.`);
      L.push(`Thành phần: ${who || '…'}.`);
      L.push(`Chủ trì: ${ctx.signer.trim() || '…'}${ctx.role.trim() ? ` – ${low(ctx.role.trim())}` : ''}. Thư ký: …`);
      L.push('Nội dung:');
      (items.length ? items : ['nội dung cuộc họp']).forEach((x, i) => L.push(`${i + 1}. ${cap(x)}.`));
      L.push('Ý kiến thảo luận:');
      L.push('- Các thành viên tham dự trao đổi, thống nhất các nội dung trên.');
      L.push('Kết luận:');
      L.push(`- ${req ? cap(req) : 'Thống nhất các nội dung đã thảo luận; các cá nhân, bộ phận liên quan triển khai thực hiện'}.`);
      L.push('Buổi họp kết thúc lúc … giờ … cùng ngày. Biên bản đã được đọc lại cho các thành viên cùng nghe và thống nhất thông qua./.');
      return { subject: what ? cap(what) : '', body: L.join('\n') };
    }
    case 'giay-moi': {
      const guest = who || (isClass ? `Quý phụ huynh học sinh ${low(unit)}` : 'Quý vị');
      L.push(`Thực hiện ${plan}, ${unit} ${act}.`);
      L.push(`${unit} trân trọng kính mời ${guest} đến dự.`);
      if (when) L.push(`Thời gian: ${when}.`);
      if (where) L.push(`Địa điểm: ${where}.`);
      L.push(`Nội dung: ${items.length ? items.map(low).join('; ') : `theo chương trình ${W || 'buổi làm việc'}`}.`);
      if (purpose) L.push(`Mục đích: ${low(purpose)}.`);
      L.push('Sự có mặt của Quý vị góp phần quan trọng vào thành công của chương trình. Rất mong Quý vị sắp xếp thời gian đến dự đầy đủ, đúng giờ.');
      L.push('Trân trọng kính mời./.');
      return { subject: what ? `Dự ${W}` : '', to: guest, body: L.join('\n') };
    }
    case 'to-trinh': {
      // chức danh người phê duyệt giữ viết hoa (Hiệu trưởng, Ban giám hiệu…)
      const boss = who ? cap(who) : 'Hiệu trưởng';
      L.push(`Căn cứ ${plan};`);
      L.push('Căn cứ tình hình thực tế của đơn vị;');
      L.push(`${unit} kính trình ${boss} xem xét việc ${W || 'đề nghị dưới đây'}, cụ thể như sau:`);
      let n = 0;
      if (purpose) L.push(`${++n}. Lý do: ${cap(purpose)}.`);
      L.push(`${++n}. Nội dung đề nghị: ${what ? cap(what) : '…'}.`);
      if (req) L.push(`${++n}. Kinh phí dự kiến: ${req}.`);
      L.push(`${++n}. Hiệu quả: việc ${W || 'đề nghị'} nhằm đáp ứng yêu cầu thực tế, đảm bảo điều kiện cho hoạt động dạy và học.`);
      L.push(`Kính trình ${boss} xem xét, phê duyệt./.`);
      return { subject: what ? `Về việc đề nghị ${W}` : '', to: boss, body: L.join('\n') };
    }
    case 'don': {
      L.push(`Tôi tên là: ${ctx.signer.trim() || '…'}.`);
      L.push(`Chức vụ: ${ctx.role.trim() ? `${ctx.role.trim()}${ctx.className ? ` lớp ${ctx.className}` : ''}` : '…'}.`);
      if (ctx.unit.trim()) L.push(`Đơn vị công tác: ${unit}.`);
      L.push(`Nay tôi làm đơn này kính đề nghị Hiệu trưởng cho tôi được nghỉ phép ${when ? when : '…'}.`);
      L.push(`Lý do: ${purpose ? low(purpose) : '…'}.`);
      L.push(who ? `Trong thời gian nghỉ, tôi đã bàn giao công việc cho ${who} và sẽ phối hợp khi cần.` : 'Trong thời gian nghỉ, tôi sẽ bàn giao công việc theo sự phân công của nhà trường.');
      L.push('Tôi xin hứa sẽ đi làm lại đúng thời hạn. Kính mong Hiệu trưởng xem xét, chấp thuận./.');
      return { subject: '', body: L.join('\n') };
    }
  }
}
