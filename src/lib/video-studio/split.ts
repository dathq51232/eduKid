// Tách kịch bản thành các cảnh 8 giây bằng thuật toán (không cần AI):
// 1) cắt lời kể thành câu, câu dài cắt tiếp ở dấu phẩy; 2) gom câu vào từng cảnh sao cho lời đọc vừa 8 giây
// (tiếng Việt ~20 từ, tiếng Anh ~16 từ); 3) nhận dạng loại cảnh (mở đầu, câu hỏi, ví dụ, phép tính, khen, kết)
// và từ khoá (đồng hồ, sách, cây…) để ghép sẵn 3 nhịp hành động bằng tiếng Anh cho Veo, có khung đầu / khung cuối nối nhau.
import { alias, type LibItem, type Narration } from './presets';
import { uid, type VsClip } from './prompt';

export const CLIP_SECONDS = 8;
export const MAX_CLIPS = 30;
/** số từ lời đọc vừa một cảnh 8 giây */
export const wordLimit = (n: Narration) => (n === 'en' ? 16 : 20);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** Cắt văn bản thành câu; câu quá dài cắt ở dấu phẩy / chấm phẩy, vẫn dài thì cắt theo số từ */
export function sentences(text: string, max: number): string[] {
  const raw = text.replace(/\r/g, '').split(/\n+|(?<=[.!?…])\s+/).map((s) => s.replace(/^[-•*\d.)\s]+(?=\D)/, '').trim()).filter((s) => words(s).length);
  const out: string[] = [];
  for (const s of raw) {
    if (words(s).length <= max) { out.push(s); continue; }
    let cur = '';
    for (const part of s.split(/(?<=[,;:])\s+/)) {
      const t = cur ? `${cur} ${part}` : part;
      if (words(t).length <= max) { cur = t; continue; }
      if (cur) out.push(cur);
      if (words(part).length <= max) { cur = part; continue; }
      // cắt đều (không để sót một mẩu ngắn cuối câu): 26 từ, tối đa 20 -> 13 + 13
      cur = '';
      const pieces = cutLong(words(part), max);
      pieces.slice(0, -1).forEach((x) => out.push(x));
      cur = pieces[pieces.length - 1];
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** Cắt một vế quá dài (không có dấu phẩy) thành các đoạn ≤ max từ, ưu tiên cắt trước từ nối gần giữa đoạn */
const JOIN = new Set(['thì', 'và', 'nhưng', 'rồi', 'để', 'vì', 'nên', 'khi', 'mà', 'hay', 'hoặc', 'trên', 'dưới', 'của', 'and', 'but', 'so', 'because', 'when', 'then', 'or']);
function cutLong(w: string[], max: number): string[] {
  if (w.length <= max) return [w.join(' ')];
  const k = Math.ceil(w.length / max), ideal = Math.ceil(w.length / k);
  let at = ideal, best = Infinity;
  for (let i = Math.max(3, w.length - max); i <= Math.min(max, w.length - 3); i++) {
    if (!JOIN.has(w[i].toLowerCase())) continue;
    const d = Math.abs(i - ideal);
    if (d < best) { best = d; at = i; }
  }
  return [w.slice(0, at).join(' '), ...cutLong(w.slice(at), max)];
}

/** Gom câu thành lời đọc của từng cảnh (mỗi cảnh ≤ max từ, không cắt ngang câu nếu tránh được) */
export function packClips(text: string, max: number): string[] {
  const list = sentences(text, max);
  const out: string[] = [];
  let cur = '';
  list.forEach((s, i) => {
    const last = i === list.length - 1 && list.length >= 3; // câu kết (chào, mời luyện tập) luôn là cảnh riêng
    const newIdea = /^(vi du|chang han|vi sao|tai sao|lam the nao|for example|why|how)(?![a-z])/.test(fold(s)) || /\?$/.test(s.trim()); // câu hỏi, ví dụ: mở cảnh mới
    const t = cur ? `${cur} ${s}` : s;
    if (cur && (last || (newIdea && words(cur).length >= max / 4) || words(t).length > max)) { out.push(cur); cur = s; } else cur = t;
  });
  if (cur) out.push(cur);
  return out.slice(0, MAX_CLIPS);
}

type Kind = 'intro' | 'question' | 'example' | 'math' | 'praise' | 'outro' | 'explain';
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
function kindOf(text: string, i: number, n: number): Kind {
  const f = fold(text);
  if (n > 1 && i === n - 1) return 'outro';
  if (i === 0) return 'intro';
  if (/\?|\b(vi sao|tai sao|lam the nao|lam sao|bao nhieu|the nao|co biet|why|how|what|which)\b/.test(f)) return 'question';
  if (/\d\s*[+\-x×*:÷=]\s*\d|\b(cong|tru|nhan|chia|bang|plus|minus|times|equals)\b/.test(f)) return 'math';
  if (/\b(vi du|chang han|for example|such as|thu xem|cung lam)\b/.test(f)) return 'example';
  if (/!|\b(gioi|tuyet|dung roi|hoan ho|great|well done|good job)\b/.test(f)) return 'praise';
  return 'explain';
}

/** Đồ vật minh hoạ theo từ khoá (biểu tượng không chữ, không số) */
const PROP_LIST: [string, string][] = [
  ['dong ho|gio|phut|clock|time', 'a big round clock icon without numbers'],
  ['sach|doc|truyen|book|read', 'an open picture book'],
  ['viet|chu|but|vo|write|pencil', 'a large pencil and an open notebook with simple line doodles'],
  ['toan|phep tinh|cong|tru|nhan|chia|dem|math|count|number', 'a row of colorful counting blocks'],
  ['tieng anh|english|word|tu vung', 'a friendly globe icon and picture cards'],
  ['nuoc|uong|water|drink', 'a clear glass of water'],
  ['cay|la|hoa|plant|tree|flower', 'a small green potted plant'],
  ['an|com|qua|rau|food|fruit|apple', 'a bowl of colorful fruit'],
  ['ngu|nghi|sleep|rest|bed', 'a soft pillow and a crescent moon icon'],
  ['the duc|chay|nhay|tap|sport|run|exercise', 'a bouncy ball and a jump rope'],
  ['rang|danh rang|tooth|teeth', 'a toothbrush and a smiling tooth icon'],
  ['tay|rua tay|xa phong|wash|soap', 'a soap bar with bubbles'],
  ['giao thong|duong|xe|den do|traffic|road', 'a traffic light icon and a zebra crossing'],
  ['nhac|hat|song|music|sing', 'floating music note icons'],
  ['mat troi|troi|mua|nang|weather|sun|rain', 'a sun and cloud icon'],
  ['may tinh|dien thoai|man hinh|screen|computer', 'a tablet with a blank glowing screen'],
  ['hen gio|tap trung|focus|timer', 'a small kitchen timer icon'],
];
const PROPS = PROP_LIST.map(([k, v]) => [new RegExp(`(?:^|[^a-z])(?:${k})(?=$|[^a-z])`), v] as const);
const propOf = (text: string) => { const f = fold(text); return PROPS.find(([re]) => re.test(f))?.[1] ?? DEFAULT_PROP; };
const DEFAULT_PROP = 'a glowing light bulb icon';
/** Phép tính trong câu để chèn chữ khi dựng (Veo không vẽ chữ / số) */
const mathOf = (text: string) => text.match(/\d+(?:\s*[+\-x×*:÷]\s*\d+)+(?:\s*=\s*\d+)?/)?.[0].replace(/\s+/g, ' ') ?? '';

/** Vai trong cảnh: người giảng (cô / thầy) và người hỏi (học sinh) */
export function roles(cast: LibItem[]): { T: string; K: string; K2: string } {
  const isTeacher = (c: LibItem) => /^(co|thay|ong|ba|bac|me|bo)\b/.test(fold(c.name)) || /giao vien|co giao|thay giao|teacher|nguoi lon/.test(fold(c.note));
  const t = cast.find(isTeacher), kids = cast.filter((c) => c !== t);
  const name = (c?: LibItem) => (c ? alias(c.name) : '');
  const K = name(kids[0] ?? t), T = name(t ?? kids[1] ?? kids[0]);
  return { T, K, K2: name(kids[1]) };
}

type Beats = [string, string, string];
function beatsFor(kind: Kind, r: { T: string; K: string; K2: string }, prop: string, v: number): { beats: Beats; end: string } {
  const { T, K } = r, solo = T === K;
  const B = r.K2 || K;
  const pick = <X,>(xs: X[]) => xs[v % xs.length];
  switch (kind) {
    case 'intro': return pick([
      { beats: [`${K} walks in from the left, waves hello to the camera with a big smile.`, solo ? `${K} looks around curiously and spots ${prop}.` : `${T} steps forward on the right and waves back warmly, then gestures toward ${prop}.`, `${K} hops once with excitement and points at ${prop}.`] as Beats, end: `${K} stands on the left pointing at ${prop}${solo ? '' : `, ${T} stands on the right smiling`}.` },
      { beats: [`${K} skips into the frame and stops at the center, eyes wide with curiosity.`, solo ? `${K} pulls out ${prop} and holds it up proudly.` : `${T} appears beside ${K} holding ${prop} and kneels to child height.`, `${K} claps both hands together, ready to learn.`] as Beats, end: `${K} faces ${solo ? 'the camera' : T} with clasped hands${solo ? '' : `, ${T} holds ${prop}`}.` },
    ]);
    case 'question': return pick([
      { beats: [`${K} tilts the head and taps the chin, a small question-mark icon pops above.`, `${K} raises one hand high toward ${solo ? 'the camera' : T}.`, solo ? `${K} leans closer to ${prop}, thinking hard.` : `${T} nods kindly and lifts ${prop} to show the answer.`] as Beats, end: solo ? `${K} studies ${prop} closely.` : `${T} holds ${prop} up while ${K} watches with wide eyes.` },
      { beats: [`${B} scratches the head with a puzzled face.`, `${B} turns to ${solo ? 'the camera' : T} and shrugs both shoulders.`, solo ? `${B} spots ${prop} and a light bulb icon flickers above.` : `${T} smiles, crouches down and points at ${prop}.`] as Beats, end: `${B} looks at ${prop} with growing understanding.` },
    ]);
    case 'math': return pick([
      { beats: [`${solo ? K : T} places colorful counting blocks one by one on a table.`, `${K} counts along, touching each block with one finger and nodding.`, `${K} pushes the blocks together into one group and throws both arms up happily.`] as Beats, end: `${K} stands beside one neat group of counting blocks, arms raised.` },
      { beats: [`${K} lines up small round apples in two groups on a table.`, `${solo ? K : T} slides the two groups together with both hands.`, `${K} counts them with a finger, then gives a big thumbs up.`] as Beats, end: `${K} gives a thumbs up next to one group of apples.` },
    ]);
    case 'example': return pick([
      { beats: [`${solo ? K : T} holds up ${prop} and turns it slowly so everyone can see.`, `${K} copies the action carefully, step by step.`, `${K} shows the result proudly to the camera.`] as Beats, end: `${K} holds the finished result up toward the camera.` },
      { beats: [`${K} walks to ${prop} and examines it closely.`, `${K} tries it once, wobbles, then tries again more carefully.`, `${K} succeeds and does a small happy spin.`] as Beats, end: `${K} stands beside ${prop}, smiling after a small spin.` },
    ]);
    case 'praise': return pick([
      { beats: [`${K} finishes the task and looks up hopefully.`, solo ? `${K} jumps with joy as soft confetti shapes fall.` : `${T} claps warmly and gives ${K} a gentle high five.`, `A bright star icon pops above ${K}, who beams with pride.`] as Beats, end: `${K} glows with pride under a bright star icon.` },
      { beats: [`${K} and ${B === K ? 'the camera' : B} cheer together, pumping fists in the air.`, `Soft colorful confetti shapes float down around them.`, `${K} takes a cheerful little bow.`] as Beats, end: `${K} finishes a cheerful bow among floating confetti shapes.` },
    ]);
    case 'outro': return { beats: [`${K}${solo ? '' : ` and ${T}`} stand side by side facing the camera.`, `${K} gives a big thumbs up and nods.`, `They wave goodbye happily and the camera gently pulls back.`], end: `${K}${solo ? '' : ` and ${T}`} waving goodbye in a calm wide shot.` };
    default: return pick([
      { beats: [`${solo ? K : T} points at ${prop} and traces its shape with one hand.`, `${K} leans in, watching closely and nodding slowly.`, `${K} smiles as a small light bulb icon glows above.`] as Beats, end: `${K} smiles under a glowing light bulb icon beside ${prop}.` },
      { beats: [`${solo ? K : T} draws a simple picture of ${prop} in the air with a fingertip, leaving a soft glowing outline.`, `${K} follows the glowing outline with wide eyes.`, `${K} nods firmly and taps the temple to remember.`] as Beats, end: `${K} taps the temple with a confident smile.` },
      { beats: [`${K} walks beside ${solo ? prop : T} across the setting.`, `${solo ? K : T} stops and demonstrates with ${prop}, moving slowly.`, `${K} repeats the movement and grins.`] as Beats, end: `${K} grins after repeating the movement with ${prop}.` },
    ]);
  }
}

/** Kịch bản -> danh sách cảnh 8 giây, sẵn hành động, khung đầu / cuối, lời đọc, chữ chèn khi dựng */
export function autoSplit(o: { script: string; narration: Narration; cast: LibItem[]; settingId: string; settingName?: string }): VsClip[] {
  const parts = packClips(o.script, wordLimit(o.narration));
  const r = roles(o.cast);
  const castIds = o.cast.map((c) => c.id);
  let lastProp = '';
  return parts.map((text, i) => {
    const kind = kindOf(text, i, parts.length);
    const found = propOf(text);
    // câu không có từ khoá đồ vật: giữ đồ vật của cảnh trước để câu chuyện liền mạch
    const prop = found === DEFAULT_PROP && lastProp ? lastProp : found;
    lastProp = prop;
    const { beats, end } = r.K ? beatsFor(kind, r, prop, i) : { beats: [`The camera glides slowly across the setting toward ${prop}.`, `${prop} gently glows and comes into focus.`, 'The camera settles on a calm, clear view.'] as Beats, end: `A calm clear view of ${prop}.` };
    const first = i === 0 && r.K
      ? `${r.K} stands on the left${r.T !== r.K ? `, ${r.T} stands on the right` : ''}${r.K2 ? `, ${r.K2} stands in the middle` : ''}, all fully visible in ${o.settingName ? 'the setting' : 'a clear establishing view'}.`
      : '';
    return { id: uid(), settingId: o.settingId, cast: castIds, firstFrame: first, beats, dialogue: text, endFrame: end, overlay: mathOf(text) };
  });
}
