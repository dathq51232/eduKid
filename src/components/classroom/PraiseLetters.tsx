'use client';
/* eslint-disable @next/next/no-img-element -- ảnh học sinh là blob trên máy giáo viên, không qua next/image */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award as AwardIcon, Camera, Check, ChevronLeft, ChevronRight, FileDown, ImageDown, ImagePlus, Move, Palette, Printer, RotateCcw, Upload, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { asciiFilename } from '@/lib/filename';
import { zipStore } from '@/lib/xlsx';
import { buildImagePdf, downloadBytes } from '@/lib/praise/pdf';
import { canvasBlob, drawLetter, loadImage, loadPraiseFonts, loadTemplateAssets, renderLetterCanvas, type LetterData } from '@/lib/praise/render';
import { addItem, canvasToImage, galleryError } from '@/lib/gallery/client';
import { createClient } from '@/lib/supabase/client';
import { isCustomized, readDesigns, writeDesigns, type PraiseDesign } from '@/lib/praise/design';
import { DEFAULT_SLOT, PHOTO_SHAPES, PHOTO_SPOTS, deletePhoto, loadPhotos, matchFiles, prepPhoto, readSlots, saveCrop, savePhoto, slotBox, writeSlot, type PhotoSlot, type StudentPhoto } from '@/lib/praise/photos';
import { LETTER_H, LETTER_W, PRAISE_REASONS, PRAISE_TEMPLATES, defaultTemplateFor, fillReason, templateById, type PraiseTemplateId } from '@/lib/praise/templates';

const PraiseEditor = dynamic(() => import('./PraiseEditor'), { ssr: false });

type Student = { id: string; name: string };
type AwardRow = { student_id: string; title: string; awarded_on: string };
type Row = { on: boolean; reason: number; extra: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
type Tab = 'mau' | 'noidung' | 'hocsinh' | 'anh';
const DEMO = '__demo'; // ảnh thử (chỉ dùng để xem trước, không in vào thư thật)
const FRAME_COLORS = ['#ffffff', '#f59e0b', '#ec4899', '#2457c5', '#16a34a', '#c0161b', '#7c3aed', '#111827'];

/** Cài đặt chung lưu trên máy giáo viên (không chứa tên học sinh) */
type Settings = {
  tpl: PraiseTemplateId; lead: string; reason: number; customReason: string; ky: string;
  wish: string; place: string; role: string; teacher: string; school: string; closing: string;
};
const STORE_KEY = 'edukid:thu-khen';
const CUSTOM = -2; // lời khen tự nhập
const COMMON = -1; // dùng lời khen chung (ở từng dòng)
const DEFAULT_WISH = 'Cô gửi tới em và gia đình lời chúc mừng và tình cảm trân trọng.\nYêu thương và tự hào về em, mong em tiếp tục phát huy!';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const lastMonth = () => `tháng ${((new Date().getMonth() + 11) % 12) + 1}`;

function readSettings(grade: number, teacherName: string, schoolName: string, fromStore: boolean): Settings {
  const base: Settings = {
    tpl: defaultTemplateFor(grade), lead: 'Cô dành lời khen ngợi và chúc mừng em', reason: 0, customReason: '', ky: lastMonth(),
    wish: DEFAULT_WISH, place: '', role: 'GVCN', teacher: teacherName, school: schoolName, closing: 'Yêu thương và trân trọng',
  };
  try {
    const raw = fromStore ? localStorage.getItem(STORE_KEY) : null;
    if (!raw) return base;
    const v = JSON.parse(raw) as Partial<Settings>;
    const out = { ...base };
    for (const k of Object.keys(base) as (keyof Settings)[]) {
      if (typeof v[k] === typeof base[k]) (out as Record<string, unknown>)[k] = v[k];
    }
    out.tpl = templateById(out.tpl).id;
    out.ky = base.ky; // thời gian khen thay đổi mỗi lần, luôn gợi ý theo tháng trước
    return out;
  } catch {
    return base;
  }
}

function placeDate(place: string, iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = m ? `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}` : '';
  if (!place.trim()) return date ? date[0].toUpperCase() + date.slice(1) : '';
  return date ? `${place.trim()}, ${date}` : place.trim();
}

/**
 * Tạo thư khen cho học sinh trong lớp: chọn mẫu, nhập lời khen chung, chọn các em được khen
 * (có thể ghi lời khen / dòng riêng cho từng em), rồi tải PDF, ảnh PNG hoặc in.
 * Mọi thứ vẽ ngay trên máy giáo viên; tên học sinh không gửi đi đâu.
 */
export default function PraiseLetters({ classId, className, grade, students, awards, teacherName, schoolName }: {
  classId?: string; className: string; grade: number; students: Student[]; awards: AwardRow[]; teacherName: string; schoolName: string;
}) {
  const [s, setS] = useState<Settings>(() => readSettings(grade, teacherName, schoolName, false));
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setS(readSettings(grade, teacherName, schoolName, true)); setLoaded(true); }, [grade, teacherName, schoolName]);
  useEffect(() => { if (loaded) try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* bỏ qua */ } }, [s, loaded]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(students.map((st) => [st.id, { on: false, reason: COMMON, extra: '' }])));
  const setRow = (id: string, patch: Partial<Row>) => setRows((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  const [signature, setSignature] = useState<HTMLImageElement | null>(null);
  const [useSignImage, setUseSignImage] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const [page, setPage] = useState(0);

  // Khen thưởng đã nhập ở "Kết quả học tập trên trường" — gợi ý dòng riêng, lấy khen thưởng mới nhất của mỗi em
  const latestAward = useMemo(() => {
    const m = new Map<string, AwardRow>();
    for (const a of awards) {
      const cur = m.get(a.student_id);
      if (!cur || a.awarded_on > cur.awarded_on) m.set(a.student_id, a);
    }
    return m;
  }, [awards]);

  const selected = useMemo(() => students.filter((st) => rows[st.id]?.on), [students, rows]);
  const tpl = templateById(s.tpl);
  // ------------------------------------------------ thiết kế riêng (trình chỉnh sửa kiểu Canva), lưu theo từng mẫu
  const [designs, setDesigns] = useState<Record<string, PraiseDesign>>({});
  useEffect(() => { setDesigns(readDesigns()); }, []);
  const design = designs[tpl.id] ?? null;
  const [editing, setEditing] = useState(false);
  const saveDesign = (d: PraiseDesign | null) => {
    const next = { ...designs };
    if (d && isCustomized(d)) next[tpl.id] = d; else delete next[tpl.id];
    const err = writeDesigns(next);
    if (err) { setMsg({ kind: 'error', text: err }); return false; }
    setDesigns(next);
    setMsg({ kind: 'ok', text: d && isCustomized(d) ? 'Đã lưu thiết kế. Thư xuất PDF / ảnh / in sẽ dùng thiết kế này.' : 'Đã đưa thư về mẫu gốc.' });
    return true;
  };
  const commonReason = s.reason === CUSTOM ? s.customReason : PRAISE_REASONS[s.reason] ?? PRAISE_REASONS[0];

  // ------------------------------------------------ ảnh học sinh (lưu trong trình duyệt trên máy này, không tải lên máy chủ)
  const scope = classId ?? 'mau';
  const [slots, setSlots] = useState<Record<string, PhotoSlot>>({});
  useEffect(() => { setSlots(readSlots()); }, []);
  const slot = slots[tpl.id] ?? DEFAULT_SLOT;
  const setSlot = useCallback((patch: Partial<PhotoSlot>) => setSlots((all) => writeSlot(all, tpl.id, { ...(all[tpl.id] ?? DEFAULT_SLOT), ...patch })), [tpl.id]);
  const [photos, setPhotos] = useState<Record<string, StudentPhoto>>({});
  useEffect(() => { let live = true; void loadPhotos(scope).then((p) => { if (live) setPhotos(p); }); return () => { live = false; }; }, [scope]);
  const demo = photos[DEMO] ?? null;
  const withPhoto = students.filter((st) => photos[st.id]).length;

  const letterFor = useCallback((st: Student, preview = false): LetterData => {
    const r = rows[st.id] ?? { on: false, reason: COMMON, extra: '' };
    const reason = r.reason >= 0 ? PRAISE_REASONS[r.reason] : commonReason;
    return {
      school: s.school, lead: s.lead, name: st.name, className, extra: r.extra,
      reason: fillReason(reason, s.ky), wish: s.wish, placeDate: placeDate(s.place, date),
      role: s.role, teacher: s.teacher, closing: s.closing, signature: useSignImage ? signature : null,
      // xem trước: em chưa có ảnh thì dùng ảnh thử (nếu có); thư xuất thật chỉ dùng ảnh của chính em
      photo: slot.on ? { slot, photo: photos[st.id] ?? (preview ? demo : null) } : null,
    };
  }, [rows, commonReason, s, className, date, signature, useSignImage, slot, photos, demo]);

  // ------------------------------------------------ xem trước
  const preview = useRef<HTMLCanvasElement>(null);
  const shown = useMemo(() => (selected.length ? selected[Math.min(page, selected.length - 1)] : students[0] ?? { id: 'mau', name: 'Học sinh mẫu' }), [selected, page, students]);
  useEffect(() => { if (page >= Math.max(1, selected.length)) setPage(0); }, [page, selected.length]);
  useEffect(() => {
    let live = true;
    const id = setTimeout(async () => {
      await loadPraiseFonts();
      const assets = await loadTemplateAssets(tpl, design).catch(() => null);
      const c = preview.current;
      const ctx = c?.getContext('2d');
      if (!live || !assets || !ctx) return;
      drawLetter(ctx, tpl, assets, letterFor(shown, true), design);
      c!.dataset.ready = '1';
    }, 120);
    return () => { live = false; clearTimeout(id); };
  }, [tpl, letterFor, shown, design]);

  // ------------------------------------------------ ảnh thu nhỏ các mẫu
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([]);
  const sample = students[0]?.name ?? 'Học sinh mẫu';
  useEffect(() => {
    let live = true;
    (async () => {
      await loadPraiseFonts();
      for (const [i, t] of PRAISE_TEMPLATES.entries()) {
        const assets = await loadTemplateAssets(t).catch(() => null);
        const ctx = thumbs.current[i]?.getContext('2d');
        if (!live || !assets || !ctx) continue;
        ctx.setTransform(0.2, 0, 0, 0.2, 0, 0);
        drawLetter(ctx, t, assets, {
          school: 'Trường tiểu học', lead: 'Cô dành lời khen ngợi và chúc mừng em', name: sample, className, extra: '',
          reason: fillReason(PRAISE_REASONS[0], 'tháng 9'), wish: DEFAULT_WISH, placeDate: 'Ngày 30 tháng 9', role: 'GVCN', teacher: teacherName, closing: 'Yêu thương và trân trọng',
        });
      }
    })();
    return () => { live = false; };
  }, [sample, className, teacherName]);

  // ------------------------------------------------ tạo hàng loạt
  const renderAll = async (scale: number, type: 'image/png' | 'image/jpeg', label: string) => {
    if (!selected.length) { askToPick(); return null; }
    setMsg(null);
    await loadPraiseFonts();
    const assets = await loadTemplateAssets(tpl, design, true);
    const out: { student: Student; blob: Blob; w: number; h: number }[] = [];
    for (const [i, st] of selected.entries()) {
      setBusy(`${label} ${i + 1}/${selected.length}…`);
      const c = renderLetterCanvas(tpl, assets, letterFor(st), scale, design);
      out.push({ student: st, blob: await canvasBlob(c, type, type === 'image/jpeg' ? 0.92 : undefined), w: c.width, h: c.height });
      await new Promise((r) => setTimeout(r, 0)); // nhường cho giao diện cập nhật tiến độ
    }
    return out;
  };
  /** chưa chọn em nào: nhắc rồi mở thẻ Học sinh để chọn */
  const askToPick = () => {
    setMsg({ kind: 'error', text: 'Chưa chọn em nào. Đánh dấu các em được khen ở thẻ 3 “Học sinh” (hoặc bấm “Chọn cả lớp”), rồi bấm tải lại.' });
    goTab('hocsinh');
  };
  const fileBase = asciiFilename(`thu-khen-lop-${className}`);
  // ------------------------------------------------ treo thư lên Phòng triển lãm của lớp (migration 0039)
  const [hang, setHang] = useState(true);
  useEffect(() => { try { setHang(localStorage.getItem('edukid:thu-khen-treo') !== '0'); } catch { /* bỏ qua */ } }, []);
  const toggleHang = (v: boolean) => { setHang(v); try { localStorage.setItem('edukid:thu-khen-treo', v ? '1' : '0'); } catch { /* bỏ qua */ } };
  const hangTitle = `Thư khen ${s.ky}`.trim();
  const postToGallery = async (base: string) => {
    if (!classId || !hang || !selected.length) return base;
    try {
      const { data, error } = await createClient().rpc('gallery_list', { p_class: classId });
      if (error) throw error;
      const have = new Set(((data as { items?: { kind: string; student_id: string | null; title: string }[] })?.items ?? [])
        .filter((i) => i.kind === 'praise').map((i) => `${i.student_id}|${i.title}`));
      const todo = selected.filter((st) => !have.has(`${st.id}|${hangTitle}`));
      if (!todo.length) return `${base} Các thư này đã có trên Phòng triển lãm.`;
      const assets = await loadTemplateAssets(tpl, design, true);
      for (const [i, st] of todo.entries()) {
        setBusy(`Đang treo lên Phòng triển lãm ${i + 1}/${todo.length}…`);
        const c = renderLetterCanvas(tpl, assets, letterFor(st), 1, design);
        await addItem(classId, { student: st.id, kind: 'praise', title: hangTitle, note: '', image: await canvasToImage(c, 0.88), w: c.width, h: c.height });
      }
      return `${base} Đã treo ${todo.length} thư lên Phòng triển lãm của lớp${todo.length < selected.length ? ` (bỏ qua ${selected.length - todo.length} thư đã treo)` : ''}.`;
    } catch (e) {
      return `${base} Chưa treo được lên Phòng triển lãm: ${galleryError(e)}`;
    }
  };

  const run = async (fn: () => Promise<void>) => {
    try { await fn(); } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Có lỗi khi tạo thư khen.' }); } finally { setBusy(''); }
  };

  const downloadPdf = () => run(async () => {
    const imgs = await renderAll(2, 'image/jpeg', 'Đang tạo PDF');
    if (!imgs) return;
    const pages = await Promise.all(imgs.map(async (x) => ({ jpeg: new Uint8Array(await x.blob.arrayBuffer()), width: x.w, height: x.h })));
    downloadBytes(`${fileBase}.pdf`, buildImagePdf(pages), 'application/pdf');
    setMsg({ kind: 'ok', text: await postToGallery(`Đã tạo file PDF ${pages.length} trang (A4 ngang).`) });
  });

  const downloadPng = () => run(async () => {
    const imgs = await renderAll(2, 'image/png', 'Đang tạo ảnh');
    if (!imgs) return;
    const nameOf = (st: Student, i: number) => `${String(i + 1).padStart(2, '0')}-${asciiFilename(st.name)}.png`;
    if (imgs.length === 1) {
      downloadBytes(asciiFilename(`thu-khen-${imgs[0].student.name}.png`), imgs[0].blob, 'image/png');
    } else {
      const enc = new TextEncoder();
      const entries = await Promise.all(imgs.map(async (x, i) => [enc.encode(nameOf(x.student, i)), new Uint8Array(await x.blob.arrayBuffer())] as [Uint8Array, Uint8Array]));
      downloadBytes(`${fileBase}-anh.zip`, zipStore(entries), 'application/zip');
    }
    setMsg({ kind: 'ok', text: await postToGallery(imgs.length === 1 ? 'Đã tải ảnh PNG.' : `Đã tải ${imgs.length} ảnh PNG (gói .zip).`) });
  });

  const [printUrls, setPrintUrls] = useState<string[]>([]);
  const doPrint = () => run(async () => {
    const imgs = await renderAll(2, 'image/jpeg', 'Đang chuẩn bị bản in');
    if (!imgs) return;
    setPrintUrls(imgs.map((x) => URL.createObjectURL(x.blob)));
    const t = await postToGallery('');
    if (t.trim()) setMsg({ kind: 'ok', text: t.trim() });
  });
  useEffect(() => {
    if (!printUrls.length) return;
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      printUrls.forEach((u) => URL.revokeObjectURL(u));
      setPrintUrls([]);
    };
    Promise.all(printUrls.map((u) => loadImage(u).catch(() => null))).then(() => {
      window.addEventListener('afterprint', cleanup, { once: true });
      window.print();
      setTimeout(cleanup, 60_000);
    });
    return () => window.removeEventListener('afterprint', cleanup);
  }, [printUrls]);

  const onSignature = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 3_000_000) { setMsg({ kind: 'error', text: 'Chọn ảnh chữ ký (PNG/JPG) dưới 3 MB.' }); return; }
    try {
      setSignature(await loadImage(URL.createObjectURL(f)));
      setUseSignImage(true);
    } catch { setMsg({ kind: 'error', text: 'Không đọc được ảnh chữ ký.' }); }
  };

  // ------------------------------------------------ thẻ (tab) bên trái
  const [tab, setTab] = useState<Tab>('mau');
  const goTab = (t: Tab) => {
    setTab(t);
    document.getElementById('pr-tabs')?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  };

  // ------------------------------------------------ tải ảnh học sinh
  const fileFor = useRef<string | null>(null);
  const oneInput = useRef<HTMLInputElement>(null);
  const [unmatched, setUnmatched] = useState<{ file: File; to: string }[]>([]);
  const putPhoto = async (id: string, file: File) => {
    const { blob, photo } = await prepPhoto(file);
    await savePhoto(scope, id, blob, photo);
    setPhotos((p) => { if (p[id]) URL.revokeObjectURL(p[id].url); return { ...p, [id]: photo }; });
  };
  const pickOne = (id: string) => { fileFor.current = id; oneInput.current?.click(); };
  const onOneFile = async (f: File | undefined) => {
    const id = fileFor.current;
    if (!f || !id) return;
    try {
      await putPhoto(id, f);
      if (id === DEMO) setMsg({ kind: 'ok', text: 'Đã gắn ảnh thử. Thư xem trước của các em chưa có ảnh sẽ dùng ảnh này (không in vào thư thật).' });
      else { const st = students.find((x) => x.id === id); if (st) { setRow(id, { on: true }); const i = selected.findIndex((x) => x.id === id); setPage(i >= 0 ? i : selected.length); } }
      if (!slot.on) setSlot({ on: true });
    } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được ảnh.' }); }
  };
  const onManyFiles = async (list: FileList | null) => {
    const files = [...(list ?? [])].slice(0, 60);
    if (!files.length) return;
    setBusy('Đang đọc ảnh…');
    const res = matchFiles(files, students);
    let ok = 0;
    for (const r of res) {
      if (!r.student) continue;
      try { await putPhoto(r.student.id, r.file); ok++; setRow(r.student.id, { on: true }); } catch { /* ảnh lỗi: để ghép tay */ r.student = null; }
    }
    setBusy('');
    const left = res.filter((r) => !r.student).map((r) => ({ file: r.file, to: '' }));
    setUnmatched(left);
    if (ok && !slot.on) setSlot({ on: true });
    setMsg({ kind: ok ? 'ok' : 'info', text: `Đã gắn ${ok} ảnh theo tên file.${left.length ? ` Còn ${left.length} ảnh chưa nhận ra tên — chọn em cho từng ảnh ở dưới.` : ''}` });
  };
  const assignUnmatched = async (i: number, to: string) => {
    const u = unmatched[i];
    if (!u || !to) return;
    try { await putPhoto(to, u.file); setRow(to, { on: true }); setUnmatched((x) => x.filter((_, j) => j !== i)); } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được ảnh.' }); }
  };
  const removePhoto = (id: string) => {
    void deletePhoto(scope, id);
    setPhotos((p) => { const n = { ...p }; if (n[id]) URL.revokeObjectURL(n[id].url); delete n[id]; return n; });
  };
  const setCrop = (id: string, patch: Partial<Pick<StudentPhoto, 'zoom' | 'ox' | 'oy'>>) => setPhotos((p) => {
    const cur = p[id];
    if (!cur) return p;
    const next = { ...cur, ...patch };
    void saveCrop(scope, id, { zoom: next.zoom, ox: next.ox, oy: next.oy });
    return { ...p, [id]: next };
  });

  // kéo khung ảnh ngay trên bản xem trước
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const toLetter = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LETTER_W, y: ((e.clientY - r.top) / r.height) * LETTER_H };
  };
  const shownPhoto = photos[shown.id] ?? demo;
  const slotVisible = slot.on && (!!shownPhoto || slot.empty === 'frame');
  const onPrevDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!slotVisible) return;
    const p = toLetter(e), b = slotBox(slot);
    if (p.x < b.x || p.x > b.x + b.w || p.y < b.y || p.y > b.y + b.h) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: p.x - slot.x, dy: p.y - slot.y };
  };
  const onPrevMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLetter(e);
    if (!drag.current) {
      const b = slotBox(slot);
      e.currentTarget.style.cursor = slotVisible && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h ? 'grab' : '';
      return;
    }
    setSlot({ x: Math.round(Math.min(LETTER_W - 40, Math.max(40, p.x - drag.current.dx))), y: Math.round(Math.min(LETTER_H - 40, Math.max(40, p.y - drag.current.dy))) });
  };
  const onPrevUp = () => { drag.current = null; };

  const withAward = students.filter((st) => latestAward.has(st.id));
  const selectAwarded = () => setRows((p) => {
    const n = { ...p };
    for (const st of withAward) n[st.id] = { ...n[st.id], on: true, extra: n[st.id].extra || latestAward.get(st.id)!.title };
    return n;
  });
  const selectAll = (on: boolean) => setRows((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { ...v, on }])));

  const TABS: { id: Tab; n: number; label: string; info: string }[] = [
    { id: 'mau', n: 1, label: 'Mẫu thư', info: tpl.label },
    { id: 'noidung', n: 2, label: 'Nội dung', info: s.ky ? `Lời khen ${s.ky}` : 'Lời khen chung' },
    { id: 'hocsinh', n: 3, label: 'Học sinh', info: `${selected.length}/${students.length} em được khen` },
    { id: 'anh', n: 4, label: 'Ảnh học sinh', info: slot.on ? `${withPhoto}/${students.length} em có ảnh` : 'Chưa gắn ảnh' },
  ];
  const nextTab = (t: Tab) => {
    const i = TABS.findIndex((x) => x.id === t);
    const n = TABS[i + 1];
    return n ? <div className="praise-next"><button type="button" className="btn btn-primary btn-sm" onClick={() => goTab(n.id)}>Tiếp: {n.label} <ChevronRight aria-hidden="true" /></button></div> : null;
  };
  const shownHasOwn = !!photos[shown.id];

  return (
    <div className="praise">
      <style>{'@media print { @page { size: A4 landscape; margin: 0; } }'}</style>
      <header className="dash-head no-print">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><AwardIcon aria-hidden="true" /> Thư khen</h1>
          <p className="dash-muted">Làm lần lượt 4 bước bên trái, thư xem trước bên phải cập nhật ngay. Thư và ảnh được xử lý trên máy của thầy cô, không gửi đi đâu.</p>
        </div>
      </header>

      <input ref={oneInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void onOneFile(e.target.files?.[0]); e.target.value = ''; }} />

      <div className="praise-layout no-print">
        <div className="praise-steps">
          <nav id="pr-tabs" className="praise-tabs" role="tablist" aria-label="Các bước làm thư khen">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`pr-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`pr-panel-${t.id}`} className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
                <span className="praise-n">{t.n}</span>
                <span className="praise-tab-txt"><b>{t.label}</b><small>{t.info}</small></span>
              </button>
            ))}
          </nav>

          {tab === 'mau' && (
          <section className="dash-section praise-card" role="tabpanel" id="pr-panel-mau" aria-labelledby="pr-tab-mau">
            <h2 id="pr-step1">Chọn mẫu thư <small>· {PRAISE_TEMPLATES.length} mẫu, mẫu hợp khối {grade} hiện rõ hơn</small></h2>
            <div className="praise-tpls" role="radiogroup" aria-label="Mẫu thư khen">
              {PRAISE_TEMPLATES.map((t, i) => {
                const fit = t.grades.includes(grade);
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={s.tpl === t.id} className={`praise-tpl${s.tpl === t.id ? ' is-on' : ''}${fit ? '' : ' is-other'}`} onClick={() => set('tpl', t.id)}>
                    <canvas ref={(el) => { thumbs.current[i] = el; }} width={Math.round(LETTER_W * 0.2)} height={Math.round(LETTER_H * 0.2)} aria-hidden="true" />
                    <strong>{t.label}</strong>
                    <small><span className={`praise-style${t.layout === 'formal' ? ' is-formal' : ''}`}>{t.style}</span> {t.tag}{fit ? ' · hợp lớp này' : ''}</small>
                    {s.tpl === t.id && <span className="praise-tick" aria-hidden="true"><Check /></span>}
                  </button>
                );
              })}
            </div>
            {nextTab('mau')}
          </section>
          )}

          {tab === 'noidung' && (
          <section className="dash-section praise-card" role="tabpanel" id="pr-panel-noidung" aria-labelledby="pr-tab-noidung">
            <h2 id="pr-step2">Nội dung chung <small>· dùng cho mọi thư</small></h2>
            <div className="praise-form">
              <label className="adm-field"><span>Lời mở</span>
                <input value={s.lead} maxLength={80} onChange={(e) => set('lead', e.target.value)} />
              </label>
              <div className="praise-row2">
                <label className="adm-field"><span>Lời khen</span>
                  <select value={s.reason} onChange={(e) => set('reason', Number(e.target.value))}>
                    {PRAISE_REASONS.map((r, i) => <option key={r} value={i}>{fillReason(r, '…')}</option>)}
                    <option value={CUSTOM}>Tự viết lời khen…</option>
                  </select>
                </label>
                <label className="adm-field praise-ky"><span>Thời gian</span>
                  <input value={s.ky} maxLength={40} placeholder="tháng 9 / học kì I" onChange={(e) => set('ky', e.target.value)} />
                </label>
              </div>
              {s.reason === CUSTOM && (
                <label className="adm-field"><span>Lời khen tự viết <small>(gõ {'{ky}'} để chèn thời gian)</small></span>
                  <input value={s.customReason} maxLength={140} placeholder="Đạt giải Nhất hội thi Viết chữ đẹp {ky}" onChange={(e) => set('customReason', e.target.value)} />
                </label>
              )}
              <label className="adm-field"><span>Lời chúc</span>
                <textarea rows={2} value={s.wish} maxLength={260} onChange={(e) => set('wish', e.target.value)} />
              </label>
              <div className="praise-row2">
                <label className="adm-field"><span>Nơi</span>
                  <input value={s.place} maxLength={60} placeholder="Phường / xã" onChange={(e) => set('place', e.target.value)} />
                </label>
                <label className="adm-field"><span>Ngày</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
              </div>
              <div className="praise-row2">
                <label className="adm-field praise-role"><span>Chức danh</span>
                  <input value={s.role} maxLength={30} onChange={(e) => set('role', e.target.value)} />
                </label>
                <label className="adm-field"><span>Người ký</span>
                  <input value={s.teacher} maxLength={60} onChange={(e) => set('teacher', e.target.value)} />
                </label>
              </div>
              <div className="praise-sign">
                <span className="praise-label">Chữ ký</span>
                <div className="praise-seg" role="radiogroup" aria-label="Kiểu chữ ký">
                  <button type="button" role="radio" aria-checked={!useSignImage} className={!useSignImage ? 'is-on' : ''} onClick={() => setUseSignImage(false)}>Tên viết tay</button>
                  <button type="button" role="radio" aria-checked={useSignImage} className={useSignImage ? 'is-on' : ''} onClick={() => (signature ? setUseSignImage(true) : document.getElementById('pr-sign-file')?.click())}>Ảnh chữ ký</button>
                </div>
                <label className="btn btn-outline btn-sm praise-upload"><Upload aria-hidden="true" /> {signature ? 'Đổi ảnh' : 'Tải ảnh chữ ký'}
                  <input id="pr-sign-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void onSignature(e.target.files?.[0])} hidden />
                </label>
                {signature && <button type="button" className="mini-btn" onClick={() => { setSignature(null); setUseSignImage(false); }}><X aria-hidden="true" /> Bỏ ảnh</button>}
              </div>
              {tpl.layout === 'formal' && (
                <label className="adm-field"><span>Lời kết <small>(trên chữ ký, mẫu trang trọng)</small></span>
                  <input value={s.closing} maxLength={50} onChange={(e) => set('closing', e.target.value)} />
                </label>
              )}
              {tpl.school && (
                <label className="adm-field"><span>Tên trường <small>(mẫu {tpl.label} có dòng tên trường; để trống thì không in)</small></span>
                  <input value={s.school} maxLength={80} onChange={(e) => set('school', e.target.value)} />
                </label>
              )}
            </div>
            {nextTab('noidung')}
          </section>
          )}

          {tab === 'hocsinh' && (
          <section className="dash-section praise-card" role="tabpanel" id="pr-panel-hocsinh" aria-labelledby="pr-tab-hocsinh">
            <h2 id="pr-step3">Học sinh được khen <small>({selected.length}/{students.length}) · bấm ô ảnh để gắn ảnh từng em</small></h2>
            {students.length === 0 ? (
              <p className="adm-alert is-info">Lớp chưa có học sinh. Thêm học sinh ở trang quản lý lớp trước.</p>
            ) : (
              <>
                <div className="praise-actions">
                  <button type="button" className="mini-btn" onClick={() => selectAll(true)}>Chọn cả lớp</button>
                  <button type="button" className="mini-btn" onClick={() => selectAll(false)}>Bỏ chọn</button>
                  {withAward.length > 0 && <button type="button" className="mini-btn" onClick={selectAwarded}><AwardIcon aria-hidden="true" /> Chọn {withAward.length} em có khen thưởng</button>}
                </div>
                <div className="table-scroll">
                  <table className="roster-table praise-table">
                    <thead><tr><th scope="col"><span className="sr-only">Chọn</span></th><th scope="col">Ảnh</th><th scope="col">Họ và tên</th><th scope="col">Lời khen · dòng riêng (không bắt buộc)</th></tr></thead>
                    <tbody>
                      {students.map((st) => {
                        const r = rows[st.id];
                        const aw = latestAward.get(st.id);
                        return (
                          <tr key={st.id} className={r.on ? 'is-on' : ''}>
                            <td><input type="checkbox" checked={r.on} aria-label={`Khen ${st.name}`} onChange={(e) => setRow(st.id, { on: e.target.checked })} /></td>
                            <td className="praise-ph-cell">
                              {photos[st.id]
                                ? <button type="button" className="praise-ph" title={`Đổi ảnh của ${st.name}`} onClick={() => pickOne(st.id)}><img src={photos[st.id].url} alt={`Ảnh của ${st.name}`} /></button>
                                : <button type="button" className="praise-ph is-empty" title={`Tải ảnh của ${st.name}`} aria-label={`Tải ảnh của ${st.name}`} onClick={() => pickOne(st.id)}><Camera aria-hidden="true" /></button>}
                            </td>
                            <td className="praise-name">
                              {st.name}
                              {aw && r.extra !== aw.title && (
                                <button type="button" className="mini-btn praise-award" title="Dùng khen thưởng đã nhập làm dòng riêng" onClick={() => setRow(st.id, { extra: aw.title, on: true })}>
                                  <AwardIcon aria-hidden="true" /> {aw.title}
                                </button>
                              )}
                            </td>
                            <td>
                              <div className="praise-extra">
                                <select value={r.reason} aria-label={`Lời khen cho ${st.name}`} onChange={(e) => setRow(st.id, { reason: Number(e.target.value), on: true })}>
                                  <option value={COMMON}>Lời khen chung</option>
                                  {PRAISE_REASONS.map((x, i) => <option key={x} value={i}>{fillReason(x, '')}</option>)}
                                </select>
                                <input value={r.extra} maxLength={90} placeholder="Dòng riêng, vd: Là một lớp trưởng gương mẫu." aria-label={`Dòng riêng cho ${st.name}`} onChange={(e) => setRow(st.id, { extra: e.target.value, on: e.target.value ? true : r.on })} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {nextTab('hocsinh')}
          </section>
          )}

          {tab === 'anh' && (
          <section className="dash-section praise-card" role="tabpanel" id="pr-panel-anh" aria-labelledby="pr-tab-anh">
            <h2 id="pr-step4">Ảnh học sinh trên thư</h2>
            <label className="praise-switch">
              <input type="checkbox" checked={slot.on} onChange={(e) => setSlot({ on: e.target.checked })} />
              <span><b>Gắn ảnh học sinh lên thư</b><small>Khung ảnh nằm ở vị trí riêng cho mẫu “{tpl.label}”. Kéo khung ngay trên bản xem trước để đổi chỗ.</small></span>
            </label>

            <div className={`praise-ph-opts${slot.on ? '' : ' is-off'}`}>
              <div className="praise-opt"><span className="praise-label">Kiểu khung</span>
                <div className="praise-seg" role="radiogroup" aria-label="Kiểu khung ảnh">
                  {PHOTO_SHAPES.map((x) => <button key={x.id} type="button" role="radio" aria-checked={slot.shape === x.id} className={slot.shape === x.id ? 'is-on' : ''} onClick={() => setSlot({ shape: x.id, on: true })}>{x.label}</button>)}
                </div>
              </div>
              <div className="praise-opt"><span className="praise-label">Vị trí nhanh</span>
                <div className="praise-spots">
                  {PHOTO_SPOTS.map((x) => <button key={x.id} type="button" className={`mini-btn${Math.abs(slot.x - x.x) < 4 && Math.abs(slot.y - x.y) < 4 ? ' is-on' : ''}`} onClick={() => setSlot({ x: x.x, y: x.y, on: true })}>{x.label}</button>)}
                  <span className="dash-muted praise-drag-hint"><Move aria-hidden="true" /> hoặc kéo trên bản xem trước</span>
                </div>
              </div>
              <div className="praise-row2">
                <label className="adm-field"><span>Cỡ khung: <b>{slot.size}</b></span><input type="range" min={120} max={460} step={10} value={slot.size} onChange={(e) => setSlot({ size: Number(e.target.value), on: true })} /></label>
                <label className="adm-field"><span>Độ dày viền: <b>{slot.bw}</b></span><input type="range" min={0} max={24} value={slot.bw} onChange={(e) => setSlot({ bw: Number(e.target.value) })} /></label>
              </div>
              <div className="praise-opt"><span className="praise-label">Màu viền</span>
                <div className="praise-colors">
                  {FRAME_COLORS.map((c) => <button key={c} type="button" aria-label={`Viền màu ${c}`} aria-pressed={slot.border === c} className={slot.border === c ? 'is-on' : ''} style={{ background: c }} onClick={() => setSlot({ border: c })} />)}
                </div>
              </div>
              <label className="praise-check"><input type="checkbox" checked={slot.wrap} onChange={(e) => setSlot({ wrap: e.target.checked })} /> Chữ tự thu nhỏ, nhường chỗ cho ảnh (không bị ảnh che)</label>
              <div className="praise-opt"><span className="praise-label">Em chưa có ảnh</span>
                <div className="praise-seg" role="radiogroup" aria-label="Em chưa có ảnh">
                  <button type="button" role="radio" aria-checked={slot.empty === 'hide'} className={slot.empty === 'hide' ? 'is-on' : ''} onClick={() => setSlot({ empty: 'hide' })}>Bỏ khung</button>
                  <button type="button" role="radio" aria-checked={slot.empty === 'frame'} className={slot.empty === 'frame' ? 'is-on' : ''} onClick={() => setSlot({ empty: 'frame' })}>Khung trống (dán ảnh sau)</button>
                </div>
              </div>
            </div>

            <div className="praise-ph-box">
              <h3>Ảnh thử để xem mẫu trước</h3>
              <p className="dash-muted">Chưa có ảnh các em? Tải một ảnh bất kỳ để xem thư trông thế nào. Ảnh thử chỉ hiện ở bản xem trước, <b>không in vào thư thật</b>.</p>
              <div className="praise-ph-row">
                {demo
                  ? <button type="button" className="praise-ph is-lg" onClick={() => pickOne(DEMO)} title="Đổi ảnh thử"><img src={demo.url} alt="Ảnh thử" /></button>
                  : <button type="button" className="praise-ph is-lg is-empty" onClick={() => pickOne(DEMO)} aria-label="Tải ảnh thử"><ImagePlus aria-hidden="true" /></button>}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => pickOne(DEMO)}><Upload aria-hidden="true" /> {demo ? 'Đổi ảnh thử' : 'Tải ảnh thử'}</button>
                {demo && <button type="button" className="mini-btn" onClick={() => removePhoto(DEMO)}><X aria-hidden="true" /> Bỏ ảnh thử</button>}
              </div>
            </div>

            <div className="praise-ph-box">
              <h3>Ảnh của các em <small>({withPhoto}/{students.length})</small></h3>
              <p className="dash-muted">Chọn nhiều ảnh cùng lúc, đặt tên file theo tên học sinh (vd <code>Nguyen Minh An.jpg</code> hoặc <code>an.jpg</code>) để tự ghép; hoặc bấm vào từng ô bên dưới.</p>
              <label className="btn btn-primary btn-sm praise-upload"><Upload aria-hidden="true" /> Tải nhiều ảnh cùng lúc
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { void onManyFiles(e.target.files); e.target.value = ''; }} />
              </label>
              {unmatched.length > 0 && (
                <ul className="praise-unmatched">
                  {unmatched.map((u, i) => (
                    <li key={`${u.file.name}-${i}`}>
                      <span title={u.file.name}>{u.file.name}</span>
                      <select value="" aria-label={`Ảnh ${u.file.name} của em nào`} onChange={(e) => void assignUnmatched(i, e.target.value)}>
                        <option value="">— Ảnh của em nào? —</option>
                        {students.map((st) => <option key={st.id} value={st.id}>{st.name}{photos[st.id] ? ' (đã có ảnh)' : ''}</option>)}
                      </select>
                      <button type="button" className="mini-btn" aria-label="Bỏ ảnh này" onClick={() => setUnmatched((x) => x.filter((_, j) => j !== i))}><X aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="praise-ph-grid">
                {students.map((st) => (
                  <div key={st.id} className={`praise-ph-item${shown.id === st.id ? ' is-shown' : ''}`}>
                    {photos[st.id]
                      ? <button type="button" className="praise-ph is-lg" title={`Xem thư của ${st.name}`} onClick={() => { setRow(st.id, { on: true }); const i = selected.findIndex((x) => x.id === st.id); setPage(i >= 0 ? i : selected.length); }}><img src={photos[st.id].url} alt={`Ảnh của ${st.name}`} /></button>
                      : <button type="button" className="praise-ph is-lg is-empty" aria-label={`Tải ảnh của ${st.name}`} onClick={() => pickOne(st.id)}><Camera aria-hidden="true" /></button>}
                    <span>{st.name}</span>
                    {photos[st.id] && <span className="praise-ph-acts"><button type="button" className="mini-btn" onClick={() => pickOne(st.id)}>Đổi</button><button type="button" className="mini-btn" onClick={() => removePhoto(st.id)} aria-label={`Xoá ảnh của ${st.name}`}><X aria-hidden="true" /></button></span>}
                  </div>
                ))}
              </div>
            </div>

            {slot.on && shownPhoto && (
              <div className="praise-ph-box">
                <h3>Căn ảnh {shownHasOwn ? <>của <b>{shown.name}</b></> : 'thử'} trong khung</h3>
                <div className="praise-row2">
                  <label className="adm-field"><span>Phóng to</span><input type="range" min={1} max={3} step={0.05} value={shownPhoto.zoom} onChange={(e) => setCrop(shownHasOwn ? shown.id : DEMO, { zoom: Number(e.target.value) })} /></label>
                  <label className="adm-field"><span>Dời ngang</span><input type="range" min={-1} max={1} step={0.05} value={shownPhoto.ox} onChange={(e) => setCrop(shownHasOwn ? shown.id : DEMO, { ox: Number(e.target.value) })} /></label>
                  <label className="adm-field"><span>Dời dọc</span><input type="range" min={-1} max={1} step={0.05} value={shownPhoto.oy} onChange={(e) => setCrop(shownHasOwn ? shown.id : DEMO, { oy: Number(e.target.value) })} /></label>
                </div>
                <p className="dash-muted">Bấm mũi tên ở bản xem trước để chuyển sang em khác rồi căn ảnh của em đó.</p>
              </div>
            )}
            <p className="dash-muted praise-note">Ảnh chỉ lưu trong trình duyệt trên máy này, không tải lên máy chủ. Nếu bật “Treo lên Phòng triển lãm”, thư (kèm ảnh) sẽ được đăng cho phụ huynh lớp xem.</p>
          </section>
          )}
        </div>

        <aside className="praise-preview" aria-label="Xem trước và tải về">
          <section className="dash-section praise-card">
            <div className="praise-prev-head">
              <h2>Xem trước</h2>
              {isCustomized(design) && <span className="praise-custom-tag">Đã chỉnh sửa</span>}
            </div>
            <canvas ref={preview} width={LETTER_W} height={LETTER_H} className="praise-canvas" role="img" aria-label={`Thư khen của ${shown.name}`}
              onPointerDown={onPrevDown} onPointerMove={onPrevMove} onPointerUp={onPrevUp} onPointerCancel={onPrevUp} style={slotVisible ? { touchAction: 'none' } : undefined} />
            {slot.on && !shownHasOwn && demo && <p className="praise-demo-tag">Đang dùng ảnh thử — thư thật của {shown.name} {slot.empty === 'frame' ? 'sẽ có khung trống' : 'sẽ không có ảnh'}.</p>}
            <div className="praise-pager">
              <button type="button" className="btn btn-outline btn-sm" disabled={selected.length < 2} onClick={() => setPage((p) => (p - 1 + selected.length) % selected.length)} aria-label="Thư trước"><ChevronLeft aria-hidden="true" /></button>
              <span>{selected.length ? `Thư ${Math.min(page, selected.length - 1) + 1} / ${selected.length}` : 'Chưa chọn em nào — đang xem mẫu'}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={selected.length < 2} onClick={() => setPage((p) => (p + 1) % selected.length)} aria-label="Thư sau"><ChevronRight aria-hidden="true" /></button>
            </div>
            {!selected.length && students.length > 0 && (
              <p className="adm-alert is-info praise-pick-hint">
                Đang xem thư mẫu. Chọn các em được khen ở thẻ 3 “Học sinh” để xem thư từng em và tải về.
                <button type="button" className="mini-btn" onClick={() => { selectAll(true); setMsg(null); }}>Chọn cả lớp ({students.length} em)</button>
              </p>
            )}
            <div className="praise-edit-row">
              <button type="button" className="btn btn-outline btn-sm praise-edit-btn" disabled={!!busy} onClick={() => { setMsg(null); setEditing(true); }}><Palette aria-hidden="true" /> Chỉnh sửa thiết kế</button>
              {isCustomized(design) && <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => saveDesign(null)}><RotateCcw aria-hidden="true" /> Về mẫu gốc</button>}
            </div>
            <div className="praise-dl">
              <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => void downloadPdf()}><FileDown aria-hidden="true" /> Tải PDF{selected.length ? ` (${selected.length} trang)` : ''}</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => void downloadPng()}><ImageDown aria-hidden="true" /> Tải ảnh PNG</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => void doPrint()}><Printer aria-hidden="true" /> In</button>
            </div>
            {classId && (
              <label className="praise-hang">
                <input type="checkbox" checked={hang} onChange={(e) => toggleHang(e.target.checked)} />
                <span>Treo lên <a href={`/giao-vien/lop/${classId}/trien-lam`}>Phòng triển lãm</a> của lớp khi tải / in (phụ huynh vào xem được)</span>
              </label>
            )}
            {busy && <p className="adm-alert is-info" role="status">{busy}</p>}
            {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
            <p className="dash-muted praise-note">PDF, ảnh và bản in xuất nét cao 2828 × 2000 px (khoảng 240 dpi trên A4), mỗi em một trang A4 ngang. Khi in, chọn khổ A4, hướng ngang, lề “Không” để thư phủ kín trang.</p>
          </section>
        </aside>
      </div>

      {editing && (
        <PraiseEditor tpl={tpl} data={letterFor(shown, true)} initial={design} onClose={() => setEditing(false)} onSave={(d) => { if (saveDesign(d)) setEditing(false); }} />
      )}

      {printUrls.length > 0 && (
        <div className="praise-print" aria-hidden="true">
          
          {printUrls.map((u) => <img key={u} src={u} alt="" />)}
        </div>
      )}
    </div>
  );
}
