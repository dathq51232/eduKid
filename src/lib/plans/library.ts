// Kho giáo án của trường: tách file Word (.docx) giáo án của giáo viên thành từng bài / tiết,
// chuyển về khung giáo án của app (I. Yêu cầu cần đạt · II. Đồ dùng · III. Hoạt động · IV. Điều chỉnh)
// và tìm giáo án phù hợp cho từng tiết của lịch báo giảng.

import type { DocBlock } from '../docx-read';
import type { ActivityKey, LessonPlan, PlanActivity, PlanSubject } from './generate';
import { fold, subjectOf } from './schedule';

export type LibraryEntry = {
  subject: PlanSubject;
  /** tiết bổ sung / buổi 2 */
  extra: boolean;
  grade: number;
  week: number | null;
  /** số bài trong sách ("BÀI 5: …") */
  lessonNo: number | null;
  /** các tiết của bài mà giáo án này dạy ("TIẾT 2", "(Tiết 1, 2)"); [] = cả bài */
  periods: number[];
  /** "ÔN TẬP TIẾT 10" (tiết bổ sung đánh số theo PPCT) */
  ppct: number | null;
  title: string;
  topic: string;
  source: string;
  plan: LessonPlan;
};

const isDots = (s: string) => /^[.…_\s-]{6,}$/.test(s);
const roman = (s: string) => /^0?(I|II|III|IV|V)\s*[.:]\s*/.exec(s.trim())?.[1] ?? null;
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

/** Môn / khối / buổi 2 theo đường dẫn file ("TOÁN K1/…", "Giao an Stem lop 3/…", "TV (BS) VÀ TOÁN (BS)/KHBD_Toan_1_Buoi_2…") */
export function guessFromPath(path: string): { subject: PlanSubject | null; grade: number | null; extra: boolean; stem: boolean } {
  const f = fold(path.replace(/[_/\\]+/g, ' '));
  const stem = /\bstem\b/.test(f);
  const extra = /buoi 2|\(bs\)|\bbs\b|bo sung/.test(f);
  const grade = Number(/\bk\s?([1-5])\b/.exec(f)?.[1] ?? /\blop\s?([1-5])\b/.exec(f)?.[1] ?? /\bstem\s?([1-5])\b/.exec(f)?.[1] ?? /\b(?:toan|viet)\s([1-5])\b/.exec(f)?.[1] ?? 0) || null;
  const base = fold((path.split(/[/\\]/).pop() ?? '').replace(/[_]+/g, ' '));
  let subject: PlanSubject | null = null;
  if (stem) subject = 'stem';
  else {
    const name = /tieng viet|\btv\b/.test(base) ? 'tiếng việt' : /\btoan\b/.test(base) ? 'toán' : /dao duc/.test(base) ? 'đạo đức' : /hdtn|trai nghiem/.test(base) ? 'hđtn' : /tnxh/.test(base) ? 'tnxh' : '';
    const dir = fold(path.split(/[/\\]/).slice(-2, -1)[0] ?? '');
    const s = subjectOf(name || dir);
    subject = s.subject === 'khac' ? null : s.subject;
  }
  return { subject, grade, extra, stem };
}

type Ctx = { subject: PlanSubject | null; extra: boolean; grade: number | null; week: number | null; topic: string };

/** đọc thông tin từ các dòng đầu giáo án */
function readHeader(head: string[], ctx: Ctx, baseExtra: boolean) {
  let title = '';
  let stop = false;
  for (const raw of head) {
    const s = raw.trim();
    const f = fold(s);
    if (/^(goi y|mo ta)/.test(f)) { stop = true; continue; }
    if (stop) { if (!ctx.topic && /\bbai\s*\d+.*sach/.test(f)) ctx.topic = s; continue; }
    if (/^(ke hoach bai day\s*:?\s*)?bai hoc stem(\s*lop\s*\d)?\s*$/.test(f)) { const g = /lop\s*([1-5])/.exec(f); if (g) ctx.grade = Number(g[1]); continue; }
    if (/^(thoi gian thuc hien|tuan\s*:|ngay soan|tiet\s*:|ngay day|lop\s*:|nguoi soan|giao vien\s*:)/.test(f) || /^\(?tiet\s*\d+\)?$/.test(f) && !title) continue;
    if (!s || /^(ke hoach bai day|ke hoach day hoc|bo sach|\*+$|thu .*ngay|thoi luong|so tiet|goi y|mo ta|duyet)/.test(f)) {
      const g = /\blop\s*([1-5])\b/.exec(f); if (g) ctx.grade = Number(g[1]);
      const w = /\btuan\s*(\d+)/.exec(f); if (w) ctx.week = Number(w[1]);
      const m = /\bmon\s+(.+?)(\s+lop\b|\s+[-–]|$)/.exec(f);
      if (m) { const r = subjectOf(m[1]); if (r.subject !== 'khac') ctx.subject = r.subject; }
      continue;
    }
    const mon = /^mon\s*[:\-]?\s*(.+)$/.exec(f);
    const gm = /\b(toan|viet|duc|hoi|nghiem|anh)\s+([1-5])\b/.exec(f); if (gm && /^(mon|ke hoach)/.test(f)) ctx.grade = Number(gm[2]);
    const g = /\blop\s*([1-5])\b/.exec(f); if (g) ctx.grade = Number(g[1]);
    const w = /^tuan\s*(\d+)/.exec(f); if (w) ctx.week = Number(w[1]);
    if (mon) { const r = subjectOf(mon[1]); if (r.subject !== 'khac') ctx.subject = r.subject; ctx.extra = ctx.extra || r.extra || /bo sung|buoi 2/.test(f); if (/tuan\s*\d+/.test(f)) ctx.week = Number(/tuan\s*(\d+)/.exec(f)![1]); continue; }
    // dòng chỉ có tên môn ("TIẾNG VIỆT", "TOÁN (BỔ SUNG)", "TỰ NHIÊN VÀ XÃ HỘI")
    if (s.length <= 40 && !/\b(bai|tiet|chu de|tuan|on tap|sinh hoat)\b/.test(f)) {
      const r = subjectOf(s);
      if (r.subject !== 'khac' || /^(toan|tieng viet|dao duc|tu nhien|hoat dong trai nghiem)/.test(f)) { ctx.subject = r.subject; ctx.extra = baseExtra || r.extra || /bo sung/.test(f); continue; }
    }
    if (/^chu de\b/.test(f)) { ctx.topic = s; continue; }
    if (/^tuan\s*\d+\s*$/.test(f)) continue;
    if (/^tuan\s*\d+\s*[-–:]\s*(chu de|on tap)/.test(f) && !/\bbai\s*\d/.test(f)) { ctx.topic = s.replace(/^tuần\s*\d+\s*[-–:]\s*/i, ''); if (/on tap|thuc hanh/.test(f)) title = s.replace(/^tuần\s*\d+\s*[-–:]\s*/i, ''); continue; }
    if (/^thay bang/.test(f)) continue;
    if (/^\(?tiet\s*\d/.test(f) && title) { title += ` ${s}`; continue; }
    if (/^\(\d+ tiet\)$/.test(f)) continue;
    title = s.replace(/^tuần\s*\d+\s*[-–:]\s*/i, '').replace(/^(toán|tiếng việt|đạo đức|tnxh)\s+(?=bài\b)/i, '');
  }
  return title;
}

const MAJOR = /^(\d+\s*[.)]|hoạt động\b|hđ\s*\d|[ivx]+\.\s)/i;
const SUB = /^([a-zđ]\s*[.)]\s|câu\s*\d|bài\s*\d|bước\s*\d|\*|nhiệm vụ\s*\d)/i;
const HEADING = /^(\d+\.|[a-zđ]\)|hoạt động\s*\d*|hđ\s*\d|tiết\s*\d|bước\s*\d|phần\s*\d|[ivx]+\.)/i;
function keyOf(title: string, i: number, n: number): ActivityKey {
  const f = fold(title);
  if (/khoi dong|mo dau|on dinh/.test(f)) return 'khoi-dong';
  if (/van dung|trai nghiem|cung co|dan do|tong ket|ket thuc|nhan xet tiet/.test(f)) return 'van-dung';
  if (/luyen tap|thuc hanh|luyen doc|luyen viet|viet|tap viet/.test(f)) return 'luyen-tap';
  if (/kham pha|hinh thanh|kien thuc moi|nhan biet|tim hieu|doc|noi/.test(f)) return 'kham-pha';
  return i === 0 ? 'khoi-dong' : i === n - 1 ? 'van-dung' : 'kham-pha';
}

/** bảng hoạt động (GV | HS, có thể kèm cột thời gian) → danh sách hoạt động */
function activitiesFrom(tables: string[][][], paras: string[]): PlanActivity[] {
  type A = { title: string; goal: string; teacher: string[]; student: string[]; minutes: number };
  const acts: A[] = [];
  let tiet = '';
  let multiTiet = false;
  let majorSeen = false;
  const start = (title: string) => {
    const t = title.replace(/\s+/g, ' ').trim();
    const min = Number(/(\d+)\s*(?:phút|')/i.exec(t)?.[1] ?? 0);
    acts.push({ title: (tiet && multiTiet ? `${tiet} · ` : '') + t, goal: '', teacher: [], student: [], minutes: min });
  };
  const cur = () => { if (!acts.length) start('Hoạt động'); return acts[acts.length - 1]; };
  const addHeadCell = (cell: string) => {
    const ls = lines(cell);
    const first = ls.shift() ?? '';
    if (/^tiết\s*\d+/i.test(first) && first.length < 60) { tiet = first.replace(/\s*[-–:].*$/, '').replace(/^tiết/i, 'Tiết'); multiTiet = true; if (!ls.length) return; start(ls.shift()!); }
    else if (acts.length && /^[-–+•∙]/.test(first)) { cur().teacher.push(first, ...ls); return; }
    else if (/^(cách tiến hành|tiến trình|tổ chức thực hiện)\s*:?$/i.test(first)) { if (!ls.length) return; cur().teacher.push(...ls); return; }
    else if (acts.length && (SUB.test(first) || (majorSeen && !MAJOR.test(first)))) { cur().teacher.push(first, ...ls.filter((l) => !/^(cách tiến hành)/i.test(l))); return; }
    else { if (MAJOR.test(first)) majorSeen = true; start(first); }
    let goalMode = false;
    for (const l of ls) {
      if (/^mục tiêu\s*:?/i.test(l)) { const g = l.replace(/^mục tiêu\s*:?\s*/i, ''); cur().goal += (cur().goal && g ? ' ' : '') + g; goalMode = !g; continue; }
      if (goalMode && /^[-–+•]/.test(l) && !/\b(GV|HS)\b/.test(l)) { cur().goal += (cur().goal ? '\n' : '') + l; continue; }
      goalMode = false;
      if (false) continue;
      else if (/^(cách tiến hành|phương pháp|hình thức|kĩ thuật|kỹ thuật)\s*:?/i.test(l)) continue;
      else cur().teacher.push(l);
    }
  };
  for (const rows of tables) {
    if (!rows.length) continue;
    const h = rows[0].map(fold);
    let gv = h.findIndex((c) => /giao vien|\bgv\b/.test(c));
    let hs = h.findIndex((c) => /hoc sinh|\bhs\b/.test(c));
    const hasHeader = gv >= 0 && hs >= 0;
    const width = Math.max(...rows.map((r) => r.length));
    if (!hasHeader) { gv = Math.max(0, width - 2); hs = width - 1; }
    const tcol = h.findIndex((c) => /thoi gian|^tg$/.test(c));
    for (const r of rows.slice(hasHeader ? 1 : 0)) {
      if (r.length === 1 || r.every((c, i) => i === 0 || !c || c === r[0])) { addHeadCell(r[0]); continue; }
      const t = (r[gv] ?? '').trim(), s = (r[hs] ?? '').trim();
      const ls = lines(t);
      if (!s && ls.length && ls[0].length < 110 && (HEADING.test(ls[0]) || (!/^[-–+•*]/.test(ls[0]) && ls.length <= 3 && ls[0] === ls[0].replace(/\.$/, '')))) { addHeadCell(t); }
      else {
        const a = cur();
        if (t) a.teacher.push(t);
        if (s) a.student.push(s);
      }
      if (tcol >= 0 && r[tcol]) { const m = Number(/(\d+)/.exec(r[tcol])?.[1] ?? 0); if (m && !cur().minutes) cur().minutes = m; }
    }
  }
  if (!tables.length && paras.length) for (const p of paras) { if (HEADING.test(p) && p.length < 110) start(p); else cur().teacher.push(p); }
  const n = acts.length;
  return acts.filter((a) => a.title || a.teacher.length || a.student.length).map((a, i) => ({
    key: keyOf(a.title, i, n), title: a.title, minutes: a.minutes, goal: a.goal,
    teacher: a.teacher.join('\n'), student: a.student.join('\n'),
  }));
}

type Draft = { start: number; head: string[]; sec: string; goals: { k: string[]; c: string[]; q: string[]; i: string[]; labels: string[]; cur: 'k' | 'c' | 'q' | 'i' }; mat: { t: string[]; s: string[]; cur: 't' | 's' | '' }; tables: string[][][]; actParas: string[]; adjust: string[] };
const newDraft = (head: string[], start: number): Draft => ({ start, head, sec: 'I', goals: { k: [], c: [], q: [], i: [], labels: [], cur: 'k' }, mat: { t: [], s: [], cur: '' }, tables: [], actParas: [], adjust: [] });

/** Tách một file giáo án thành các giáo án (mỗi bài / tiết một giáo án) */
export function splitLessonPlans(blocks: DocBlock[], path: string): LibraryEntry[] {
  const fromPath = guessFromPath(path);
  const ctx: Ctx = { subject: fromPath.subject, extra: fromPath.extra, grade: fromPath.grade, week: null, topic: '' };
  const fileName = path.split(/[/\\]/).pop() ?? path;
  const wf = /tuan\s*(\d+)/.exec(fold(fileName)); if (wf) ctx.week = Number(wf[1]);
  const out: LibraryEntry[] = [];
  let buf: string[] = [];
  let bufStart = -1;
  let d: Draft | null = null;
  const addBuf = (i: number, ...xs: string[]) => { if (!xs.length) return; if (!buf.length) bufStart = i; buf.push(...xs); };
  const clearBuf = () => { buf = []; bufStart = -1; };
  /** khối bắt đầu giáo án mới: giáo án đầu tiên lấy cả phần đầu file */
  const startAt = (i: number) => (!d && !out.length ? 0 : bufStart >= 0 ? bufStart : i);

  const finish = (end: number) => {
    if (!d) return;
    const draft = d; d = null;
    const html = blocks.slice(draft.start, end + 1).map((b) => b.html).join('');
    const c: Ctx = { ...ctx };
    const title = readHeader(draft.head, c, fromPath.extra) || fileName.replace(/\.docx$/i, '').replace(/_/g, ' ');
    Object.assign(ctx, { subject: c.subject, extra: c.extra, grade: c.grade, week: c.week, topic: c.topic });
    const subject: PlanSubject = fromPath.stem ? 'stem' : c.subject ?? 'khac';
    const ft = fold(title);
    const lessonNo = Number(/\bbai\s*(\d+)/.exec(ft)?.[1] ?? 0) || null;
    const tm = /\btiet\s*(\d+(?:\s*(?:,|\+|-|–|va)\s*\d+)*)/.exec(ft);
    const nums = tm ? [...tm[1].matchAll(/\d+/g)].map((m) => Number(m[0])) : [];
    const onTap = /^on tap tiet\s*(\d+)/.exec(ft);
    const ppct = onTap ? Number(onTap[1]) : null;
    const periods = ppct ? [] : nums;
    const acts = activitiesFrom(draft.tables, draft.actParas);
    const g = draft.goals;
    const labels = g.labels;
    const plan: LessonPlan = {
      v: 1, subject, subjectLabel: subject === 'stem' ? 'Bài học STEM' : undefined, grade: c.grade ?? fromPath.grade ?? 1, className: '', lessonId: '',
      title: title.replace(/\s+/g, ' ').trim(), week: c.week ? String(c.week) : '', date: '', period: 0, minutes: 35,
      goals: { knowledge: g.k.join('\n'), competence: g.c.join('\n'), quality: g.q.join('\n') },
      goalLabels: labels.length ? [labels[0] ?? 'Kiến thức, kĩ năng', labels[1] ?? 'Năng lực', labels[2] ?? 'Phẩm chất'] : undefined,
      integration: g.i.join('\n') || undefined,
      materials: { teacher: draft.mat.t.join('\n'), student: draft.mat.s.join('\n') },
      activities: acts.length ? acts : [{ key: 'kham-pha', title: 'Hoạt động dạy học', minutes: 0, goal: '', teacher: '', student: '' }],
      assessment: '', adjust: draft.adjust.join('\n'), source: fileName, orig: html ? { html } : undefined,
    };
    if (c.extra && subject !== 'stem') plan.subjectLabel = `${subjectName(subject)} (BS)`;
    out.push({ subject, extra: c.extra && subject !== 'stem', grade: plan.grade, week: c.week, lessonNo, periods, ppct, title: plan.title, topic: c.topic, source: fileName, plan });
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === 'p' && !b.text) continue;
    if (b.t === 'p') {
      const s = b.text.trim();
      const r = roman(s);
      const f = fold(s);
      if (r === 'I' && /yeu cau|muc tieu/.test(f)) { const st = startAt(i); finish(st - 1); d = newDraft(buf, st); clearBuf(); continue; }
      if (!d) { if (s.length < 200) addBuf(i, ...lines(s)); continue; }
      if (r === 'II' && d.sec === 'I') { d.sec = 'II'; continue; }
      if (r === 'III' && (d.sec === 'II' || d.sec === 'I')) { d.sec = 'III'; continue; }
      if (r === 'IV' && d.sec === 'III') { d.sec = 'IV'; continue; }
      if (d.sec === 'I') {
        const g = d.goals;
        const head = /^(\d\.|[a-d]\)|-)?\s*(năng lực đặc thù|năng lực chung|năng lực|phẩm chất|kiến thức|kĩ năng|kỹ năng|tích hợp|nội dung tích hợp|giáo dục tích hợp)[^:]*:?\s*(.*)$/i.exec(s);
        if (head && s.length < 120 && (b.bold || /^\d\./.test(s) || /:$/.test(s.trim()) || !head[3])) {
          const name = fold(head[2]);
          g.cur = /tich hop/.test(name) ? 'i' : /pham chat/.test(name) ? 'q' : /nang luc chung/.test(name) || (name === 'nang luc' && g.k.length) ? 'c' : 'k';
          if (g.cur !== 'i') { const lab = s.replace(/^(\d\.|[a-d]\))\s*/, '').replace(/:.*$/, '').trim(); const idx = g.cur === 'k' ? 0 : g.cur === 'c' ? 1 : 2; g.labels[idx] = lab.charAt(0).toUpperCase() + lab.slice(1); }
          if (head[3]?.trim()) g[g.cur].push(head[3].trim());
          continue;
        }
        g[g.cur].push(s);
        continue;
      }
      if (d.sec === 'II') {
        const m = d.mat;
        const t = /^(\d\.\s*|-\s*)?(chuẩn bị của\s*)?(giáo viên|gv)\b[^:]*:?\s*(.*)$/i.exec(s);
        const h = /^(\d\.\s*|-\s*)?(chuẩn bị của\s*)?(học sinh|hs)\b[^:]*:?\s*(.*)$/i.exec(s);
        if (t) { m.cur = 't'; if (t[4]) m.t.push(t[4]); continue; }
        if (h) { m.cur = 's'; if (h[4]) m.s.push(h[4]); continue; }
        (m.cur === 's' ? m.s : m.t).push(s);
        continue;
      }
      if (d.sec === 'III') {
        // dòng in đậm sau bảng hoạt động: có thể là phần đầu của giáo án kế tiếp (file không có mục IV)
        if (d.tables.length && (b.bold || buf.length)) { addBuf(i, s); continue; }
        d.actParas.push(s);
        continue;
      }
      if (d.sec === 'IV') {
        if (b.bold) { addBuf(i, s); continue; }
        if (!isDots(s) && !buf.length) d.adjust.push(s);
        else if (!isDots(s)) addBuf(i, s);
      }
    } else if (!d) {
      const all = b.rows.flat();
      const k = all.findIndex((c) => roman(c) === 'I' || /^i\.\s/i.test(c.trim()));
      if (k >= 0) {
        const st = startAt(i);
        finish(st - 1);
        for (const c of all.slice(0, k)) if (c.length < 200) addBuf(i, ...lines(c));
        d = newDraft(buf, st); clearBuf();
        for (const c of all.slice(k)) for (const l of lines(c)) if (!roman(l)) d.goals.k.push(l);
      } else for (const c of all) if (c.length < 200) addBuf(i, ...lines(c));
    } else if (d) {
      if (d.sec === 'III') {
        if (buf.length) { d.tables.push(buf.map((x) => [x])); clearBuf(); }
        d.tables.push(b.rows);
      } else if (d.sec === 'II') {
        // bảng dụng cụ (STEM): STT | Thiết bị | Số lượng
        const items = b.rows.slice(1).map((r) => (r.length >= 3 ? `${r[1]}${r[2] ? ` (${r[2]})` : ''}` : r.filter(Boolean).join(': '))).filter((x) => x.trim());
        (d.mat.cur === 's' ? d.mat.s : d.mat.t).push(...items.map((x) => `- ${x}`));
      }
    }
  }
  finish(blocks.length - 1);
  return out.filter((e) => e.plan.activities.some((a) => a.teacher || a.student) || e.plan.goals.knowledge);
}

const NAMES: Partial<Record<PlanSubject, string>> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh', 'dao-duc': 'Đạo đức', tnxh: 'TNXH', hdtn: 'HĐTN' };
const subjectName = (s: PlanSubject) => NAMES[s] ?? s;

// ------------------------------------------------------------------ tìm giáo án cho một tiết của lịch báo giảng

export type LibraryMeta = Omit<LibraryEntry, 'plan'> & { id: string };

const words = (s: string) => new Set(fold(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 1 && !/^(bai|tiet|trang|va|cua|em|on|tap|luyen)$/.test(w)));
function overlap(a: string, b: string): number {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

/**
 * Chấm điểm một giáo án trong kho cho một tiết: cùng môn (+ buổi 2), cùng khối; số bài, số tiết, tuần, tên bài.
 * Trả về điểm (≥ 5 là dùng được) — số càng lớn càng khớp.
 */
export function scoreEntry(e: LibraryMeta, q: { subject: PlanSubject; extra: boolean; grade: number; week: number | null; title: string; ppct: number | null; integration?: string }): number {
  if (e.grade !== q.grade) return 0;
  const ft = fold(q.title);
  // tiết thay bằng bài học STEM (ghi ở cột tích hợp)
  if (e.subject === 'stem') {
    const ref = /stem\s*:?\s*(.+)$/i.exec(q.integration ?? '')?.[1];
    return ref ? Math.round(overlap(ref.replace(/\(.*?\)/g, ''), e.title) * 10) : 0;
  }
  if (e.subject !== q.subject || e.extra !== q.extra) return 0;
  let s = 1;
  const bai = Number(/\bbai\s*(\d+)/.exec(ft)?.[1] ?? 0) || null;
  const tiet = Number(/\btiet\s*(\d+)/.exec(ft)?.[1] ?? 0) || null;
  if (q.extra) {
    if (e.ppct && q.ppct) s += e.ppct === q.ppct ? 8 : -5;
    if (e.week && q.week) s += e.week === q.week ? 4 : -4;
    return s;
  }
  if (bai && e.lessonNo) s += bai === e.lessonNo ? 5 : -6;
  else if (bai && !e.lessonNo) s -= 2;
  const kind = (t: string) => (/^(sinh hoat duoi co|shdc|chao co)/.test(t) ? 'dc' : /^(sinh hoat lop|shl)/.test(t) ? 'lop' : '');
  const kq = kind(ft), ke = kind(fold(e.title));
  if (kq || ke) s += kq === ke ? 4 : -4;
  if (tiet && e.periods.length) s += e.periods.includes(tiet) ? 3 : -2;
  if (e.week && q.week) s += e.week === q.week ? 2 : Math.abs(e.week - q.week) <= 1 ? 0 : -2;
  s += Math.round(overlap(q.title, e.title) * 4);
  if (!bai && /on luyen tuan|on tap/.test(ft) && /on luyen|on tap/.test(fold(e.title))) s += 2;
  return s;
}

/** Chọn giáo án tốt nhất cho từng tiết; tiết bổ sung không có số PPCT thì lấy lần lượt theo thứ tự trong tuần */
export function pickFromLibrary<T extends LibraryMeta>(items: T[], rows: { subject: PlanSubject; extra: boolean; grade: number; week: number | null; title: string; ppct: number | null; integration?: string }[]): (T | null)[] {
  const used = new Set<string>();
  return rows.map((q) => {
    let best: T | null = null, bestScore = 4;
    for (const e of items) {
      if (q.extra && used.has(e.id)) continue;
      const sc = scoreEntry(e, q);
      if (sc > bestScore) { best = e; bestScore = sc; }
    }
    if (best && q.extra) used.add(best.id);
    return best;
  });
}
