'use client';

import { useState } from 'react';
import { ChevronRight, ListChecks } from 'lucide-react';
import EmojiText from '@/components/EmojiText';

/**
 * Lời giải của Milo: từ 3 dòng trở lên thì mở TỪNG BƯỚC (em đọc bước 1, thử nghĩ bước tiếp rồi mới bấm),
 * ít hơn thì hiện cả đoạn như cũ. Đặt `key` theo mã câu để mỗi câu bắt đầu lại từ bước 1.
 */
export default function SolutionSteps({ text }: { text: string }) {
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const [shown, setShown] = useState(1);
  if (lines.length < 3) return <p className="solution-text"><EmojiText text={text} /></p>;
  const done = shown >= lines.length;
  return (
    <div className="solution-steps-wrap">
      <ol className="solution-steps" aria-live="polite">
        {lines.slice(0, shown).map((line, i) => (
          <li key={i} className="solution-step">
            <span className="solution-step-no" aria-hidden="true">{i + 1}</span>
            <span><EmojiText text={line} /></span>
          </li>
        ))}
      </ol>
      {!done && (
        <div className="solution-steps-actions">
          <p className="solution-steps-hint">Em thử nghĩ bước tiếp theo trước khi bấm nhé!</p>
          <button type="button" className="button button-yellow" onClick={() => setShown((n) => n + 1)}>
            Bước tiếp theo ({shown + 1}/{lines.length}) <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="button button-white" onClick={() => setShown(lines.length)}>
            <ListChecks size={18} aria-hidden="true" /> Xem hết
          </button>
        </div>
      )}
    </div>
  );
}
