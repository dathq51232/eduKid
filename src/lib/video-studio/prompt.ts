// Bộ ghép câu lệnh Google Flow (Veo) cho Xưởng video — theo "Omni Flash Production Prompt Contract" của
// stickman-video-director (chế độ A): mỗi câu lệnh tự đủ, theo đúng thứ tự 12 mục, lặp nguyên văn mô tả
// nhân vật / bối cảnh / giọng đọc / nhạc để các cảnh 8 giây ghép lại vẫn đồng nhất.
import { alias, musicOf, styleOf, voiceOf, type LibItem, type Narration, type Ratio } from './presets';

export type VsClip = {
  id: string;
  settingId: string;
  cast: string[];
  /** trạng thái khung đầu; trống = kế thừa khung cuối của cảnh trước */
  firstFrame: string;
  beats: [string, string, string];
  dialogue: string;
  endFrame: string;
  /** chữ chèn khi dựng (không đưa vào câu lệnh) */
  overlay: string;
};
export type VsProject = {
  id?: string;
  title: string;
  ratio: Ratio;
  styleKey: string;
  voiceKey: string;
  musicKey: string;
  brief: string;
  /** nhân vật chính và bối cảnh mặc định dùng khi tách cảnh tự động */
  cast?: string[];
  settingId?: string;
  clips: VsClip[];
};

/** số từ lời đọc vừa một cảnh 8 giây (đọc thong thả cho các em: ~3,2 tiếng/giây tiếng Việt, ~2,5 từ/giây tiếng Anh) */
export const wordLimit = (n: Narration) => (n === 'en' ? 20 : 26);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const emptyClip = (settingId = 's-lop', cast: string[] = ['b-chain']): VsClip =>
  ({ id: uid(), settingId, cast, firstFrame: '', beats: ['', '', ''], dialogue: '', endFrame: '', overlay: '' });
export const newProject = (): VsProject => ({
  title: 'Video mới', ratio: '16:9', styleKey: 'cozy', voiceKey: 'vi-female', musicKey: 'ukulele', brief: '',
  cast: ['b-chain', 'b-co-mai'], settingId: 's-lop', clips: [],
});

type Lib = { characters: LibItem[]; settings: LibItem[] };
const find = (list: LibItem[], id: string) => list.find((x) => x.id === id);

const COMPOSITION: Record<Ratio, string> = {
  '16:9': 'Composition for 16:9 landscape: stage action across left, center and right thirds, use lateral tracking and clean negative space; keep characters fully inside the frame.',
  '9:16': 'Composition for 9:16 portrait: use depth, stacked vertical motion and vertical reveals; keep characters and key props in the central safe area away from the top and bottom edges.',
};

const KID_SAFE = 'Child-friendly content for primary school pupils: no scary imagery, no violence, no weapons, no dangerous stunts, no blood, no crying distress lingering, no romance; friendly expressions and safe behavior.';
const NO_TEXT = 'no visible words, letters, numbers, captions, subtitles, interface copy, palette labels, logos or watermarks; icon-only bubbles, cards, clocks and signs; no speech bubbles, comic balloons or dialogue boxes';
const BASE_NEG = 'no photorealism, no realistic eyes, pupils or lips, no extra or missing limbs, no malformed anatomy, no disconnected lines, no changing line weight or proportions, no unintended extra characters or clones, no abstract liquid shape morphing';

const dialogueLine = (narration: Narration, text: string) => {
  if (narration === 'none' || !text.trim()) return 'No spoken words in this clip.';
  const lang = narration === 'vi' ? 'Vietnamese' : 'English';
  return `Audio voiceover only, strictly no speech bubbles, no dialogue boxes. The narrator says exactly, in ${lang}: "${text.trim()}" Do not add, omit, paraphrase, repeat, reorder, caption, subtitle or visually transcribe these words.`;
};

/** Câu lệnh tự đủ cho cảnh thứ i (0-based) */
export function buildClipPrompt(p: VsProject, i: number, lib: Lib): string {
  const c = p.clips[i];
  const style = styleOf(p.styleKey);
  const voice = voiceOf(p.voiceKey);
  const music = musicOf(p.musicKey);
  const setting = find(lib.settings, c.settingId);
  const cast = c.cast.map((id) => find(lib.characters, id)).filter((x): x is LibItem => Boolean(x));
  const prevEnd = i > 0 ? p.clips[i - 1].endFrame.trim() : '';
  const first = c.firstFrame.trim() || (prevEnd ? `Continue exactly from the previous clip's final state: ${prevEnd}` : 'Open on a clear establishing view of the setting with the characters already in place.');
  const castBlock = cast.length
    ? cast.map((ch, k) => `Character ${k + 1}, called "${alias(ch.name)}" in the actions below (never write any name on screen): ${ch.anchor.trim()}`).join('\n')
    : 'No characters appear in this clip; show only the setting and props.';
  return [
    `1. Output: exactly 8 seconds, ${p.ratio} aspect ratio, 720p target, 24 FPS, synchronized audio. Clip ${i + 1} of ${p.clips.length}.`,
    `2. Style and environment: ${style.grammar} ${style.environment} ${setting?.anchor.trim() ?? 'a simple friendly setting'}`,
    `3. Character lock (exactly ${cast.length} character${cast.length === 1 ? '' : 's'}, frozen design, repeated verbatim in every clip):\n${castBlock}`,
    `4. Palette: ${style.palette} Use ordinary color names only.`,
    `5. ${COMPOSITION[p.ratio]}`,
    `6. First frame: ${first}`,
    `7. Timed actions with concrete, continuous character movement (never idle):\n[0-3s] ${c.beats[0].trim() || '—'}\n[3-6s] ${c.beats[1].trim() || '—'}\n[6-8s] ${c.beats[2].trim() || '—'}`,
    `8. Dialogue: ${dialogueLine(voice.narration, c.dialogue)}`,
    `9. Voice: ${voice.block}`,
    `10. ${i === 0 ? music.first : music.next} Voice-first mix.`,
    `11. Final frame: ${c.endFrame.trim() || 'Hold a clear, calm final pose that the next clip can continue.'}`,
    `12. Negative constraints: ${BASE_NEG}; ${style.negatives} ${NO_TEXT}. ${KID_SAFE}`,
  ].join('\n\n');
}

/** Ảnh tham chiếu cần tải lên Flow cho cảnh i (đường dẫn trong kho) */
export function clipRefs(p: VsProject, i: number, lib: Lib): { label: string; path: string }[] {
  const c = p.clips[i];
  const out: { label: string; path: string }[] = [];
  for (const id of c.cast) { const ch = find(lib.characters, id); ch?.refs.forEach((path) => out.push({ label: ch.name, path })); }
  const s = find(lib.settings, c.settingId);
  s?.refs.forEach((path) => out.push({ label: s.name, path }));
  return out;
}

export type Check = { ok: boolean; text: string };
const VI_MARK = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const HEX = /#[0-9a-f]{3,8}\b|\brgb\(|pantone/i;

/** Kiểm tra trước khi đưa sang Flow (giống bước "Phase B checks" của repo) */
export function checkProject(p: VsProject, lib: Lib): Check[] {
  const voice = voiceOf(p.voiceKey);
  const out: Check[] = [];
  const empty = p.clips.map((c, i) => (c.beats.some((b) => !b.trim()) ? i + 1 : 0)).filter(Boolean);
  out.push({ ok: !empty.length, text: empty.length ? `Cảnh ${empty.join(', ')} chưa đủ 3 nhịp hành động` : 'Mọi cảnh có đủ 3 nhịp hành động' });
  const viBeats = p.clips.map((c, i) => ([c.firstFrame, c.endFrame, ...c.beats].some((t) => VI_MARK.test(t)) ? i + 1 : 0)).filter(Boolean);
  out.push({ ok: !viBeats.length, text: viBeats.length ? `Cảnh ${viBeats.join(', ')} có mô tả hình bằng tiếng Việt — Veo hiểu tiếng Anh tốt hơn (lời thoại thì giữ tiếng Việt được)` : 'Mô tả hình viết bằng tiếng Anh' });
  const noCast = p.clips.map((c, i) => (c.cast.length ? 0 : i + 1)).filter(Boolean);
  if (noCast.length) out.push({ ok: true, text: `Cảnh ${noCast.join(', ')} không có nhân vật (chỉ cảnh vật)` });
  const missing = p.clips.flatMap((c) => [...c.cast.filter((id) => !find(lib.characters, id)), ...(find(lib.settings, c.settingId) ? [] : [c.settingId])]);
  out.push({ ok: !missing.length, text: missing.length ? 'Có nhân vật / bối cảnh đã bị xoá khỏi thư viện' : 'Nhân vật và bối cảnh đều có trong thư viện' });
  if (voice.narration !== 'none') {
    const limit = wordLimit(voice.narration);
    const long = p.clips.map((c, i) => (c.dialogue.trim().split(/\s+/).filter(Boolean).length > limit ? i + 1 : 0)).filter(Boolean);
    const blank = p.clips.map((c, i) => (c.dialogue.trim() ? 0 : i + 1)).filter(Boolean);
    out.push({ ok: !long.length, text: long.length ? `Lời đọc cảnh ${long.join(', ')} dài quá ~${limit} từ cho 8 giây — rút gọn, đừng tăng tốc độ đọc` : `Lời đọc mỗi cảnh trong khoảng ${limit} từ` });
    if (blank.length) out.push({ ok: true, text: `Cảnh ${blank.join(', ')} không có lời đọc` });
  }
  const noRef = new Set(p.clips.flatMap((c) => c.cast).filter((id) => !(find(lib.characters, id)?.refs.length)));
  out.push({ ok: !noRef.size, text: noRef.size ? `Chưa có ảnh tham chiếu cho: ${[...noRef].map((id) => find(lib.characters, id)?.name ?? id).join(', ')} — Flow giữ nhân vật tốt hơn khi có ảnh` : 'Nhân vật đều có ảnh tham chiếu' });
  const hex = p.clips.some((c, i) => HEX.test(buildClipPrompt(p, i, lib)));
  out.push({ ok: !hex, text: hex ? 'Có mã màu kỹ thuật (#…, rgb) trong câu lệnh — Veo có thể vẽ thành chữ' : 'Không có mã màu kỹ thuật' });
  return out;
}

/** Gói sản xuất đầy đủ (Markdown) — khối liên tục, N câu lệnh, hướng dẫn ghép, ghi chú âm thanh, chữ chèn khi dựng */
export function buildPackage(p: VsProject, lib: Lib): string {
  const style = styleOf(p.styleKey), voice = voiceOf(p.voiceKey), music = musicOf(p.musicKey);
  const castIds = [...new Set(p.clips.flatMap((c) => c.cast))];
  const lines: string[] = [
    `# ${p.title}`, '',
    '## Khối liên tục chung',
    `- Khổ hình: ${p.ratio} · Thời lượng: ${p.clips.length * 8} giây (${p.clips.length} cảnh × 8 giây)`,
    `- Phong cách: ${style.name}`,
    `- Giọng đọc: ${voice.name}`,
    `- Nhạc nền: ${music.name} (cảnh 1 tạo chủ đề, các cảnh sau nối tiếp y hệt)`,
    `- Nhân vật: ${castIds.map((id) => find(lib.characters, id)?.name ?? id).join(', ') || '—'}`,
    p.brief.trim() ? `- Nội dung: ${p.brief.trim()}` : '', '',
  ];
  p.clips.forEach((c, i) => {
    const refs = clipRefs(p, i, lib);
    lines.push(`## Cảnh ${i + 1} · ${find(lib.settings, c.settingId)?.name ?? ''}`, '');
    if (refs.length) lines.push(`Ảnh tham chiếu tải lên Flow: ${refs.map((r) => r.label).join(', ')}`, '');
    lines.push('```text', buildClipPrompt(p, i, lib), '```', '');
  });
  lines.push('## Hướng dẫn ghép');
  p.clips.forEach((c, i) => {
    const next = p.clips[i + 1];
    lines.push(next
      ? `- Cảnh ${i + 1} → ${i + 2}: kết thúc "${c.endFrame.trim() || 'tư thế cuối'}" nối sang ${next.firstFrame.trim() ? `"${next.firstFrame.trim()}"` : 'khung đầu kế thừa'}. Xem khung thật để chọn điểm cắt, có thể chồng âm thanh ngắn.`
      : `- Cảnh ${i + 1}: cảnh cuối — giữ khung kết khoảng 1 giây trước khi chèn lời mời luyện tập trên EduChain Kids.`);
  });
  lines.push('', '## Ghi chú giọng và nhạc',
    '- Khối giọng đọc và nhạc nền đã lặp nguyên văn trong mọi câu lệnh. Nghe các cảnh liền nhau để so giọng; nếu lệch, chỉ tạo lại cảnh lệch, giữ nguyên phần còn lại.',
    voice.narration === 'none' ? '- Video không lời: ghi lời đọc bằng VoiceStudio theo từng cảnh rồi ghép khi dựng.' : '- Nếu giọng tiếng Việt của Veo chưa chuẩn, tạo lại với "Không lời" và lồng tiếng bằng VoiceStudio.');
  const overlays = p.clips.map((c, i) => (c.overlay.trim() ? `- Cảnh ${i + 1}: ${c.overlay.trim()}` : '')).filter(Boolean);
  if (overlays.length) lines.push('', '## Chữ chèn khi dựng (không đưa vào Flow)', ...overlays);
  lines.push('', '---', 'Phương pháp câu lệnh dựa trên kaomei/stickman-video-director (MIT). Kiểm tra video thật trước khi đăng: tạo thành công không đồng nghĩa nhân vật đã đồng nhất.');
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
