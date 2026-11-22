// Thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP (Phụ lục I) — bản rút gọn cho văn bản của trường / giáo viên.
// Một HTML dùng chung cho xem trước, in (lưu PDF) và xuất Word (htmlToDocx: A4, lề trên/dưới 20 mm, trái 30 mm, phải 15 mm).

export type DocKind = 'thong-bao' | 'ke-hoach' | 'bao-cao' | 'bien-ban' | 'giay-moi' | 'to-trinh' | 'don';

export type Org = {
  /** cơ quan chủ quản, vd "UBND XÃ TÂN ĐỊNH" (để trống nếu không có) */
  parent: string;
  /** tên cơ quan ban hành, vd "TRƯỜNG TIỂU HỌC TÂN ĐỊNH" */
  name: string;
  /** chữ viết tắt tên cơ quan trong ký hiệu, vd "THTĐ" */
  abbr: string;
  /** địa danh ghi trước ngày tháng, vd "Tân Định" */
  place: string;
  /** chức vụ người ký (in hoa khi in), vd "Hiệu trưởng", "Giáo viên chủ nhiệm" */
  role: string;
  /** ký thay: "KT. HIỆU TRƯỞNG" phía trên chức vụ (để trống nếu ký chính) */
  onBehalf: string;
  signer: string;
};

export type Doc = {
  kind: DocKind;
  /** số văn bản (để trống → "Số:      /…" chờ vào sổ) */
  no: string;
  /** ngày ban hành yyyy-mm-dd */
  date: string;
  /** trích yếu nội dung, vd "Về việc tổ chức họp phụ huynh đầu năm" */
  subject: string;
  /** Kính gửi (tờ trình, đơn, giấy mời…), mỗi nơi một dòng */
  to: string;
  /** nội dung: mỗi dòng một đoạn. Dòng "I. …", "1. …" là đề mục; "- …" là gạch đầu dòng */
  body: string;
  /** nơi nhận, mỗi nơi một dòng (đơn không có) */
  recipients: string;
};

export const KINDS: { id: DocKind; label: string; title: string; code: string }[] = [
  { id: 'thong-bao', label: 'Thông báo', title: 'THÔNG BÁO', code: 'TB' },
  { id: 'ke-hoach', label: 'Kế hoạch', title: 'KẾ HOẠCH', code: 'KH' },
  { id: 'bao-cao', label: 'Báo cáo', title: 'BÁO CÁO', code: 'BC' },
  { id: 'bien-ban', label: 'Biên bản', title: 'BIÊN BẢN', code: 'BB' },
  { id: 'giay-moi', label: 'Giấy mời', title: 'GIẤY MỜI', code: 'GM' },
  { id: 'to-trinh', label: 'Tờ trình', title: 'TỜ TRÌNH', code: 'TTr' },
  { id: 'don', label: 'Đơn xin nghỉ phép', title: 'ĐƠN XIN NGHỈ PHÉP', code: '' },
];
export const kindOf = (k: DocKind) => KINDS.find((x) => x.id === k) ?? KINDS[0];

/** Nội dung mẫu cho từng loại — cô sửa lại; [ … ] là chỗ cần điền */
export const SAMPLE: Record<DocKind, Pick<Doc, 'subject' | 'to' | 'body' | 'recipients'>> = {
  'thong-bao': {
    subject: 'Về việc [nội dung thông báo]', to: '',
    body: 'Căn cứ [kế hoạch / văn bản chỉ đạo];\n[Tên trường / lớp] thông báo như sau:\n1. Thời gian: [giờ, ngày].\n2. Địa điểm: [địa điểm].\n3. Thành phần: [thành phần tham dự].\n4. Nội dung: [nội dung chính].\nĐề nghị [các bộ phận / quý phụ huynh] thực hiện đúng nội dung thông báo này./.',
    recipients: 'Như trên;\nBGH (để b/c);\nLưu: VT.',
  },
  'ke-hoach': {
    subject: 'Thực hiện [nội dung kế hoạch] năm học [2026–2027]', to: '',
    body: 'I. MỤC ĐÍCH, YÊU CẦU\n1. Mục đích\n- [mục đích].\n2. Yêu cầu\n- [yêu cầu].\nII. NỘI DUNG, THỜI GIAN THỰC HIỆN\n1. [nội dung 1]: [thời gian].\n2. [nội dung 2]: [thời gian].\nIII. TỔ CHỨC THỰC HIỆN\n- [người / bộ phận phụ trách và nhiệm vụ].\nTrên đây là kế hoạch [tên kế hoạch]. Trong quá trình thực hiện nếu có vướng mắc, kịp thời báo cáo để điều chỉnh./.',
    recipients: 'BGH (để b/c);\nTổ chuyên môn;\nLưu: VT.',
  },
  'bao-cao': {
    subject: 'Kết quả [nội dung báo cáo]', to: '',
    body: 'Thực hiện [văn bản / kế hoạch], [đơn vị] báo cáo kết quả như sau:\nI. KẾT QUẢ ĐẠT ĐƯỢC\n1. [kết quả 1].\n2. [kết quả 2].\nII. TỒN TẠI, HẠN CHẾ VÀ NGUYÊN NHÂN\n- [tồn tại].\nIII. PHƯƠNG HƯỚNG, ĐỀ XUẤT\n- [đề xuất].\nTrên đây là báo cáo [tên báo cáo] của [đơn vị]./.',
    recipients: 'BGH (để b/c);\nLưu: VT.',
  },
  'bien-ban': {
    subject: '[Họp / sinh hoạt …]', to: '',
    body: 'Thời gian: [giờ] ngày [ngày tháng năm].\nĐịa điểm: [địa điểm].\nThành phần: [chủ trì, thư ký, người tham dự, vắng mặt].\nNội dung:\n1. [nội dung 1].\n2. [nội dung 2].\nÝ kiến thảo luận:\n- [ý kiến].\nKết luận:\n- [kết luận].\nBuổi họp kết thúc lúc [giờ] cùng ngày. Biên bản đã được thông qua trước cuộc họp./.',
    recipients: '',
  },
  'giay-moi': {
    subject: 'Dự [tên cuộc họp / sự kiện]', to: 'Quý phụ huynh học sinh lớp [lớp]',
    body: '[Tên trường / GVCN lớp] trân trọng kính mời Quý vị đến dự [tên cuộc họp / sự kiện].\nThời gian: [giờ], ngày [ngày tháng năm].\nĐịa điểm: [địa điểm].\nNội dung: [nội dung chính].\nRất mong Quý vị sắp xếp thời gian đến dự đầy đủ, đúng giờ./.',
    recipients: 'Như trên;\nLưu: VT.',
  },
  'to-trinh': {
    subject: 'Về việc đề nghị [nội dung đề nghị]', to: 'Hiệu trưởng [tên trường]',
    body: 'Căn cứ [văn bản / tình hình thực tế];\n[Đơn vị / cá nhân] kính trình [nội dung đề nghị] như sau:\n1. Lý do: [lý do].\n2. Nội dung đề nghị: [nội dung, kinh phí nếu có].\nKính trình [người có thẩm quyền] xem xét, phê duyệt./.',
    recipients: 'Như trên;\nLưu: VT.',
  },
  don: {
    subject: '', to: 'Hiệu trưởng [tên trường]',
    body: 'Tôi tên là: [họ và tên].\nChức vụ: [giáo viên chủ nhiệm lớp …].\nNay tôi làm đơn này kính đề nghị Hiệu trưởng cho tôi được nghỉ phép [số] ngày, từ ngày [ngày] đến hết ngày [ngày].\nLý do: [lý do].\nTrong thời gian nghỉ, tôi đã bàn giao công việc cho [người nhận bàn giao].\nTôi xin hứa sẽ đi làm lại đúng thời hạn. Kính mong Hiệu trưởng xem xét, chấp thuận./.',
    recipients: '',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');
/** "Tân Định, ngày 05 tháng 01 năm 2026" — ngày < 10 và tháng 1, 2 thêm số 0 (NĐ30) */
export function dateLine(place: string, iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return `${place || '……'}, ngày … tháng … năm ……`;
  return `${place || '……'}, ngày ${pad(d)} tháng ${m < 3 ? pad(m) : m} năm ${y}`;
}
/** "Số: 05/TB-THTĐ" — số < 10 thêm 0; chưa có số thì chừa trống để vào sổ */
export function numberLine(kind: DocKind, no: string, abbr: string) {
  const n = no.trim();
  const num = /^\d+$/.test(n) ? pad(Number(n)) : n || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0';
  return `Số: ${num}/${kindOf(kind).code}${abbr.trim() ? `-${abbr.trim()}` : ''}`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const P = (style: string, html: string) => `<p style="margin:0;${style}">${html}</p>`;
const LINE = '────────';

/** Một dòng nội dung → đoạn văn đúng thể thức: đề mục La Mã in đậm, "1." in đậm nếu ngắn, còn lại căn đều lùi đầu dòng 1 cm */
function bodyLine(line: string) {
  const t = line.trim();
  if (!t) return '';
  if (/^[IVX]+\.\s/.test(t)) return P('text-align:justify;text-indent:1cm;margin-top:6pt;font-weight:bold', esc(t));
  if (/^\d+\.\s/.test(t) && t.length <= 60 && !/[.;:]$/.test(t)) return P('text-align:justify;text-indent:1cm;margin-top:6pt;font-weight:bold', esc(t));
  return P('text-align:justify;text-indent:1cm;margin-top:6pt;line-height:1.2', esc(t));
}

/** HTML văn bản hoàn chỉnh (A4 dọc). Dùng cho xem trước / in và htmlToDocx */
export function buildHtml(org: Org, doc: Doc): string {
  const k = kindOf(doc.kind);
  const isDon = doc.kind === 'don';
  const nation = P('text-align:center;font-weight:bold;font-size:13pt', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
    + P('text-align:center;font-weight:bold;font-size:14pt', 'Độc lập - Tự do - Hạnh phúc')
    + P('text-align:center;font-size:11pt', LINE + LINE);
  const parts: string[] = [];
  if (isDon) {
    parts.push(nation, P('text-align:right;font-style:italic;font-size:14pt;margin-top:6pt', esc(dateLine(org.place, doc.date))));
  } else {
    const left = (org.parent.trim() ? P('text-align:center;font-size:13pt', esc(org.parent.trim().toUpperCase())) : '')
      + P('text-align:center;font-weight:bold;font-size:13pt', esc(org.name.trim().toUpperCase() || 'TÊN CƠ QUAN'))
      + P('text-align:center;font-size:11pt', LINE)
      + P('text-align:center;font-size:13pt;margin-top:4pt', esc(numberLine(doc.kind, doc.no, org.abbr)));
    const right = nation + P('text-align:center;font-style:italic;font-size:14pt;margin-top:4pt', esc(dateLine(org.place, doc.date)));
    parts.push(`<table style="width:100%;border-collapse:collapse"><tr><td style="width:40%;vertical-align:top">${left}</td><td style="width:60%;vertical-align:top">${right}</td></tr></table>`);
  }
  // tên loại + trích yếu
  parts.push(P('text-align:center;font-weight:bold;font-size:14pt;margin-top:18pt', esc(k.title)));
  if (doc.subject.trim()) parts.push(P('text-align:center;font-weight:bold;font-size:14pt', esc(doc.subject.trim())));
  if (!isDon) parts.push(P('text-align:center;font-size:11pt', LINE));
  // kính gửi
  const to = doc.to.split('\n').map((x) => x.trim()).filter(Boolean);
  if (to.length === 1) parts.push(P('text-align:center;font-size:14pt;margin-top:8pt', `Kính gửi: ${esc(to[0])}`));
  else if (to.length > 1) parts.push(P('text-align:center;font-size:14pt;margin-top:8pt', 'Kính gửi:') + to.map((x) => P('text-align:center;font-size:14pt', `- ${esc(x)};`)).join(''));
  // nội dung
  parts.push(`<div style="margin-top:8pt">${doc.body.split('\n').map(bodyLine).join('')}</div>`);
  // nơi nhận + chữ ký
  const rec = doc.recipients.split('\n').map((x) => x.trim().replace(/^[-–•]\s*/, '')).filter(Boolean);
  const recHtml = rec.length ? P('font-weight:bold;font-style:italic;font-size:12pt', 'Nơi nhận:') + rec.map((x) => P('font-size:11pt', `- ${esc(x)}`)).join('') : '';
  const sign = (org.onBehalf.trim() ? P('text-align:center;font-weight:bold;font-size:14pt', esc(org.onBehalf.trim().toUpperCase())) : '')
    + P('text-align:center;font-weight:bold;font-size:14pt', esc((isDon ? 'Người làm đơn' : org.role.trim() || 'Thủ trưởng cơ quan').toUpperCase()))
    + (isDon ? P('text-align:center;font-style:italic;font-size:13pt', '(Ký và ghi rõ họ tên)') : '')
    + P('text-align:center;font-size:14pt', '&nbsp;') + P('text-align:center;font-size:14pt', '&nbsp;') + P('text-align:center;font-size:14pt', '&nbsp;')
    + P('text-align:center;font-weight:bold;font-size:14pt', esc(org.signer.trim()));
  parts.push(`<table style="width:100%;border-collapse:collapse;margin-top:12pt"><tr><td style="width:45%;vertical-align:top">${recHtml}</td><td style="width:55%;vertical-align:top">${sign}</td></tr></table>`);
  return `<html><head><meta charset="utf-8"></head><body>${parts.join('')}</body></html>`;
}

export function fileName(doc: Doc) {
  const slug = kindOf(doc.kind).label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
  return `${slug}-${doc.date || 'van-ban'}`;
}
