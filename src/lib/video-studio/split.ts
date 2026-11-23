// Tách kịch bản thành các cảnh 8 giây bằng thuật toán (không cần AI):
// 1) cắt lời kể thành câu, câu dài cắt tiếp ở dấu phẩy; 2) gom câu vào từng cảnh sao cho lời đọc vừa 8 giây
// (tiếng Việt ~26 từ, tiếng Anh ~20 từ); 3) nhận dạng loại cảnh (mở đầu, câu hỏi, ví dụ, phép tính, khen, lo lắng, kết)
// và từ khoá (trái tim, đồng hồ, sách…) để ghép sẵn 3 nhịp hành động bằng tiếng Anh cho Veo — mỗi nhịp có góc máy,
// động tác chính và phản ứng của nhân vật khác — có khung đầu / khung cuối nối nhau.
import { alias, type LibItem, type Narration } from './presets';
import { uid, wordLimit, type VsClip } from './prompt';

export { wordLimit };

export const CLIP_SECONDS = 8;
export const MAX_CLIPS = 30;

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
  // mẩu quá ngắn (sót lại sau khi cắt câu) ghép vào cảnh trước nếu vừa — tránh cảnh 8 giây chỉ có vài từ
  for (let i = out.length - 1; i > 0; i--) {
    const keep = i === out.length - 1 && out.length >= 3; // câu kết vẫn là cảnh riêng
    if (!keep && words(out[i]).length < max / 3 && words(out[i - 1]).length + words(out[i]).length <= max) out.splice(i - 1, 2, `${out[i - 1]} ${out[i]}`);
  }
  return out.slice(0, MAX_CLIPS);
}

type Kind = 'intro' | 'question' | 'example' | 'math' | 'praise' | 'concern' | 'outro' | 'explain';
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
/** So khớp từ khoá GIỮ DẤU (không bỏ dấu: “sống” khác “song”, “giờ” khác “gió”), có ranh giới từ cho chữ Việt */
const LETTER = 'a-z0-9À-ɏḀ-ỿ';
const kw = (k: string) => new RegExp(`(?:^|[^${LETTER}])(?:${k})(?=$|[^${LETTER}])`);
const low = (s: string) => s.toLowerCase().normalize('NFC');
const RE_QUESTION = kw('vì sao|tại sao|làm thế nào|làm sao|bao nhiêu|thế nào|có biết|why|how|what|which');
const RE_MATH_WORD = kw('cộng|trừ|nhân với|chia cho|bằng mấy|plus|minus|times|equals');
const RE_EXAMPLE = kw("ví dụ|chẳng hạn|thử xem|cùng làm|for example|such as|let's try");
const RE_PRAISE = kw('giỏi|tuyệt|đúng rồi|hoan hô|great|well done|good job');
const RE_CONCERN = kw('buồn|khóc|giận|nóng giận|cáu|bạo lực|đánh nhau|đánh(?! răng)|bắt nạt|xô đẩy|chế giễu|trêu chọc|sợ hãi|sợ|cô đơn|đau|tổn thương|cãi nhau|thiếu suy nghĩ|sad|cry|angry|bully|hurt|scared|lonely');
function kindOf(text: string, i: number, n: number): Kind {
  const t = low(text);
  if (n > 1 && i === n - 1) return 'outro';
  if (i === 0) return 'intro';
  if (/\?/.test(t) || RE_QUESTION.test(t)) return 'question';
  if (RE_CONCERN.test(t)) return 'concern';
  if (/\d\s*[+\-x×*:÷=]\s*\d/.test(t) || (/\d/.test(t) && RE_MATH_WORD.test(t))) return 'math';
  if (RE_EXAMPLE.test(t)) return 'example';
  if (/!/.test(t) || RE_PRAISE.test(t)) return 'praise';
  return 'explain';
}

/** Đồ vật minh hoạ theo từ khoá (biểu tượng không chữ, không số) — thứ tự = ưu tiên */
const PROP_LIST: [string, string][] = [
  ['yêu thương|tôn trọng|quan tâm|chia sẻ|tử tế|nhường nhịn|love|kind|kindness|respect|care', 'a soft glowing heart icon'],
  ['bạn bè|tình bạn|đoàn kết|kết bạn|friend|friends|friendship', 'a friendship icon of two small hands holding together'],
  ['bình yên|hoà bình|hòa bình|peace|peaceful', 'a white dove icon gliding gently'],
  ['bạo lực|bắt nạt|đánh nhau|xô đẩy|nóng giận|giận|cãi nhau|chế giễu|trêu chọc|bully|fight|angry', 'a small grey cloud icon'],
  ["đồng hồ|mấy giờ|phút|clock|o'clock", 'a big round clock icon without numbers'],
  ['hẹn giờ|tập trung|focus|timer', 'a small kitchen timer icon'],
  ['sách|đọc|truyện|book|read|story', 'an open picture book'],
  ['viết|chữ|bút|vở|write|pencil', 'a large pencil and an open notebook with simple line doodles'],
  ['toán|phép tính|cộng|trừ|đếm|con số|math|count|number', 'a row of colorful counting blocks'],
  ['tiếng anh|english|từ vựng|vocabulary', 'a friendly globe icon and picture cards'],
  ['uống nước|nước uống|uống|water|drink', 'a clear glass of water'],
  ['cây|lá|hoa|plant|tree|flower', 'a small green potted plant'],
  ['ăn|cơm|trái cây|hoa quả|rau|food|fruit|apple', 'a bowl of colorful fruit'],
  ['ngủ|nghỉ ngơi|sleep|rest|bed', 'a soft pillow and a crescent moon icon'],
  ['thể dục|chạy|nhảy|vận động|sport|run|exercise', 'a bouncy ball and a jump rope'],
  ['răng|đánh răng|tooth|teeth', 'a toothbrush and a smiling tooth icon'],
  ['rửa tay|xà phòng|wash|soap', 'a soap bar with bubbles'],
  ['giao thông|đèn đỏ|qua đường|xe cộ|traffic|road', 'a traffic light icon and a zebra crossing'],
  ['âm nhạc|nhạc|bài hát|hát|music|sing|song', 'floating music note icons'],
  ['mặt trời|mưa|nắng|thời tiết|weather|sun|rain', 'a sun and cloud icon'],
  ['máy tính|điện thoại|màn hình|screen|computer|phone', 'a tablet with a blank glowing screen'],
];
const PROPS = PROP_LIST.map(([k, v]) => [kw(k), v] as const);
const DEFAULT_PROP = 'a glowing light bulb icon';
const propOf = (text: string) => { const t = low(text); return PROPS.find(([re]) => re.test(t))?.[1] ?? DEFAULT_PROP; };
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

/** Góc máy cho 3 nhịp — mỗi cảnh 8 giây đi từ toàn cảnh → trung cảnh → cận cảnh để hình không đứng yên */
const SHOTS: [string, string, string][] = [
  ['Wide shot:', 'Medium shot, the camera slowly pushes in:', 'Medium close-up, gentle camera drift:'],
  ['Medium-wide shot, the camera tracks sideways:', 'Over-the-shoulder medium shot:', 'Close-up on the faces, soft focus behind:'],
  ['Wide shot, the camera glides in slowly:', 'Medium two-shot:', 'Slow push-in to a medium close-up:'],
];

type Beats = [string, string, string];
function beatsFor(kind: Kind, r: { T: string; K: string; K2: string }, prop: string, v: number): { beats: Beats; end: string } {
  const { T, K, K2 } = r, solo = T === K;
  const B = K2 || K;
  const pick = <X,>(xs: X[]) => xs[v % xs.length];
  /** nhân vật thứ ba phản ứng ở hậu cảnh (nếu có) */
  const also = K2 ? `, while ${K2} watches from nearby and nods along` : '';
  switch (kind) {
    case 'intro': return pick([
      { beats: [
        `${K} walks in from the left with light bouncy steps, looks around the setting with bright curious eyes, then waves hello to the camera with a big smile.`,
        solo ? `${K} notices ${prop} nearby, walks over, crouches down and studies it from both sides with raised eyebrows.` : `${T} steps in from the right, waves back warmly, kneels to child height and gestures with an open hand toward ${prop} between them${also}.`,
        `${K} hops once with excitement, points at ${prop} and turns to the camera with an eager nod, ready to begin.`] as Beats,
        end: `${K} stands on the left pointing at ${prop}${solo ? '' : `, ${T} stands on the right smiling`}${K2 ? `, ${K2} stands in the middle` : ''}.` },
      { beats: [
        `${K} skips into the frame, stops at the center and turns around slowly, taking in the whole setting with wide eyes.`,
        solo ? `${K} pulls out ${prop}, holds it up proudly with both hands and tilts it toward the camera.` : `${T} appears beside ${K} holding ${prop}, kneels down and holds it at eye level so ${K} can see it clearly${also}.`,
        `${K} claps both hands together, bounces on the toes and leans forward, ready to learn.`] as Beats,
        end: `${K} faces ${solo ? 'the camera' : T} with clasped hands${solo ? '' : `, ${T} holds ${prop}`}.` },
    ]);
    case 'question': return pick([
      { beats: [
        `${K} stops walking, tilts the head and taps the chin slowly, a small question-mark icon pops up and bobs above.`,
        `${K} turns toward ${solo ? 'the camera' : T}, raises one hand high and waves it gently to ask${also}.`,
        solo ? `${K} leans closer to ${prop}, squints, then slowly lifts a finger as an idea starts to form.` : `${T} nods kindly, walks over and lifts ${prop} to eye level, inviting ${K} to look closer.`] as Beats,
        end: solo ? `${K} studies ${prop} closely, one finger raised.` : `${T} holds ${prop} up while ${K} watches with wide eyes.` },
      { beats: [
        `${B} scratches the head with a puzzled face, looks left and right, and a tiny question-mark icon blinks above.`,
        `${B} turns to ${solo ? 'the camera' : T} and shrugs both shoulders with open palms, eyebrows raised.`,
        solo ? `${B} spots ${prop}, walks closer, and a light bulb icon flickers on above the head.` : `${T} smiles, crouches down beside ${B} and points at ${prop}, encouraging ${B} to think.`] as Beats,
        end: `${B} looks at ${prop} with growing understanding.` },
    ]);
    case 'concern': {
      // chủ đề buồn / giận / bắt nạt: chỉ thể hiện cảm xúc và sự an ủi, không diễn cảnh đánh nhau (an toàn cho trẻ)
      const sad = K2 || K, helper = sad === K ? T : K;
      if (helper === sad) return {
        beats: [
          `${K} walks slowly with lowered head and slumped shoulders, a small grey cloud icon drifting above.`,
          `${K} stops, places one hand on the chest and takes a slow, deep breath with eyes closed.`,
          `${K} opens the eyes, the grey cloud fades away, and a small brave smile appears.`],
        end: `${K} stands calmly with a small brave smile, the grey cloud gone.`,
      };
      return pick([
        { beats: [
          `${sad} stands alone at the edge of the scene with slumped shoulders and a sad face, a small grey cloud icon hovering above the head.`,
          `${helper} notices, walks over gently, crouches beside ${sad} and places a kind hand on the shoulder.`,
          `${sad} looks up, the grey cloud slowly turns into a soft glowing heart icon, and both share a small comforting smile.`] as Beats,
          end: `${helper} stands beside ${sad}, a soft heart icon glowing above them.` },
        { beats: [
          `${sad} frowns, crosses both arms and turns away, while a small grey cloud icon puffs silently above.`,
          `${helper} steps in calmly, raises both open palms and takes a slow deep breath, inviting ${sad} to breathe along.`,
          `${sad} breathes in and out together with ${helper}, the arms relax, and the grey cloud shrinks into a tiny puff and disappears.`] as Beats,
          end: `${sad} and ${helper} face each other calmly, arms relaxed.` },
        { beats: [
          `${helper} kneels at eye level beside ${sad} and draws ${prop} in the air with a fingertip, leaving a soft glowing outline.`,
          `${sad} watches the glowing outline, lets out a long breath and slowly nods.`,
          `${sad} reaches out and touches the glowing outline, it brightens warmly, and ${sad} smiles a little.`] as Beats,
          end: `${sad} smiles a little beside the softly glowing outline, ${helper} close by.` },
      ]);
    }
    case 'math': return pick([
      { beats: [
        `${solo ? K : T} places colorful counting blocks one by one on a low table, each block landing with a tiny bounce.`,
        `${K} counts along, touching each block with one finger and nodding at every count${also}.`,
        `${K} pushes the blocks together into one neat group and throws both arms up happily.`] as Beats,
        end: `${K} stands beside one neat group of counting blocks, arms raised.` },
      { beats: [
        `${K} lines up small round apples in two groups on a table, glancing at the camera after each one.`,
        `${solo ? K : T} slides the two groups together slowly with both hands, the apples rolling into one row.`,
        `${K} counts them with a finger from left to right, then gives a big thumbs up.`] as Beats,
        end: `${K} gives a thumbs up next to one group of apples.` },
    ]);
    case 'example': return pick([
      { beats: [
        `${solo ? K : T} holds up ${prop} and turns it slowly so everyone can see every side.`,
        `${K} copies the action carefully step by step, face focused and calm${also}.`,
        `${K} finishes, steps back to look, then shows the result proudly to the camera.`] as Beats,
        end: `${K} holds the finished result up toward the camera.` },
      { beats: [
        `${K} walks over to ${prop}, crouches down and examines it closely from different angles.`,
        `${K} tries it once, wobbles a little, laughs, then tries again more slowly and carefully.`,
        `${K} succeeds this time and does a small happy spin with arms out.`] as Beats,
        end: `${K} stands beside ${prop}, smiling after a small spin.` },
    ]);
    case 'praise': return pick([
      { beats: [
        `${K} finishes the task, lets out a satisfied sigh and looks up hopefully.`,
        solo ? `${K} jumps with joy as soft confetti shapes drift down all around.` : `${T} claps warmly, walks over and gives ${K} a gentle high five${also}.`,
        `A bright star icon pops up above ${K}, who beams with pride and gives a little bow.`] as Beats,
        end: `${K} glows with pride under a bright star icon.` },
      { beats: [
        `${K} and ${B !== K ? B : solo ? 'the camera' : T} cheer together, pumping fists in the air and bouncing on the toes.`,
        'Soft colorful confetti shapes float down around them as they turn in a small happy circle.',
        `${K} faces the camera and takes a cheerful little bow, one hand on the chest.`] as Beats,
        end: `${K} finishes a cheerful bow among floating confetti shapes.` },
    ]);
    case 'outro': {
      const all = `${K}${solo ? '' : ` and ${T}`}${K2 ? ` and ${K2}` : ''}`;
      return {
        beats: [
          `${all} walk to the center and stand side by side facing the camera, smiling warmly.`,
          `${K} gives a big thumbs up and nods${solo ? ', then points cheerfully at the camera' : `, ${T} rests a gentle hand on ${K}'s shoulder`}.`,
          'Everyone waves goodbye happily while the camera gently pulls back into a calm wide view of the setting.'],
        end: `${all} waving goodbye in a calm wide shot.`,
      };
    }
    default: return pick([
      { beats: [
        `${solo ? K : T} walks to ${prop}, points at it and slowly traces its shape in the air with one hand.`,
        `${K} leans in, watching closely and nodding slowly, eyes following every movement${also}.`,
        `${K} smiles as a small light bulb icon glows on above the head, then gives a confident thumbs up.`] as Beats,
        end: `${K} smiles under a glowing light bulb icon beside ${prop}.` },
      { beats: [
        `${solo ? K : T} draws a simple picture of ${prop} in the air with a fingertip, leaving a soft glowing outline.`,
        `${K} follows the glowing outline with wide eyes, reaching out a hand to touch it gently.`,
        `${K} nods firmly, taps the temple to remember and smiles at the camera.`] as Beats,
        end: `${K} taps the temple with a confident smile.` },
      { beats: [
        `${K} walks beside ${solo ? prop : T} across the setting, looking up and listening carefully.`,
        `${solo ? K : T} stops and demonstrates slowly with ${prop}, turning so the camera can see clearly${also}.`,
        `${K} repeats the movement step by step, gets it right and grins proudly.`] as Beats,
        end: `${K} grins after repeating the movement with ${prop}.` },
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
    const raw = r.K ? beatsFor(kind, r, prop, i) : { beats: [`The camera glides slowly across the setting toward ${prop}, passing small details along the way.`, `${prop} gently glows, sways a little and comes into sharp focus.`, 'The camera settles on a calm, clear view and holds steady.'] as Beats, end: `A calm clear view of ${prop}.` };
    const shot = SHOTS[i % SHOTS.length];
    const beats = raw.beats.map((b, k) => `${shot[k]} ${b}`) as Beats;
    const end = raw.end;
    const first = i === 0 && r.K
      ? `${r.K} stands on the left${r.T !== r.K ? `, ${r.T} stands on the right` : ''}${r.K2 ? `, ${r.K2} stands in the middle` : ''}, all fully visible in ${o.settingName ? 'the setting' : 'a clear establishing view'}.`
      : '';
    return { id: uid(), settingId: o.settingId, cast: castIds, firstFrame: first, beats, dialogue: text, endFrame: end, overlay: mathOf(text) };
  });
}
