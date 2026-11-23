// Kiểm tra Văn phòng ảo (src/lib/office/roles.ts) khớp với các trợ lý trong .claude/agents/*.md.
// Chạy: npm run check:office (chạy tay mỗi khi sửa / thêm / đổi tên agent; không gắn vào pre-commit).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OFFICE_ROLES, type OfficeAccess } from '../src/lib/office/roles';

const root = process.cwd();
const agentsDir = join(root, '.claude', 'agents');
const errors: string[] = [];
const err = (m: string) => errors.push(m);

/** đọc frontmatter đơn giản (khoá: giá trị trên một dòng) */
function frontmatter(text: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const out: Record<string, string> = {};
  if (!m) return out;
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return out;
}

/** quyền suy ra từ tools: có Edit → sửa mã; có Write → ghi bản nháp; còn lại → chỉ đọc */
const accessFromTools = (tools: string[]): OfficeAccess => (tools.includes('Edit') ? 'sua-ma' : tools.includes('Write') ? 'ghi-tai-lieu' : 'chi-doc');

if (!existsSync(agentsDir)) {
  console.error('✗ Không thấy thư mục .claude/agents');
  process.exit(1);
}

const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
const agents = new Map<string, string[]>();
files.forEach((f) => {
  const fm = frontmatter(readFileSync(join(agentsDir, f), 'utf8'));
  const name = fm.name ?? '';
  if (!name) { err(`${f}: thiếu "name:" trong frontmatter`); return; }
  if (`${name}.md` !== f) err(`${f}: tên file khác "name: ${name}"`);
  if (agents.has(name)) err(`${f}: trùng tên agent "${name}"`);
  agents.set(name, (fm.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean));
});

const ids = new Set<string>();
const seats = new Set<string>();
OFFICE_ROLES.forEach((r) => {
  if (ids.has(r.id)) err(`roles.ts: trùng id "${r.id}"`);
  ids.add(r.id);
  const seat = `${r.seat.x},${r.seat.z}`;
  if (seats.has(seat)) err(`roles.ts: "${r.id}" ngồi trùng chỗ (${seat})`);
  seats.add(seat);
  if (Math.abs(r.seat.x) > 9.5 || Math.abs(r.seat.z) > 6.5) err(`roles.ts: bàn của "${r.id}" ra ngoài sa bàn (${seat})`);
  if (!existsSync(join(root, 'public', 'emoji', 'f3d', `${r.icon}.webp`))) err(`roles.ts: "${r.id}" dùng hình public/emoji/f3d/${r.icon}.webp không có`);
  r.outDirs.forEach((d) => { if (!/^docs\/(ke-hoach|marketing)(\/|$)/.test(d)) err(`roles.ts: "${r.id}" có thư mục nộp ngoài docs/ke-hoach, docs/marketing: ${d}`); });
  if (!r.short.trim() || [...r.short].length > 14) err(`roles.ts: "${r.id}" nhãn ghim ngắn "${r.short}" phải có 1–14 ký tự`);
  // bàn rộng 2,4 (Trưởng phòng 3): hai bàn cùng hàng phải cách nhau ≥ 3 để ghim / nhãn không đè nhau
  OFFICE_ROLES.forEach((o) => { if (o.id < r.id && Math.abs(o.seat.z - r.seat.z) < 1.5 && Math.abs(o.seat.x - r.seat.x) < 3) err(`roles.ts: bàn "${o.id}" và "${r.id}" quá gần nhau`); });
  if (!r.commands.length) err(`roles.ts: "${r.id}" chưa có lệnh giao việc mẫu`);
  if (!r.title.trim() || !r.duties.length || !r.accessText.trim()) err(`roles.ts: "${r.id}" thiếu tên / việc chính / quyền hạn`);

  if (!r.agent) {
    if (r.access !== 'toan-quyen') err(`roles.ts: "${r.id}" không phải agent nhưng quyền không phải "toan-quyen"`);
    if (agents.has(r.id)) err(`roles.ts: "${r.id}" ghi agent: false nhưng có file .claude/agents/${r.id}.md`);
    return;
  }
  const tools = agents.get(r.id);
  if (!tools) { err(`roles.ts: vị trí "${r.id}" không còn file .claude/agents/${r.id}.md`); return; }
  const a = [...tools].sort().join(', '), b = [...r.tools].sort().join(', ');
  if (a !== b) err(`roles.ts: "${r.id}" tools [${b}] khác file agent [${a}]`);
  const want = accessFromTools(tools);
  if (r.access !== want) err(`roles.ts: "${r.id}" ghi quyền "${r.access}" nhưng tools [${tools.join(', ')}] tương ứng "${want}"`);
  if (r.access === 'toan-quyen') err(`roles.ts: agent "${r.id}" không được ghi "toan-quyen"`);
  if (!r.commands.some((c) => c.includes(r.id))) err(`roles.ts: lệnh mẫu của "${r.id}" không nhắc tên agent`);
});

agents.forEach((_, name) => { if (!ids.has(name)) err(`.claude/agents/${name}.md: chưa có trong src/lib/office/roles.ts`); });
if (OFFICE_ROLES.filter((r) => !r.agent).length !== 1) err('roles.ts: phải có đúng một Trưởng phòng (agent: false)');

// mỗi vị trí ~4 đồ vật + khoảng 10 đồ trang trí, giới hạn MAX_OBJECTS = 80 của sân khấu 3D
const est = OFFICE_ROLES.length * 4 + 10;
if (est > 80) err(`Quá nhiều vị trí: ước tính ${est} đồ vật > 80`);

if (errors.length) {
  console.error(`✗ Văn phòng ảo lệch với .claude/agents (${errors.length} lỗi):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`✓ Văn phòng ảo khớp .claude/agents: ${agents.size} agent + Trưởng phòng (${OFFICE_ROLES.length} vị trí).`);
