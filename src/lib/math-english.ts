// Toán song ngữ: đọc phép tính và từ vựng Toán trong đề bằng tiếng Anh (không dịch máy cả câu).
// - Phép tính trong đề ("7 + 5 = ?", "36 : 4 = …") → câu tiếng Anh: "Seven plus five equals what?"
// - Số trong đề → chữ tiếng Anh ("12 · twelve"); thuật ngữ Toán quen thuộc → từ tiếng Anh ("tổng · sum").
// - Vài câu lệnh hay gặp ("Tính", "Điền số thích hợp"…) → câu lệnh tiếng Anh tương ứng.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` and ${under1000(rest)}` : ''}`;
}

/** Số nguyên 0 – 999 999 999 → chữ tiếng Anh (Anh – Anh: "one hundred and five"). */
export function numberToEnglish(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e9) return String(n);
  if (n < 1000) return under1000(n);
  const parts: string[] = [];
  const millions = Math.floor(n / 1e6), thousands = Math.floor((n % 1e6) / 1000), rest = n % 1000;
  if (millions) parts.push(`${under1000(millions)} million`);
  if (thousands) parts.push(`${under1000(thousands)} thousand`);
  if (rest) parts.push(rest < 100 ? `and ${under1000(rest)}` : under1000(rest));
  return parts.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}

/** Chuỗi số kiểu Việt Nam ("1.000", "3,5") → chữ tiếng Anh ("one thousand", "three point five"). */
export function numeralToEnglish(raw: string): string {
  const s = raw.trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return numberToEnglish(Number(s.replace(/\./g, '')));
  const m = s.match(/^(\d+)(?:,(\d+))?$/);
  if (!m) return s;
  const whole = numberToEnglish(Number(m[1]));
  if (!m[2]) return whole;
  return `${whole} point ${[...m[2]].map((d) => ONES[Number(d)]).join(' ')}`;
}

const OP_WORD: Record<string, string> = {
  '+': 'plus', '-': 'minus', '−': 'minus', '–': 'minus', '×': 'times', x: 'times', '*': 'times',
  ':': 'divided by', '÷': 'divided by', '=': 'equals', '>': 'is greater than', '<': 'is less than',
};
export const OPERATOR_VOCAB: { sign: string; en: string }[] = [
  { sign: '+', en: 'plus' }, { sign: '−', en: 'minus' }, { sign: '×', en: 'times' },
  { sign: ':', en: 'divided by' }, { sign: '=', en: 'equals' }, { sign: '>', en: 'greater than' }, { sign: '<', en: 'less than' },
];

const NUM = String.raw`\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?`;
const BLANK = String.raw`\?|…|\.{3}|_+|□`;
const TERM = `(?:${NUM}|${BLANK})`;
// Dấu chia ":" phải cách đều hai bên ("36 : 4") hoặc dính liền ("36:4"); "Bài 1: 3 + 4" không phải phép chia.
const OP = String.raw`(?:\s*[+\-−–×x*÷]\s*|\s+:\s+|:)`;
// Một phép tính: số (op số)+ (= / > / < kết quả)?  — hoặc số (=/>/<) số
const EXPR_RE = new RegExp(String.raw`${TERM}(?:${OP}${TERM})+(?:\s*[=<>]\s*${TERM})?|${TERM}\s*[=<>]\s*${TERM}`, 'g');

/** Ẩn x, y trong đề ("x + 5 = 9", "36 : y = 4") coi như ô trống để đọc "what". */
function blankVariables(text: string): string {
  return text
    .replace(/(^|[^\p{L}])[xy](?=\s*[+\-−–×*:÷=<>])/gu, '$1?')
    .replace(/([+\-−–×*:÷=<>]\s*)[xy](?![\p{L}\d])/gu, '$1?');
}

/** Các phép tính trong đề, kèm câu tiếng Anh tương ứng. */
export function expressionsInEnglish(prompt: string): { math: string; en: string; time?: boolean }[] {
  const out: { math: string; en: string; time?: boolean }[] = [];
  for (const m of blankVariables(prompt).matchAll(EXPR_RE)) {
    const math = m[0].trim();
    if (!/[+\-−–×x*:÷=<>]/.test(math) || !/\d/.test(math)) continue;
    const time = math.match(/^(\d{1,2}):(\d{2})$/);
    if (time) {
      // giờ đồng hồ "7:30" → "seven thirty", "8:05" → "eight oh five", "9:00" → "nine o'clock"
      const h = numberToEnglish(Number(time[1])), mm = Number(time[2]);
      const en = mm === 0 ? `${h} o'clock` : mm < 10 ? `${h} oh ${ONES[mm]}` : `${h} ${numberToEnglish(mm)}`;
      if (!out.some((x) => x.math === math)) out.push({ math, en: `${en.charAt(0).toUpperCase()}${en.slice(1)}.`, time: true });
      continue;
    }
    // "x" chỉ là dấu nhân khi đứng giữa hai số (tránh nhầm chữ x)
    const tokens = math.match(new RegExp(`${TERM}|[+\\-−–×x*:÷=<>]`, 'g')) ?? [];
    let hasBlank = false;
    const words = tokens.map((t) => {
      if (OP_WORD[t]) return OP_WORD[t];
      if (new RegExp(`^(?:${BLANK})$`).test(t)) { hasBlank = true; return 'what'; }
      return numeralToEnglish(t);
    });
    let en = words.join(' ').replace(/\s+/g, ' ').trim();
    en = en.charAt(0).toUpperCase() + en.slice(1) + (hasBlank ? '?' : '.');
    if (!out.some((x) => x.math === math)) out.push({ math, en });
  }
  return out.slice(0, 4);
}

// Thuật ngữ Toán tiểu học (dài trước, ngắn sau để "số bị trừ" không bị bắt thành "số trừ").
const TERMS: [string, string][] = [
  ['trung bình cộng', 'average'], ['số liền trước', 'the number before'], ['số liền sau', 'the number after'],
  ['hình chữ nhật', 'rectangle'], ['hình tam giác', 'triangle'], ['hình vuông', 'square'], ['hình tròn', 'circle'],
  ['khối lập phương', 'cube'], ['khối hộp chữ nhật', 'cuboid'], ['đoạn thẳng', 'line segment'], ['đường thẳng', 'straight line'],
  ['số bị trừ', 'minuend'], ['số bị chia', 'dividend'], ['số hạng', 'addend'], ['số trừ', 'subtrahend'], ['số chia', 'divisor'],
  ['thừa số', 'factor'], ['số thập phân', 'decimal'], ['phân số', 'fraction'], ['tử số', 'numerator'], ['mẫu số', 'denominator'],
  ['chu vi', 'perimeter'], ['diện tích', 'area'], ['thể tích', 'volume'], ['góc vuông', 'right angle'],
  ['lớn nhất', 'the greatest'], ['bé nhất', 'the smallest'], ['nhỏ nhất', 'the smallest'],
  ['lớn hơn', 'greater than'], ['bé hơn', 'less than'], ['nhỏ hơn', 'less than'],
  ['số chẵn', 'even number'], ['số lẻ', 'odd number'], ['so sánh', 'compare'],
  ['tổng', 'sum'], ['hiệu', 'difference'], ['tích', 'product'], ['thương', 'quotient'],
  ['phép cộng', 'addition'], ['phép trừ', 'subtraction'], ['phép nhân', 'multiplication'], ['phép chia', 'division'],
  ['chục', 'tens'], ['đơn vị', 'ones'], ['trăm', 'hundreds'], ['nghìn', 'thousand'], ['triệu', 'million'],
  ['xăng-ti-mét', 'centimetre'], ['mi-li-mét', 'millimetre'], ['ki-lô-mét', 'kilometre'], ['ki-lô-gam', 'kilogram'],
  ['đề-xi-mét', 'decimetre'], ['lít', 'litre'], ['đồng hồ', 'clock'], ['phút', 'minute'], ['giây', 'second'],
  ['tuần', 'week'], ['tháng', 'month'], ['ngày', 'day'], ['tiền', 'money'], ['đồng', 'dong'],
];

const PHRASES: [RegExp, string][] = [
  [/^\s*đặt tính rồi tính/i, 'Set out and calculate.'],
  [/^\s*tính nhẩm/i, 'Calculate in your head.'],
  [/^\s*tính/i, 'Calculate.'],
  [/điền (số|dấu)? ?thích hợp|điền vào chỗ (trống|chấm)|số thích hợp/i, 'Fill in the blank.'],
  [/điền dấu/i, 'Write >, < or =.'],
  [/chọn (đáp án|câu trả lời) đúng|khoanh vào/i, 'Choose the correct answer.'],
  [/đúng ghi đ|đúng hay sai/i, 'True or false?'],
  [/sắp xếp/i, 'Put them in order.'],
  [/có (tất cả )?bao nhiêu/i, 'How many are there?'],
  [/^\s*so sánh/i, 'Compare.'],
  [/đếm/i, 'Count.'],
  [/tìm x|tìm số/i, 'Find the missing number.'],
  [/mấy giờ/i, 'What time is it?'],
];

const NUM_RE = new RegExp(NUM, 'g');

export type MathEnglish = {
  /** câu lệnh tiếng Anh (nếu nhận ra) */ instruction: string | null;
  expressions: { math: string; en: string; time?: boolean }[];
  numbers: { n: string; en: string }[];
  terms: { vi: string; en: string }[];
  operators: { sign: string; en: string }[];
};

/** Tách phần tiếng Anh cho một đề Toán (kèm đề phụ: các dòng điền ô). */
export function mathEnglishFor(prompt: string, extra: string[] = []): MathEnglish {
  const text = [prompt, ...extra.map((l) => l.replace(/\{\}/g, ' ? '))].join('\n');
  const instruction = PHRASES.find(([re]) => re.test(prompt))?.[1] ?? null;
  const expressions = expressionsInEnglish(text);

  const seen = new Set<string>();
  const numbers: { n: string; en: string }[] = [];
  for (const m of text.matchAll(NUM_RE)) {
    const n = m[0];
    if (seen.has(n) || numbers.length >= 8) continue;
    seen.add(n);
    numbers.push({ n, en: numeralToEnglish(n) });
  }

  let rest = ` ${text.toLowerCase()} `;
  const terms: { vi: string; en: string }[] = [];
  for (const [vi, en] of TERMS) {
    // thuật ngữ chỉ gồm chữ, dấu cách và "-" nên dùng thẳng trong biểu thức
    const re = new RegExp(`(^|[^\\p{L}])${vi}(?=$|[^\\p{L}])`, 'u');
    if (!re.test(rest)) continue;
    terms.push({ vi, en });
    rest = rest.replace(new RegExp(vi, 'gu'), ' ');
    if (terms.length >= 6) break;
  }

  const operators = OPERATOR_VOCAB.filter(({ sign }) => {
    const alts = sign === '−' ? ['−', '-', '–'] : sign === '×' ? ['×', 'x', '*'] : sign === ':' ? [':', '÷'] : [sign];
    return expressions.some((e) => !e.time && alts.some((a) => e.math.includes(a)));
  });

  return { instruction, expressions, numbers, terms, operators };
}

/** Câu tiếng Anh để đọc to: câu lệnh + phép tính; không có phép tính thì đọc các số và thuật ngữ. */
export function englishSpeech(me: MathEnglish): string {
  const parts: string[] = [];
  if (me.instruction) parts.push(me.instruction);
  if (me.expressions.length) parts.push(...me.expressions.map((e) => e.en));
  else {
    if (me.numbers.length) parts.push(`${me.numbers.map((x) => x.en).join(', ')}.`);
    const lead = (me.instruction ?? '').toLowerCase();
    const terms = me.terms.filter((x) => !lead.includes(x.en)); // "Compare." đã đọc thì không đọc lại "compare"
    if (terms.length) parts.push(`${terms.map((x) => x.en).join(', ')}.`);
  }
  return parts.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}
