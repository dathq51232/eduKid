'use client';

// Màn hình soạn giáo án 3 cột: mục lục + thời gian + kiểm tra nhanh | khung soạn (từng dòng, kéo đổi chỗ, câu mẫu "/")
// | bản xem trước A4 cập nhật ngay khi gõ (đúng mẫu tải Word). Bấm vào trang xem trước → khung soạn nhảy tới đúng mục.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { GripVertical, Minus, Plus, X } from 'lucide-react';
import type { ActivityKey, LessonPlan, PlanActivity } from '@/lib/plans/generate';
import { plansDocument } from '@/lib/plans/word';
import PlanAssistant from './PlanAssistant';

type Sec = 'info' | 'goals' | 'mat' | 'act-0' | 'act-1' | 'act-2' | 'act-3' | 'act-4' | 'act-5' | 'assess' | 'adjust';
const ACT_COLOR: Record<string, string> = { 'khoi-dong': '#f59e0b', 'kham-pha': '#0ea5e9', 'luyen-tap': '#22c55e', 'van-dung': '#ec4899' };
const colorOf = (a: PlanActivity, i: number) => ACT_COLOR[a.key] ?? ['#f59e0b', '#0ea5e9', '#22c55e', '#ec4899', '#8b5cf6', '#64748b'][i % 6];

/** Câu mẫu theo hoạt động: [giáo viên, học sinh tương ứng] */
const SNIPS: Record<ActivityKey, [string, string][]> = {
  'khoi-dong': [
    ['Tổ chức trò chơi “…” để ôn lại bài cũ.', 'Tham gia trò chơi.'],
    ['Cho cả lớp hát / vận động theo bài hát “…”.', 'Hát và vận động theo nhạc.'],
    ['Nêu câu hỏi gợi mở, dẫn dắt vào bài mới.', 'Lắng nghe, trả lời theo hiểu biết.'],
    ['Giới thiệu bài, ghi tên bài lên bảng.', 'Nhắc lại tên bài.'],
    ['Nhận xét, tuyên dương.', 'Lắng nghe.'],
  ],
  'kham-pha': [
    ['Cho HS quan sát tranh / vật thật, nêu câu hỏi: …', 'Quan sát, trả lời câu hỏi.'],
    ['Tổ chức cho HS thảo luận nhóm đôi, hoàn thành …', 'Thảo luận nhóm đôi.'],
    ['Chia lớp thành nhóm 4, phát phiếu học tập, giao nhiệm vụ …', 'Nhận phiếu, thảo luận nhóm 4, hoàn thành phiếu.'],
    ['Mời đại diện nhóm trình bày, các nhóm khác nhận xét, bổ sung.', 'Đại diện nhóm trình bày; nhóm khác nhận xét.'],
    ['Hướng dẫn mẫu: …', 'Quan sát, làm theo hướng dẫn.'],
    ['Nhận xét, chốt kiến thức: …', 'Lắng nghe, nhắc lại.'],
  ],
  'luyen-tap': [
    ['Bài …: Gọi HS nêu yêu cầu bài.', 'Đọc, nêu yêu cầu.'],
    ['Cho HS làm bài cá nhân vào vở / bảng con.', 'Làm bài cá nhân.'],
    ['Tổ chức chữa bài, cho HS đổi vở kiểm tra chéo.', 'Đổi vở, kiểm tra bài của bạn.'],
    ['Theo dõi, giúp đỡ HS còn lúng túng.', 'Hỏi khi chưa hiểu, sửa bài.'],
    ['Phân hoá: nhóm củng cố làm bài …; nhóm nâng cao làm thêm bài …', 'Làm bài theo nhóm năng lực.'],
    ['Tổ chức trò chơi “Ai nhanh, ai đúng” để luyện tập.', 'Tham gia trò chơi.'],
  ],
  'van-dung': [
    ['Nêu tình huống thực tế: …', 'Suy nghĩ, trả lời / chia sẻ.'],
    ['Cho HS liên hệ bản thân: …', 'Liên hệ, chia sẻ trước lớp.'],
    ['Nhận xét tiết học, tuyên dương HS tích cực.', 'Lắng nghe.'],
    ['Dặn dò HS chuẩn bị bài sau.', 'Ghi nhớ nhiệm vụ.'],
  ],
};
const snipsOf = (k: ActivityKey | string) => SNIPS[k as ActivityKey] ?? SNIPS['kham-pha'];

/* ---------------------------------------------------------------- từng dòng */
function Lines({ value, onChange, snips, onPair, label }: {
  value: string; onChange: (v: string) => void; label: string;
  /** câu mẫu ("/" để mở) */ snips?: [string, string][];
  /** chọn câu mẫu bên giáo viên → thêm dòng tương ứng bên học sinh */ onPair?: (hs: string) => void;
}) {
  const lines = value.length ? value.split('\n') : [''];
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [menu, setMenu] = useState<{ i: number; q: string; k: number } | null>(null);
  const [dragI, setDragI] = useState<number | null>(null);
  const set = (next: string[]) => onChange(next.join('\n'));
  // ô tự cao theo nội dung
  useLayoutEffect(() => { for (const t of refs.current) if (t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; } }, [value]);
  const focus = (i: number) => setTimeout(() => { const t = refs.current[i]; if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 0);
  const list = menu && snips ? snips.filter(([g]) => !menu.q || g.toLowerCase().includes(menu.q.toLowerCase())) : [];
  const pick = (i: number, g: string, h: string) => {
    const next = [...lines]; next[i] = `- ${g}`; set(next); setMenu(null); onPair?.(`- ${h}`); focus(i);
  };
  return (
    <div className="pw-lines" aria-label={label}>
      {lines.map((l, i) => (
        <div key={i} className={`pw-line${dragI === i ? ' is-drag' : ''}`}
          onDragOver={(e) => { if (dragI !== null) e.preventDefault(); }}
          onDrop={() => { if (dragI === null || dragI === i) return; const next = [...lines]; const [m] = next.splice(dragI, 1); next.splice(i, 0, m); set(next); setDragI(null); }}>
          <span className="pw-grip" draggable onDragStart={() => setDragI(i)} onDragEnd={() => setDragI(null)} title="Kéo để đổi chỗ"><GripVertical aria-hidden="true" /></span>
          <textarea ref={(t) => { refs.current[i] = t; }} rows={1} value={l}
            aria-label={`${label} – dòng ${i + 1}`}
            onChange={(e) => {
              const v = e.target.value.replace(/\n/g, ' ');
              const next = [...lines]; next[i] = v; set(next);
              const m = /^(?:-\s*)?\/(.*)$/.exec(v);
              setMenu(m && snips ? { i, q: m[1], k: 0 } : null);
            }}
            onKeyDown={(e) => {
              if (menu && menu.i === i && list.length) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setMenu({ ...menu, k: (menu.k + 1) % list.length }); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setMenu({ ...menu, k: (menu.k + list.length - 1) % list.length }); return; }
                if (e.key === 'Enter') { e.preventDefault(); const [g, h] = list[menu.k]; pick(i, g, h); return; }
                if (e.key === 'Escape') { setMenu(null); return; }
              }
              if (e.key === 'Enter') { e.preventDefault(); const next = [...lines]; next.splice(i + 1, 0, '- '); set(next); focus(i + 1); }
              if (e.key === 'Backspace' && !l && lines.length > 1) { e.preventDefault(); const next = lines.filter((_, k) => k !== i); set(next); focus(Math.max(0, i - 1)); }
            }}
            onBlur={() => setTimeout(() => setMenu((m) => (m?.i === i ? null : m)), 150)} />
          <button type="button" className="pw-del" aria-label="Xoá dòng" onClick={() => set(lines.length > 1 ? lines.filter((_, k) => k !== i) : [''])}><X aria-hidden="true" /></button>
          {menu?.i === i && list.length > 0 && (
            <div className="pw-snips" role="listbox">
              <b>✨ Câu mẫu{menu.q ? ` · “${menu.q}”` : ''}</b>
              {list.map(([g, h], k) => (
                <button key={g} type="button" role="option" aria-selected={k === menu.k} className={k === menu.k ? 'is-on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(i, g, h); }}>{g}</button>
              ))}
              {onPair && <small>↵ chèn · cột học sinh tự thêm dòng tương ứng</small>}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="pw-add" onClick={() => { set([...lines, '- ']); focus(lines.length); }}>＋ thêm dòng{snips ? ' · gõ “/” để chọn câu mẫu' : ''}</button>
    </div>
  );
}

/* ---------------------------------------------------------------- bản xem trước */
const PV_CSS = `<style id="pw-css">
html { background: #d6dbe4; }
body { background: #fff; max-width: 21cm; margin: 12px auto 24px; padding: 1.6cm 1.4cm 1.6cm 2.4cm; box-sizing: border-box; box-shadow: 0 2px 12px rgba(15,23,42,.2); overflow-wrap: anywhere; cursor: pointer; }
[data-sec] { transition: background .2s; border-radius: 2px; }
[data-sec]:hover { background: #f5f3ff; }
.pw-on, tr.pw-on td { background: #ede9fe !important; }
div.pw-on { outline: 2px solid #7c3aed; outline-offset: 3px; }
tr.pw-on td { box-shadow: inset 0 0 0 1px #7c3aed; }
p[style*="page-break-before"] { border-top: 2px dashed #9aa7b8; margin: 24px -1.4cm 16px -2.4cm !important; height: 0; overflow: hidden; }
img { max-width: 100%; height: auto; }
</style>`;

function LivePreview({ html, active, onPick }: { html: string; active: Sec; onPick: (s: Sec) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const first = useRef(html);
  const pickRef = useRef(onPick); pickRef.current = onPick;
  // cập nhật nội dung trang (không tải lại khung → không nháy, giữ vị trí cuộn)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const d = frame.current?.contentDocument; if (!d?.body) return;
      const m = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
      d.body.innerHTML = m ? m[1] : html;
      mark(d, active, false);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, ready]);
  useEffect(() => { const d = frame.current?.contentDocument; if (ready && d) mark(d, active, true); }, [active, ready]);
  // thu trang A4 cho vừa bề ngang khung xem trước
  useEffect(() => {
    const f = frame.current; if (!f || !ready) return;
    const fit = () => { const d = f.contentDocument; if (d?.documentElement) d.documentElement.style.zoom = String(Math.min(1, (f.clientWidth - 16) / (21 * 96 / 2.54 + 24))); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(f);
    return () => ro.disconnect();
  }, [ready]);
  const onLoad = () => {
    const d = frame.current?.contentDocument; if (!d) return;
    d.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest('[data-sec]');
      const s = el?.getAttribute('data-sec'); if (s) pickRef.current(s as Sec);
    });
    setReady(true);
  };
  return <iframe ref={frame} className="pw-frame" title="Bản xem trước giáo án" sandbox="allow-same-origin" onLoad={onLoad}
    srcDoc={first.current.replace(/<\/head>/i, `${PV_CSS}</head>`)} />;
}
function mark(d: Document, active: Sec, scroll: boolean) {
  d.querySelectorAll('.pw-on').forEach((x) => x.classList.remove('pw-on'));
  const els = Array.from(d.querySelectorAll<HTMLElement>(`[data-sec="${active}"]`));
  els.forEach((x) => x.classList.add('pw-on'));
  if (scroll && els[0]) els[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ---------------------------------------------------------------- kiểm tra nhanh */
type Check = { ok: boolean; text: string; fix?: { label: string; run: () => void } };
const placeholder = (s: string) => !s.trim() || /^-?\s*\(Thầy cô ghi/.test(s.trim());

export default function PlanWorkspace({ plan, edit, school, weak, view }: {
  plan: LessonPlan; edit: (fn: (p: LessonPlan) => LessonPlan) => void; school: string;
  /** dạng bài lớp còn hay sai (môn của giáo án) */ weak: string[];
  view: 'split' | 'form';
}) {
  const [active, setActive] = useState<Sec>('info');
  // cột phải: bản xem trước A4 hoặc Trợ lý soạn bài (nhớ lựa chọn trên máy)
  const [side, setSide] = useState<'pv' | 'ai'>('pv');
  useEffect(() => { try { if (localStorage.getItem('edukid:plan-side') === 'ai') setSide('ai'); } catch { /* bỏ qua */ } }, []);
  const pickSide = (x: 'pv' | 'ai') => { setSide(x); try { localStorage.setItem('edukid:plan-side', x); } catch { /* bỏ qua */ } };
  const actIdx = active.startsWith('act-') ? Number(active.slice(4)) : -1;
  const midRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => plansDocument([plan], school), [plan, school]);
  const setAct = (i: number, patch: Partial<PlanActivity>) => edit((p) => ({ ...p, activities: p.activities.map((a, k) => (k === i ? { ...a, ...patch } : a)) }));
  const total = plan.activities.reduce((n, a) => n + (a.minutes || 0), 0);
  const go = (s: Sec) => {
    setActive(s);
    const el = midRef.current?.querySelector<HTMLElement>(`[data-pw="${s}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const all = plan.activities.map((a) => `${a.teacher}\n${a.student}`).join('\n').toLowerCase();
  const lt = plan.activities.findIndex((a) => a.key === 'luyen-tap');
  const missWeak = weak.find((w) => !all.includes(w.toLowerCase().slice(0, 18)));
  const checks: Check[] = [
    { ok: plan.activities.every((a) => a.goal.trim() && a.teacher.trim() && a.student.trim()), text: 'Đủ các hoạt động, có mục tiêu, có việc của GV và HS' },
    { ok: total === plan.minutes, text: total === plan.minutes ? `Thời gian khớp ${plan.minutes} phút` : `Tổng thời gian ${total}/${plan.minutes} phút`, fix: total !== plan.minutes && plan.activities.length ? { label: 'Chia lại', run: () => edit((p) => ({ ...p, activities: rebalance(p.activities, p.minutes) })) } : undefined },
    { ok: !placeholder(plan.goals.knowledge), text: 'Mục I có yêu cầu cần đạt cụ thể' },
    { ok: /nhóm/.test(all), text: 'Có hoạt động nhóm' },
    { ok: /phân hoá|phân hóa|lúng túng|hỗ trợ|củng cố|nâng cao|hs chậm/.test(all), text: 'Có phân hoá / hỗ trợ HS chậm',
      fix: lt >= 0 ? { label: 'Thêm dòng', run: () => setAct(lt, { teacher: `${plan.activities[lt].teacher}\n- Phân hoá: nhóm củng cố làm bài …; nhóm nâng cao làm thêm bài …`.trim(), student: `${plan.activities[lt].student}\n- Làm bài theo nhóm năng lực.`.trim() }) } : undefined },
    ...(missWeak && lt >= 0 ? [{ ok: false, text: `Dạng lớp hay sai “${missWeak}” chưa có trong Luyện tập`, fix: { label: 'Chèn', run: () => setAct(lt, { teacher: `${plan.activities[lt].teacher}\n- Luyện thêm dạng lớp còn hay sai: ${missWeak}.`.trim(), student: `${plan.activities[lt].student}\n- Làm bài luyện thêm.`.trim() }) } }] : []),
    { ok: !!plan.adjust.trim(), text: plan.adjust.trim() ? 'Mục IV đã ghi' : 'Mục IV (điều chỉnh) ghi sau khi dạy' },
  ];
  const doneSec = (s: Sec) => s === 'goals' ? !placeholder(plan.goals.knowledge) : s === 'mat' ? !!(plan.materials.teacher.trim() && plan.materials.student.trim()) : s === 'adjust' ? !!plan.adjust.trim() : true;

  return (
    <div className={`pw${view === 'form' ? ' is-form' : ''}`}>
      <nav className="pw-nav" aria-label="Mục lục giáo án">
        <h4>Mục lục</h4>
        {([['info', 'Thông tin tiết dạy'], ['goals', 'I. Yêu cầu cần đạt'], ['mat', 'II. Đồ dùng']] as [Sec, string][]).map(([s, t]) => (
          <button key={s} type="button" className={active === s ? 'is-on' : ''} onClick={() => go(s)}>{t}<small>{doneSec(s) ? '✓' : 'trống'}</small></button>
        ))}
        <h4>III. Hoạt động · {total}/{plan.minutes}′</h4>
        {plan.activities.map((a, i) => (
          <button key={i} type="button" className={active === `act-${i}` ? 'is-on' : ''} onClick={() => go(`act-${i}` as Sec)}>
            <i style={{ background: colorOf(a, i) }} />{a.title.replace(/^\d+\.\s*/, `${i + 1}. `)}<small>{a.minutes}′</small>
          </button>
        ))}
        <button type="button" className={active === 'adjust' ? 'is-on' : ''} onClick={() => go('adjust')}>IV. Điều chỉnh<small className={plan.adjust.trim() ? '' : 'pw-warn'}>{plan.adjust.trim() ? '✓' : 'trống'}</small></button>
        <div className="pw-time" title="Phân bổ thời gian">{plan.activities.map((a, i) => <i key={i} style={{ flex: Math.max(1, a.minutes), background: colorOf(a, i) }} title={`${a.title}: ${a.minutes} phút`} />)}</div>
        <div className="pw-mins">{plan.activities.map((a, i) => (
          <span key={i}><i style={{ background: colorOf(a, i) }} />
            <button type="button" aria-label={`Bớt 1 phút: ${a.title}`} onClick={() => setAct(i, { minutes: Math.max(0, a.minutes - 1) })}><Minus aria-hidden="true" /></button>
            <b>{a.minutes}′</b>
            <button type="button" aria-label={`Thêm 1 phút: ${a.title}`} onClick={() => setAct(i, { minutes: Math.min(60, a.minutes + 1) })}><Plus aria-hidden="true" /></button>
          </span>
        ))}</div>
        <h4>Kiểm tra nhanh</h4>
        <ul className="pw-checks">{checks.map((c) => (
          <li key={c.text} className={c.ok ? 'is-ok' : 'is-warn'}>{c.ok ? '✅' : '⚠️'} {c.text}{!c.ok && c.fix && <button type="button" onClick={c.fix.run}>{c.fix.label}</button>}</li>
        ))}</ul>
      </nav>

      <div className="pw-mid" ref={midRef}>
        <section data-pw="info" className={`pw-card${active === 'info' ? ' is-on' : ''}`} onFocus={() => setActive('info')}>
          <h3>Thông tin tiết dạy</h3>
          <div className="planner-grid">
            <label className="adm-field planner-wide"><span>Tên bài</span><input value={plan.title} maxLength={200} onChange={(e) => edit((p) => ({ ...p, title: e.target.value }))} /></label>
            <label className="adm-field"><span>Ngày dạy</span><input type="date" value={plan.date} onChange={(e) => edit((p) => ({ ...p, date: e.target.value }))} /></label>
            <label className="adm-field"><span>Tiết</span><input type="number" min={1} max={10} value={plan.period || ''} onChange={(e) => edit((p) => ({ ...p, period: Math.max(0, Math.min(10, Number(e.target.value) || 0)) }))} /></label>
            <label className="adm-field"><span>Tuần</span><input value={plan.week} maxLength={10} placeholder="vd: 7" onChange={(e) => edit((p) => ({ ...p, week: e.target.value }))} /></label>
            <label className="adm-field"><span>Thời lượng (phút)</span><input type="number" min={20} max={90} value={plan.minutes} onChange={(e) => edit((p) => ({ ...p, minutes: Number(e.target.value) || 35 }))} /></label>
            <label className="adm-field"><span>Buổi</span><select value={plan.session ?? ''} onChange={(e) => edit((p) => ({ ...p, session: e.target.value }))}><option value="">—</option><option>Sáng</option><option>Chiều</option></select></label>
            <label className="adm-field"><span>Tiết PPCT</span><input value={plan.ppct ?? ''} maxLength={10} onChange={(e) => edit((p) => ({ ...p, ppct: e.target.value }))} /></label>
          </div>
          {plan.orig && (
            <div className="planner-orig" role="group" aria-label="Bản xuất Word">
              <p>Giáo án có <b>bản gốc của trường</b> (giữ nguyên chữ, bảng, hình như file Word đã nạp). Bản xem trước và file Word dùng:</p>
              <label><input type="radio" name="pl-orig" checked={plan.useOrig !== false} onChange={() => edit((p) => ({ ...p, useOrig: true }))} /> Bản gốc của trường (sửa trên “Xem trước &amp; tải Word”)</label>
              <label><input type="radio" name="pl-orig" checked={plan.useOrig === false} onChange={() => edit((p) => ({ ...p, useOrig: false }))} /> Khung soạn bên dưới</label>
            </div>
          )}
        </section>

        <section data-pw="goals" className={`pw-card${active === 'goals' ? ' is-on' : ''}`} onFocus={() => setActive('goals')}>
          <h3>I. Yêu cầu cần đạt</h3>
          {plan.source && <p className="dash-muted">Từ kho giáo án của trường: {plan.source}</p>}
          <div className="adm-field"><span>1. {plan.goalLabels?.[0] ?? 'Kiến thức, kĩ năng'}</span><Lines label={plan.goalLabels?.[0] ?? 'Kiến thức, kĩ năng'} value={plan.goals.knowledge} onChange={(v) => edit((p) => ({ ...p, goals: { ...p.goals, knowledge: v } }))} /></div>
          <div className="adm-field"><span>2. {plan.goalLabels?.[1] ?? 'Năng lực'}</span><Lines label={plan.goalLabels?.[1] ?? 'Năng lực'} value={plan.goals.competence} onChange={(v) => edit((p) => ({ ...p, goals: { ...p.goals, competence: v } }))} /></div>
          <div className="adm-field"><span>3. {plan.goalLabels?.[2] ?? 'Phẩm chất'}</span><Lines label={plan.goalLabels?.[2] ?? 'Phẩm chất'} value={plan.goals.quality} onChange={(v) => edit((p) => ({ ...p, goals: { ...p.goals, quality: v } }))} /></div>
          <label className="adm-field"><span>4. Nội dung tích hợp (nếu có)</span><textarea rows={2} value={plan.integration ?? ''} placeholder="vd: GDĐP, Quyền con người, Bảo vệ môi trường…" onChange={(e) => edit((p) => ({ ...p, integration: e.target.value }))} /></label>
        </section>

        <section data-pw="mat" className={`pw-card${active === 'mat' ? ' is-on' : ''}`} onFocus={() => setActive('mat')}>
          <h3>II. Đồ dùng dạy học</h3>
          <div className="planner-two">
            <label className="adm-field"><span>Giáo viên</span><textarea rows={2} value={plan.materials.teacher} onChange={(e) => edit((p) => ({ ...p, materials: { ...p.materials, teacher: e.target.value } }))} /></label>
            <label className="adm-field"><span>Học sinh</span><textarea rows={2} value={plan.materials.student} onChange={(e) => edit((p) => ({ ...p, materials: { ...p.materials, student: e.target.value } }))} /></label>
          </div>
        </section>

        {plan.activities.map((a, i) => {
          const s = `act-${i}` as Sec, on = active === s;
          return (
            <section key={i} data-pw={s} className={`pw-card pw-act${on ? ' is-on' : ''}`} style={{ '--c': colorOf(a, i) } as React.CSSProperties} onFocus={() => setActive(s)}>
              <h3 className="pw-act-h">
                <input className="planner-act-title" value={a.title} aria-label="Tên hoạt động" onChange={(e) => setAct(i, { title: e.target.value })} />
                <span className="pw-min"><input className="planner-min" type="number" min={0} max={60} value={a.minutes} aria-label={`Số phút: ${a.title}`} onChange={(e) => setAct(i, { minutes: Number(e.target.value) || 0 })} /> phút</span>
                {!on && <button type="button" className="mini-btn" onClick={() => go(s)}>Sửa</button>}
              </h3>
              {on ? <>
                <label className="adm-field"><span>Mục tiêu</span><textarea rows={a.goal.length > 120 ? 3 : 1} value={a.goal} onChange={(e) => setAct(i, { goal: e.target.value })} /></label>
                <div className="planner-two">
                  <div className="adm-field"><span>Hoạt động của giáo viên</span><Lines label="Hoạt động của giáo viên" value={a.teacher} snips={snipsOf(a.key)} onChange={(v) => setAct(i, { teacher: v })}
                    onPair={(hs) => edit((p) => ({ ...p, activities: p.activities.map((x, k) => (k === i ? { ...x, student: `${x.student.trim() ? `${x.student}\n` : ''}${hs}` } : x)) }))} /></div>
                  <div className="adm-field"><span>Hoạt động của học sinh</span><Lines label="Hoạt động của học sinh" value={a.student} onChange={(v) => setAct(i, { student: v })} /></div>
                </div>
              </> : <p className="pw-sum" onClick={() => go(s)}>{a.goal || a.teacher.split('\n')[0]}</p>}
            </section>
          );
        })}

        <section data-pw="assess" className={`pw-card${active === 'assess' ? ' is-on' : ''}`} onFocus={() => setActive('assess')}>
          <label className="adm-field"><span>Đánh giá</span><textarea rows={2} value={plan.assessment} onChange={(e) => edit((p) => ({ ...p, assessment: e.target.value }))} /></label>
        </section>
        <section data-pw="adjust" className={`pw-card${active === 'adjust' ? ' is-on' : ''}`} onFocus={() => setActive('adjust')}>
          <h3>IV. Điều chỉnh sau bài dạy</h3>
          <label className="adm-field"><span>Ghi lại sau khi dạy (để lần sau dùng lại giáo án tốt hơn)</span><textarea rows={3} value={plan.adjust} onChange={(e) => edit((p) => ({ ...p, adjust: e.target.value }))} /></label>
        </section>
      </div>

      <div className="pw-pv">
        <div className="pw-tabs" role="tablist" aria-label="Cột bên phải">
          {view === 'split' && <button type="button" role="tab" aria-selected={side === 'pv'} className={side === 'pv' ? 'is-on' : ''} onClick={() => pickSide('pv')}>📄 Xem trước A4</button>}
          <button type="button" role="tab" aria-selected={side === 'ai' || view !== 'split'} className={side === 'ai' || view !== 'split' ? 'is-on' : ''} onClick={() => pickSide('ai')}>🧑‍🏫 Trợ lý soạn bài</button>
        </div>
        {side === 'pv' && view === 'split' ? <>
          {plan.orig && plan.useOrig !== false && <p className="pw-pv-note">Đang xem bản gốc của trường. Sửa khung soạn sẽ không đổi bản này — chọn “Khung soạn bên dưới” ở mục Thông tin để dùng khung soạn.</p>}
          <LivePreview html={html} active={active} onPick={go} />
          <p className="pw-pv-hint">Bấm vào một mục trên trang để sửa mục đó · trang giống file Word tải về</p>
        </> : <PlanAssistant plan={plan} edit={edit} weak={weak} active={actIdx} onGo={(t) => go(t < 0 ? 'adjust' : (`act-${t}` as Sec))} />}
      </div>
    </div>
  );
}

/** Chia lại số phút theo tỉ lệ cũ cho khớp tổng thời lượng */
function rebalance(acts: PlanActivity[], minutes: number): PlanActivity[] {
  const sum = acts.reduce((n, a) => n + (a.minutes || 0), 0) || acts.length;
  const out = acts.map((a) => ({ ...a, minutes: Math.max(1, Math.round(((a.minutes || 1) * minutes) / sum)) }));
  const diff = minutes - out.reduce((n, a) => n + a.minutes, 0);
  const big = out.reduce((k, a, i) => (a.minutes > out[k].minutes ? i : k), 0);
  out[big] = { ...out[big], minutes: Math.max(1, out[big].minutes + diff) };
  return out;
}
