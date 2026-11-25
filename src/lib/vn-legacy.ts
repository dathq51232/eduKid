// Đổi chữ tiếng Việt gõ bằng bảng mã cũ sang Unicode chuẩn — giáo án, đề cũ soạn bằng phông .VnTime (TCVN3 / ABC)
// hoặc VNI-Times (VNI-Windows) mở ra thành "Gi¸o ¸n", "Giaùo aùn". Thuần hàm, chạy được trên trình duyệt và Node.
//   - TCVN3: mỗi chữ có dấu là MỘT ký tự Latin-1 (á = "¸", ư = "­"…). Phông "…H" (.VnTimeH) là bản chữ in hoa:
//     dùng chung mã chữ thường, hiển thị in hoa → đổi xong viết hoa lại.
//   - VNI: chữ cái gốc + ký tự dấu đứng sau ("aù" = á, "eä" = ệ); ơ, ư, đ, các chữ i có dấu và ỵ là một ký tự riêng.

export type Legacy = 'tcvn3' | 'vni';

// ------------------------------------------------------------------ TCVN3 (ABC)
const TCVN3: Record<string, string> = {
  'µ': 'à', '¸': 'á', '¶': 'ả', '·': 'ã', '¹': 'ạ',
  '¨': 'ă', '»': 'ằ', '¾': 'ắ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
  '©': 'â', 'Ç': 'ầ', 'Ê': 'ấ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ',
  '®': 'đ',
  'Ì': 'è', 'Ð': 'é', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ',
  'ª': 'ê', 'Ò': 'ề', 'Õ': 'ế', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ',
  '×': 'ì', 'Ý': 'í', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
  'ß': 'ò', 'ã': 'ó', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ',
  '«': 'ô', 'å': 'ồ', 'è': 'ố', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
  '¬': 'ơ', 'ê': 'ờ', 'í': 'ớ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ',
  'ï': 'ù', 'ó': 'ú', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ',
  '­': 'ư', 'õ': 'ừ', 'ø': 'ứ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự',
  'ú': 'ỳ', 'ý': 'ý', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
  // chữ hoa riêng của bảng mã (các chữ hoa có dấu thanh dùng phông …H)
  '¡': 'Ă', '¢': 'Â', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư', '§': 'Đ',
};

/** TCVN3 → Unicode. upper: phông in hoa (.VnTimeH, .VnArialH…) */
export function tcvn3ToUnicode(s: string, upper = false): string {
  let out = '';
  for (const ch of s) out += TCVN3[ch] ?? ch;
  return upper ? out.toUpperCase() : out;
}

// ------------------------------------------------------------------ VNI-Windows
const ACUTE = '́', GRAVE = '̀', HOOK = '̉', TILDE = '̃', DOT = '̣';
const CIRC = '̂', BREVE = '̆', HORN = '̛';
/** dấu thanh đứng sau nguyên âm */
const TONE: Record<string, string> = { 'ù': ACUTE, 'ø': GRAVE, 'û': HOOK, 'õ': TILDE, 'ï': DOT };
/** mũ (â, ê, ô) kèm dấu thanh — sau a, e, o */
const CIRC_T: Record<string, string> = { 'â': '', 'á': ACUTE, 'à': GRAVE, 'å': HOOK, 'ã': TILDE, 'ä': DOT };
/** trăng (ă) kèm dấu thanh — chỉ sau a */
const BREVE_T: Record<string, string> = { 'ê': '', 'é': ACUTE, 'è': GRAVE, 'ú': HOOK, 'ü': TILDE, 'ë': DOT };
/** ký tự đứng riêng */
const VNI_ONE: Record<string, string> = {
  'ô': 'ơ', 'Ô': 'Ơ', 'ö': 'ư', 'Ö': 'Ư', 'ñ': 'đ', 'Ñ': 'Đ',
  'í': 'í', 'ì': 'ì', 'æ': 'ỉ', 'ó': 'ĩ', 'ò': 'ị', 'Í': 'Í', 'Ì': 'Ì', 'Æ': 'Ỉ', 'Ó': 'Ĩ', 'Ò': 'Ị',
  'î': 'ỵ', 'Î': 'Ỵ',
};
const low = (c: string) => c.toLowerCase();

/** VNI-Windows → Unicode */
export function vniToUnicode(s: string): string {
  const cs = [...s];
  let out = '';
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    const next = cs[i + 1];
    const lc = low(c);
    // nguyên âm gốc (kể cả ơ, ư viết bằng ô, ö) + ký tự dấu đứng sau
    const base = lc === 'ô' ? 'o' + HORN : lc === 'ö' ? 'u' + HORN : 'aeouy'.includes(lc) ? lc : '';
    if (base && next !== undefined) {
      const ln = low(next);
      const upper = c !== lc;
      let marks: string | null = null;
      if ((lc === 'a' || lc === 'e' || lc === 'o') && ln in CIRC_T) marks = CIRC + CIRC_T[ln];
      else if (lc === 'a' && ln in BREVE_T) marks = BREVE + BREVE_T[ln];
      else if (ln in TONE) marks = TONE[ln];
      if (marks !== null) {
        const ch = (base + marks).normalize('NFC');
        out += upper ? ch.toUpperCase() : ch;
        i++;
        continue;
      }
    }
    out += VNI_ONE[c] ?? c;
  }
  return out;
}

// ------------------------------------------------------------------ nhận dạng
/** Ký tự chỉ gặp trong chữ TCVN3 (không bao giờ có trong tiếng Việt Unicode) */
const TCVN3_SIGN = /[¸µ¶·¹¨©®ª«¬»¾¼½­]/g;
/** Cặp chữ chỉ gặp trong chữ VNI ("aù", "eâ", "aê", "ñ"…) — không lấy "oà", "oá" vì Unicode cũng có (hoà, khoá) */
const VNI_SIGN = /[aAeEoO][âÂ]|[aA][êÊ]|[aAeEoOuUyYôÔöÖ][ùøûõïÙØÛÕÏ]|[ñÑ]/g;

/** Đoán bảng mã của một đoạn chữ không rõ phông (min: số dấu hiệu tối thiểu). null = chữ Unicode bình thường */
export function detectLegacy(s: string, min = 2): Legacy | null {
  const t = (s.match(TCVN3_SIGN) ?? []).length;
  const v = (s.match(VNI_SIGN) ?? []).length;
  if (t >= min && t >= v) return 'tcvn3';
  if (v >= min) return 'vni';
  return null;
}

/** Bảng mã theo tên phông: ".VnTime", ".VnArialH" → TCVN3 (H = in hoa); "VNI-Times" → VNI */
export function fontLegacy(font: string | undefined): { kind: Legacy; upper: boolean } | null {
  const f = (font ?? '').trim();
  if (/^\.vn/i.test(f) || /^vn(time|arial|avant)/i.test(f)) return { kind: 'tcvn3', upper: /H$/.test(f) };
  if (/^vni[- ]/i.test(f)) return { kind: 'vni', upper: false };
  return null;
}

/** Đổi một đoạn chữ theo bảng mã đã biết */
export function toUnicode(s: string, kind: Legacy, upper = false): string {
  return kind === 'tcvn3' ? tcvn3ToUnicode(s, upper) : vniToUnicode(s);
}

/** Đổi đoạn chữ tự đoán bảng mã (dùng cho chữ dán vào, không có thông tin phông) */
export function fixLegacyText(s: string): { text: string; kind: Legacy | null } {
  const kind = detectLegacy(s);
  return kind ? { text: toUnicode(s, kind), kind } : { text: s, kind: null };
}
