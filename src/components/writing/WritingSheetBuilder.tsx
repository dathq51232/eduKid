'use client';

// Tạo trang vở luyện chữ khổ A4 để in cho học sinh viết tay ngoài giấy:
// cô nhập câu thơ, ca dao (hoặc chọn trong kho), chọn font tập viết, vở 4 / 5 ô li, màu đường kẻ, số dòng mẫu / tô / trống,
// hoạ tiết góc vở, viền trang; lưu thành bài giao cho lớp (học sinh luyện thêm trên màn hình).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpenText, Eye, EyeOff, FilePlus2, Lock, Move, Minus, Plus, Printer, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import SheetPageSvg, { MOTIFS, Motif, type UserDeco } from './SheetPageSvg';
import { assetError, assetUsage, deleteAsset, fmtMB, listAssets, uploadAsset, type TeacherAsset } from '@/lib/assets/client';
import { IMAGE_ACCEPT, baseName, prepareDeco } from '@/lib/assets/image';
import { FLORALS, Floral, FloralScope } from './floral';
import { STICKERS } from '@/lib/stickers';
import { CORNER_POS0, DEFAULT_CORNER_POS, DEFAULT_SHEET, FALLBACK_FONT, LINE_COLORS, PAGE_SIZES, TAP_FONTS, fallbackScale, pageDims, textSegments, fontFamily, layoutSheet, loadTapFont, normalizeSheet, type Corner, type CornerPos, type SheetSettings } from '@/lib/writing/sheet';
import { VERSE_GROUPS } from '@/lib/writing/verses';
import { deleteTask, listTasks, saveTask, setTaskActive, taskError, type WritingTask } from '@/lib/writing/tasks';

const STORE = 'edukid:trang-vo';
const CORNERS: { k: Corner; label: string }[] = [{ k: 'tl', label: 'Góc trên trái' }, { k: 'tr', label: 'Góc trên phải' }, { k: 'bl', label: 'Góc dưới trái' }, { k: 'br', label: 'Góc dưới phải' }];
const DECO_PRESETS: { label: string; v: Partial<SheetSettings> }[] = [
  { label: 'Hoa hồng', v: { corners: { tl: 'f:hong', tr: 'none', bl: 'none', br: 'f:hong' }, decoSize: 34, border: 'none' } },
  { label: 'Đào & mai', v: { corners: { tl: 'f:dao', tr: 'f:mai', bl: 'f:mai', br: 'f:dao' }, decoSize: 30, border: 'doi', borderColor: '#ec4899' } },
  { label: 'Hoa phượng', v: { corners: { tl: 'f:phuong', tr: 'none', bl: 'none', br: 'f:phuong' }, decoSize: 38, border: 'don', borderColor: '#dc2626' } },
  { label: 'Hoa sen', v: { corners: { tl: 'f:sen', tr: 'none', bl: 'none', br: 'f:sen' }, decoSize: 36, border: 'doi', borderColor: '#10b981' } },
  { label: 'Cúc trắng', v: { corners: { tl: 'f:cuc', tr: 'f:cuc', bl: 'f:cuc', br: 'f:cuc' }, decoSize: 28, border: 'cham', borderColor: '#f59e0b' } },
  { label: 'Hướng dương', v: { corners: { tl: 'f:huong-duong', tr: 'none', bl: 'none', br: 'f:huong-duong' }, decoSize: 36, border: 'none' } },
  { label: 'Oải hương', v: { corners: { tl: 'f:oai-huong', tr: 'none', bl: 'none', br: 'f:oai-huong' }, decoSize: 36, border: 'song', borderColor: '#8b5cf6' } },
  { label: 'Hình vẽ vui', v: { corners: { tl: 'm:may', tr: 'm:mat-troi', bl: 'none', br: 'm:bong' }, decoSize: 26, decoColor: '#3b82f6', border: 'none' } },
  { label: 'Không trang trí', v: { corners: { tl: 'none', tr: 'none', bl: 'none', br: 'none' }, border: 'none' } },
];

// Mẫu theo chương trình tập viết tiểu học: chữ cỡ vừa (chữ thường cao 2 li) học ở lớp 1–2, cỡ nhỏ (1 li) từ cuối lớp 1;
// lớp 4–5 viết cỡ nhỏ, có thể tập chữ nghiêng nét thanh đậm. Ô li 2 mm là cỡ vở ô li thông dụng (chỉnh lại được).
const STANDARDS: { id: string; label: string; hint: string; v: Partial<SheetSettings> }[] = [
  { id: 'l1-chu', label: 'Lớp 1 — chữ cái, vần (cỡ vừa)', hint: 'Vở 4 ô li, chữ thường cao 2 li, lặp kín dòng; 1 dòng mẫu, 3 dòng tô.', v: { paper: 4, oli: 2, size: 'vua', layout: 'lap', font: 'hp4hn', sample: 1, trace: 3, blank: 2, vertical: true, margin: true } },
  { id: 'l1-cau', label: 'Lớp 1 — từ, câu ứng dụng (cỡ vừa)', hint: 'Cỡ vừa, viết cả câu; 1 dòng mẫu, 2 dòng tô, 2 dòng trống.', v: { paper: 4, oli: 2, size: 'vua', layout: 'cau', font: 'hp4hn', sample: 1, trace: 2, blank: 2, vertical: true, margin: true } },
  { id: 'l23-hoa', label: 'Lớp 2–3 — chữ hoa (cỡ vừa)', hint: 'Chữ hoa cao 5 li, lặp kín dòng.', v: { paper: 4, oli: 2, size: 'vua', layout: 'lap', font: 'hp4hn', sample: 1, trace: 2, blank: 2 } },
  { id: 'l23-cau', label: 'Lớp 2–3 — câu ứng dụng (cỡ nhỏ)', hint: 'Cỡ nhỏ: chữ thường cao 1 li; 1 dòng mẫu, 1 dòng tô, 3 dòng trống.', v: { paper: 4, oli: 2, size: 'nho', layout: 'cau', font: 'hp4hn', sample: 1, trace: 1, blank: 3 } },
  { id: 'l45', label: 'Lớp 4–5 — đoạn thơ, ca dao (cỡ nhỏ)', hint: 'Cỡ nhỏ, chữ đứng; 1 dòng mẫu, 3 dòng trống.', v: { paper: 4, oli: 2, size: 'nho', layout: 'cau', font: 'hp4hn', sample: 1, trace: 0, blank: 3 } },
  { id: 'l45-nghieng', label: 'Lớp 4–5 — chữ nghiêng nét thanh đậm', hint: 'Chữ sáng tạo cho đội tuyển viết chữ đẹp.', v: { paper: 4, oli: 2, size: 'nho', layout: 'cau', font: 'kieu5', sample: 1, trace: 1, blank: 2 } },
  { id: 'toan', label: 'Phiếu Toán — ô li vuông (như vở Toán)', hint: 'Ô li vuông, đậm mỗi 4 li; chữ in cho số và phép tính, mỗi phép tính trên một ô lớn.', v: { paper: 4, oli: 2.2, size: 'vua', grid: 'vuong', layout: 'cau', font: 'in-n', sample: 1, trace: 0, blank: 0, margin: false, lineColor: '#8b5cf6' } },
];

function Stepper({ label, value, min, max, onChange, hint }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="wsb-step">
      <span>{label}{hint && <small>{hint}</small>}</span>
      <div>
        <button type="button" aria-label={`Bớt ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus aria-hidden="true" /></button>
        <b aria-live="polite">{value}</b>
        <button type="button" aria-label={`Thêm ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function Swatches({ value, onChange, label, colors = LINE_COLORS }: { value: string; onChange: (c: string) => void; label: string; colors?: { c: string; label: string }[] }) {
  return (
    <div className="wsb-sw" role="radiogroup" aria-label={label}>
      {colors.map((x) => <button key={x.c} type="button" role="radio" aria-checked={value === x.c} aria-label={x.label} title={x.label} style={{ background: x.c }} className={value === x.c ? 'is-on' : ''} onClick={() => onChange(x.c)} />)}
      <label className="wsb-sw-pick" title="Chọn màu khác"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label}: màu khác`} /></label>
    </div>
  );
}

/** Ảnh của tôi: tải ảnh lên kho, tự xoá nền trắng, cắt viền, thu vào khung vuông canh sát góc */
function MyDecos({ list, value, onChange, onChanged }: { list: TeacherAsset[] | null; value: string; onChange: (v: string) => void; onChanged: (l: TeacherAsset[]) => void }) {
  const [white, setWhite] = useState(true);
  const [corner, setCornerAlign] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [usage, setUsage] = useState<{ bytes: number; limit: number } | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { void assetUsage().then((u) => { if (u) setUsage(u); }); }, [list?.length]);
  const pick = async (f: File) => {
    setBusy(true); setMsg(null);
    try {
      const r = await prepareDeco(f, { removeWhite: white, align: corner ? 'corner' : 'center' });
      const row = await uploadAsset('deco', baseName(f), r.blob, { meta: { flip: corner, fill: r.fill } });
      onChanged([row, ...(list ?? [])]);
      onChange(`u:${row.id}`);
      setMsg({ kind: 'ok', text: 'Đã thêm ảnh vào kho và đặt vào góc đang chọn.' });
    } catch (e) { setMsg({ kind: 'error', text: assetError(e) }); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  const remove = async (a: TeacherAsset) => {
    if (!window.confirm(`Xoá ảnh “${a.name}” khỏi kho?`)) return;
    try { await deleteAsset(a); onChanged((list ?? []).filter((x) => x.id !== a.id)); if (value === `u:${a.id}`) onChange('none'); }
    catch (e) { setMsg({ kind: 'error', text: assetError(e) }); }
  };
  return (
    <div className="wsb-mine">
      <b className="wsb-deco-h">Ảnh của tôi {usage && <small>· kho {fmtMB(usage.bytes)} / {fmtMB(usage.limit)}</small>}</b>
      <input ref={ref} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); }} />
      <div className="wsb-mine-opts">
        <label className="wsb-check"><input type="checkbox" checked={white} onChange={(e) => setWhite(e.target.checked)} /> Xoá nền trắng</label>
        <label className="wsb-check"><input type="checkbox" checked={corner} onChange={(e) => setCornerAlign(e.target.checked)} /> Canh sát góc, lật theo góc</label>
      </div>
      <div className="wsb-deco">
        <button type="button" className="wsb-up" disabled={busy} onClick={() => ref.current?.click()} title="PNG, JPG, WebP, SVG — tự cắt viền, thu vừa khung hoạ tiết"><Upload aria-hidden="true" />{busy ? '…' : 'Tải ảnh'}</button>
        {(list ?? []).map((a) => (
          <span key={a.id} className="wsb-mine-it">
            <button type="button" role="radio" aria-checked={value === `u:${a.id}`} className={value === `u:${a.id}` ? 'is-on' : ''} onClick={() => onChange(`u:${a.id}`)} title={a.name} aria-label={a.name}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh trong kho riêng (đường dẫn ký) */}
              {a.url ? <img src={a.url} alt="" loading="lazy" /> : '?'}
            </button>
            <button type="button" className="wsb-mine-x" aria-label={`Xoá ảnh ${a.name}`} onClick={() => void remove(a)}><Trash2 aria-hidden="true" /></button>
          </span>
        ))}
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
    </div>
  );
}

function DecoPick({ value, onChange, color, mine }: { value: string; onChange: (v: string) => void; color: string; mine?: React.ReactNode }) {
  return (
    <div className="wsb-deco" role="radiogroup">
      <button type="button" role="radio" aria-checked={value === 'none'} className={value === 'none' ? 'is-on' : ''} onClick={() => onChange('none')} title="Không">∅</button>
      {mine && <div className="wsb-deco-full">{mine}</div>}
      <b className="wsb-deco-h">Hoa văn bo góc (hoa thật)</b>
      {FLORALS.map((f) => (
        <button key={f.id} type="button" role="radio" aria-checked={value === `f:${f.id}`} className={`is-floral${value === `f:${f.id}` ? ' is-on' : ''}`} onClick={() => onChange(`f:${f.id}`)} title={f.label} aria-label={f.label}>
          <svg viewBox="0 0 100 100" aria-hidden="true"><FloralScope><Floral id={f.id} /></FloralScope></svg><small>{f.label}</small>
        </button>
      ))}
      <b className="wsb-deco-h">Hình vẽ đơn giản (đổi được màu)</b>
      {MOTIFS.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={value === `m:${m.id}`} className={value === `m:${m.id}` ? 'is-on' : ''} onClick={() => onChange(`m:${m.id}`)} title={m.label} aria-label={m.label}>
          <svg viewBox="0 0 72 72" aria-hidden="true"><Motif id={m.id} color={color} /></svg>
        </button>
      ))}
      <b className="wsb-deco-h">Tranh dán hoạt hình</b>
      {STICKERS.map((st) => (
        <button key={st.id} type="button" role="radio" aria-checked={value === `s:${st.id}`} className={value === `s:${st.id}` ? 'is-on' : ''} onClick={() => onChange(`s:${st.id}`)} title={st.name} aria-label={st.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/stickers/${st.id}.webp`} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

export default function WritingSheetBuilder({ classId, className, grade }: { classId: string | null; className?: string; grade: number }) {
  const [s, setS] = useState<SheetSettings>(() => ({ ...DEFAULT_SHEET, size: grade >= 3 ? 'nho' : 'vua' }));
  const [ready, setReady] = useState(false);
  const [measureV, setMeasureV] = useState(0);
  const [group, setGroup] = useState(VERSE_GROUPS[0].id);
  const [corner, setCorner] = useState<Corner>('tl');
  const [std, setStd] = useState<string | null>(null);
  const [decos, setDecos] = useState<TeacherAsset[] | null>(null);
  useEffect(() => { void listAssets(['deco']).then(setDecos, () => setDecos([])); }, []);
  const userDeco: UserDeco = useMemo(() => Object.fromEntries((decos ?? []).filter((a) => a.url).map((a) => [a.id, { url: a.url as string, flip: a.meta.flip !== false }])), [decos]);
  const [tasks, setTasks] = useState<WritingTask[] | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [printing, setPrinting] = useState(false);
  const loadedPrefs = useRef(false);
  const set = useCallback(<K extends keyof SheetSettings>(k: K, v: SheetSettings[K]) => setS((o) => ({ ...o, [k]: v })), []);
  const setPos = useCallback((c: Corner, p: Partial<CornerPos>) => setS((o) => ({ ...o, cornerPos: { ...o.cornerPos, [c]: { ...(o.cornerPos?.[c] ?? CORNER_POS0), ...p } } })), []);

  // kéo hoạ tiết góc trên trang xem trước để đổi vị trí (đơn vị mm; góc phải / dưới tính vào trong từ mép phải / dưới)
  const onCornerDown = useCallback((c: Corner, e: React.PointerEvent<SVGGElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    e.preventDefault();
    setCorner(c);
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    const mm = vb.width / r.width;
    const sx = e.clientX, sy = e.clientY;
    const p0 = s.cornerPos?.[c] ?? CORNER_POS0;
    const fx = c === 'tl' || c === 'bl' ? 1 : -1, fy = c === 'tl' || c === 'tr' ? 1 : -1;
    const size = s.decoSize * p0.k / 100;
    const maxX = vb.width - 5 - size, maxY = vb.height - 5 - size;
    const move = (ev: PointerEvent) => {
      const x = Math.round(Math.min(maxX, Math.max(-5, p0.x + fx * (ev.clientX - sx) * mm)));
      const y = Math.round(Math.min(maxY, Math.max(-5, p0.y + fy * (ev.clientY - sy) * mm)));
      setPos(c, { x, y });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [s.cornerPos, s.decoSize, setPos]);

  // cài đặt lần trước (trên máy này)
  useEffect(() => {
    try { const raw = localStorage.getItem(STORE); if (raw) setS(normalizeSheet(JSON.parse(raw))); } catch { /* bỏ qua */ }
    loadedPrefs.current = true;
  }, []);
  useEffect(() => { if (loadedPrefs.current) { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* bỏ qua */ } } }, [s]);

  // nạp font đang chọn + font tiêu đề, rồi mới đo chữ để xuống dòng
  useEffect(() => {
    let live = true;
    setReady(false);
    void Promise.all([loadTapFont(s.font), loadTapFont('in-n'), loadTapFont('hp4b')]).then(() => { if (live) { setReady(true); setMeasureV((v) => v + 1); } }, () => { if (live) setReady(true); });
    return () => { live = false; };
  }, [s.font]);

  const layout = useMemo(() => {
    if (!ready || typeof document === 'undefined') return null; // chờ font (và tránh lệch khi dựng trang ở máy chủ)
    const c = document.createElement('canvas').getContext('2d')!;
    c.font = `100px "${fontFamily(s.font)}", cursive`;
    const c2 = document.createElement('canvas').getContext('2d')!;
    c2.font = `${100 * fallbackScale(s.font)}px ${FALLBACK_FONT}`;
    const cache = new Map<string, number>();
    const measure = (t: string) => {
      let w = cache.get(t);
      if (w === undefined) { w = textSegments(t, s.font).reduce((a, g) => a + (g.safe ? c : c2).measureText(g.t).width, 0) / 100; cache.set(t, w); }
      return w;
    };
    return layoutSheet(s, measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, measureV, ready]);

  const reloadTasks = useCallback(async () => {
    if (!classId) return;
    try { setTasks(await listTasks(classId)); } catch (e) { setTasks([]); setMsg({ kind: 'info', text: taskError(e) }); }
  }, [classId]);
  useEffect(() => { void reloadTasks(); }, [reloadTasks]);

  // in: dựng các trang vào một vùng riêng rồi gọi lệnh in của trình duyệt
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add('ws-printing');
    // khổ giấy A4, không lề: chỉ gắn trong lúc in trang vở (các trang in khác của app giữ cài đặt riêng)
    const st = document.createElement('style');
    const d = pageDims(s.pageSize);
    st.textContent = `@page { size: ${d.w}mm ${d.h}mm; margin: 0; }`;
    document.head.appendChild(st);
    const done = () => { document.body.classList.remove('ws-printing'); st.remove(); setPrinting(false); };
    window.addEventListener('afterprint', done, { once: true });
    // chờ font và ảnh của tôi ở góc vở tải xong rồi mới in
    const imgs = Object.values(s.corners).filter((v) => v.startsWith('u:')).map((v) => userDeco[v.slice(2)]?.url).filter(Boolean) as string[];
    const ready = Promise.all([document.fonts.ready, ...imgs.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => undefined); })]);
    const t = window.setTimeout(() => { void ready.then(() => window.print()); }, 150);
    return () => { window.clearTimeout(t); window.removeEventListener('afterprint', done); document.body.classList.remove('ws-printing'); st.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printing]);

  const addVerse = (v: string) => setS((o) => ({ ...o, text: o.text.trim() ? `${o.text.trim()}\n${v}` : v, layout: group === 'chu-cai' ? 'lap' : o.layout }));
  const lineCount = s.text.split(/\r?\n/).filter((l) => l.trim()).length;
  const pages = layout?.pages ?? [];

  const save = async (asNew: boolean) => {
    if (!classId) return;
    setBusy(true); setMsg(null);
    try {
      const cur = tasks?.find((t) => t.id === taskId);
      const id = await saveTask(classId, asNew ? null : taskId, s.title, s, cur?.active ?? true);
      setTaskId(id);
      setMsg({ kind: 'ok', text: asNew || !taskId ? 'Đã giao bài cho lớp. Học sinh vào mục Luyện chữ → “Cô giao” để luyện trên máy.' : 'Đã cập nhật bài.' });
      await reloadTasks();
    } catch (e) { setMsg({ kind: 'error', text: taskError(e) }); } finally { setBusy(false); }
  };

  return (
    <div className="wsb">
      <aside className="wsb-panel" aria-label="Cài đặt trang vở">
        <div className="wsb-std">
          <label className="wsb-f"><span>Mẫu theo chương trình tiểu học</span>
            <select value="" onChange={(e) => { const st = STANDARDS.find((x) => x.id === e.target.value); if (st) { setS((o) => ({ ...o, ...st.v })); setStd(st.id); } }}>
              <option value="">— Chọn mẫu chuẩn để điền nhanh —</option>
              {STANDARDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>
          {std && <p className="dash-muted">{STANDARDS.find((x) => x.id === std)?.hint} Vẫn chỉnh tay được mọi mục bên dưới.</p>}
        </div>
        <details open className="wsb-sec">
          <summary>1. Nội dung luyện viết</summary>
          <label className="wsb-f"><span>Tiêu đề trang</span><input value={s.title} maxLength={120} onChange={(e) => set('title', e.target.value)} placeholder="VD: Luyện viết ca dao tuần 8" /></label>
          <label className="wsb-f"><span>Câu thơ, ca dao… <small>(mỗi dòng một câu · {lineCount} dòng)</small></span>
            <textarea rows={6} value={s.text} maxLength={4000} onChange={(e) => set('text', e.target.value)} placeholder={'Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra'} />
          </label>
          <div className="wsb-bank">
            <div className="wsb-bank-h"><BookOpenText aria-hidden="true" /> Kho câu mẫu
              <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Nhóm câu mẫu">{VERSE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
            </div>
            <div className="wsb-bank-list">
              {(VERSE_GROUPS.find((g) => g.id === group)?.items ?? []).map((v) => (
                <button key={v} type="button" onClick={() => addVerse(v)} title="Thêm vào nội dung">{v.split('\n').join(' / ')}</button>
              ))}
            </div>
            <button type="button" className="mini-btn" onClick={() => set('text', '')}><RotateCcw aria-hidden="true" /> Xoá hết nội dung</button>
          </div>
          <div className="wsb-seg" role="radiogroup" aria-label="Cách dàn chữ">
            <button type="button" role="radio" aria-checked={s.layout === 'cau'} className={s.layout === 'cau' ? 'is-on' : ''} onClick={() => set('layout', 'cau')}>Viết cả câu</button>
            <button type="button" role="radio" aria-checked={s.layout === 'lap'} className={s.layout === 'lap' ? 'is-on' : ''} onClick={() => set('layout', 'lap')}>Lặp kín dòng</button>
          </div>
        </details>

        <details open className="wsb-sec">
          <summary>2. Chữ mẫu</summary>
          <label className="wsb-f"><span>Font chữ</span>
            <select value={s.font} onChange={(e) => set('font', e.target.value as SheetSettings['font'])}>
              {[...new Set(TAP_FONTS.map((f) => f.group))].map((g) => (
                <optgroup key={g} label={g}>{TAP_FONTS.filter((f) => f.group === g).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
              ))}
            </select>
          </label>
          <p className="wsb-font-demo" style={{ fontFamily: `"${fontFamily(s.font)}", cursive` }} aria-hidden="true">{ready ? 'Ăn quả nhớ kẻ trồng cây' : '…'}</p>
          <div className="wsb-seg" role="radiogroup" aria-label="Cỡ chữ">
            <button type="button" role="radio" aria-checked={s.size === 'vua'} className={s.size === 'vua' ? 'is-on' : ''} onClick={() => set('size', 'vua')}>Cỡ vừa <small>(2 li)</small></button>
            <button type="button" role="radio" aria-checked={s.size === 'nho'} className={s.size === 'nho' ? 'is-on' : ''} onClick={() => set('size', 'nho')}>Cỡ nhỏ <small>(1 li)</small></button>
          </div>
          <Stepper label="Dòng chữ mẫu" value={s.sample} min={0} max={3} onChange={(v) => set('sample', v)} />
          <Stepper label="Dòng tô theo" value={s.trace} min={0} max={6} onChange={(v) => set('trace', v)} />
          <Stepper label="Dòng để trống" value={s.blank} min={0} max={10} onChange={(v) => set('blank', v)} hint="sau mỗi câu" />
          <div className="wsb-f"><span>Kiểu chữ tô</span>
            <div className="wsb-seg" role="radiogroup" aria-label="Kiểu chữ tô">
              {([['mo', 'Chữ mờ'], ['cham', 'Nét chấm'], ['rong', 'Nét rỗng']] as const).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={s.traceStyle === k} className={s.traceStyle === k ? 'is-on' : ''} onClick={() => set('traceStyle', k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="wsb-f"><span>Màu chữ mẫu</span><Swatches label="Màu chữ mẫu" value={s.ink} onChange={(c) => set('ink', c)} colors={[{ c: '#1e3a8a', label: 'Xanh mực' }, { c: '#111827', label: 'Đen' }, { c: '#7c3aed', label: 'Tím' }, { c: '#be123c', label: 'Đỏ' }]} /></div>
          <div className="wsb-f"><span>Màu chữ tô</span><Swatches label="Màu chữ tô" value={s.traceColor} onChange={(c) => set('traceColor', c)} colors={[{ c: '#94a3b8', label: 'Xám' }, { c: '#93c5fd', label: 'Xanh nhạt' }, { c: '#f9a8d4', label: 'Hồng nhạt' }, { c: '#fcd34d', label: 'Vàng' }]} /></div>
        </details>

        <details open className="wsb-sec">
          <summary>3. Giấy ô li & khổ giấy</summary>
          <label className="wsb-f"><span>Khổ giấy</span>
            <select value={s.pageSize} onChange={(e) => set('pageSize', e.target.value as SheetSettings['pageSize'])}>{PAGE_SIZES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
          </label>
          <div className="wsb-seg" role="radiogroup" aria-label="Loại vở">
            <button type="button" role="radio" aria-checked={s.paper === 4} className={s.paper === 4 ? 'is-on' : ''} onClick={() => set('paper', 4)}>Vở 4 ô li</button>
            <button type="button" role="radio" aria-checked={s.paper === 5} className={s.paper === 5 ? 'is-on' : ''} onClick={() => set('paper', 5)}>Vở 5 ô li</button>
          </div>
          <label className="wsb-f"><span>Cỡ ô li: <b>{s.oli.toFixed(1)} mm</b> <small>(ô lớn {(s.oli * s.paper).toFixed(1)} mm)</small></span>
            <input type="range" min={1.5} max={3.5} step={0.1} value={s.oli} onChange={(e) => set('oli', Number(e.target.value))} />
          </label>
          <div className="wsb-f"><span>Khung ô li</span>
            <div className="wsb-seg" role="radiogroup" aria-label="Khung ô li">
              <button type="button" role="radio" aria-checked={s.gridMode === 'auto'} className={s.gridMode === 'auto' ? 'is-on' : ''} onClick={() => set('gridMode', 'auto')}>Tự vừa trang</button>
              <button type="button" role="radio" aria-checked={s.gridMode === 'fixed'} className={s.gridMode === 'fixed' ? 'is-on' : ''}
                onClick={() => setS((o) => ({ ...o, gridMode: 'fixed', rows: o.rows > 0 ? o.rows : layout?.rows ?? 20, cols: o.cols > 0 ? o.cols : layout?.cols ?? 18 }))}><Lock aria-hidden="true" /> Khoá hàng × cột</button>
            </div>
            {s.gridMode === 'fixed' && layout ? (
              <div className="wsb-grid-fix">
                <Stepper label="Số hàng (ô lớn)" value={Math.min(s.rows, layout.maxRows)} min={1} max={layout.maxRows} onChange={(v) => set('rows', v)} hint={`tối đa ${layout.maxRows}`} />
                <Stepper label="Số cột (ô lớn)" value={Math.min(s.cols, layout.maxCols)} min={1} max={layout.maxCols} onChange={(v) => set('cols', v)} hint={`tối đa ${layout.maxCols}`} />
                <small>Khung {(layout.cols * layout.sq / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} × {(layout.rows * layout.sq / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} cm, giữ nguyên ở mọi trang — kéo hoạ tiết góc đi đâu cũng không thêm / bớt hàng.</small>
              </div>
            ) : <small>Khung ô li tự lấp đầy trang, chừa chỗ cho hoạ tiết góc ({layout ? `${layout.rows} hàng × ${layout.cols} cột` : '…'}).</small>}
          </div>
          <div className="wsb-f"><span>Màu đường kẻ</span><Swatches label="Màu đường kẻ" value={s.lineColor} onChange={(c) => set('lineColor', c)} /></div>
          <div className="wsb-f"><span>Đường kẻ dọc</span>
            <div className="wsb-seg" role="radiogroup" aria-label="Đường kẻ dọc">
              {([['li', 'Từng ô li nhỏ'], ['o', 'Mỗi ô lớn'], ['none', 'Không kẻ']] as const).map(([k, l]) => {
                const cur = s.grid === 'vuong' ? 'li' : s.vertical ? 'o' : 'none';
                return <button key={k} type="button" role="radio" aria-checked={cur === k} className={cur === k ? 'is-on' : ''}
                  onClick={() => setS((o) => ({ ...o, grid: k === 'li' ? 'vuong' : 'ngang', vertical: k !== 'none' }))}>{l}</button>;
              })}
            </div>
            <small>Từng ô li nhỏ: chia thành ô vuông {s.paper} × {s.paper} li trong mỗi ô lớn, đường đậm ở mỗi ô lớn.</small>
          </div>
          <label className="wsb-check"><input type="checkbox" checked={s.margin} onChange={(e) => set('margin', e.target.checked)} /> Lề đỏ bên trái
            {s.margin && <input type="color" value={s.marginColor} onChange={(e) => set('marginColor', e.target.value)} aria-label="Màu lề" />}
          </label>
        </details>

        <details open className="wsb-sec">
          <summary>4. Trang trí</summary>
          <label className="wsb-check"><input type="checkbox" checked={s.header} onChange={(e) => set('header', e.target.checked)} /> Dòng Họ tên · Lớp · Ngày</label>
          <label className="wsb-check"><input type="checkbox" checked={s.headerEvery} onChange={(e) => set('headerEvery', e.target.checked)} /> Lặp tiêu đề ở mọi trang</label>
          <div className="wsb-presets">{DECO_PRESETS.map((p) => <button key={p.label} type="button" className="mini-btn" onClick={() => setS((o) => ({ ...o, ...p.v, cornerPos: DEFAULT_CORNER_POS }))}>{p.label}</button>)}</div>
          <div className="wsb-corners">
            <div className="wsb-cpage" role="tablist" aria-label="Chọn góc vở">
              {CORNERS.map((c) => (
                <button key={c.k} type="button" role="tab" aria-selected={corner === c.k} className={`c-${c.k}${corner === c.k ? ' is-on' : ''}${s.corners[c.k] !== 'none' ? ' has' : ''}`} onClick={() => setCorner(c.k)} title={c.label} aria-label={c.label} />
              ))}
            </div>
            <span><b>{CORNERS.find((c) => c.k === corner)?.label}</b><small>Bấm góc trên hình trang vở rồi chọn hoạ tiết hoặc tranh dán bên dưới.</small></span>
          </div>
          <DecoPick value={s.corners[corner]} color={s.decoColor} onChange={(v) => setS((o) => ({ ...o, corners: { ...o.corners, [corner]: v } }))}
            mine={<MyDecos list={decos} value={s.corners[corner]} onChange={(v) => setS((o) => ({ ...o, corners: { ...o.corners, [corner]: v } }))} onChanged={setDecos} />} />
          <label className="wsb-f"><span>Cỡ hoa văn / hoạ tiết (cả 4 góc): <b>{s.decoSize} mm</b></span><input type="range" min={12} max={50} value={s.decoSize} onChange={(e) => set('decoSize', Number(e.target.value))} /></label>
          {s.corners[corner] !== 'none' && (() => {
            const p = s.cornerPos?.[corner] ?? CORNER_POS0;
            const { w, h } = pageDims(s.pageSize);
            const size = s.decoSize * p.k / 100;
            const right = corner === 'tr' || corner === 'br', bottom = corner === 'bl' || corner === 'br';
            return (
              <div className="wsb-pos">
                <div className="wsb-pos-h"><Move aria-hidden="true" /> Vị trí {CORNERS.find((c) => c.k === corner)?.label.toLowerCase()}
                  <button type="button" className="mini-btn" disabled={p.x === 0 && p.y === 0 && p.k === 100} onClick={() => setPos(corner, CORNER_POS0)}><RotateCcw aria-hidden="true" /> Về sát góc</button>
                </div>
                <small>Kéo thả hoạ tiết ngay trên trang vở, hoặc chỉnh bằng thanh trượt.</small>
                <label className="wsb-f"><span>Cách mép {right ? 'phải' : 'trái'}: <b>{p.x} mm</b></span><input type="range" min={-5} max={Math.max(0, Math.floor(w - 10 - size))} value={p.x} onChange={(e) => setPos(corner, { x: Number(e.target.value) })} /></label>
                <label className="wsb-f"><span>Cách mép {bottom ? 'dưới' : 'trên'}: <b>{p.y} mm</b></span><input type="range" min={-5} max={Math.max(0, Math.floor(h - 10 - size))} value={p.y} onChange={(e) => setPos(corner, { y: Number(e.target.value) })} /></label>
                <label className="wsb-f"><span>Cỡ riêng góc này: <b>{p.k}%</b> <small>({Math.round(size)} mm)</small></span><input type="range" min={40} max={200} step={5} value={p.k} onChange={(e) => setPos(corner, { k: Number(e.target.value) })} /></label>
              </div>
            );
          })()}
          <div className="wsb-f"><span>Màu hình vẽ đơn giản <small>(hoa văn hoa thật giữ màu tự nhiên)</small></span><Swatches label="Màu hoạ tiết" value={s.decoColor} onChange={(c) => set('decoColor', c)} /></div>
          <label className="wsb-f"><span>Viền trang</span>
            <select value={s.border} onChange={(e) => set('border', e.target.value as SheetSettings['border'])}>
              <option value="none">Không viền</option><option value="don">Viền đơn</option><option value="doi">Viền đôi</option><option value="cham">Viền chấm bi</option><option value="song">Viền gợn sóng</option>
            </select>
          </label>
          {s.border !== 'none' && <div className="wsb-f"><span>Màu viền</span><Swatches label="Màu viền" value={s.borderColor} onChange={(c) => set('borderColor', c)} /></div>}
        </details>

        {classId && (
          <details open className="wsb-sec">
            <summary>5. Giao bài cho lớp {className}</summary>
            <p className="dash-muted">Lưu nội dung và kiểu trang vở để in lại lần sau. Bài đang <b>mở</b> sẽ hiện ở mục “Cô giao” trong trang Luyện chữ của học sinh.</p>
            <div className="wsb-row">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy || !lineCount} onClick={() => void save(!taskId)}><Save aria-hidden="true" /> {taskId ? 'Cập nhật bài' : 'Lưu & giao bài'}</button>
              {taskId && <button type="button" className="btn btn-outline btn-sm" disabled={busy || !lineCount} onClick={() => void save(true)}><FilePlus2 aria-hidden="true" /> Lưu thành bài mới</button>}
            </div>
            {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
            {tasks && tasks.length > 0 && (
              <ul className="wsb-tasks">
                {tasks.map((t) => (
                  <li key={t.id} className={t.id === taskId ? 'is-on' : ''}>
                    <button type="button" className="wsb-task-open" onClick={() => { setS({ ...t.sheet, title: t.title, text: t.lines.join('\n') }); setTaskId(t.id); setMsg(null); }}>
                      <b>{t.title || 'Bài không tên'}</b><small>{t.lines.length} dòng · {new Date(t.updated_at).toLocaleDateString('vi-VN')}</small>
                    </button>
                    <button type="button" className={`mini-btn${t.active ? ' is-active' : ''}`} title={t.active ? 'Đang mở cho học sinh — bấm để đóng' : 'Đang đóng — bấm để mở cho học sinh'}
                      onClick={() => void setTaskActive(t.id, !t.active).then(reloadTasks, (e) => setMsg({ kind: 'error', text: taskError(e) }))}>
                      {t.active ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}{t.active ? 'Mở' : 'Đóng'}
                    </button>
                    <button type="button" className="mini-btn is-danger" aria-label={`Xoá bài ${t.title}`}
                      onClick={() => { if (window.confirm(`Xoá bài “${t.title || 'không tên'}”?`)) void deleteTask(t.id).then(() => { if (taskId === t.id) setTaskId(null); return reloadTasks(); }, (e) => setMsg({ kind: 'error', text: taskError(e) })); }}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </details>
        )}
      </aside>

      <section className="wsb-preview" aria-label="Xem trước trang vở">
        <div className="wsb-bar">
          <b>{layout ? `${pages.length} trang · ${pageDims(s.pageSize).label}` : 'Trang vở'}</b>
          {layout && layout.overflow.length > 0 && <span className="wsb-warn">Có từ dài hơn dòng kẻ — chọn cỡ nhỏ hoặc ô li nhỏ hơn.</span>}
          <button type="button" className="btn btn-primary btn-sm" disabled={!ready || !pages.length} onClick={() => setPrinting(true)}><Printer aria-hidden="true" /> In / Lưu PDF</button>
        </div>
        <p className="dash-muted wsb-tip">Khi in: chọn đúng khổ giấy, tỉ lệ 100% (không “vừa trang”), bỏ đầu trang / chân trang của trình duyệt.</p>
        {!ready && <p className="dash-muted" role="status">Đang nạp font chữ…</p>}
        {ready && layout && pages.map((p, i) => (
          <div key={i} className="wsb-page"><SheetPageSvg s={s} layout={layout} page={p} index={i} user={userDeco} onCornerDown={onCornerDown} activeCorner={corner} /></div>
        ))}
      </section>

      {printing && layout && createPortal(
        <div className="ws-print-root">{pages.map((p, i) => <SheetPageSvg key={i} s={s} layout={layout} page={p} index={i} className="ws-print-page" user={userDeco} />)}</div>,
        document.body,
      )}
    </div>
  );
}
