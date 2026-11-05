'use client';

// Ô "Tiết dạy đã chọn" bên cạnh "Hôm nay dạy": hiện tiến trình tiết từ các gợi ý thầy cô đã chọn.
// Nghe sự kiện PICK_EVENT: bấm tiết đã chọn (show) hoặc vừa chọn / đổi gợi ý trong bảng.
import { useEffect, useState } from 'react';
import { ClipboardList, Pencil, X } from 'lucide-react';
import { PICK_EVENT, loadPick, planOf } from '@/lib/plans/idea-bank';

type Cur = { subject: string; title: string };

export default function LessonPlanAside() {
  const [cur, setCur] = useState<Cur | null>(null);
  const [, setVer] = useState(0);
  useEffect(() => {
    const f = (e: Event) => {
      const d = (e as CustomEvent<Cur & { open?: boolean }>).detail;
      if (d.open) return;
      setCur({ subject: d.subject, title: d.title });
      setVer((v) => v + 1);
    };
    addEventListener(PICK_EVENT, f); return () => removeEventListener(PICK_EVENT, f);
  }, []);
  if (!cur) return null;
  const pick = loadPick(cur.subject, cur.title);
  if (!pick) return null;
  const rows = planOf(cur.subject, cur.title, pick);
  const total = rows.reduce((s, r) => s + r.idea.m, 0);
  const prep = rows.reduce((s, r) => s + r.idea.p, 0);

  return (
    <section className="tdy-card li-aside" aria-label="Tiết dạy đã chọn gợi ý">
      <h2><ClipboardList aria-hidden="true" /> Tiết dạy
        <button className="li-x" onClick={() => setCur(null)} aria-label="Đóng"><X size={16} /></button></h2>
      <p className="li-aside-t"><b>{cur.subject}</b> · {cur.title}</p>
      <p className="li-aside-m">{total}/{pick.dur} phút{prep ? ` · chuẩn bị trước ${prep}′` : ''}{rows.length < 4 ? ` · mới chọn ${rows.length}/4 hoạt động` : ''}</p>
      {rows.map((r) => (
        <div key={r.phase.k} className="li-row" style={{ borderColor: r.phase.c }}>
          <span className="li-time">{r.start}′–{r.end}′</span>
          <div className="li-rowb">
            <small style={{ color: r.phase.c }}>{r.phase.n}</small>
            <b>{r.idea.t}</b>
            <ol>{r.idea.s.map((s, j) => <li key={j}>{s}</li>)}</ol>
          </div>
        </div>
      ))}
      <button className="btn btn-outline li-aside-btn" onClick={() => dispatchEvent(new CustomEvent(PICK_EVENT, { detail: { ...cur, open: true } }))}>
        <Pencil size={14} /> Sửa gợi ý
      </button>
    </section>
  );
}
