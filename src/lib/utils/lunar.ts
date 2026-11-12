// Âm lịch Việt Nam (múi giờ +7) — thuật toán thiên văn của Hồ Ngọc Đức (tính điểm sóc và trung khí),
// cộng can chi ngày/tháng/năm, tiết khí, giờ hoàng đạo và các ngày lễ thường dùng ở trường.
// Chạy hoàn toàn trên máy, không cần mạng.

const TZ = 7;
const PI = Math.PI;
const INT = Math.floor;

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

export function jdToDate(jd: number): [number, number, number] {
  let b: number, c: number;
  if (jd > 2299160) { const a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}

function newMoon(k: number): number {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltat;
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * INT(L / (PI * 2));
  return L;
}

const newMoonDay = (k: number) => INT(newMoon(k) + 0.5 + TZ / 24);
const sunSector = (day: number) => INT((sunLongitude(day - 0.5 - TZ / 24) / PI) * 6);

function lunarMonth11(yy: number): number {
  const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
  const nm = newMoonDay(k);
  return sunSector(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1;
  let arc = sunSector(newMoonDay(k + i));
  do { last = arc; i++; arc = sunSector(newMoonDay(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}

export type Lunar = { day: number; month: number; year: number; leap: boolean };

export function solarToLunar(dd: number, mm: number, yy: number): Lunar {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = newMoonDay(k);
  let a11 = lunarMonth11(yy), b11 = a11, year: number;
  if (a11 >= monthStart) { year = yy; a11 = lunarMonth11(yy - 1); }
  else { year = yy + 1; b11 = lunarMonth11(yy + 1); }
  const day = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = false, month = diff + 11;
  if (b11 - a11 > 365) {
    const lm = leapMonthOffset(a11);
    if (diff >= lm) { month = diff + 10; if (diff === lm) leap = true; }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap };
}

/** Ngày âm → ngày dương [ngày, tháng, năm]; tháng nhuận không có trong năm đó → null */
export function lunarToSolar(day: number, month: number, year: number, leap = false): [number, number, number] | null {
  let a11: number, b11: number;
  if (month < 11) { a11 = lunarMonth11(year - 1); b11 = lunarMonth11(year); }
  else { a11 = lunarMonth11(year); b11 = lunarMonth11(year + 1); }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) return null;
  const start = newMoonDay(k + off);
  // ngày 30 không có trong tháng thiếu
  if (day === 30 && newMoonDay(k + off + 1) - start < 30) return null;
  return jdToDate(start + day - 1);
}

/** Số ngày của tháng âm chứa ngày dương này (29 = tháng thiếu, 30 = tháng đủ) */
export function lunarMonthLength(dd: number, mm: number, yy: number): number {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let start = newMoonDay(k + 1), next = newMoonDay(k + 2);
  if (start > dayNumber) { next = start; start = newMoonDay(k); }
  return next - start;
}

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const CON_GIAP = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];
const TIET_KHI = ['Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập'];
const GIO_HD = ['110100101100', '001101001011', '110011010010', '101100110100', '001011001101', '010010110011'];

export const canChiDay = (jd: number) => `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
export const canChiMonth = (l: Lunar) => `${CAN[(l.year * 12 + l.month + 3) % 10]} ${CHI[(l.month + 1) % 12]}${l.leap ? ' (nhuận)' : ''}`;
export const canChiYear = (y: number) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`;
export const conGiap = (y: number) => CON_GIAP[(y + 8) % 12];
/** Tiết khí của ngày (theo kinh độ mặt trời lúc 0 giờ ngày hôm sau, giờ Việt Nam) */
export const tietKhi = (jd: number) => TIET_KHI[INT((sunLongitude(jd + 1 - 0.5 - TZ / 24) / PI) * 12)];
/** Giờ hoàng đạo trong ngày: ["Tý (23–1)", …] */
export function gioHoangDao(jd: number): string[] {
  const pattern = GIO_HD[((jd + 1) % 12) % 6];
  const out: string[] = [];
  for (let i = 0; i < 12; i++) if (pattern[i] === '1') out.push(`${CHI[i]} (${(i * 2 + 23) % 24}–${(i * 2 + 1) % 24}h)`);
  return out;
}

export type Holiday = { name: string; kind: 'le' | 'truong' | 'am'; off?: boolean };
/** Ngày lễ dương lịch (khoá "d/m") — `off`: ngày nghỉ theo luật */
const SOLAR_DAYS: Record<string, Holiday> = {
  '1/1': { name: 'Tết Dương lịch', kind: 'le', off: true },
  '9/1': { name: 'Ngày Học sinh – Sinh viên', kind: 'truong' },
  '3/2': { name: 'Thành lập Đảng CSVN', kind: 'le' },
  '14/2': { name: 'Lễ Tình nhân', kind: 'le' },
  '27/2': { name: 'Ngày Thầy thuốc Việt Nam', kind: 'le' },
  '8/3': { name: 'Quốc tế Phụ nữ', kind: 'le' },
  '26/3': { name: 'Thành lập Đoàn TNCS HCM', kind: 'truong' },
  '21/4': { name: 'Ngày Sách và Văn hoá đọc', kind: 'truong' },
  '30/4': { name: 'Giải phóng miền Nam', kind: 'le', off: true },
  '1/5': { name: 'Quốc tế Lao động', kind: 'le', off: true },
  '15/5': { name: 'Thành lập Đội TNTP HCM', kind: 'truong' },
  '19/5': { name: 'Sinh nhật Bác Hồ', kind: 'le' },
  '1/6': { name: 'Quốc tế Thiếu nhi', kind: 'truong' },
  '28/6': { name: 'Ngày Gia đình Việt Nam', kind: 'le' },
  '27/7': { name: 'Thương binh Liệt sĩ', kind: 'le' },
  '19/8': { name: 'Cách mạng tháng Tám', kind: 'le' },
  '2/9': { name: 'Quốc khánh', kind: 'le', off: true },
  '5/9': { name: 'Khai giảng năm học', kind: 'truong' },
  '20/10': { name: 'Phụ nữ Việt Nam', kind: 'le' },
  '20/11': { name: 'Nhà giáo Việt Nam', kind: 'truong' },
  '22/12': { name: 'Quân đội Nhân dân VN', kind: 'le' },
  '24/12': { name: 'Giáng sinh', kind: 'le' },
};
/** Ngày lễ âm lịch (khoá "d/m" âm) */
const LUNAR_DAYS: Record<string, Holiday> = {
  '1/1': { name: 'Tết Nguyên Đán', kind: 'am', off: true },
  '2/1': { name: 'Mùng 2 Tết', kind: 'am', off: true },
  '3/1': { name: 'Mùng 3 Tết', kind: 'am', off: true },
  '15/1': { name: 'Rằm tháng Giêng', kind: 'am' },
  '3/3': { name: 'Tết Hàn thực', kind: 'am' },
  '10/3': { name: 'Giỗ Tổ Hùng Vương', kind: 'am', off: true },
  '15/4': { name: 'Lễ Phật Đản', kind: 'am' },
  '5/5': { name: 'Tết Đoan Ngọ', kind: 'am' },
  '15/7': { name: 'Lễ Vu Lan', kind: 'am' },
  '15/8': { name: 'Tết Trung Thu', kind: 'am' },
  '23/12': { name: 'Ông Công Ông Táo', kind: 'am' },
};

export type DayInfo = {
  y: number; m: number; d: number; jd: number; weekday: number; lunar: Lunar; monthLen: number; holidays: Holiday[];
};
export function dayInfo(d: number, m: number, y: number): DayInfo {
  const jd = jdFromDate(d, m, y);
  const lunar = solarToLunar(d, m, y);
  const monthLen = lunarMonthLength(d, m, y);
  const holidays: Holiday[] = [];
  const s = SOLAR_DAYS[`${d}/${m}`];
  if (s) holidays.push(s);
  if (!lunar.leap) {
    const l = LUNAR_DAYS[`${lunar.day}/${lunar.month}`];
    if (l) holidays.push(l);
    // Giao thừa: ngày cuối tháng Chạp
    if (lunar.month === 12 && lunar.day === monthLen) holidays.push({ name: 'Giao thừa', kind: 'am', off: true });
  }
  return { y, m, d, jd, weekday: (jd + 1) % 7, lunar, monthLen, holidays };
}

export const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const LUNAR_MONTH_NAME = ['', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Một', 'Chạp'];
