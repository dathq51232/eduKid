'use client';

// Kế hoạch bài dạy › Bổ sung giáo án cũ: thầy cô mở giáo án Word (.docx) đang có, app GIỮ NGUYÊN giáo án,
// chỉ chèn thêm vào cuối từng hoạt động: tích hợp năng lực số, hỗ trợ học sinh hoà nhập, phân hoá;
// đổi luôn chữ phông cũ (.VnTime / VNI) sang Unicode nếu có. Tải về thành file mới "… (bổ sung)". Xử lý trên máy, không gửi đi đâu.
import { useRef, useState } from 'react';
import { CheckCircle2, FileDown, FileUp, Sparkles, X } from 'lucide-react';
import { augmentDocx, type AugmentResult } from '@/lib/plans/augment';
import { AUGMENT_LABEL, type AugmentKind } from '@/lib/plans/augment-bank';
import { downloadDocx } from '@/lib/doc-download';
import '@/styles/kh.css';

type Item = { name: string; res?: AugmentResult; error?: string };
const ACT_NAME = { 'khoi-dong': 'Khởi động', 'kham-pha': 'Khám phá', 'luyen-tap': 'Luyện tập', 'van-dung': 'Vận dụng' } as const;
const SUBJ_NAME: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const outName = (n: string) => `${n.replace(/\.docx$/i, '')} (bo sung)`;

export default function PlanAugment() {
  const [kinds, setKinds] = useState<AugmentKind[]>(['nls', 'hoa-nhap']);
  const [fixLegacy, setFixLegacy] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const files = useRef<File[]>([]);

  const toggle = (k: AugmentKind) => setKinds((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));

  /** Bổ sung lại toàn bộ file đã chọn (khi đổi tuỳ chọn cũng chạy lại) */
  const run = async (list: File[], ks = kinds, fx = fixLegacy) => {
    if (!ks.length) { setItems(list.map((f) => ({ name: f.name, error: 'Chọn ít nhất một nội dung cần bổ sung.' }))); return; }
    setBusy(true);
    const out: Item[] = [];
    for (const f of list) {
      if (!/\.docx$/i.test(f.name)) { out.push({ name: f.name, error: 'Chỉ mở được file Word .docx (file .doc: mở bằng Word rồi “Lưu thành” .docx).' }); continue; }
      try {
        const res = await augmentDocx(await f.arrayBuffer(), { kinds: ks, fixLegacy: fx, fileName: f.name });
        out.push(res.activities.length ? { name: f.name, res } : { name: f.name, res, error: 'Không tìm thấy tiêu đề hoạt động (Khởi động, Khám phá, Luyện tập, Vận dụng…) trong file này.' });
      } catch (e) {
        out.push({ name: f.name, error: e instanceof Error ? e.message : 'Không đọc được file.' });
      }
    }
    setItems(out);
    setOpen(out.findIndex((x) => x.res?.activities.length));
    setBusy(false);
  };
  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    files.current = [...list].slice(0, 20);
    void run(files.current);
  };
  const setOpt = (ks: AugmentKind[], fx: boolean) => { if (files.current.length) void run(files.current, ks, fx); };

  return (
    <section className="dash-section planner-card kh-aug" aria-label="Bổ sung giáo án cũ">
      <div className="kh-aug-opts">
        <p className="kh-aug-k">Chèn thêm vào cuối từng hoạt động</p>
        {(['nls', 'hoa-nhap', 'phan-hoa'] as AugmentKind[]).map((k) => (
          <label key={k} className="kh-aug-opt">
            <input type="checkbox" checked={kinds.includes(k)} onChange={() => { const ks = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k]; toggle(k); setOpt(ks, fixLegacy); }} />
            <span><b>{AUGMENT_LABEL[k]}</b><small>{k === 'nls' ? 'Theo các miền của Khung năng lực số (TT 02/2025/TT-BGDĐT), mức tiểu học' : k === 'hoa-nhap' ? 'Cách hỗ trợ học sinh khuyết tật học hoà nhập trong hoạt động' : 'Việc cho em cần hỗ trợ / em hoàn thành tốt'}</small></span>
          </label>
        ))}
        <label className="kh-aug-opt">
          <input type="checkbox" checked={fixLegacy} onChange={(e) => { setFixLegacy(e.target.checked); setOpt(kinds, e.target.checked); }} />
          <span><b>Đổi chữ phông cũ sang Unicode</b><small>Giáo án gõ phông .VnTime / VNI (“Gi¸o ¸n”, “Giaùo aùn”) → chữ chuẩn, phông Times New Roman</small></span>
        </label>
      </div>

      <div className="kh-aug-drop">
        <input ref={input} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}><FileUp aria-hidden="true" /> {busy ? 'Đang bổ sung…' : 'Mở giáo án Word (.docx)'}</button>
        <p className="dash-muted">Chọn một hoặc nhiều file (tối đa 20). Giáo án của thầy cô được <b>giữ nguyên</b>; app chỉ thêm các dòng in nghiêng có dấu “*” vào cuối từng hoạt động và lưu thành file mới. File xử lý ngay trên máy, không gửi đi đâu.</p>
      </div>

      {items.length > 0 && (
        <ul className="kh-aug-list">
          {items.map((it, i) => (
            <li key={`${it.name}-${i}`} className={it.error ? 'is-error' : ''}>
              <div className="kh-aug-row">
                <span className="kh-aug-name">{it.error ? <X aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />} <b>{it.name}</b>
                  <small>{it.error ?? `${it.res!.activities.length} hoạt động được bổ sung${it.res!.subject && SUBJ_NAME[it.res!.subject] ? ` · môn ${SUBJ_NAME[it.res!.subject]}` : ''}${it.res!.legacyRuns ? ` · đổi ${it.res!.legacyRuns} đoạn chữ phông cũ` : ''}`}</small>
                </span>
                {it.res && it.res.activities.length > 0 && (
                  <span className="kh-aug-act">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(open === i ? null : i)}><Sparkles aria-hidden="true" /> {open === i ? 'Ẩn' : 'Xem phần thêm'}</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadDocx(outName(it.name), it.res!.bytes)}><FileDown aria-hidden="true" /> Tải file (bổ sung)</button>
                  </span>
                )}
              </div>
              {open === i && it.res && (
                <ol className="kh-aug-acts">
                  {it.res.activities.map((a, k) => (
                    <li key={k}>
                      <p className="kh-aug-title"><span className={`kh-aug-tag is-${a.key}`}>{ACT_NAME[a.key]}</span> {a.title}</p>
                      {a.lines.map((l, j) => <p key={j} className="kh-aug-line"><b>* {l.label}:</b> {l.text}</p>)}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="dash-muted kh-aug-note">Các dòng thêm là gợi ý chung cho mọi bài — thầy cô đọc lại, sửa cho đúng bài và lớp mình trước khi nộp. Nhận được tiêu đề hoạt động kiểu “1. Khởi động”, “Hoạt động 2: Khám phá”, “HĐ3. Luyện tập”, kể cả khi soạn trong bảng hai cột GV | HS.</p>
    </section>
  );
}
