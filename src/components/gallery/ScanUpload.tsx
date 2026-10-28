'use client';

// Chụp / chọn ảnh tác phẩm → kéo 4 góc tờ giấy (app tự tìm sẵn) → làm phẳng, chỉnh sáng → gắn tên em → treo lên tường.
// Chọn nhiều ảnh một lượt: xong ảnh này tự chuyển ảnh sau, giữ nguyên loại tác phẩm và tên bài.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Maximize, RotateCcw, RotateCw, ScanLine, SkipForward, Wand2 } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import { addItem, canvasToImage } from '@/lib/gallery/client';
import { detectPaper, enhance, fullQuad, loadPhoto, rotate90, warp, type Enhance, type Quad } from '@/lib/gallery/scan';
import { KIND_LABEL, type GalleryKind } from '@/lib/gallery/types';

type Student = { id: string; name: string };
const ENH: { key: Enhance; label: string; hint: string }[] = [
  { key: 'auto', label: 'Tự nhiên', hint: 'Tranh màu: tăng sáng, màu tươi' },
  { key: 'paper', label: 'Trang vở', hint: 'Bài viết, tranh chì: làm trắng giấy, rõ nét' },
  { key: 'none', label: 'Giữ nguyên', hint: 'Không chỉnh màu' },
];
const todayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export default function ScanUpload({ classId, students, ownStudent, kinds, onSaved }: {
  classId: string; students?: Student[]; ownStudent?: string | null; kinds: GalleryKind[]; onSaved: (id: string) => void;
}) {
  const [queue, setQueue] = useState<File[]>([]);
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [enh, setEnh] = useState<Enhance>('auto');
  const [kind, setKind] = useState<GalleryKind>(kinds[0]);
  const [student, setStudent] = useState<string>(ownStudent ?? '');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [taken, setTaken] = useState(todayVN());
  const [audio, setAudio] = useState<Blob | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [done, setDone] = useState(0);
  const pickRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  // mở ảnh đầu hàng đợi
  useEffect(() => {
    const f = queue[0];
    if (!f) { setSrc(null); setQuad(null); return; }
    let live = true;
    setBusy('Đang mở ảnh…');
    loadPhoto(f).then((c) => {
      if (!live) return;
      setSrc(c); setQuad(detectPaper(c)); setBusy('');
    }).catch(() => { if (live) { setMsg({ kind: 'error', text: `Không mở được ảnh ${f.name}.` }); setQueue((q) => q.slice(1)); setBusy(''); } });
    return () => { live = false; };
  }, [queue]);

  const addFiles = (fl: FileList | null) => {
    const files = Array.from(fl ?? []).filter((f) => f.type.startsWith('image/') && f.size < 25_000_000).slice(0, 40);
    if (!files.length) return;
    setMsg(null); setDone(0);
    setQueue((q) => [...q, ...files]);
  };
  const rot = (d: 1 | -1) => { if (!src) return; const c = rotate90(src, d); setSrc(c); setQuad(detectPaper(c)); };

  const save = async () => {
    if (!src || !quad) return;
    if (students && kind !== 'praise' && !student) { setMsg({ kind: 'error', text: 'Chọn tên em có tác phẩm này (hoặc “Cả lớp”).' }); return; }
    setBusy('Đang làm phẳng ảnh…'); setMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const out = enhance(warp(src, quad), enh);
      setBusy('Đang tải lên…');
      const image = await canvasToImage(out, 0.86);
      const id = await addItem(classId, {
        student: student === 'ca-lop' ? null : (student || null), kind, title, note, image, w: out.width, h: out.height, audio, taken,
      }, ownStudent);
      onSaved(id);
      setDone((n) => n + 1);
      setAudio(null); setNote('');
      if (!ownStudent) setStudent('');
      setQueue((q) => q.slice(1));
      setMsg({ kind: 'ok', text: ownStudent ? 'Đã nộp! Cô duyệt xong tác phẩm sẽ lên tường triển lãm.' : 'Đã treo lên tường triển lãm.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không lưu được, thử lại.' });
    } finally { setBusy(''); }
  };

  return (
    <div className="su">
      <div className="su-pick">
        <button type="button" className="btn btn-primary" onClick={() => camRef.current?.click()}><Camera aria-hidden="true" /> Chụp ảnh</button>
        <button type="button" className="btn btn-outline" onClick={() => pickRef.current?.click()}><ImagePlus aria-hidden="true" /> Chọn ảnh có sẵn (nhiều ảnh)</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={pickRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        {queue.length > 1 && <span className="su-q">Còn {queue.length} ảnh</span>}
        {done > 0 && <span className="su-done"><Check aria-hidden="true" /> Đã lưu {done}</span>}
      </div>
      {!src && !busy && (
        <p className="dash-muted su-tip">Đặt tranh / vở lên mặt bàn tối màu, chụp thẳng từ trên xuống, đủ sáng. App tự tìm mép tờ giấy và làm phẳng ảnh.</p>
      )}
      {busy && <p className="adm-alert is-info" role="status">{busy}</p>}
      {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

      {src && quad && (
        <div className="su-work">
          <div className="su-left">
            <CornerEditor src={src} quad={quad} onChange={setQuad} />
            <div className="su-tools">
              <button type="button" className="mini-btn" onClick={() => setQuad(detectPaper(src))}><ScanLine aria-hidden="true" /> Tự tìm mép giấy</button>
              <button type="button" className="mini-btn" onClick={() => setQuad(fullQuad(src.width, src.height))}><Maximize aria-hidden="true" /> Lấy cả ảnh</button>
              <button type="button" className="mini-btn" onClick={() => rot(-1)} aria-label="Xoay trái"><RotateCcw aria-hidden="true" /></button>
              <button type="button" className="mini-btn" onClick={() => rot(1)} aria-label="Xoay phải"><RotateCw aria-hidden="true" /></button>
            </div>
          </div>
          <div className="su-right">
            <Preview src={src} quad={quad} enh={enh} />
            <div className="su-enh" role="radiogroup" aria-label="Chỉnh màu">
              {ENH.map((e) => (
                <button key={e.key} type="button" role="radio" aria-checked={enh === e.key} className={enh === e.key ? 'is-on' : ''} title={e.hint} onClick={() => setEnh(e.key)}>
                  <Wand2 aria-hidden="true" /> {e.label}
                </button>
              ))}
            </div>
            <div className="su-form">
              {kinds.length > 1 && (
                <label><span>Loại</span>
                  <select value={kind} onChange={(e) => { setKind(e.target.value as GalleryKind); if (e.target.value === 'writing') setEnh('paper'); }}>
                    {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                  </select>
                </label>
              )}
              {students && (
                <label><span>Của em</span>
                  <select value={student} onChange={(e) => setStudent(e.target.value)}>
                    <option value="">— Chọn tên em —</option>
                    <option value="ca-lop">Cả lớp (tác phẩm chung)</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <label><span>Tên tác phẩm</span><input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'writing' ? 'VD: Luyện chữ hoa A' : 'VD: Ngôi nhà của em'} /></label>
              {!ownStudent && <label><span>Lời nhận xét</span><textarea rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="VD: Màu sắc tươi sáng, bố cục đẹp" /></label>}
              {!ownStudent && <label><span>Ngày</span><input type="date" value={taken} max={todayVN()} onChange={(e) => setTaken(e.target.value)} /></label>}
              <AudioRecorder value={audio} onChange={setAudio} label={ownStudent ? 'Ghi âm giới thiệu tác phẩm (20 giây)' : 'Ghi âm lời giới thiệu (20 giây)'} />
            </div>
            <div className="su-act">
              <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => void save()}><Check aria-hidden="true" /> {ownStudent ? 'Nộp cho cô' : 'Lưu & treo lên tường'}</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => setQueue((q) => q.slice(1))}><SkipForward aria-hidden="true" /> Bỏ ảnh này</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Kéo 4 góc tờ giấy trên ảnh */
function CornerEditor({ src, quad, onChange }: { src: HTMLCanvasElement; quad: Quad; onChange: (q: Quad) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const scale = Math.min(1, 900 / Math.max(src.width, src.height));
  const w = Math.round(src.width * scale), h = Math.round(src.height * scale);
  useEffect(() => {
    const c = cv.current?.getContext('2d');
    if (c) c.drawImage(src, 0, 0, w, h);
  }, [src, w, h]);
  const toSrc = (e: React.PointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect();
    return [Math.max(0, Math.min(src.width, ((e.clientX - r.left) / r.width) * src.width)), Math.max(0, Math.min(src.height, ((e.clientY - r.top) / r.height) * src.height))];
  };
  const pts = quad.map(([x, y]) => `${(x / src.width) * 100},${(y / src.height) * 100}`).join(' ');
  return (
    <div className="ce" ref={box} style={{ aspectRatio: `${w} / ${h}` }}
      onPointerMove={(e) => { if (drag.current === null) return; const q = quad.map((p) => [...p]) as Quad; q[drag.current] = toSrc(e); onChange(q); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <canvas ref={cv} width={w} height={h} aria-label="Ảnh vừa chụp" role="img" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={pts} className="ce-poly" vectorEffect="non-scaling-stroke" />
      </svg>
      {quad.map(([x, y], i) => (
        <button key={i} type="button" className="ce-h" style={{ left: `${(x / src.width) * 100}%`, top: `${(y / src.height) * 100}%` }}
          aria-label={['Góc trên trái', 'Góc trên phải', 'Góc dưới phải', 'Góc dưới trái'][i]}
          onPointerDown={(e) => { e.preventDefault(); drag.current = i; (e.currentTarget.parentElement as HTMLElement).setPointerCapture?.(e.pointerId); }}
          onKeyDown={(e) => {
            const d = e.shiftKey ? 20 : 4;
            const m: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
            if (!m[e.key]) return; e.preventDefault();
            const q = quad.map((p) => [...p]) as Quad; q[i] = [Math.max(0, Math.min(src.width, q[i][0] + m[e.key][0] / scale)), Math.max(0, Math.min(src.height, q[i][1] + m[e.key][1] / scale))]; onChange(q);
          }} />
      ))}
    </div>
  );
}

/** Xem trước ảnh sau khi làm phẳng (bản nhỏ, cập nhật khi kéo góc) */
function Preview({ src, quad, enh }: { src: HTMLCanvasElement; quad: Quad; enh: Enhance }) {
  const small = useMemo(() => {
    const k = Math.min(1, 700 / Math.max(src.width, src.height));
    const c = document.createElement('canvas'); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height);
    return { c, k };
  }, [src]);
  const [url, setUrl] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      const q = quad.map(([x, y]) => [x * small.k, y * small.k]) as Quad;
      const isFull = quad[0][0] === 0 && quad[0][1] === 0 && quad[2][0] === src.width && quad[2][1] === src.height;
      const out = enhance(warp(small.c, isFull ? fullQuad(small.c.width, small.c.height) : q), enh);
      setUrl(out.toDataURL('image/jpeg', 0.8));
    }, 160);
    return () => clearTimeout(t);
  }, [quad, enh, small, src]);
  // eslint-disable-next-line @next/next/no-img-element
  return <div className="su-prev">{url ? <img src={url} alt="Ảnh sau khi làm phẳng" /> : null}<span>Ảnh sẽ treo</span></div>;
}
