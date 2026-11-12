'use client';

// Màn hình "Tuần dạy" của Kế hoạch bài dạy: lưới Thứ × Buổi, mỗi tiết một thẻ (màu theo môn) cho biết đã có giáo án,
// giáo án lấy từ kho, đã có bài giảng; tiết trong lịch báo giảng vừa nạp mà chưa lưu hiện viền đứt.
// Bấm thẻ → khung dưới gom đủ việc của tiết: Giáo án · Bài giảng · Phiếu & bài tập. Bên phải: việc của tuần.
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileDown, MonitorPlay, Pencil, Trash2 } from 'lucide-react';
import { SUBJECT_NAMES, addDays, viDate, weekdayVi, type LessonPlan, type PlanSubject } from '@/lib/plans/generate';
import type { DeckRow } from '@/components/deck/DeckHome';

export type WeekSaved = { id: string; subject: PlanSubject; title: string; teach_date: string | null; period: number | null };

const COLOR: Partial<Record<PlanSubject, string>> = {
  'tieng-viet': '#38bdf8', toan: '#f59e0b', 'tieng-anh': '#f472b6', 'dao-duc': '#fb7185', tnxh: '#4ade80', hdtn: '#a78bfa',
  'am-nhac': '#f97316', 'mi-thuat': '#e879f9', gdtc: '#22d3ee', 'tin-hoc': '#818cf8', 'khoa-hoc': '#34d399', 'ls-dl': '#facc15', stem: '#2dd4bf',
};
const colorOf = (s: PlanSubject) => COLOR[s] ?? '#94a3b8';
const isPm = (s?: string) => /chi/i.test(s ?? '');

type Card = { key: string; id?: string; date: string; pm: boolean; period: number; subject: PlanSubject; label: string; ppct?: string; title: string; kho: boolean; deck: number; draft?: LessonPlan };

export default function PlanWeekBoard({ classId, week, setWeek, saved, details, drafts, decks, weak, busy, onOpen, onOpenDraft, onRemove, onPreviewPlan, onExportWeek, onImport, onMakeDeck }: {
  classId: string; week: string; setWeek: (w: string) => void;
  /** giáo án đã lưu của tuần */ saved: WeekSaved[];
  /** nội dung giáo án đã lưu của tuần (để biết buổi, PPCT, kho) */ details: Map<string, LessonPlan>;
  /** giáo án sinh từ lịch báo giảng vừa nạp (chưa chắc đã lưu) */ drafts: LessonPlan[];
  decks: DeckRow[]; weak: string[]; busy: boolean;
  onOpen: (id: string) => void; onOpenDraft: (p: LessonPlan) => void; onRemove: (id: string) => void;
  onPreviewPlan: (p: LessonPlan) => void; onExportWeek: (withPlans: boolean) => void; onImport: () => void; onMakeDeck: (planId: string) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<'ga' | 'bg' | 'phieu'>('ga');
  const keyOf = (date: string, period: number, title: string) => `${date}|${period}|${title.trim().toLowerCase()}`;

  const cards = useMemo(() => {
    const out: Card[] = [];
    const have = new Set<string>();
    for (const s of saved) {
      if (!s.teach_date) continue;
      const d = details.get(s.id);
      have.add(keyOf(s.teach_date, s.period ?? 0, s.title));
      out.push({
        key: s.id, id: s.id, date: s.teach_date, pm: isPm(d?.session), period: s.period ?? 0, subject: s.subject,
        label: d?.subjectLabel || SUBJECT_NAMES[s.subject], ppct: d?.ppct, title: s.title, kho: !!(d?.source || d?.orig), deck: decks.filter((x) => x.plan === s.id).length,
      });
    }
    drafts.forEach((p, i) => {
      if (!p.date || p.date < week || p.date > addDays(week, 6) || have.has(keyOf(p.date, p.period, p.title))) return;
      out.push({ key: `d${i}`, date: p.date, pm: isPm(p.session), period: p.period, subject: p.subject, label: p.subjectLabel || SUBJECT_NAMES[p.subject], ppct: p.ppct, title: p.title, kho: !!(p.source || p.orig), deck: 0, draft: p });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date) || Number(a.pm) - Number(b.pm) || a.period - b.period);
  }, [saved, details, drafts, decks, week]);

  const days = [0, 1, 2, 3, 4].map((i) => addDays(week, i));
  if (cards.some((c) => c.date === addDays(week, 5))) days.push(addDays(week, 5));
  const hasPm = cards.some((c) => c.pm);
  const done = cards.filter((c) => !c.draft), todo = cards.filter((c) => c.draft);
  const cur = cards.find((c) => c.key === sel) ?? null;
  const curPlan = cur ? (cur.draft ?? (cur.id ? details.get(cur.id) : undefined)) : undefined;
  const curDecks = cur?.id ? decks.filter((d) => d.plan === cur.id) : [];
  const thaoGiang = done.filter((c) => c.deck > 0);

  const cell = (date: string, pm: boolean) => cards.filter((c) => c.date === date && c.pm === pm);
  const pickCard = (c: Card) => { setSel(c.key === sel ? null : c.key); setTab('ga'); };

  const card = (c: (typeof cards)[number]) => (
    <button key={c.key} type="button" className={`kb-card${c.draft ? ' is-todo' : ''}${sel === c.key ? ' is-sel' : ''}`} style={{ '--c': colorOf(c.subject) } as React.CSSProperties}
      onClick={() => pickCard(c)} aria-pressed={sel === c.key}>
      <b>{c.period ? `T${c.period} · ` : ''}{c.label}{c.ppct ? ` · ${c.ppct}` : ''}</b>
      <span>{c.title}</span>
      <i className="kb-flags" aria-label={[c.draft ? 'chưa lưu' : 'đã có giáo án', c.kho ? 'từ kho' : '', c.deck ? 'có bài giảng' : ''].filter(Boolean).join(', ')}>{c.draft ? '✏️' : '✅'}{c.kho ? '📚' : ''}{c.deck ? '🎬' : ''}</i>
    </button>
  );

  return (
    <div className="kb">
      <div className="kb-bar">
        <button type="button" className="kb-nav" aria-label="Tuần trước" onClick={() => { setWeek(addDays(week, -7)); setSel(null); }}><ChevronLeft aria-hidden="true" /></button>
        <strong className="kb-week">{viDate(week)} – {viDate(addDays(week, 4))}</strong>
        <button type="button" className="kb-nav" aria-label="Tuần sau" onClick={() => { setWeek(addDays(week, 7)); setSel(null); }}><ChevronRight aria-hidden="true" /></button>
        <span className="kb-chip is-g">✅ {done.length} đã có giáo án</span>
        {todo.length > 0 && <span className="kb-chip is-a">✏️ {todo.length} chưa lưu</span>}
        <span className="kb-chip is-b">📚 {cards.filter((c) => c.kho).length} từ kho</span>
        <span className="kb-chip is-p">🎬 {thaoGiang.length} có bài giảng</span>
      </div>

      {cards.length === 0 ? (
        <div className="kb-empty">
          <p><b>Tuần này chưa có tiết nào.</b> Nạp lịch báo giảng để app soạn sẵn giáo án cho cả tuần, hoặc soạn từng tiết.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onImport}>Nạp lịch báo giảng</button>
        </div>
      ) : (
        <div className="kb-grid" style={{ gridTemplateColumns: `36px repeat(${days.length}, minmax(0, 1fr))` }}>
          <span />
          {days.map((d) => <div key={d} className="kb-dh">{weekdayVi(d)}<small>{viDate(d).slice(0, -5)}</small></div>)}
          {[false, ...(hasPm ? [true] : [])].map((pm) => (
            <div key={String(pm)} className="kb-row" style={{ display: 'contents' }}>
              <div className="kb-ses">{pm ? 'CHIỀU' : 'SÁNG'}</div>
              {days.map((d) => (
                <div key={d} className="kb-col">
                  {cell(d, pm).map((c) => (
                    card(c)
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {cards.length > 0 && (
        // điện thoại: từng ngày xếp dọc (không phải kéo ngang lưới 5 cột)
        <div className="kb-days">
          {days.map((d) => {
            const am = cell(d, false), pm = hasPm ? cell(d, true) : [];
            if (!am.length && !pm.length) return null;
            return (
              <section key={d} className="kb-day">
                <h4>{weekdayVi(d)} <small>{viDate(d).slice(0, -5)}</small></h4>
                {am.length > 0 && <><p className="kb-day-ses">Sáng</p><div className="kb-day-cards">{am.map(card)}</div></>}
                {pm.length > 0 && <><p className="kb-day-ses">Chiều</p><div className="kb-day-cards">{pm.map(card)}</div></>}
              </section>
            );
          })}
        </div>
      )}
      {cards.length > 0 && <p className="kb-legend">✅ đã có giáo án · ✏️ chưa lưu (viền đứt) · 📚 giáo án từ kho · 🎬 có bài giảng — bấm một tiết để xem giáo án, bài giảng, phiếu của tiết đó</p>}

      <div className="kb-bottom">
        {cur ? (
          <section className="kb-detail" aria-label={`Tiết ${cur.title}`}>
            <div className="kb-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'ga'} className={tab === 'ga' ? 'is-on' : ''} onClick={() => setTab('ga')}>📄 Giáo án</button>
              <button type="button" role="tab" aria-selected={tab === 'bg'} className={tab === 'bg' ? 'is-on' : ''} onClick={() => setTab('bg')}>🎬 Bài giảng{curDecks.length ? ` (${curDecks.length})` : ''}</button>
              <button type="button" role="tab" aria-selected={tab === 'phieu'} className={tab === 'phieu' ? 'is-on' : ''} onClick={() => setTab('phieu')}>📝 Phiếu & bài tập</button>
              <span className="kb-cur">{weekdayVi(cur.date)} · {cur.pm ? 'Chiều' : 'Sáng'}{cur.period ? ` tiết ${cur.period}` : ''} · <b>{cur.title}</b></span>
            </div>
            {tab === 'ga' && (
              <div className="kb-pane">
                {cur.draft ? <p>✏️ Giáo án app soạn sẵn từ lịch báo giảng, <b>chưa lưu</b>.{cur.kho ? ' Dùng giáo án từ kho.' : ''}</p>
                  : <p>✅ Đã lưu{curPlan?.source ? <> · 📚 từ kho: {curPlan.source}</> : ''}</p>}
                {curPlan && <ul className="kb-facts">
                  <li>Môn: {cur.label}{curPlan.ppct ? ` · PPCT ${curPlan.ppct}` : ''} · {curPlan.minutes} phút · {curPlan.activities.length} hoạt động</li>
                  {curPlan.integration?.trim() && <li>Tích hợp: {curPlan.integration.split('\n')[0]}</li>}
                  <li>{curPlan.adjust.trim() ? '✅ Đã ghi điều chỉnh sau bài dạy' : '⚪ Chưa ghi điều chỉnh sau bài dạy'}</li>
                </ul>}
                <div className="kb-btns">
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => (cur.draft ? onOpenDraft(cur.draft) : cur.id && onOpen(cur.id))}><Pencil aria-hidden="true" /> {cur.draft ? 'Mở soạn & lưu' : 'Mở soạn'}</button>
                  {curPlan && <button type="button" className="btn btn-outline btn-sm" onClick={() => onPreviewPlan(curPlan)}><FileDown aria-hidden="true" /> Xem Word</button>}
                  {cur.id && <button type="button" className="btn btn-outline btn-sm is-danger" onClick={() => { if (cur.id) { onRemove(cur.id); setSel(null); } }}><Trash2 aria-hidden="true" /> Xoá</button>}
                </div>
              </div>
            )}
            {tab === 'bg' && (
              <div className="kb-pane">
                {curDecks.length ? <ul className="kb-decks">{curDecks.map((d) => (
                  <li key={d.id}><b>{d.title}</b>{d.slides ? ` · ${d.slides} trang` : ''}
                    <Link className="mini-btn" href={`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${d.id}`}>Sửa</Link>
                    <Link className="mini-btn" href={`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${d.id}/trinh-chieu`}><MonitorPlay aria-hidden="true" /> Trình chiếu</Link></li>
                ))}</ul> : <p>Tiết này chưa có bài giảng.</p>}
                {cur.id
                  ? <button type="button" className="btn btn-primary btn-sm" onClick={() => cur.id && onMakeDeck(cur.id)}><MonitorPlay aria-hidden="true" /> {curDecks.length ? 'Tạo thêm bài giảng' : 'Tạo bài giảng từ giáo án'}</button>
                  : <p className="dash-muted">Lưu giáo án trước rồi tạo bài giảng (slide, cảnh 3D) thẳng từ giáo án.</p>}
              </div>
            )}
            {tab === 'phieu' && (
              <div className="kb-pane kb-links">
                <Link className="btn btn-outline btn-sm" href={`/giao-vien/lop/${classId}/phieu-bai-tap`}>📝 Phiếu bài tập</Link>
                {cur.subject === 'tieng-viet' && <Link className="btn btn-outline btn-sm" href={`/giao-vien/lop/${classId}/phieu-chinh-ta`}>🔤 Phiếu chính tả</Link>}
                <Link className="btn btn-outline btn-sm" href={`/giao-vien/lop/${classId}/giao-bai`}>🏠 Giao bài về nhà</Link>
                {curPlan?.lessonId && (cur.subject === 'toan' || cur.subject === 'tieng-viet' || cur.subject === 'tieng-anh') && <Link className="btn btn-outline btn-sm" href={`/lam-bai?lessonId=${curPlan.lessonId}&subject=${cur.subject}&grade=${curPlan.grade}`}>▶ Bài luyện của HS trên app</Link>}
              </div>
            )}
          </section>
        ) : <section className="kb-detail kb-hint"><p>Bấm vào một tiết trên lịch để xem giáo án, bài giảng và phiếu của tiết đó.</p></section>}

        <aside className="kb-todo" aria-label="Việc của tuần">
          <h3>Việc của tuần</h3>
          <ul>
            {todo.length > 0 && <li>✏️ {todo.length} tiết chưa lưu <button type="button" className="ct-link" onClick={onImport}>Lưu ở Nạp lịch báo giảng</button></li>}
            <li>📄 Lịch báo giảng tuần <button type="button" className="ct-link" disabled={!done.length || busy} onClick={() => onExportWeek(false)}>Xem trước, tải Word / Excel</button></li>
            <li>📚 Lịch + giáo án cả tuần <button type="button" className="ct-link" disabled={!done.length || busy} onClick={() => onExportWeek(true)}>Xuất Word</button></li>
            {thaoGiang.map((c) => <li key={c.key}>🎬 {weekdayVi(c.date)}: {c.label} – có bài giảng <button type="button" className="ct-link" onClick={() => { setSel(c.key); setTab('bg'); }}>Mở</button></li>)}
            {weak.length > 0 && <li>📊 Lớp còn hay sai: {weak[0]}</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
