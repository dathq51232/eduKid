// Ví phí cộng tác của thầy cô (migration 0082): kiểu dữ liệu, lịch chi trả 2 lần / năm, câu báo lỗi.
// Phí cộng tác = % gói lớp học phụ huynh lớp cô đóng (0074), tự cộng vào ví khi khoản đóng được xác nhận.

export type WalletAccount = { bankName: string; accountNo: string; accountName: string; idNumber: string | null; agreedAt: string };
export type Wallet = {
  enabled: boolean; pct: number; priceTerm: number; priceYear: number; taxThreshold: number; taxPct: number;
  balance: number; inBatch: number; paid: number;
  byClass: { className: string; term: number; year: number; amount: number }[];
  history: { label: string; gross: number; tax: number; net: number; status: 'cho_chi' | 'da_chi' | 'giu_lai'; paidAt: string | null }[];
  account: WalletAccount | null;
};

/** Học kỳ của app: HK1 đến hết 15/1, HK2 đến hết 31/5 (0074). Chi trả trong 15 ngày sau khi học kỳ kết thúc. */
export function nextPayout(today = new Date()): { label: string; from: string; to: string } {
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const md = m * 100 + d;
  if (md <= 115) return { label: `cuối học kỳ 1 (năm học ${y - 1}–${y})`, from: `16/1/${y}`, to: `31/1/${y}` };
  if (md <= 531) return { label: `cuối học kỳ 2 (năm học ${y - 1}–${y})`, from: `1/6/${y}`, to: `15/6/${y}` };
  return { label: `cuối học kỳ 1 (năm học ${y}–${y + 1})`, from: `16/1/${y + 1}`, to: `31/1/${y + 1}` };
}
/** Tên đợt chi gợi ý cho quản trị theo ngày tạo (tháng 1–5: chi cho HK1; tháng 6–12: chi cho HK2 của năm học vừa xong) */
export function payoutLabel(today = new Date()): string {
  const y = today.getFullYear(), md = (today.getMonth() + 1) * 100 + today.getDate();
  return md <= 531 ? `Cuối HK1 ${y - 1}–${y}` : `Cuối HK2 ${y - 1}–${y}`;
}

/** Tên chủ tài khoản như ngân hàng in: IN HOA, không dấu */
export const bankName = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase().replace(/\s+/g, ' ').trimStart();
export const maskAccount = (no: string) => (no.length > 4 ? `•••• ${no.slice(-4)}` : no);

export function walletError(m: string): string {
  if (/must_agree/.test(m)) return 'Thầy cô cần đồng ý điều khoản cộng tác để nhận tiền.';
  if (/bad_account/.test(m)) return 'Số tài khoản chỉ gồm 6–20 chữ số; nhập đủ tên ngân hàng và tên chủ tài khoản.';
  if (/bad_id/.test(m)) return 'Số CCCD gồm 9–12 chữ số.';
  if (/nothing_to_pay/.test(m)) return 'Chưa có thầy cô nào đủ điều kiện chi trả (có số dư và đã khai tài khoản).';
  if (/held/.test(m)) return 'Dòng này đã giữ lại — các khoản đã về ví, sẽ vào đợt chi sau.';
  if (/already_paid/.test(m)) return 'Dòng này đã chi, không đổi lại được.';
  if (/not_voidable/.test(m)) return 'Khoản này đã vào đợt chi hoặc không có phí cộng tác.';
  if (/could not find the function|PGRST202|does not exist/i.test(m)) return 'Ví chưa được bật: chạy migration supabase/migrations/0082_commission_wallet.sql trên Supabase.';
  return `Chưa thực hiện được: ${m}`;
}
