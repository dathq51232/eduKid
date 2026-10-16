'use client';

import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { csvToDrafts, type CsvItem } from '@/lib/admin/csv';
import { describeAnswer } from '@/lib/admin/questions';
import { TYPE_LABEL, type CatalogForm, type CatalogOutcome, type QuestionDraft } from '@/lib/admin/types';

type Props = {
  forms: CatalogForm[];
  outcomes: CatalogOutcome[];
  onImport: (drafts: QuestionDraft[]) => Promise<{ ok: number; failed: { index: number; message: string }[] }>;
  onClose: () => void;
};

export default function CsvImport({ forms, outcomes, onImport, onClose }: Props) {
  const parse = (t: string) => csvToDrafts(t, { forms, outcomes });
  const [text, setText] = useState('');
  const [items, setItems] = useState<CsvItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState('');

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setItems(parse(content));
    setReport('');
  };

  const valid = items?.filter((i) => i.errors.length === 0) ?? [];

  const run = async () => {
    setBusy(true);
    const res = await onImport(valid.map((i) => i.draft));
    setBusy(false);
    const failText = res.failed.map((f) => `dòng ${valid[f.index].line}: ${f.message}`).join('; ');
    setReport(`Đã thêm ${res.ok} câu.${res.failed.length ? ` Lỗi ${res.failed.length} câu — ${failText}` : ''}`);
    if (res.failed.length === 0) {
      setItems(null);
      setText('');
    }
  };

  return (
    <section className="adm-card adm-csv">
      <div className="adm-card-head">
        <h2>Nhập câu hỏi từ CSV</h2>
        <button type="button" className="adm-btn is-ghost" onClick={onClose}>Đóng</button>
      </div>
      <p className="adm-muted">
        Dùng đúng mẫu cột trong docs/soan-cau-hoi.md (có hoặc không có dòng tiêu đề). Các cột môn/lớp/tên bài được bỏ qua — mọi câu vào bài đang mở, ở trạng thái nháp.
        Cột form_code (mã dạng bài), outcome_code (mã YCCĐ) lấy ở trang Chương trình; cột solution là lời giải chi tiết.
      </p>
      <div className="adm-actions">
        <label className="adm-btn">
          <FileUp size={16} aria-hidden="true" /> Chọn file .csv
          <input type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => readFile(e.target.files?.[0])} />
        </label>
        <span className="adm-muted">hoặc dán nội dung vào ô dưới</span>
      </div>
      <textarea
        className="adm-code"
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setItems(null);
        }}
        placeholder={'"toan","1","Kết nối tri thức","1","Phép cộng","single_choice","5 + 2 = ?","3","6","7","8","7","Đếm thêm 2 từ 5.","1","cong_10"'}
        aria-label="Nội dung CSV"
      />
      <div className="adm-actions">
        <button type="button" className="adm-btn" disabled={!text.trim()} onClick={() => { setItems(parse(text)); setReport(''); }}>Kiểm tra dữ liệu</button>
        {items && (
          <button type="button" className="adm-btn is-primary" disabled={busy || valid.length === 0} onClick={run}>
            {busy ? 'Đang nhập...' : `Nhập ${valid.length} câu hợp lệ`}
          </button>
        )}
      </div>
      {report && <p className="adm-alert is-info" role="status">{report}</p>}

      {items && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Dòng</th>
                <th scope="col">Loại</th>
                <th scope="col">Đề bài</th>
                <th scope="col">Đáp án</th>
                <th scope="col">Dạng bài · YCCĐ</th>
                <th scope="col">Kiểm tra</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.line} className={i.errors.length ? 'is-bad' : ''}>
                  <td>{i.line}</td>
                  <td>{TYPE_LABEL[i.draft.type]}</td>
                  <td>{i.draft.prompt}</td>
                  <td>{describeAnswer(i.draft)}</td>
                  <td className="adm-muted">
                    {forms.find((f) => f.id === i.draft.formId)?.name ?? '—'} · {outcomes.find((o) => o.id === i.draft.outcomeId)?.code ?? '—'}
                  </td>
                  <td>{i.errors.length ? i.errors.join(' ') : 'Hợp lệ'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
