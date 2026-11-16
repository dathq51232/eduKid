'use client';

// 🎨 Hộp màu: chạm một thẻ rồi chạm vào hộp để xếp thẻ vào hộp (chạm thẻ đã xếp để lấy ra). Không cần kéo thả — dùng tốt trên cảm ứng.
// Dữ liệu: leftItems = các thẻ, options = tên các hộp; câu trả lời { thẻ: hộp } (chấm như ghép cặp).
import { useMemo, useState } from 'react';
import EmojiText from '@/components/EmojiText';
import { shuffle } from '@/lib/shuffle';
import type { AnswerValue, Question } from '@/lib/types';
import '@/styles/qgroup.css';
import '@/styles/question.css';

type Props = { question: Question; answer: AnswerValue; onAnswerChange: (value: AnswerValue) => void; isSubmitted: boolean; isCorrect: boolean };

const BOX_TONE = ['is-blue', 'is-coral', 'is-green', 'is-purple'];

export default function GroupingQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const placed = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const cards = useMemo(() => shuffle(question.leftItems ?? [], `${question.id}-g`), [question.id, question.leftItems]);
  const boxes = question.options;
  const [active, setActive] = useState<string | null>(null);
  const loose = cards.filter((c) => !placed[c]);

  const pickCard = (c: string) => {
    if (isSubmitted) return;
    if (placed[c]) { // lấy thẻ ra khỏi hộp
      const next = { ...placed }; delete next[c];
      onAnswerChange(Object.keys(next).length ? next : null);
      setActive(c);
      return;
    }
    setActive(active === c ? null : c);
  };
  const dropTo = (box: string) => {
    if (isSubmitted || !active) return;
    onAnswerChange({ ...placed, [active]: box });
    setActive(null);
  };

  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';
  return (
    <>
      <p className="question-hint">Chạm một thẻ, rồi chạm vào hộp đúng. Đã xếp {Object.keys(placed).length}/{cards.length} thẻ.</p>
      <div className={`qg-board${state}`}>
        <ul className="qg-tray" aria-label="Thẻ chưa xếp">
          {loose.map((c) => (
            <li key={c}>
              <button type="button" className={`qg-card${active === c ? ' is-active' : ''}`} aria-pressed={active === c} disabled={isSubmitted} onClick={() => pickCard(c)}>
                <EmojiText text={c} />
              </button>
            </li>
          ))}
          {loose.length === 0 && !isSubmitted && <li className="qg-done">Đã xếp hết thẻ — bấm <b>Kiểm tra</b> nhé!</li>}
        </ul>
        <div className="qg-boxes" style={{ gridTemplateColumns: `repeat(${Math.min(boxes.length, 3)}, minmax(0, 1fr))` }}>
          {boxes.map((b, i) => {
            const inside = cards.filter((c) => placed[c] === b);
            return (
              <section key={b} className={`qg-box ${BOX_TONE[i % BOX_TONE.length]}${active ? ' is-target' : ''}`}>
                <button type="button" className="qg-box-head" disabled={isSubmitted || !active} onClick={() => dropTo(b)} aria-label={active ? `Xếp “${active}” vào hộp ${b}` : `Hộp ${b}`}>
                  <EmojiText text={b} />
                </button>
                <ul className="qg-in" aria-label={`Trong hộp ${b}`}>
                  {inside.map((c) => (
                    <li key={c}><button type="button" className="qg-card is-in" disabled={isSubmitted} onClick={() => pickCard(c)} title="Chạm để lấy ra"><EmojiText text={c} /></button></li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
