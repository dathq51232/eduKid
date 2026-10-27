'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award as AwardIcon, Check, ChevronLeft, ChevronRight, FileDown, ImageDown, Palette, Printer, RotateCcw, Upload, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { asciiFilename } from '@/lib/filename';
import { zipStore } from '@/lib/xlsx';
import { buildImagePdf, downloadBytes } from '@/lib/praise/pdf';
import { canvasBlob, drawLetter, loadImage, loadPraiseFonts, loadTemplateAssets, renderLetterCanvas, type LetterData } from '@/lib/praise/render';
import { isCustomized, readDesigns, writeDesigns, type PraiseDesign } from '@/lib/praise/design';
import { LETTER_H, LETTER_W, PRAISE_REASONS, PRAISE_TEMPLATES, defaultTemplateFor, fillReason, templateById, type PraiseTemplateId } from '@/lib/praise/templates';

const PraiseEditor = dynamic(() => import('./PraiseEditor'), { ssr: false });

type Student = { id: string; name: string };
type AwardRow = { student_id: string; title: string; awarded_on: string };
type Row = { on: boolean; reason: number; extra: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;

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
export default function PraiseLetters({ className, grade, students, awards, teacherName, schoolName }: {
  className: string; grade: number; students: Student[]; awards: AwardRow[]; teacherName: string; schoolName: string;
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

  const letterFor = useCallback((st: Student): LetterData => {
    const r = rows[st.id] ?? { on: false, reason: COMMON, extra: '' };
    const reason = r.reason >= 0 ? PRAISE_REASONS[r.reason] : commonReason;
    return {
      school: s.school, lead: s.lead, name: st.name, className, extra: r.extra,
      reason: fillReason(reason, s.ky), wish: s.wish, placeDate: placeDate(s.place, date),
      role: s.role, teacher: s.teacher, closing: s.closing, signature: useSignImage ? signature : null,
    };
  }, [rows, commonReason, s, className, date, signature, useSignImage]);

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
      drawLetter(ctx, tpl, assets, letterFor(shown), design);
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
    const assets = await loadTemplateAssets(tpl, design);
    const out: { student: Student; blob: Blob; w: number; h: number }[] = [];
    for (const [i, st] of selected.entries()) {
      setBusy(`${label} ${i + 1}/${selected.length}…`);
      const c = renderLetterCanvas(tpl, assets, letterFor(st), scale, design);
      out.push({ student: st, blob: await canvasBlob(c, type, type === 'image/jpeg' ? 0.9 : undefined), w: c.width, h: c.height });
      await new Promise((r) => setTimeout(r, 0)); // nhường cho giao diện cập nhật tiến độ
    }
    return out;
  };
  /** chưa chọn em nào: nhắc rồi đưa thầy cô tới mục 3 để chọn */
  const askToPick = () => {
    setMsg({ kind: 'error', text: 'Chưa chọn em nào. Đánh dấu các em được khen ở mục 3 “Học sinh được khen” (hoặc bấm “Chọn cả lớp”), rồi bấm tải lại.' });
    const h = document.getElementById('pr-step3');
    h?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const fileBase = asciiFilename(`thu-khen-lop-${className}`);
  const run = async (fn: () => Promise<void>) => {
    try { await fn(); } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Có lỗi khi tạo thư khen.' }); } finally { setBusy(''); }
  };

  const downloadPdf = () => run(async () => {
    const imgs = await renderAll(1.5, 'image/jpeg', 'Đang tạo PDF');
    if (!imgs) return;
    const pages = await Promise.all(imgs.map(async (x) => ({ jpeg: new Uint8Array(await x.blob.arrayBuffer()), width: x.w, height: x.h })));
    downloadBytes(`${fileBase}.pdf`, buildImagePdf(pages), 'application/pdf');
    setMsg({ kind: 'ok', text: `Đã tạo file PDF ${pages.length} trang (A4 ngang).` });
  });

  const downloadPng = () => run(async () => {
    const imgs = await renderAll(1.5, 'image/png', 'Đang tạo ảnh');
    if (!imgs) return;
    const nameOf = (st: Student, i: number) => `${String(i + 1).padStart(2, '0')}-${asciiFilename(st.name)}.png`;
    if (imgs.length === 1) {
      downloadBytes(asciiFilename(`thu-khen-${imgs[0].student.name}.png`), imgs[0].blob, 'image/png');
    } else {
      const enc = new TextEncoder();
      const entries = await Promise.all(imgs.map(async (x, i) => [enc.encode(nameOf(x.student, i)), new Uint8Array(await x.blob.arrayBuffer())] as [Uint8Array, Uint8Array]));
      downloadBytes(`${fileBase}-anh.zip`, zipStore(entries), 'application/zip');
    }
    setMsg({ kind: 'ok', text: imgs.length === 1 ? 'Đã tải ảnh PNG.' : `Đã tải ${imgs.length} ảnh PNG (gói .zip).` });
  });

  const [printUrls, setPrintUrls] = useState<string[]>([]);
  const doPrint = () => run(async () => {
    const imgs = await renderAll(1.25, 'image/jpeg', 'Đang chuẩn bị bản in');
    if (!imgs) return;
    setPrintUrls(imgs.map((x) => URL.createObjectURL(x.blob)));
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

  const withAward = students.filter((st) => latestAward.has(st.id));
  const selectAwarded = () => setRows((p) => {
    const n = { ...p };
    for (const st of withAward) n[st.id] = { ...n[st.id], on: true, extra: n[st.id].extra || latestAward.get(st.id)!.title };
    return n;
  });
  const selectAll = (on: boolean) => setRows((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { ...v, on }])));

  return (
    <div className="praise">
      <style>{'@media print { @page { size: A4 landscape; margin: 0; } }'}</style>
      <header className="dash-head no-print">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><AwardIcon aria-hidden="true" /> Thư khen</h1>
          <p className="dash-muted">Chọn mẫu, viết lời khen một lần rồi chọn các em được khen để tạo cả lớp cùng lúc. Thư được vẽ ngay trên máy của thầy cô, tên học sinh không gửi đi đâu.</p>
        </div>
      </header>

      <div className="praise-layout no-print">
        <div className="praise-steps">
          <section className="dash-section praise-card" aria-labelledby="pr-step1">
            <h2 id="pr-step1"><span className="praise-n">1</span> Chọn mẫu</h2>
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
          </section>

          <section className="dash-section praise-card" aria-labelledby="pr-step2">
            <h2 id="pr-step2"><span className="praise-n">2</span> Nội dung chung</h2>
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
          </section>

          <section className="dash-section praise-card" aria-labelledby="pr-step3">
            <h2 id="pr-step3"><span className="praise-n">3</span> Học sinh được khen <small>({selected.length}/{students.length})</small></h2>
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
                    <thead><tr><th scope="col"><span className="sr-only">Chọn</span></th><th scope="col">Họ và tên</th><th scope="col">Lời khen · dòng riêng (không bắt buộc)</th></tr></thead>
                    <tbody>
                      {students.map((st) => {
                        const r = rows[st.id];
                        const aw = latestAward.get(st.id);
                        return (
                          <tr key={st.id} className={r.on ? 'is-on' : ''}>
                            <td><input type="checkbox" checked={r.on} aria-label={`Khen ${st.name}`} onChange={(e) => setRow(st.id, { on: e.target.checked })} /></td>
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
          </section>
        </div>

        <aside className="praise-preview" aria-label="Xem trước và tải về">
          <section className="dash-section praise-card">
            <div className="praise-prev-head">
              <h2>Xem trước</h2>
              {isCustomized(design) && <span className="praise-custom-tag">Đã chỉnh sửa</span>}
            </div>
            <canvas ref={preview} width={LETTER_W} height={LETTER_H} className="praise-canvas" role="img" aria-label={`Thư khen của ${shown.name}`} />
            <div className="praise-pager">
              <button type="button" className="btn btn-outline btn-sm" disabled={selected.length < 2} onClick={() => setPage((p) => (p - 1 + selected.length) % selected.length)} aria-label="Thư trước"><ChevronLeft aria-hidden="true" /></button>
              <span>{selected.length ? `Thư ${Math.min(page, selected.length - 1) + 1} / ${selected.length}` : 'Chưa chọn em nào — đang xem mẫu'}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={selected.length < 2} onClick={() => setPage((p) => (p + 1) % selected.length)} aria-label="Thư sau"><ChevronRight aria-hidden="true" /></button>
            </div>
            {!selected.length && students.length > 0 && (
              <p className="adm-alert is-info praise-pick-hint">
                Đang xem thư mẫu. Chọn các em được khen ở mục 3 để xem thư từng em và tải về.
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
            {busy && <p className="adm-alert is-info" role="status">{busy}</p>}
            {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
            <p className="dash-muted praise-note">PDF và bản in: mỗi em một trang A4 ngang. Khi in, chọn khổ A4, hướng ngang, lề “Không” để thư phủ kín trang.</p>
          </section>
        </aside>
      </div>

      {editing && (
        <PraiseEditor tpl={tpl} data={letterFor(shown)} initial={design} onClose={() => setEditing(false)} onSave={(d) => { if (saveDesign(d)) setEditing(false); }} />
      )}

      {printUrls.length > 0 && (
        <div className="praise-print" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {printUrls.map((u) => <img key={u} src={u} alt="" />)}
        </div>
      )}
    </div>
  );
}
