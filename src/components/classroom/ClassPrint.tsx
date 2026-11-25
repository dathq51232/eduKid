'use client';

// "In theo lớp" trong Văn bản & in ấn: dùng danh sách học sinh có sẵn để in nhanh — danh sách lớp, nhãn vở, thẻ tên để bàn,
// trộn thư (một mẫu → mỗi em một phiếu) — kèm lối tắt tới các mục in khác của lớp. Mọi xử lý trên máy, không gửi đi đâu.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, IdCard, ListChecks, Mails, PenLine, Printer, Tags, Users } from 'lucide-react';
import { RbBtn, RbGroup } from '@/components/classroom/PageEditor';
import { TOOLS, toolHref, type ToolKey } from '@/lib/classroom/teacher-nav';
import {
  LABEL_STYLES, MERGE_FIELDS, MERGE_PRESETS, ROSTER_KINDS, labelsHtml, mergeHtml, rosterHtml, tentHtml,
  type Ctx, type LabelStyle, type Printable, type Pupil, type RosterKind,
} from '@/lib/vanban/class-print';
import '@/styles/cpr.css';

type Mode = 'ds' | 'nhan' | 'the' | 'tron';
const MODES: { id: Mode; label: string; hint: string; Icon: typeof ListChecks }[] = [
  { id: 'ds', label: 'Danh sách lớp', hint: 'Điểm danh, ký nhận, nộp tiền', Icon: ListChecks },
  { id: 'tron', label: 'Trộn thư', hint: 'Mỗi em một giấy mời / phiếu', Icon: Mails },
  { id: 'nhan', label: 'Nhãn vở', hint: 'In giấy decal A4, 10 nhãn/tờ', Icon: Tags },
  { id: 'the', label: 'Thẻ tên để bàn', hint: 'Gấp đôi, dựng trên bàn', Icon: IdCard },
];
/** Các mục khác trong lớp có nút in — lối tắt để thầy cô khỏi phải nhớ nằm ở đâu */
/** "Toán, Tiếng Việt" → ['Toán', 'Tiếng Việt'] (tối đa 12) */
const list = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 12);
const ELSEWHERE: ToolKey[] = ['phieu-bai-tap', 'phieu-chinh-ta', 'de-kiem-tra', 'ke-hoach', 'luyen-chu', 'nhan-xet', 'phieu-tien-bo', 'thu-khen', 'hop-ph'];

export default function ClassPrint({ classId, students, ctx, onPrint, onWord, onEdit }: {
  classId: string;
  students: Pupil[];
  ctx: Ctx;
  onPrint: (p: Printable) => void;
  /** Xuất Word (chỉ danh sách lớp và trộn thư — nhãn, thẻ cần bố cục chính xác nên chỉ In / PDF) */
  onWord: (p: Printable, file: string, title: string) => void;
  /** Mở bản in trong trình soạn (thẻ Mở file & in) để sửa trực tiếp như Word */
  onEdit: (p: Printable, file: string, title: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('ds');
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const chosen = useMemo(() => students.filter((s) => !skip.has(s.id)), [students, skip]);
  const now = new Date(ctx.date || Date.now());

  // danh sách lớp
  const [rKind, setRKind] = useState<RosterKind>('diem-danh');
  const [rTitle, setRTitle] = useState(ROSTER_KINDS[0].title);
  const [rCols, setRCols] = useState(ROSTER_KINDS[0].cols);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [weekends, setWeekends] = useState(false);
  // nhãn vở / thẻ tên
  const [subjects, setSubjects] = useState('Toán, Tiếng Việt, Tiếng Anh');
  const [copies, setCopies] = useState(4);
  const [style, setStyle] = useState<LabelStyle>('xanh');
  // trộn thư
  const [preset, setPreset] = useState(MERGE_PRESETS[0].id);
  const [mTitle, setMTitle] = useState(MERGE_PRESETS[0].title);
  const [mBody, setMBody] = useState(MERGE_PRESETS[0].body);
  const [perPage, setPerPage] = useState<1 | 2>(2);

  const pickRoster = (k: RosterKind) => {
    const r = ROSTER_KINDS.find((x) => x.id === k) ?? ROSTER_KINDS[0];
    setRKind(k); setRTitle(r.title); setRCols(r.cols);
  };
  const pickPreset = (id: string) => {
    const p = MERGE_PRESETS.find((x) => x.id === id) ?? MERGE_PRESETS[0];
    if (mBody.trim() && mBody !== MERGE_PRESETS.find((x) => x.id === preset)?.body && !window.confirm('Thay nội dung đang soạn bằng mẫu mới?')) return;
    setPreset(id); setMTitle(p.title); setMBody(p.body);
  };

  const out: Printable = useMemo(() => {
    if (mode === 'ds') return rosterHtml({ kind: rKind, title: rTitle, cols: list(rCols), month, year, weekends, students: chosen, ctx });
    if (mode === 'nhan') return labelsHtml({ students: chosen, subjects: list(subjects), copies, style, ctx });
    if (mode === 'the') return tentHtml({ students: chosen, ctx, style });
    return mergeHtml({ title: mTitle, body: mBody, students: chosen, ctx, perPage });
  }, [mode, rKind, rTitle, rCols, month, year, weekends, chosen, ctx, subjects, copies, style, mTitle, mBody, perPage]);
  // preview chỉ vẽ vài em đầu cho nhẹ (danh sách lớp thì vẽ đủ)
  const preview = useMemo(() => {
    if (mode === 'ds') return out;
    const few = chosen.slice(0, mode === 'nhan' ? 3 : 2);
    if (mode === 'nhan') return labelsHtml({ students: few, subjects: list(subjects), copies, style, ctx });
    if (mode === 'the') return tentHtml({ students: few.slice(0, 1), ctx, style });
    return mergeHtml({ title: mTitle, body: mBody, students: few, ctx, perPage });
  }, [mode, out, chosen, subjects, copies, style, ctx, mTitle, mBody, perPage]);

  /** Bản dạng Word (danh sách, trộn thư) — dùng cho Tải Word và Sửa trên trang */
  const wordOut = (): [Printable, string, string] | null => {
    if (mode === 'ds') return [out, `danh-sach-${rKind}-lop-${ctx.className}`, rTitle];
    if (mode === 'tron') return [mergeHtml({ title: mTitle, body: mBody, students: chosen, ctx, perPage: 1, forWord: true }), `${preset}-lop-${ctx.className}`, mTitle];
    return null;
  };
  const word = () => { const w = wordOut(); if (w) onWord(...w); };
  const edit = () => { const w = wordOut(); if (w) onEdit(...w); };
  const count = mode === 'nhan' ? chosen.length * (list(subjects).length || Math.max(1, copies)) : chosen.length;
  const sheets = mode === 'nhan' ? Math.ceil(count / 10) : mode === 'tron' ? Math.ceil(count / perPage) : mode === 'the' ? count : 0;
  const others = TOOLS.filter((t) => ELSEWHERE.includes(t.key));

  if (!students.length) {
    return (
      <div className="dash-card cpr-empty">
        <Users aria-hidden="true" />
        <p>Lớp chưa có học sinh. Thêm học sinh ở <Link href={`/giao-vien/lop/${classId}`}>Học sinh & mã lớp</Link> rồi quay lại để in danh sách, nhãn vở, giấy mời.</p>
      </div>
    );
  }

  return (
    <div className="cpr">
      <div className="cpr-modes" role="radiogroup" aria-label="Chọn loại cần in">
        {MODES.map(({ id, label, hint, Icon }) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} className={`cpr-mode${mode === id ? ' is-on' : ''}`} onClick={() => setMode(id)}>
            <Icon aria-hidden="true" /><b>{label}</b><small>{hint}</small>
          </button>
        ))}
      </div>

      <div className="vbe-ribbon vbe-ribbon-lite">
        <div className="vbe-rbody">
          <RbGroup label="Tệp">
            <RbBtn primary icon={<Printer aria-hidden="true" />} label="In / PDF" onClick={() => onPrint(out)} disabled={!chosen.length} />
            {(mode === 'ds' || mode === 'tron') && <RbBtn icon={<FileText aria-hidden="true" />} label="Tải Word" onClick={word} disabled={!chosen.length} />}
          </RbGroup>
          {(mode === 'ds' || mode === 'tron') && (
            <RbGroup label="Soạn tiếp">
              <RbBtn icon={<PenLine aria-hidden="true" />} label="Sửa trên trang & cấu hình in" onClick={edit} disabled={!chosen.length} />
            </RbGroup>
          )}
        </div>
        <p className="cpr-count">{chosen.length}/{students.length} em{sheets ? ` · khoảng ${sheets} tờ A4` : ''}</p>
      </div>

      <div className="vb-grid">
        <section className="dash-card cpr-form">
          {mode === 'ds' && (
            <>
              <div className="vb-kinds" role="radiogroup" aria-label="Mẫu danh sách">
                {ROSTER_KINDS.map((k) => <button key={k.id} type="button" role="radio" aria-checked={rKind === k.id} className={rKind === k.id ? 'is-on' : ''} title={k.hint} onClick={() => pickRoster(k.id)}>{k.label}</button>)}
              </div>
              <div className="vb-fields">
                <label className="vb-wide">Tiêu đề<input value={rTitle} maxLength={120} onChange={(e) => setRTitle(e.target.value)} /></label>
                {rKind === 'diem-danh' ? (
                  <>
                    <label>Tháng<select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}</select></label>
                    <label>Năm<input type="number" value={year} min={2020} max={2100} onChange={(e) => setYear(Number(e.target.value) || year)} /></label>
                    <label className="cpr-check vb-wide"><input type="checkbox" checked={weekends} onChange={(e) => setWeekends(e.target.checked)} /> Có cả thứ Bảy, Chủ nhật</label>
                  </>
                ) : (
                  <label className="vb-wide">Các cột sau “Họ và tên” <small>(cách nhau dấu phẩy, tối đa 12)</small><input value={rCols} maxLength={300} onChange={(e) => setRCols(e.target.value)} /></label>
                )}
              </div>
            </>
          )}

          {mode === 'nhan' && (
            <div className="vb-fields">
              <label className="vb-wide">Môn (mỗi môn một nhãn cho mỗi em) <small>(để trống = nhãn chung có dòng “Vở: …”)</small><input value={subjects} maxLength={200} onChange={(e) => setSubjects(e.target.value)} /></label>
              {!list(subjects).length && <label>Số nhãn mỗi em<input type="number" min={1} max={20} value={copies} onChange={(e) => setCopies(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} /></label>}
              <StylePick value={style} onChange={setStyle} />
            </div>
          )}

          {mode === 'the' && (
            <div className="vb-fields">
              <p className="dash-muted vb-wide">Mỗi em một tờ A4 ngang. Gấp đôi theo đường nét đứt ở giữa để dựng trên bàn; tên hiện ở cả hai mặt.</p>
              <StylePick value={style} onChange={setStyle} />
            </div>
          )}

          {mode === 'tron' && (
            <>
              <div className="vb-kinds" role="radiogroup" aria-label="Mẫu có sẵn">
                {MERGE_PRESETS.map((p) => <button key={p.id} type="button" role="radio" aria-checked={preset === p.id} className={preset === p.id ? 'is-on' : ''} onClick={() => pickPreset(p.id)}>{p.label}</button>)}
              </div>
              <div className="vb-fields">
                <label className="vb-wide">Tiêu đề<input value={mTitle} maxLength={80} onChange={(e) => setMTitle(e.target.value)} /></label>
                <label className="vb-wide">Nội dung <small>(mỗi dòng một đoạn; sửa các chỗ [ … ])</small><textarea rows={9} value={mBody} maxLength={4000} onChange={(e) => setMBody(e.target.value)} /></label>
              </div>
              <p className="cpr-fields">Ô tự điền: {MERGE_FIELDS.map((f) => (
                <button key={f.key} type="button" title={f.label} onClick={() => setMBody((b) => `${b}{${f.key}}`)}>{`{${f.key}}`}</button>
              ))}</p>
              <div className="cpr-seg" role="radiogroup" aria-label="Số phiếu mỗi tờ">
                <button type="button" role="radio" aria-checked={perPage === 2} className={perPage === 2 ? 'is-on' : ''} onClick={() => setPerPage(2)}>2 phiếu / tờ A4 (tiết kiệm)</button>
                <button type="button" role="radio" aria-checked={perPage === 1} className={perPage === 1 ? 'is-on' : ''} onClick={() => setPerPage(1)}>1 phiếu / tờ</button>
              </div>
              {/\[[^\]]*\]/.test(mBody) && <p className="adm-alert">Còn chỗ <b>[ … ]</b> chưa điền trong nội dung.</p>}
            </>
          )}

          <details className="vb-org cpr-pick">
            <summary>Học sinh được in: <b>{chosen.length === students.length ? `cả lớp (${students.length} em)` : `${chosen.length}/${students.length} em`}</b> <small className="vb-edit-link">Chọn</small></summary>
            <div className="cpr-pick-bar">
              <button type="button" className="btn btn-sm" onClick={() => setSkip(new Set())}>Chọn tất cả</button>
              <button type="button" className="btn btn-sm" onClick={() => setSkip(new Set(students.map((s) => s.id)))}>Bỏ chọn tất cả</button>
            </div>
            <div className="cpr-pick-list">
              {students.map((s, i) => (
                <label key={s.id}><input type="checkbox" checked={!skip.has(s.id)} onChange={(e) => setSkip((x) => { const n = new Set(x); if (e.target.checked) n.delete(s.id); else n.add(s.id); return n; })} /> {i + 1}. {s.name}</label>
              ))}
            </div>
          </details>
          {!ctx.unit && <p className="dash-muted">Mẹo: điền <b>Tên đơn vị</b> ở thẻ “Soạn văn bản” (một lần) để tên trường hiện trên giấy in.</p>}
        </section>

        <section className="vb-paper-wrap" aria-label="Xem trước bản in">
          <div className={`cpr-prev${preview.landscape ? ' is-land' : ''}`} dangerouslySetInnerHTML={{ __html: preview.html }} />
          {mode !== 'ds' && chosen.length > (mode === 'nhan' ? 3 : 2) && <p className="dash-muted cpr-more">Xem trước vài em đầu — bấm In / PDF để in đủ {chosen.length} em.</p>}
        </section>
      </div>

      <section className="dash-card cpr-else">
        <h2>In ở mục khác của lớp</h2>
        <div className="cpr-else-grid">
          {others.map((t) => (
            <Link key={t.key} href={toolHref(t, classId)} className="cpr-else-item"><b>{t.label}</b><small>{t.desc}</small><ArrowRight aria-hidden="true" /></Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StylePick({ value, onChange }: { value: LabelStyle; onChange: (s: LabelStyle) => void }) {
  return (
    <div className="cpr-colors vb-wide" role="radiogroup" aria-label="Màu">
      {LABEL_STYLES.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={value === s.id} className={value === s.id ? 'is-on' : ''} onClick={() => onChange(s.id)}>
          <i style={{ background: s.color }} aria-hidden="true" /> {s.label}
        </button>
      ))}
    </div>
  );
}
