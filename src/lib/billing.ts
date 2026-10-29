// Thu phí học sinh (migration 0018): kiểu dữ liệu, định dạng tiền, nội dung mã VietQR (chuẩn EMVCo / NAPAS 247).
// Mã QR được vẽ ngay trong app (src/lib/qr.ts) — không gọi dịch vụ ngoài, không lộ thông tin học sinh trong nội dung chuyển khoản.

export type Plan = 'month' | 'year';
export const PLAN_NAME: Record<Plan, string> = { month: 'Gói 1 tháng', year: 'Gói năm học' };
export type BillingPublic = {
  enabled: boolean; price_month: number; price_year: number; trial_days: number;
  bank_bin: string | null; bank_name: string | null; account_no: string | null; account_name: string | null; note: string | null; year_end: string;
};
export type Gate = { is_student: boolean; grade: number | null; active: boolean; reason: 'free' | 'paid' | 'trial' | 'expired' | 'not_student' | 'plan_locked'; until: string | null };
export type PaymentRow = { id: string; code: string; plan: Plan; amount: number; status: 'pending' | 'confirmed' | 'cancelled'; created_at: string; confirmed_at: string | null; period_to: string | null };

export const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN').replace(/,/g, '.')}đ`;
export const fmtDay = (s: string | null | undefined) => {
  if (!s) return '—';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/** Ngân hàng thường dùng (mã BIN theo NAPAS). Quản trị chọn ngân hàng nhận tiền; nên quét thử mã QR trước khi bật thu phí. */
export const BANKS: { bin: string; name: string }[] = [
  { bin: '970436', name: 'Vietcombank' }, { bin: '970415', name: 'VietinBank' }, { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' }, { bin: '970407', name: 'Techcombank' }, { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' }, { bin: '970432', name: 'VPBank' }, { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' }, { bin: '970441', name: 'VIB' }, { bin: '970443', name: 'SHB' },
  { bin: '970437', name: 'HDBank' }, { bin: '970448', name: 'OCB' }, { bin: '970426', name: 'MSB' },
  { bin: '970440', name: 'SeABank' }, { bin: '970431', name: 'Eximbank' }, { bin: '970449', name: 'LPBank' },
  { bin: '970428', name: 'Nam A Bank' }, { bin: '970409', name: 'Bac A Bank' },
];

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;
/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF) theo chuẩn EMVCo */
export function crc16(s: string): string {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Nội dung mã VietQR chuyển khoản tới tài khoản, có sẵn số tiền và nội dung (app ngân hàng điền tự động) */
export function vietQrPayload(o: { bin: string; account: string; amount: number; content: string }): string {
  const content = o.content.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'D').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 25);
  const body = tlv('00', '01') + tlv('01', '12')
    + tlv('38', tlv('00', 'A000000727') + tlv('01', tlv('00', o.bin) + tlv('01', o.account)) + tlv('02', 'QRIBFTTA'))
    + tlv('53', '704') + tlv('54', String(Math.round(o.amount))) + tlv('58', 'VN') + tlv('62', tlv('08', content)) + '6304';
  return body + crc16(body);
}

export const BILLING_ERRORS: Record<string, string> = {
  billing_not_ready: 'Nhà trường chưa cấu hình tài khoản nhận học phí.',
  too_many_requests: 'Em tạo quá nhiều yêu cầu trong hôm nay, thử lại ngày mai.',
  not_student: 'Chỉ tài khoản học sinh mới đóng học phí.',
  not_pending: 'Yêu cầu này đã được xử lý.',
  not_allowed: 'Chỉ quản trị hệ thống làm được việc này.',
  invalid_plan: 'Gói không hợp lệ.',
};
export function billingError(message: string): string {
  const code = Object.keys(BILLING_ERRORS).find((k) => message.includes(k));
  if (code) return BILLING_ERRORS[code];
  if (/function|does not exist|schema cache|relation/i.test(message)) return 'Chưa bật tính năng thu phí: hãy chạy supabase/migrations/0018_billing.sql trên Supabase.';
  return 'Chưa thực hiện được. Thử lại sau.';
}
