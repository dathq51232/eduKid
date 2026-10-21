'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, SpellCheck } from 'lucide-react';
import DocPreview from './DocPreview';
import { ALL_PAIRS, makeSheet, sheetHtml } from '@/lib/spelling/worksheet';
import type { PairId } from '@/lib/spelling/bank';

const KEY = 'edukid:phieu-chinh-ta';
type Saved = { school: string; className: string; teacher: string; pairs: PairId[]; picCount: number; wordCount: number; copy: boolean; withKey: boolean };
const newSeed = () => Math.floor(Math.random() * 1_000_000_000) + 1;

/** Màn hình xem trước phiếu: khổ A4, lề như khi in */
const SCREEN = `@media screen {
  html { background: #e6eaf0; }
  body { background: #fff; max-width: 21cm; margin: 16px auto 40px !important; padding: 12mm 12mm 12mm 14mm; box-sizing: border-box; box-shadow: 0 2px 14px rgba(15,23,42,.18); }
  p[style*="page-break-before"] { border-top: 2px dashed #9aa7b8; margin: 28px -12mm 18px -14mm !important; height: 0; overflow: hidden; }
}
img { max-width: 100%; height: auto; }`;

/**
 * Phiếu chính tả lớp 1: giáo viên nhập trường, lớp, tên giáo viên; chọn cặp âm, số câu → app sinh phiếu có tranh,
 * bài điền chữ, tập chép và trang đáp án. Mỗi lần "Phiếu khác" ra một phiếu mới; xem trước, sửa, in / PDF, tải Word.
 */
export default function SpellingSheets({ defaultClass, defaultSchool, defaultTeacher }: { defaultClass: string; defaultSchool: string; defaultTeacher: string }) {
  const [school, setSchool] = useState(defaultSchool);
  const [className, setClassName] = useState(defaultClass);
  const [teacher, setTeacher] = useState(defaultTeacher);
  const [pairs, setPairs] = useState<PairId[]>(['c-k']);
  const [picCount, setPicCount] = useState(12);
  const [wordCount, setWordCount] = useState(12);
  const [copy, setCopy] = useState(true);
  const [withKey, setWithKey] = useState(true);
  const [seed, setSeed] = useState(0);

  // nhớ lựa chọn trên máy này (trường, lớp, giáo viên do thầy cô nhập)
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
      if (v) {
        if (v.school) setSchool(v.school);
        if (v.teacher) setTeacher(v.teacher);
        if (Array.isArray(v.pairs) && v.pairs.length) setPairs(v.pairs.filter((p) => ALL_PAIRS.some((a) => a.id === p)));
        if (typeof v.picCount === 'number') setPicCount(v.picCount);
        if (typeof v.wordCount === 'number') setWordCount(v.wordCount);
        if (typeof v.copy === 'boolean') setCopy(v.copy);
        if (typeof v.withKey === 'boolean') setWithKey(v.withKey);
      }
    } catch { /* trình duyệt chặn lưu trữ: dùng mặc định */ }
    setSeed(newSeed());
  }, []);
  useEffect(() => {
    if (!seed) return;
    try { localStorage.setItem(KEY, JSON.stringify({ school, className, teacher, pairs, picCount, wordCount, copy, withKey } satisfies Saved)); } catch { /* bỏ qua */ }
  }, [school, className, teacher, pairs, picCount, wordCount, copy, withKey, seed]);

  const toggle = (id: PairId) => setPairs((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : [...p, id]));
  // nhiều cặp âm: gợi ý ít câu mỗi cặp để vừa 1–2 trang
  const many = pairs.length > 1;
  const sheet = useMemo(() => (seed ? makeSheet({ pairs, picCount, wordCount, copy, seed }) : null), [pairs, picCount, wordCount, copy, seed]);
  const html = useMemo(() => (sheet ? sheetHtml(sheet, { withKey, school, className, teacher }) : ''), [sheet, withKey, school, className, teacher]);
  const name = `phieu-chinh-ta-${pairs.join('-')}-so-${seed % 10000}`;

  return (
    <div className="planner">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {defaultClass}</p>
          <h1><SpellCheck aria-hidden="true" /> Phiếu chính tả</h1>
          <p className="dash-muted">Chọn cặp âm cần luyện, app tạo phiếu có tranh, bài điền chữ, tập chép và trang đáp án. Mỗi lần bấm “Phiếu khác” ra một phiếu mới. Từ ngữ do app tự soạn; tranh 3D Fluent Emoji (giấy phép MIT).</p>
        </div>
      </header>

      <section className="dash-section planner-card" aria-labelledby="ws-info">
        <h2 id="ws-info">Thông tin in trên phiếu</h2>
        <div className="planner-grid">
          <label className="adm-field planner-wide"><span>Trường</span><input value={school} maxLength={120} placeholder="vd: Trường Tiểu học …" onChange={(e) => setSchool(e.target.value)} /></label>
          <label className="adm-field"><span>Lớp</span><input value={className} maxLength={20} placeholder="vd: 1A1" onChange={(e) => setClassName(e.target.value)} /></label>
          <label className="adm-field"><span>Giáo viên</span><input value={teacher} maxLength={80} placeholder="Họ và tên giáo viên" onChange={(e) => setTeacher(e.target.value)} /></label>
        </div>
        <p className="dash-muted">Để trống ô nào thì phiếu in dòng chấm để viết tay.</p>

        <h2>Nội dung phiếu</h2>
        <div className="ws-pairs" role="group" aria-label="Cặp âm">
          {ALL_PAIRS.map((p) => (
            <label key={p.id} className={`ws-pair${pairs.includes(p.id) ? ' is-on' : ''}`}>
              <input type="checkbox" checked={pairs.includes(p.id)} onChange={() => toggle(p.id)} />
              <b>{p.options.join(' / ')}</b>
            </label>
          ))}
        </div>
        <div className="planner-grid">
          <label className="adm-field"><span>Câu có tranh{many ? ' (mỗi cặp)' : ''}</span><input type="number" min={0} max={16} value={picCount} onChange={(e) => setPicCount(Math.max(0, Math.min(16, Number(e.target.value) || 0)))} /></label>
          <label className="adm-field"><span>Từ điền chữ{many ? ' (mỗi cặp)' : ''}</span><input type="number" min={0} max={20} value={wordCount} onChange={(e) => setWordCount(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} /></label>
          <label className="adm-field ws-check"><input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} /> <span>Có bài tập chép</span></label>
          <label className="adm-field ws-check"><input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} /> <span>Kèm trang đáp án</span></label>
        </div>
        {many && (picCount > 6 || wordCount > 8) && <p className="dash-muted">Gợi ý: chọn nhiều cặp âm thì để 4 câu có tranh và 8 từ mỗi cặp để phiếu vừa một trang.</p>}
      </section>

      {sheet && (
        <DocPreview inline title={`${sheet.subtitle} · phiếu số ${seed % 10000}`} filename={name} html={html} screenCss={SCREEN} fontSize={13}
          extra={<button type="button" className="btn btn-outline btn-sm" onClick={() => setSeed(newSeed())}><RefreshCw aria-hidden="true" /> Phiếu khác</button>} />
      )}
    </div>
  );
}
