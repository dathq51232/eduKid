'use client';

// Trợ lý soạn bài (không dùng AI, không cần mạng): bấm nút → xem gợi ý soạn sẵn theo bài, môn, tích hợp, dữ liệu lớp
// → "Chèn" vào đúng hoạt động (hoặc mục IV). Mỗi lần chèn có thể hoàn tác ngay.
import { useEffect, useMemo, useState } from 'react';
import type { LessonPlan } from '@/lib/plans/generate';
import { ASSIST_GROUPS, applySuggestion, removeSuggestion, integrationKinds, suggest, type AssistKind, type Suggestion } from '@/lib/plans/assistant';

export default function PlanAssistant({ plan, edit, weak, active, onGo }: {
  plan: LessonPlan; edit: (fn: (p: LessonPlan) => LessonPlan) => void;
  /** dạng bài lớp còn hay sai */ weak: string[];
  /** hoạt động đang mở (chỉ số), -1 nếu đang ở mục khác */ active: number;
  /** nhảy tới hoạt động vừa chèn */ onGo: (target: number) => void;
}) {
  const [kind, setKind] = useState<AssistKind | null>(null);
  const [v, setV] = useState(0);
  const [done, setDone] = useState<Suggestion | null>(null);
  const preset = useMemo(() => new Set(integrationKinds(`${plan.integration ?? ''}`)), [plan.integration]);
  const sug = useMemo(() => (kind ? suggest(kind, plan, { weak, active, v }) : null), [kind, plan, weak, active, v]);
  useEffect(() => { setDone(null); }, [plan.title]);

  const where = (s: Suggestion) => (s.target < 0 ? 'mục IV' : `HĐ ${s.target + 1}${plan.activities[s.target] ? ` · ${plan.activities[s.target].title.replace(/^\d+\.\s*/, '')}` : ''}`);
  const insert = () => {
    if (!sug) return;
    edit((p) => applySuggestion(p, sug));
    setDone(sug);
    setKind(null); setV(0);
    onGo(sug.target);
  };

  return (
    <aside className="pa" aria-label="Trợ lý soạn bài">
      <h3>🧑‍🏫 Trợ lý soạn bài</h3>
      <p className="pa-hint">Không cần mạng · mẫu soạn sẵn theo bài “{plan.title || '…'}” và dữ liệu lớp · cô xem trước rồi mới chèn</p>
      {plan.orig && plan.useOrig !== false && <p className="pa-warn">Giáo án đang dùng <b>bản gốc của trường</b>: đoạn chèn vào khung soạn. Muốn file Word có đoạn chèn, chọn “Khung soạn bên dưới” ở mục Thông tin, hoặc sửa trực tiếp trên bản xem trước Word.</p>}
      {ASSIST_GROUPS.map((g) => (
        <div key={g.label} className="pa-grp">
          <b>{g.label}</b>
          <div className="pa-chips">{g.items.map(([k, label]) => (
            <button key={k} type="button" className={`pa-chip${kind === k ? ' is-on' : ''}${preset.has(k) ? ' is-hint' : ''}`} aria-pressed={kind === k}
              title={preset.has(k) ? 'Có trong nội dung tích hợp của tiết này' : undefined}
              onClick={() => { setKind(kind === k ? null : k); setV(0); }}>{preset.has(k) ? '★ ' : ''}{label}</button>
          ))}</div>
          {g.label === 'Phân hoá' && weak.length > 0 && <p className="pa-data">📊 Lớp còn hay sai: {weak.slice(0, 3).join('; ')}</p>}
        </div>
      ))}
      {sug && (
        <div className="pa-sug" role="region" aria-label="Gợi ý">
          <h5>Gợi ý: {sug.title}</h5>
          <p className="pa-where">Chèn vào: <b>{where(sug)}</b></p>
          <div className="pa-cols">
            <div><small>Giáo viên</small>{sug.teacher.map((t) => <p key={t}>{t.split('\n').map((x, i) => <span key={i}>{x}<br /></span>)}</p>)}</div>
            {sug.student.length > 0 && <div><small>Học sinh</small>{sug.student.map((t) => <p key={t}>{t}</p>)}</div>}
          </div>
          {sug.data && <p className="pa-data">📊 {sug.data}</p>}
          <div className="pa-btns">
            <button type="button" className="btn btn-primary btn-sm" onClick={insert}>Chèn vào {sug.target < 0 ? 'mục IV' : `HĐ ${sug.target + 1}`}</button>
            {sug.variants > 1 && <button type="button" className="btn btn-outline btn-sm" onClick={() => setV((x) => x + 1)}>Đổi gợi ý khác</button>}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setKind(null)}>Bỏ</button>
          </div>
        </div>
      )}
      {done && (
        <p className="pa-done" role="status">✅ Đã chèn “{done.title}” vào {where(done)}.
          <button type="button" className="mini-btn" onClick={() => { const d = done; edit((p) => removeSuggestion(p, d)); setDone(null); }}>Hoàn tác</button></p>
      )}
    </aside>
  );
}
