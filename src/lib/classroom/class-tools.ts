// Công cụ trên lớp: chia nhóm, sơ đồ chỗ ngồi, thi đua tổ, danh bạ phụ huynh, hẹn giờ.
// Chỉ là hàm thuần (không gọi mạng) để kiểm thử được bằng scripts/check-class-tools.ts.
import { fold } from '@/lib/classroom/teacher-nav';

export type ToolStudent = { id: string; name: string };
export const shortName = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

/** Ngày theo giờ Việt Nam dạng YYYY-MM-DD */
export const vnDay = (d: Date | string | number = new Date()) => new Date(new Date(d).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

/** Bộ số ngẫu nhiên có hạt giống (kiểm thử lặp lại được) */
export function seeded(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffled<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ====================================================================== HỌC LỰC (để chia nhóm cân bằng) */
export type Level = 'tot' | 'kha' | 'hotro' | 'chua';
export const LEVELS: Record<Level, { label: string; color: string }> = {
  tot: { label: 'Học tốt', color: '#15803d' },
  kha: { label: 'Khá', color: '#2457c5' },
  hotro: { label: 'Cần hỗ trợ', color: '#d97706' },
  chua: { label: 'Chưa có dữ liệu', color: '#94a3b8' },
};
/** Theo kết quả luyện tập trong app: chưa làm bài nào = chưa có dữ liệu */
export function levelOf(avgPercent: number | null | undefined, lessonsDone: number | null | undefined): Level {
  if (!lessonsDone || avgPercent == null) return 'chua';
  return avgPercent >= 80 ? 'tot' : avgPercent >= 50 ? 'kha' : 'hotro';
}

/* ====================================================================== CHIA NHÓM */
export type GroupMode = 'random' | 'balanced' | 'teams';
export type GroupOpts = { by: 'count' | 'size'; n: number; mode: GroupMode; leaders: boolean; skipAbsent: boolean; avoid: [string, string][] };
export type Group = { members: string[]; leader: string | null };
export type GroupsState = { opts: GroupOpts; groups: Group[]; at?: string };

export const GROUP_LOOKS = [
  { emoji: '🦁', name: 'Sư tử', color: '#2457c5' }, { emoji: '🐬', name: 'Cá heo', color: '#15803d' },
  { emoji: '🦊', name: 'Cáo', color: '#c2410c' }, { emoji: '🐼', name: 'Gấu trúc', color: '#6d3fe0' },
  { emoji: '🦉', name: 'Cú mèo', color: '#be185d' }, { emoji: '🐢', name: 'Rùa', color: '#0e7490' },
  { emoji: '🐝', name: 'Ong', color: '#a16207' }, { emoji: '🐧', name: 'Chim cánh cụt', color: '#334155' },
  { emoji: '🦒', name: 'Hươu', color: '#b45309' }, { emoji: '🐸', name: 'Ếch', color: '#4d7c0f' },
  { emoji: '🐳', name: 'Cá voi', color: '#1d4ed8' }, { emoji: '🦋', name: 'Bướm', color: '#9333ea' },
];
export const defaultGroupOpts = (): GroupOpts => ({ by: 'count', n: 6, mode: 'balanced', leaders: true, skipAbsent: true, avoid: [] });

/** Số nhóm thực tế */
export function groupCount(students: number, opts: Pick<GroupOpts, 'by' | 'n'>): number {
  if (students <= 0) return 0;
  const n = Math.max(1, Math.floor(opts.n || 1));
  return Math.min(students, opts.by === 'count' ? n : Math.ceil(students / n));
}

const LEVEL_ORDER: Level[] = ['tot', 'kha', 'chua', 'hotro'];

/**
 * Chia nhóm. balanced: xếp theo học lực rồi chia lần lượt vào các nhóm để nhóm nào cũng có đủ em học tốt – khá – cần hỗ trợ.
 * teams: giữ nguyên các tổ (teamMembers); em chưa thuộc tổ nào vào tổ ít người nhất.
 * Sau đó tách các cặp "không xếp chung" bằng cách đổi chỗ với em cùng học lực ở nhóm khác.
 */
export function makeGroups(students: ToolStudent[], levels: Record<string, Level>, opts: GroupOpts, rand: () => number = Math.random, teamMembers?: string[][]): Group[] {
  const ids = students.map((s) => s.id);
  if (!ids.length) return [];
  let buckets: string[][];
  if (opts.mode === 'teams' && teamMembers?.some((t) => t.length)) {
    const inClass = new Set(ids);
    buckets = teamMembers.map((t) => shuffled(t.filter((id) => inClass.has(id)), rand)).filter((t) => t.length);
    const placed = new Set(buckets.flat());
    for (const id of shuffled(ids.filter((x) => !placed.has(x)), rand)) {
      const min = Math.min(...buckets.map((t) => t.length));
      buckets[buckets.findIndex((t) => t.length === min)].push(id);
    }
  } else {
    const k = groupCount(ids.length, opts);
    buckets = Array.from({ length: k }, () => []);
    const order = opts.mode === 'balanced'
      ? LEVEL_ORDER.flatMap((lv) => shuffled(ids.filter((id) => (levels[id] ?? 'chua') === lv), rand))
      : shuffled(ids, rand);
    // chia vòng tròn liên tục qua các mức: mỗi mức rải đều (chênh tối đa 1 em), tổng số em mỗi nhóm cũng chênh tối đa 1.
    // nhóm bắt đầu khác nhau mỗi lần chia để em học tốt không luôn dồn ở nhóm 1
    const start = Math.floor(rand() * k);
    order.forEach((id, i) => buckets[(start + i) % k].push(id));
  }
  separate(buckets, opts.avoid, levels);
  return buckets.map((members) => {
    const able = members.filter((id) => ['tot', 'kha'].includes(levels[id] ?? 'chua'));
    const leader = opts.leaders ? (able.length ? able : members)[Math.floor(rand() * (able.length || members.length))] ?? null : null;
    return { members, leader };
  });
}

/** Các cặp "không xếp chung" đang bị chung nhóm */
export function conflictsOf(groups: string[][], avoid: [string, string][]): [string, string][] {
  return avoid.filter(([a, b]) => groups.some((g) => g.includes(a) && g.includes(b)));
}

function separate(groups: string[][], avoid: [string, string][], levels: Record<string, Level>) {
  if (groups.length < 2 || !avoid.length) return;
  for (let pass = 0; pass < 6; pass++) {
    const bad = conflictsOf(groups, avoid);
    if (!bad.length) return;
    for (const [, b] of bad) {
      const gi = groups.findIndex((g) => g.includes(b));
      if (gi < 0) continue;
      // đổi em b với một em ở nhóm khác (ưu tiên cùng học lực) mà không tạo cặp cấm mới
      let done = false;
      for (const sameLevel of [true, false]) {
        for (let gj = 0; gj < groups.length && !done; gj++) {
          if (gj === gi) continue;
          for (const c of groups[gj]) {
            if (sameLevel && (levels[c] ?? 'chua') !== (levels[b] ?? 'chua')) continue;
            const nextI = groups[gi].map((x) => (x === b ? c : x));
            const nextJ = groups[gj].map((x) => (x === c ? b : x));
            // chấp nhận khi số cặp cấm trong hai nhóm giảm (nhóm có thể còn cặp khác, xử lý ở lượt sau)
            if (conflictsOf([nextI, nextJ], avoid).length >= conflictsOf([groups[gi], groups[gj]], avoid).length) continue;
            groups[gi] = nextI; groups[gj] = nextJ; done = true; break;
          }
        }
        if (done) break;
      }
    }
  }
}

/* ====================================================================== SƠ ĐỒ CHỖ NGỒI */
export type DeskKind = 'double' | 'single' | 'group4';
export const DESK_SEATS: Record<DeskKind, number> = { double: 2, single: 1, group4: 4 };
export const DESK_LABEL: Record<DeskKind, string> = { double: 'Bàn đôi', single: 'Bàn đơn', group4: 'Nhóm 4' };
/** cols = số dãy (từ trái sang phải nhìn từ cuối lớp lên bảng), rows = số bàn mỗi dãy (từ bàn đầu) */
export type Seating = { cols: number; rows: number; desk: DeskKind; seats: (string | null)[]; colorByCol: boolean };

export const seatCount = (s: Pick<Seating, 'cols' | 'rows' | 'desk'>) => s.cols * s.rows * DESK_SEATS[s.desk];
/** chỉ số ghế: dãy c, bàn r, chỗ k trong bàn */
export const seatIndex = (s: Pick<Seating, 'cols' | 'desk'>, r: number, c: number, k: number) => (r * s.cols + c) * DESK_SEATS[s.desk] + k;
export const colOfSeat = (s: Pick<Seating, 'cols' | 'desk'>, i: number) => Math.floor(i / DESK_SEATS[s.desk]) % s.cols;

export function defaultSeating(n: number): Seating {
  const cols = 4;
  const rows = Math.max(1, Math.ceil(Math.max(n, 1) / (cols * 2)));
  return { cols, rows, desk: 'double', seats: Array(cols * rows * 2).fill(null), colorByCol: true };
}

/** Bỏ em không còn trong lớp, bỏ trùng, đổi kích thước theo bố cục (em bị thừa ra thành "chưa xếp chỗ") */
export function normalizeSeating(raw: Partial<Seating> | null | undefined, students: ToolStudent[]): Seating {
  const base = defaultSeating(students.length);
  const cols = clampInt(raw?.cols, 1, 8, base.cols);
  const rows = clampInt(raw?.rows, 1, 10, base.rows);
  const desk: DeskKind = raw?.desk && raw.desk in DESK_SEATS ? raw.desk : 'double';
  const total = cols * rows * DESK_SEATS[desk];
  const valid = new Set(students.map((s) => s.id));
  const seen = new Set<string>();
  const seats = Array.from({ length: total }, (_, i) => {
    const id = Array.isArray(raw?.seats) ? raw.seats[i] : null;
    if (typeof id !== 'string' || !valid.has(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
  return { cols, rows, desk, seats, colorByCol: raw?.colorByCol !== false };
}
const clampInt = (v: unknown, lo: number, hi: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : def);

/** Đổi bố cục nhưng giữ thứ tự các em đã xếp (lấp từ bàn đầu) */
export function relayout(s: Seating, next: Pick<Seating, 'cols' | 'rows' | 'desk'>): Seating {
  const placed = s.seats.filter((x): x is string => !!x);
  const total = seatCount(next);
  return { ...s, ...next, seats: Array.from({ length: total }, (_, i) => placed[i] ?? null) };
}

export const unseated = (s: Seating, students: ToolStudent[]) => students.filter((st) => !s.seats.includes(st.id));

/** Xếp ngẫu nhiên cả lớp, bỏ trống ghế cuối lớp; chỉ xếp các em trong `ids` */
export function autoSeat(s: Seating, ids: string[], rand: () => number = Math.random): Seating {
  const order = shuffled(ids, rand);
  // lấp theo từng bàn từ bàn đầu, đi qua các dãy (để chỗ trống dồn về cuối lớp)
  const seats: (string | null)[] = Array(seatCount(s)).fill(null);
  let n = 0;
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) for (let k = 0; k < DESK_SEATS[s.desk]; k++) {
    seats[seatIndex(s, r, c, k)] = order[n++] ?? null;
  }
  return { ...s, seats };
}

/** Đặt em vào ghế: ghế có người thì đổi chỗ cho nhau; from = -1 nghĩa là từ danh sách chưa xếp */
export function placeSeat(s: Seating, studentId: string, to: number): Seating {
  const seats = [...s.seats];
  const from = seats.indexOf(studentId);
  const other = seats[to];
  seats[to] = studentId;
  if (from >= 0 && from !== to) seats[from] = other ?? null;
  return { ...s, seats };
}
export const unseat = (s: Seating, i: number): Seating => ({ ...s, seats: s.seats.map((x, j) => (j === i ? null : x)) });

/* ====================================================================== THI ĐUA TỔ */
export type Team = { name: string; emoji: string; members: string[]; leader: string | null };
export type TeamsState = { teams: Team[] };
export const TEAM_EMOJI = ['🚀', '🌻', '⚡', '🌈', '🐳', '🍀', '🎈', '⭐'];
export const TEAM_COLORS = ['#2457c5', '#15803d', '#c2410c', '#6d3fe0', '#0e7490', '#be185d', '#a16207', '#334155'];
export const REASONS = [
  { icon: '🙋', label: 'Phát biểu' }, { icon: '🤫', label: 'Trật tự' }, { icon: '🧹', label: 'Vệ sinh' },
  { icon: '📚', label: 'Đủ đồ dùng' }, { icon: '🤝', label: 'Giúp bạn' }, { icon: '⏰', label: 'Đúng giờ' },
];
export const MINUS_REASONS = [
  { icon: '🗣️', label: 'Mất trật tự' }, { icon: '📚', label: 'Quên đồ dùng' }, { icon: '⏰', label: 'Đi muộn' }, { icon: '🧹', label: 'Chưa vệ sinh' },
];

export function defaultTeams(n = 4): TeamsState {
  return { teams: Array.from({ length: n }, (_, i) => ({ name: `Tổ ${i + 1}`, emoji: TEAM_EMOJI[i % TEAM_EMOJI.length], members: [], leader: null })) };
}
/** Tổ theo dãy bàn của sơ đồ chỗ ngồi (dãy 1 = tổ 1) */
export function teamsFromSeating(s: Seating, prev?: TeamsState): TeamsState {
  return {
    teams: Array.from({ length: s.cols }, (_, c) => {
      const old = prev?.teams[c];
      const members = s.seats.filter((id, i): id is string => !!id && colOfSeat(s, i) === c);
      return { name: old?.name ?? `Tổ ${c + 1}`, emoji: old?.emoji ?? TEAM_EMOJI[c % TEAM_EMOJI.length], members, leader: old?.leader && members.includes(old.leader) ? old.leader : members[0] ?? null };
    }),
  };
}
export function normalizeTeams(raw: Partial<TeamsState> | null | undefined, students: ToolStudent[]): TeamsState {
  const valid = new Set(students.map((s) => s.id));
  const list = Array.isArray(raw?.teams) ? raw.teams.slice(0, 8) : [];
  if (list.length < 2) return defaultTeams();
  const seen = new Set<string>();
  return {
    teams: list.map((t, i) => {
      const members = (Array.isArray(t?.members) ? t.members : []).filter((id): id is string => typeof id === 'string' && valid.has(id) && !seen.has(id) && !!seen.add(id));
      return {
        name: String(t?.name ?? `Tổ ${i + 1}`).slice(0, 30) || `Tổ ${i + 1}`,
        emoji: String(t?.emoji ?? TEAM_EMOJI[i % TEAM_EMOJI.length]).slice(0, 8),
        members,
        leader: typeof t?.leader === 'string' && members.includes(t.leader) ? t.leader : null,
      };
    }),
  };
}

export type Point = { id: number; team: number; delta: number; reason: string | null; at: string };
/** Tuần chứa ngày d (thứ Hai → Chủ nhật) */
export function weekOf(iso: string) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = CN
  const from = addDays(iso, -((dow + 6) % 7));
  return { from, to: addDays(from, 6), days: Array.from({ length: 6 }, (_, i) => addDays(from, i)) }; // T2–T7
}
export const DOW_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const dowOf = (iso: string) => DOW_LABEL[new Date(`${iso}T00:00:00Z`).getUTCDay()];
export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Tổng điểm từng tổ (chỉ số 0) và theo từng ngày */
export function teamTotals(points: Point[], teams: number) {
  const total = Array(teams).fill(0) as number[];
  const byDay: Record<string, number[]> = {};
  for (const p of points) {
    if (p.team < 1 || p.team > teams) continue;
    total[p.team - 1] += p.delta;
    const d = vnDay(p.at);
    (byDay[d] ??= Array(teams).fill(0))[p.team - 1] += p.delta;
  }
  return { total, byDay };
}
/** Xếp hạng (cùng điểm cùng hạng) */
export function ranking(total: number[]): { team: number; score: number; rank: number }[] {
  return total
    .map((score, team) => ({ team, score, rank: 1 + total.filter((x) => x > score).length }))
    .sort((a, b) => b.score - a.score || a.team - b.team);
}

/* ====================================================================== DANH BẠ PHỤ HUYNH */
export type Contact = { id: string; student_id: string; name: string; relation: string; phone: string; note: string | null; updated_at?: string };
export const RELATIONS = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Cô', 'Dì', 'Chú', 'Bác', 'Người giám hộ'];

/** Chuẩn hóa số: bỏ dấu cách/chấm/gạch, +84 → 0. Trả null nếu không giống số điện thoại. */
export function normalizePhone(raw: string): string | null {
  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('+84')) s = `0${s.slice(3)}`;
  else if (s.startsWith('84') && s.length === 11) s = `0${s.slice(2)}`;
  if (/^0\d{9}$/.test(s) || /^0\d{10}$/.test(s)) return s;
  if (/^\+\d{8,13}$/.test(s)) return s;
  return null;
}
/** 0912345678 → 0912 345 678 */
export const formatPhone = (p: string) => (/^0\d{9}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);
export const maskPhone = (p: string) => (/^0\d{9}$/.test(p) ? `${p.slice(0, 4)} ••• ${p.slice(7)}` : `${p.slice(0, 3)}•••${p.slice(-2)}`);
export const telHref = (p: string) => `tel:${p}`;
export const zaloHref = (p: string) => `https://zalo.me/${p.replace(/^\+84/, '0')}`;

/** Tìm em theo tên gõ/dán: khớp đủ họ tên trước, rồi tên gọi (2 chữ cuối), rồi tên (chữ cuối) nếu chỉ một em */
export function matchStudent(text: string, students: ToolStudent[]): ToolStudent | null {
  const f = fold(text).replace(/\s+/g, ' ');
  if (!f) return null;
  const by = (fn: (s: ToolStudent) => boolean) => { const m = students.filter(fn); return m.length === 1 ? m[0] : null; };
  return by((s) => fold(s.name) === f)
    ?? by((s) => fold(shortName(s.name)) === f)
    ?? by((s) => fold(s.name).endsWith(` ${f}`))
    ?? null;
}

export type PasteRow = { line: number; raw: string; student: ToolStudent | null; name: string; relation: string; phone: string | null; note: string; problem: string | null };
/**
 * Dán từ Excel / Zalo: mỗi dòng một em. Các cột cách nhau bằng Tab (hoặc ; hay |).
 * Cột chứa số điện thoại tự nhận ra; cột đầu là tên em; cột khác: tên phụ huynh, quan hệ (Bố/Mẹ/…), ghi chú.
 */
export function parseContactPaste(text: string, students: ToolStudent[]): PasteRow[] {
  const out: PasteRow[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const cells = line.split(/\t|;|\|/).map((c) => c.trim()).filter(Boolean);
    const phoneAt = cells.findIndex((c) => normalizePhone(c));
    const phone = phoneAt >= 0 ? normalizePhone(cells[phoneAt]) : null;
    const rest = cells.filter((_, k) => k !== phoneAt);
    // bỏ cột số thứ tự
    if (rest.length && /^\d{1,3}\.?$/.test(rest[0])) rest.shift();
    const student = rest.length ? matchStudent(rest[0], students) : null;
    const others = rest.slice(1);
    const relAt = others.findIndex((c) => RELATIONS.some((r) => fold(r) === fold(c)));
    const relation = relAt >= 0 ? RELATIONS.find((r) => fold(r) === fold(others[relAt]))! : '';
    const left = others.filter((_, k) => k !== relAt);
    const name = left[0] ?? '';
    const note = left.slice(1).join(' · ');
    const many = !student && rest.length ? students.filter((s) => fold(s.name).endsWith(` ${fold(rest[0])}`) || fold(s.name) === fold(rest[0])).length : 0;
    const problem = !rest.length ? 'Không có tên em'
      : !student ? (many > 1 ? `Có ${many} em tên “${rest[0]}” — ghi đủ họ tên` : `Không tìm thấy em “${rest[0]}” trong lớp`)
      : !phone ? 'Không thấy số điện thoại hợp lệ' : null;
    if (/^(stt|h[oọ] v[aà] t[eê]n|t[eê]n)/i.test(line) && !phone) return; // dòng tiêu đề
    out.push({ line: i + 1, raw: line, student, name, relation, phone, note, problem });
  });
  return out;
}

/* ====================================================================== HẸN GIỜ */
export type TimerLook = 'ring' | 'alarm' | 'sand' | 'snail' | 'rocket';
export const TIMER_LOOKS: { id: TimerLook; label: string; emoji: string }[] = [
  { id: 'alarm', label: 'Đồng hồ báo thức', emoji: '⏰' },
  { id: 'sand', label: 'Đồng hồ cát', emoji: '⏳' },
  { id: 'snail', label: 'Ốc sên về đích', emoji: '🐌' },
  { id: 'rocket', label: 'Tên lửa', emoji: '🚀' },
  { id: 'ring', label: 'Vòng sáng', emoji: '⭕' },
];
export type TimerBell = 'keng' | 'chuong' | 'ga' | 'off';
export const TIMER_BELLS: { id: TimerBell; label: string }[] = [
  { id: 'keng', label: 'Kẻng trường' }, { id: 'chuong', label: 'Chuông reo' }, { id: 'ga', label: 'Gà gáy' }, { id: 'off', label: 'Tắt tiếng' },
];
export const TIMER_PRESETS = [60, 120, 180, 300, 600, 900];
export const TIMER_LABELS = ['Thảo luận nhóm', 'Làm bài cá nhân', 'Đọc thầm', 'Viết bài', 'Thu dọn', 'Ra chơi'];
/** Lưu trên máy (đồng hồ vẫn chạy khi chuyển trang hoặc mở nhiều tab) */
export type TimerState = { total: number; left: number; endsAt: number | null; label: string; look: TimerLook; bell: TimerBell; tick: boolean };
export const TIMER_KEY = 'gv-hen-gio';
export const defaultTimer = (): TimerState => ({ total: 300, left: 300, endsAt: null, label: 'Thảo luận nhóm', look: 'alarm', bell: 'keng', tick: true });

export function parseTimer(raw: string | null): TimerState {
  const d = defaultTimer();
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<TimerState> | null;
    if (!v || typeof v !== 'object') return d;
    const total = clampInt(v.total, 5, 5999, d.total);
    return {
      total,
      left: typeof v.left === 'number' && v.left >= 0 ? Math.min(v.left, 5999) : total,
      endsAt: typeof v.endsAt === 'number' && v.endsAt > 0 ? v.endsAt : null,
      label: typeof v.label === 'string' ? v.label.slice(0, 60) : d.label,
      look: TIMER_LOOKS.some((l) => l.id === v.look) ? v.look! : d.look,
      bell: TIMER_BELLS.some((b) => b.id === v.bell) ? v.bell! : d.bell,
      tick: v.tick !== false,
    };
  } catch { return d; }
}
/** Số giây còn lại (thập phân) */
export const timerLeft = (t: TimerState, now = Date.now()) => (t.endsAt ? Math.max(0, (t.endsAt - now) / 1000) : t.left);
export const timerRunning = (t: TimerState, now = Date.now()) => !!t.endsAt && t.endsAt > now;
export const startTimer = (t: TimerState, now = Date.now()): TimerState => ({ ...t, endsAt: now + (t.left > 0 ? t.left : t.total) * 1000, left: t.left > 0 ? t.left : t.total });
export const pauseTimer = (t: TimerState, now = Date.now()): TimerState => ({ ...t, left: timerLeft(t, now), endsAt: null });
export const resetTimer = (t: TimerState, total = t.total): TimerState => ({ ...t, total, left: total, endsAt: null });
export function addTime(t: TimerState, sec: number, now = Date.now()): TimerState {
  if (t.endsAt) {
    const left = Math.max(0, timerLeft(t, now)) + sec;
    return { ...t, endsAt: now + left * 1000, total: Math.max(t.total, Math.ceil(left)) };
  }
  const left = Math.max(1, t.left + sec);
  return { ...t, left, total: Math.max(t.total, left) };
}
/** 125.2 → "02:06" (làm tròn lên: còn 0,2 giây vẫn hiện 00:01) */
export function fmtClock(sec: number): string {
  const s = Math.ceil(Math.max(0, sec) - 1e-9);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
/** Giai đoạn để đổi màu / âm thanh */
export const timerPhase = (left: number, total: number): 'calm' | 'warn' | 'last' | 'done' =>
  left <= 0 ? 'done' : left <= 10 ? 'last' : left <= Math.min(60, total / 4) ? 'warn' : 'calm';
