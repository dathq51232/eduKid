'use client';

// Quy tắc sinh đề của phòng thi — cô tự đặt như ở "Ma trận và đề kiểm tra":
// cách phát đề (riêng / chung), số câu từng chủ đề × mức, điểm mỗi câu theo mức, lọc yêu cầu cần đạt.
import { useMemo } from 'react';
import { MUCS, MUC_DESC, MUC_NAME, STAGE_MIX, STAGE_NAME, available, outcomesIn, totals, type Matrix, type Muc, type Stage } from '@/lib/exams/matrix';
import type { RoomMode } from '@/lib/classroom/rooms-build';
import { findOutcomeAny } from '@/lib/curriculum';
import type { SubjectCode } from '@/lib/types';
import '@/styles/exam.css';
import '@/styles/room.css';

/** Tỉ lệ gợi ý mức 1 · mức 2 (mức 3 = phần còn lại) */
export const RATIOS: { key: string; name: string; r: [number, number] }[] = [
  { key: '433', name: '40 · 30 · 30 (phòng thi)', r: [0.4, 0.3] },
  { key: '532', name: '50 · 30 · 20 (kiểm tra định kỳ)', r: [0.5, 0.3] },
  { key: '622', name: '60 · 20 · 20 (lớp nhỏ, ôn nhẹ)', r: [0.6, 0.2] },
  { key: '334', name: '30 · 30 · 40 (nâng cao)', r: [0.3, 0.3] },
];

type Props = {
  matrix: Matrix; subject: SubjectCode; mode: RoomMode; ratio: string; nStudents: number;
  onMatrix: (m: Matrix) => void; onMode: (m: RoomMode) => void; onRatio: (key: string) => void;
  /** xếp đề theo dạng thao tác (kiểu đề thi Tiếng Việt trực tuyến) */
  byDang?: boolean; onByDang?: (v: boolean) => void;
};

export default function RoomRules({ matrix, subject, mode, ratio, nStudents, onMatrix, onMode, onRatio, byDang, onByDang }: Props) {
  const avail = useMemo(() => matrix.rows.map((r) => available(r.lessonIds, matrix.exclude)), [matrix]);
  const t = totals(matrix);
  const outcomes = useMemo(() => outcomesIn(matrix.rows.flatMap((r) => r.lessonIds))
    .map((o) => ({ ...o, text: findOutcomeAny(subject, o.code)?.outcome.text ?? o.code })), [matrix.rows, subject]);

  const setCount = (ri: number, k: Muc, v: number) =>
    onMatrix({ ...matrix, rows: matrix.rows.map((r, i) => (i === ri ? { ...r, counts: { ...r.counts, [k]: Math.max(0, Math.min(Math.round(v) || 0, avail[ri]?.[k] ?? 0)) } } : r)) });
  const setPoint = (k: Muc, v: number) => onMatrix({ ...matrix, points: { ...matrix.points, [k]: Math.max(0.25, Math.min(Number.isFinite(v) ? v : 1, 10)) } });
  const toggleOutcome = (code: string, on: boolean) => {
    const exclude = on ? (matrix.exclude ?? []).filter((c) => c !== code) : [...(matrix.exclude ?? []), code];
    const rows = matrix.rows.map((r) => {
      const a = available(r.lessonIds, exclude);
      return { ...r, counts: { 1: Math.min(r.counts[1], a[1]), 2: Math.min(r.counts[2], a[2]), 3: Math.min(r.counts[3], a[3]) } };
    });
    onMatrix({ ...matrix, exclude, rows });
  };

  return (
    <div className="room-rules">
      <fieldset className="room-mode">
        <legend>Cách phát đề</legend>
        <label className={mode === 'rieng' ? 'is-on' : ''}>
          <input type="radio" name="room-mode" checked={mode === 'rieng'} onChange={() => onMode('rieng')} />
          <span><b>Mỗi em một đề riêng</b><small>Cùng quy tắc bên dưới, khác câu. Cô xem và sửa được đề của từng em.</small></span>
        </label>
        <label className={mode === 'chung' ? 'is-on' : ''}>
          <input type="radio" name="room-mode" checked={mode === 'chung'} onChange={() => onMode('chung')} />
          <span><b>Cả lớp chung một đề</b><small>Cô duyệt, sửa một đề; mỗi em chỉ đảo thứ tự câu và phương án.</small></span>
        </label>
      </fieldset>

      {onByDang && (
        <label className={`room-dang${byDang ? ' is-on' : ''}`}>
          <input type="checkbox" checked={!!byDang} onChange={(e) => onByDang(e.target.checked)} />
          <span>
            <b>Xếp đề theo dạng, dễ → khó</b>
            <small>Như đề thi Tiếng Việt trực tuyến: {([1, 2, 3, 4] as Stage[]).map((s) => `${STAGE_NAME[s]} ~${Math.round(STAGE_MIX[s] * 100)}%`).join(' → ')}. Trong mỗi dạng, câu mức 1 trước, mức 3 sau. Số câu và thời gian cô vẫn tự đặt (vd. 30 câu / 30 phút).</small>
          </span>
        </label>
      )}

      <label className="adm-field room-ratio"><span>Tỉ lệ gợi ý (Mức 1 · Mức 2 · Mức 3, %)</span>
        <select value={ratio} onChange={(e) => onRatio(e.target.value)}>
          {RATIOS.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          {ratio === 'tu-chinh' && <option value="tu-chinh">Cô tự chỉnh từng ô</option>}
        </select>
      </label>

      <div className="table-scroll">
        <table className="roster-table exam-matrix">
          <thead>
            <tr><th>Chủ đề</th>{MUCS.map((k) => <th key={k}>{MUC_NAME[k]}</th>)}<th>Tổng</th></tr>
            <tr className="exam-points"><th>Điểm mỗi câu</th>{MUCS.map((k) => (
              <th key={k}><input type="number" step={0.25} min={0.25} max={10} value={matrix.points[k]} aria-label={`Điểm mỗi câu ${MUC_NAME[k]}`} onChange={(e) => setPoint(k, Number(e.target.value))} /></th>
            ))}<th /></tr>
          </thead>
          <tbody>
            {matrix.rows.map((r, ri) => (
              <tr key={r.unitCode}>
                <td className="exam-unit">{r.unitTitle}<span>{r.lessonIds.length} bài</span></td>
                {MUCS.map((k) => (
                  <td key={k}>
                    <input type="number" min={0} max={avail[ri]?.[k] ?? 0} value={r.counts[k]} aria-label={`Số câu ${MUC_NAME[k]} – ${r.unitTitle}`} onChange={(e) => setCount(ri, k, Number(e.target.value))} />
                    <span className="exam-avail">có {avail[ri]?.[k] ?? 0}</span>
                  </td>
                ))}
                <td>{MUCS.reduce((a, k) => a + r.counts[k], 0)} câu</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th>Tổng</th>{MUCS.map((k) => <td key={k}>{t.byMuc[k]} câu · {Math.round(t.byMuc[k] * matrix.points[k] * 100) / 100} đ</td>)}<td><strong>{t.questions} câu · {t.score} đ</strong></td></tr>
          </tfoot>
        </table>
      </div>
      <p className="dash-muted">
        Điểm của em được quy về thang 10 theo điểm từng câu ({t.score} đ = 10 điểm), làm tròn 0,5. “có …” là số câu ngân hàng còn cho ô đó
        {mode === 'rieng' && nStudents > 1 ? ' — ô có ít câu thì các em dễ trùng câu nhau.' : '.'}
      </p>
      <ul className="exam-muc-legend">
        {MUCS.map((k) => <li key={k}><span className={`exam-muc m${k}`}>M{k}</span> <strong>{MUC_NAME[k]}:</strong> {MUC_DESC[k]}</li>)}
      </ul>
      {outcomes.length > 0 && (
        <details className="exam-outcomes">
          <summary>Lọc theo yêu cầu cần đạt ({outcomes.length - (matrix.exclude?.length ?? 0)}/{outcomes.length} đang dùng)</summary>
          <p className="dash-muted">Bỏ chọn yêu cầu cần đạt không muốn kiểm tra; số câu “có” ở bảng cập nhật theo.</p>
          <ul>
            {outcomes.map((o) => (
              <li key={o.code}><label><input type="checkbox" checked={!(matrix.exclude ?? []).includes(o.code)} onChange={(e) => toggleOutcome(o.code, e.target.checked)} /> {o.text} <span className="exam-avail">{o.n} câu</span></label></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
