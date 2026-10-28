'use client';

// Ghi âm lời giới thiệu tác phẩm (tối đa 20 giây) bằng micro của máy.
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

const MAX = 20;
const pickType = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
};

export default function AudioRecorder({ value, onChange, label = 'Ghi âm lời giới thiệu (20 giây)' }: { value: Blob | null; onChange: (b: Blob | null) => void; label?: string }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [left, setLeft] = useState(MAX);
  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!value) { setUrl(''); return; }
    const u = URL.createObjectURL(value); setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); rec?.stream.getTracks().forEach((t) => t.stop()); }, [rec]);

  const start = async () => {
    setErr('');
    const type = pickType();
    if (type === null || !navigator.mediaDevices?.getUserMedia) { setErr('Trình duyệt này chưa ghi âm được.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const r = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        setRec(null);
        const b = new Blob(chunks, { type: (r.mimeType || type || 'audio/webm').split(';')[0] });
        if (b.size > 1000) onChange(b);
      };
      r.start(250);
      setRec(r); setLeft(MAX);
      const t0 = Date.now();
      timer.current = setInterval(() => {
        const l = MAX - Math.floor((Date.now() - t0) / 1000);
        setLeft(l);
        if (l <= 0 && r.state === 'recording') r.stop();
      }, 250);
    } catch { setErr('Chưa được dùng micro. Bấm cho phép micro trên trình duyệt rồi thử lại.'); }
  };

  return (
    <div className="ar">
      {!rec && !value && <button type="button" className="btn btn-outline btn-sm" onClick={() => void start()}><Mic aria-hidden="true" /> {label}</button>}
      {rec && (
        <button type="button" className="btn btn-sm ar-stop" onClick={() => rec.stop()}><Square aria-hidden="true" /> Dừng ({left}s)</button>
      )}
      {!rec && value && url && (
        <span className="ar-play">
          <audio controls src={url} />
          <button type="button" className="mini-btn" onClick={() => onChange(null)} aria-label="Xoá bản ghi"><Trash2 aria-hidden="true" /> Ghi lại</button>
        </span>
      )}
      {err && <p className="adm-alert is-error">{err}</p>}
    </div>
  );
}
