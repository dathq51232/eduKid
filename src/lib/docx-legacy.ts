// Đổi chữ phông cũ (.VnTime = TCVN3, VNI-Times = VNI) sang Unicode NGAY TRONG word/document.xml của file .docx,
// giữ nguyên mọi trình bày khác (bảng, đậm, nghiêng, cỡ chữ, hình). Đoạn chữ đã đổi được đặt phông Times New Roman.
// Bảng mã của từng đoạn chữ (run) lấy theo tên phông của run → kiểu ký tự → kiểu đoạn → phông mặc định của file;
// không rõ phông thì đoán theo chữ của cả đoạn văn (src/lib/vn-legacy.ts). Chạy được trên trình duyệt và Node.
import { detectLegacy, fontLegacy, toUnicode, type Legacy } from './vn-legacy';

const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const xesc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NON_LATIN1 = /[^\u0000-\u00FF]/;
const TNR = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';

/** phông chữ ghi trong một khối rPr (bỏ qua phông theo chủ đề — asciiTheme) */
const fontIn = (rPr: string) => {
  const f = /<w:rFonts\b[^>]*>/.exec(rPr)?.[0] ?? '';
  return /w:ascii="([^"]*)"/.exec(f)?.[1] ?? /w:hAnsi="([^"]*)"/.exec(f)?.[1];
};

type Styles = { def?: string; byId: Map<string, { font?: string; based?: string }> };
function readStyles(xml: string): Styles {
  const byId = new Map<string, { font?: string; based?: string }>();
  const defBlock = /<w:rPrDefault>([\s\S]*?)<\/w:rPrDefault>/.exec(xml)?.[1] ?? '';
  for (const m of xml.matchAll(/<w:style\b[^>]*w:styleId="([^"]*)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
    const rPr = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(m[2])?.[1] ?? '';
    byId.set(m[1], { font: fontIn(rPr), based: /<w:basedOn w:val="([^"]*)"/.exec(m[2])?.[1] });
  }
  return { def: fontIn(defBlock), byId };
}
function styleFont(st: Styles, id: string | undefined): string | undefined {
  for (let k = 0, cur = id; cur && k < 12; k++) {
    const s = st.byId.get(cur);
    if (!s) return undefined;
    if (s.font) return s.font;
    cur = s.based;
  }
  return undefined;
}

/**
 * Đổi chữ phông cũ trong document.xml. Trả về XML mới và số đoạn chữ (run) đã đổi.
 * stylesXml: nội dung word/styles.xml (để biết phông mặc định, phông theo kiểu đoạn / kiểu ký tự).
 */
export function fixLegacyXml(docXml: string, stylesXml = ''): { xml: string; runs: number; kinds: Set<Legacy> } {
  const st = readStyles(stylesXml);
  const defFont = st.def ?? styleFont(st, 'Normal');
  let runs = 0;
  const kinds = new Set<Legacy>();
  // tạm cất hình / khung chữ (bên trong có run lồng nhau) để tách run không bị lệch
  const kept: string[] = [];
  const keep = (s: string) => `\u0000${kept.push(s) - 1}\u0000`;
  let xml = docXml
    .replace(/<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g, keep)
    .replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, keep)
    .replace(/<w:pict>[\s\S]*?<\/w:pict>/g, keep)
    .replace(/<w:object\b[\s\S]*?<\/w:object>/g, keep);

  // lượt 1: đọc từng đoạn văn và các run của nó
  type R = { m: string; open: string; body: string; font?: string; text: string; legacy: ReturnType<typeof fontLegacy> };
  type P = { m: string; list: R[] };
  const paras: P[] = [];
  for (const pm of xml.matchAll(/<w:p\b[^>]*?(?:\/>|>[\s\S]*?<\/w:p>)/g)) {
    const para = pm[0];
    if (!/<w:t[\s>]/.test(para)) continue;
    const pFont = styleFont(st, /<w:pStyle w:val="([^"]*)"/.exec(para)?.[1]) ?? defFont;
    const list: R[] = [];
    for (const m of para.matchAll(/<w:r\b([^>]*)>([\s\S]*?)<\/w:r>/g)) {
      const rPr = /^\s*<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(m[2])?.[1] ?? '';
      const font = fontIn(rPr) ?? styleFont(st, /<w:rStyle w:val="([^"]*)"/.exec(rPr)?.[1]) ?? pFont;
      const text = [...m[2].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((t) => unxml(t[1])).join('');
      list.push({ m: m[0], open: m[1], body: m[2], font, text, legacy: fontLegacy(font) });
    }
    paras.push({ m: para, list });
  }
  // Cả file có đúng là chữ phông cũ không: chữ trong phông cũ có ký tự đặc trưng của bảng mã và không có chữ Unicode
  // ngoài Latin-1. File phông .VnTime mà gõ Unikey ("giáo án") thì không đổi — tránh lỗi "giỏo ỏn".
  const legacyText = paras.flatMap((p) => p.list.filter((r) => r.legacy).map((r) => r.text)).join('\n');
  const fileIsLegacy = Boolean(detectLegacy(legacyText)) && !NON_LATIN1.test(legacyText);

  // lượt 2: đổi chữ
  for (const p of paras) {
    // run không ghi phông cũ: đoán theo chữ của cả đoạn (chữ phông cũ dán sang phông khác vẫn đổi được)
    const guess = detectLegacy(p.list.filter((r) => !r.legacy).map((r) => r.text).join(''));
    // đoạn có ký tự đặc trưng của bảng mã cũ trong các run phông cũ
    const paraSigned = Boolean(detectLegacy(p.list.filter((r) => r.legacy).map((r) => r.text).join(''), 1));
    let out = p.m;
    for (const r of p.list) {
      // chữ bảng mã cũ chỉ gồm ký tự Latin-1; có chữ ngoài Latin-1 (ạ, ơ, ư, đ…) = đã là Unicode → để nguyên
      if (!r.text || NON_LATIN1.test(r.text)) continue;
      const kind = r.legacy && (paraSigned || fileIsLegacy) ? r.legacy.kind : r.legacy ? null : guess;
      if (!kind) continue;
      const upper = r.legacy?.upper ?? false;
      const body = r.body.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g, (_, a: string, t: string, b: string) => `${a}${xesc(toUnicode(unxml(t), kind, upper))}${b}`);
      const withFont = /^\s*<w:rPr>/.test(body)
        ? body.replace(/^(\s*<w:rPr>)([\s\S]*?)(<\/w:rPr>)/, (_, a: string, x: string, b: string) => `${a}${/<w:rFonts\b[^>]*\/>/.test(x) ? x.replace(/<w:rFonts\b[^>]*\/>/, TNR) : TNR + x}${b}`)
        : `<w:rPr>${TNR}</w:rPr>${body}`;
      if (withFont === r.body) continue;
      const next = `<w:r${r.open}>${withFont}</w:r>`;
      out = out.replace(r.m, () => next); // hàm thay thế: chữ có "$" không bị hiểu nhầm
      runs++;
      kinds.add(kind);
    }
    if (out !== p.m) xml = xml.replace(p.m, () => out);
  }
  xml = xml.replace(/\u0000(\d+)\u0000/g, (_, i: string) => kept[Number(i)]);
  return { xml, runs, kinds };
}
