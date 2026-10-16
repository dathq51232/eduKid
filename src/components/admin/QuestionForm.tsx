'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from 'lucide-react';
import { switchType, validateDraft } from '@/lib/admin/questions';
import { TYPE_LABEL, type CatalogForm, type CatalogOutcome, type QuestionDraft } from '@/lib/admin/types';
import { LEVEL_LABEL } from '@/lib/curriculum/grade1';
import { LEVELS, LEVEL_LIST, defaultTimeLimit, type Level } from '@/lib/levels';
import { QUESTION_TYPES, type DbQuestionType } from '@/lib/types';
import QuestionPreview from './QuestionPreview';

type Props = {
  initial: QuestionDraft;
  forms: CatalogForm[]; // dạng bài của môn
  outcomes: CatalogOutcome[]; // YCCĐ được phép chọn (của bài, hoặc cả môn nếu bài chưa gắn)
  saving: boolean;
  serverError: string;
  onSave: (draft: QuestionDraft) => void;
  onCancel: () => void;
};

const MAX_ITEMS = 8;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

export default function QuestionForm({ initial, forms, outcomes, saving, serverError, onSave, onCancel }: Props) {
  const [d, setD] = useState<QuestionDraft>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const set = (patch: Partial<QuestionDraft>) => setD((prev) => ({ ...prev, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateDraft(d);
    setErrors(errs);
    if (errs.length === 0) onSave(d);
  };

  // ---- Các khối nhập theo loại câu ----
  const optionsEditor = (multi: boolean) => (
    <fieldset className="adm-fieldset">
      <legend>Các lựa chọn — {multi ? 'tích vào TẤT CẢ đáp án đúng' : 'chọn 1 đáp án đúng'}</legend>
      {d.options.map((opt, i) => {
        const isCorrect = multi ? d.correctMany.includes(opt) && opt.trim() !== '' : d.correct === opt && opt.trim() !== '';
        return (
          <div key={i} className={`adm-option${isCorrect ? ' is-correct' : ''}`}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              name="correct"
              checked={isCorrect}
              disabled={!opt.trim()}
              aria-label={`Lựa chọn ${i + 1} là đáp án đúng`}
              onChange={(e) => {
                if (multi) set({ correctMany: e.target.checked ? [...d.correctMany, opt] : d.correctMany.filter((c) => c !== opt) });
                else set({ correct: opt });
              }}
            />
            <span className="adm-option-key" aria-hidden="true">{'ABCDEFGH'[i]}</span>
            <input
              value={opt}
              maxLength={200}
              placeholder={`Lựa chọn ${'ABCDEFGH'[i]}`}
              aria-label={`Lựa chọn ${'ABCDEFGH'[i]}`}
              onChange={(e) => {
                const value = e.target.value;
                const options = d.options.map((o, j) => (j === i ? value : o));
                // Đổi chữ trong ô thì đáp án đúng đi theo
                const follows = opt.trim() !== ''; // ô đang trống thì chưa thể là đáp án đúng
                set({
                  options,
                  correct: follows && d.correct === opt ? value : d.correct,
                  correctMany: follows ? d.correctMany.map((c) => (c === opt ? value : c)) : d.correctMany,
                });
              }}
            />
            <button
              type="button"
              className="adm-icon"
              aria-label={`Xóa lựa chọn ${'ABCDEFGH'[i]}`}
              disabled={d.options.length <= 2}
              onClick={() =>
                set({
                  options: d.options.filter((_, j) => j !== i),
                  correct: d.correct === opt ? '' : d.correct,
                  correctMany: d.correctMany.filter((c) => c !== opt),
                })
              }
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      {d.options.length < MAX_ITEMS && (
        <button type="button" className="adm-btn is-ghost" onClick={() => set({ options: [...d.options, ''] })}>
          <Plus size={16} aria-hidden="true" /> Thêm lựa chọn
        </button>
      )}
    </fieldset>
  );

  const listEditor = (
    label: string,
    items: string[],
    key: 'accepted' | 'order',
    placeholder: string,
    ordered: boolean,
  ) => (
    <fieldset className="adm-fieldset">
      <legend>{label}</legend>
      {items.map((item, i) => (
        <div key={i} className="adm-option">
          <span className="adm-option-key" aria-hidden="true">{i + 1}</span>
          <input
            value={item}
            maxLength={200}
            placeholder={placeholder}
            aria-label={`${placeholder} ${i + 1}`}
            onChange={(e) => set({ [key]: items.map((x, j) => (j === i ? e.target.value : x)) } as Partial<QuestionDraft>)}
          />
          {ordered && (
            <>
              <button type="button" className="adm-icon" aria-label="Đưa lên" disabled={i === 0} onClick={() => set({ [key]: move(items, i, i - 1) } as Partial<QuestionDraft>)}>
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button type="button" className="adm-icon" aria-label="Đưa xuống" disabled={i === items.length - 1} onClick={() => set({ [key]: move(items, i, i + 1) } as Partial<QuestionDraft>)}>
                <ArrowDown size={16} aria-hidden="true" />
              </button>
            </>
          )}
          <button type="button" className="adm-icon" aria-label="Xóa" disabled={items.length <= 1} onClick={() => set({ [key]: items.filter((_, j) => j !== i) } as Partial<QuestionDraft>)}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      {items.length < MAX_ITEMS && (
        <button type="button" className="adm-btn is-ghost" onClick={() => set({ [key]: [...items, ''] } as Partial<QuestionDraft>)}>
          <Plus size={16} aria-hidden="true" /> Thêm
        </button>
      )}
    </fieldset>
  );

  const pairsEditor = (
    <fieldset className="adm-fieldset">
      <legend>Các cặp ghép đúng (học sinh sẽ thấy hai cột đã đảo thứ tự)</legend>
      {d.pairs.map((p, i) => (
        <div key={i} className="adm-option adm-pair">
          <span className="adm-option-key" aria-hidden="true">{i + 1}</span>
          <input value={p.left} maxLength={200} placeholder="Vế trái" aria-label={`Vế trái cặp ${i + 1}`} onChange={(e) => set({ pairs: d.pairs.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)) })} />
          <span aria-hidden="true">=</span>
          <input value={p.right} maxLength={200} placeholder="Vế phải" aria-label={`Vế phải cặp ${i + 1}`} onChange={(e) => set({ pairs: d.pairs.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)) })} />
          <button type="button" className="adm-icon" aria-label="Xóa cặp" disabled={d.pairs.length <= 2} onClick={() => set({ pairs: d.pairs.filter((_, j) => j !== i) })}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      {d.pairs.length < MAX_ITEMS && (
        <button type="button" className="adm-btn is-ghost" onClick={() => set({ pairs: [...d.pairs, { left: '', right: '' }] })}>
          <Plus size={16} aria-hidden="true" /> Thêm cặp
        </button>
      )}
    </fieldset>
  );

  return (
    <form className="adm-qform" onSubmit={submit}>
      <div className="adm-type-pick" role="radiogroup" aria-label="Loại câu hỏi">
        {QUESTION_TYPES.map((t: DbQuestionType) => (
          <button key={t} type="button" role="radio" aria-checked={d.type === t} className="adm-chip" onClick={() => setD(switchType(d, t))}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="adm-grid">
        <label className="adm-field">
          <span>Dạng bài</span>
          <select
            value={d.formId ?? ''}
            onChange={(e) => {
              const form = forms.find((f) => f.id === e.target.value);
              // Câu mới: chọn dạng bài thì tự chuyển sang kiểu câu mặc định của dạng đó
              const base = form && !d.id && form.default_question_type !== d.type ? switchType(d, form.default_question_type) : d;
              setD({ ...base, formId: form?.id ?? null, skillCode: base.skillCode });
            }}
          >
            <option value="">— Chưa chọn —</option>
            {forms.filter((f) => f.status === 'active' || f.id === d.formId).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>Yêu cầu cần đạt</span>
          <select value={d.outcomeId ?? ''} onChange={(e) => set({ outcomeId: e.target.value || null })}>
            <option value="">— Chưa chọn —</option>
            {outcomes.map((o) => (
              <option key={o.id} value={o.id} title={o.description}>
                {o.code} — {o.description.length > 70 ? o.description.slice(0, 70) + '…' : o.description}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="adm-field">
        <span>Đề bài</span>
        <textarea rows={3} maxLength={1000} value={d.prompt} onChange={(e) => set({ prompt: e.target.value })} placeholder="Ví dụ: Bé có 4 quả táo, mẹ cho thêm 3 quả. Bé có tất cả mấy quả?" />
      </label>

      {d.type === 'single_choice' && optionsEditor(false)}
      {d.type === 'multiple_choice' && optionsEditor(true)}
      {d.type === 'true_false' && (
        <fieldset className="adm-fieldset">
          <legend>Đáp án đúng</legend>
          <div className="adm-tf">
            {['Đúng', 'Sai'].map((v) => (
              <label key={v} className={`adm-chip${d.correct === v ? ' is-on' : ''}`}>
                <input type="radio" name="tf" checked={d.correct === v} onChange={() => set({ correct: v })} /> {v}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {d.type === 'fill_blank' && listEditor('Các đáp án được chấp nhận (không phân biệt hoa thường, khoảng trắng thừa)', d.accepted, 'accepted', 'Đáp án', false)}
      {d.type === 'ordering' && listEditor('Các mục theo THỨ TỰ ĐÚNG (học sinh sẽ thấy bị đảo)', d.order, 'order', 'Mục', true)}
      {d.type === 'matching' && pairsEditor}

      <label className="adm-field">
        <span>Nhận xét ngắn (hiện ngay khi học sinh trả lời)</span>
        <textarea rows={2} maxLength={1000} value={d.explanation} onChange={(e) => set({ explanation: e.target.value })} placeholder="Tối đa 2 câu, giọng nhẹ nhàng." />
      </label>
      <label className="adm-field">
        <span>Lời giải chi tiết (học sinh bấm “Xem lời giải”)</span>
        <textarea rows={3} maxLength={2000} value={d.solution} onChange={(e) => set({ solution: e.target.value })} placeholder="Ví dụ: Bước 1: Bắt đầu từ 4. Bước 2: Đếm thêm 3: 5, 6, 7. Vậy 4 + 3 = 7." />
      </label>

      <div className="adm-grid">
        <label className="adm-field">
          <span>Kỹ năng (mã)</span>
          <input value={d.skillCode} maxLength={60} onChange={(e) => set({ skillCode: e.target.value.toLowerCase() })} placeholder="cong_10" />
        </label>
        <label className="adm-field">
          <span>Cấp độ</span>
          <select value={d.difficulty} onChange={(e) => set({ difficulty: Number(e.target.value) as Level })}>
            {LEVEL_LIST.map((lv) => <option key={lv} value={lv}>{LEVEL_LABEL[lv]} — {LEVELS[lv].describe}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span>Thời gian mỗi câu (giây)</span>
          <input
            type="number"
            min={10}
            max={300}
            step={5}
            value={d.timeLimit ?? ''}
            placeholder={`Tự động: ${defaultTimeLimit(d.type, d.difficulty, d.prompt.trim())}`}
            onChange={(e) => set({ timeLimit: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </label>
      </div>

      {(errors.length > 0 || serverError) && (
        <div className="adm-alert is-error" role="alert">
          <ul>
            {errors.map((e) => <li key={e}>{e}</li>)}
            {serverError && <li>{serverError}</li>}
          </ul>
        </div>
      )}

      <div className="adm-actions">
        <button type="button" className="adm-btn" onClick={() => setPreview(true)}>
          <Eye size={16} aria-hidden="true" /> Xem thử
        </button>
        <span className="adm-spacer" />
        <button type="button" className="adm-btn is-ghost" onClick={onCancel} disabled={saving}>Hủy</button>
        <button type="submit" className="adm-btn is-primary" disabled={saving}>{saving ? 'Đang lưu...' : d.id ? 'Lưu thay đổi' : 'Thêm câu hỏi'}</button>
      </div>

      {preview && <QuestionPreview draft={d} onClose={() => setPreview(false)} />}
    </form>
  );
}
