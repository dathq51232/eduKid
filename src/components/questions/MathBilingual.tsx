'use client';
// Toán song ngữ: bật lên thì dưới đề hiện bản dịch tiếng Anh cả đề (khi đề có quy tắc dịch — xem docs/QUY-TAC-SONG-NGU.md),
// nếu chưa có thì hiện phép tính đọc bằng tiếng Anh; kèm đáp án tiếng Anh (lựa chọn, dòng điền ô, nhận định, vế ghép),
// số, từ vựng Toán Anh – Việt và nút nghe giọng Anh. Bật / tắt lưu trên máy em (dùng chung mọi bài Toán).
import { useEffect, useMemo, useState } from 'react';
import { Languages, Volume2 } from 'lucide-react';
import { englishSpeech, mathEnglishFor } from '@/lib/math-english';
import { translateAnswers } from '@/lib/math-translate';
import { speakSegments, stopSpeaking } from '@/lib/speech';
import '@/styles/qz.css';

const KEY = 'educhain-math-bilingual-v1';

type Props = { prompt: string; blanks?: string[]; options?: string[]; leftItems?: string[]; statements?: string[] };

const HAS_WORD = /\p{L}{2,}/u;

/** Cặp Việt → Anh cho một nhóm đáp án; chỉ giữ đáp án có chữ (số thuần giữ nguyên nên không cần hiện).
 *  Nhóm có đáp án chưa dịch được thì bỏ cả nhóm (không hiện nửa Việt nửa Anh). */
function answerPairs(list?: string[]): { vi: string; en: string }[] {
  const items = (list ?? []).filter((x) => HAS_WORD.test(x));
  const en = translateAnswers(items);
  if (!en) return [];
  return items.map((vi, i) => ({ vi: vi.replace(/\{\}/g, '…'), en: en[i] })).filter((p) => p.en && p.en !== p.vi);
}

export default function MathBilingual({ prompt, blanks, options, leftItems, statements }: Props) {
  const [on, setOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    try { setOn(localStorage.getItem(KEY) === '1'); } catch { /* bộ nhớ bị chặn: mặc định tắt */ }
  }, []);
  // đổi câu thì dừng đọc
  useEffect(() => () => { stopSpeaking(); setSpeaking(false); }, [prompt]);

  const me = useMemo(() => mathEnglishFor(prompt, blanks), [prompt, blanks]);
  const answers = useMemo(
    () => [...answerPairs(leftItems), ...answerPairs(options), ...answerPairs(statements), ...answerPairs(blanks)],
    [leftItems, options, statements, blanks],
  );
  const say = englishSpeech(me);
  const hasAny = Boolean(say) || answers.length > 0;

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* bỏ qua */ }
    if (!next) { stopSpeaking(); setSpeaking(false); }
  };

  const listen = async () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    // đọc đề rồi đọc các đáp án (bỏ dòng điền ô có "?" — đọc lên khó hiểu)
    const text = [say, ...answers.filter((a) => !a.en.includes('?')).map((a) => a.en)].filter(Boolean).join('. ');
    const r = await speakSegments([{ text, lang: 'en' }], { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
    if (!r.ok) setSpeaking(false);
  };

  return (
    <div className={`qz-bi${on ? ' is-on' : ''}`}>
      <button type="button" className="qz-bi-toggle" aria-pressed={on} onClick={toggle}>
        <Languages aria-hidden="true" /> Song ngữ <span lang="en">English</span>
        <span className="qz-bi-switch" aria-hidden="true" />
      </button>
      {on && (
        <section className="qz-bi-panel" aria-label="Toán bằng tiếng Anh">
          {!hasAny ? (
            <p className="qz-bi-empty">Câu này chưa có phép tính hay số để đọc bằng tiếng Anh.</p>
          ) : (
            <>
              <div className="qz-bi-say" lang="en">
                {me.sentence ? (
                  <p className="qz-bi-sentence">{me.sentence}</p>
                ) : (
                  <>
                    {me.instruction && <p className="qz-bi-ins">{me.instruction}</p>}
                    {me.expressions.map((e) => (
                      <p key={e.math} className="qz-bi-expr"><span className="qz-bi-math" lang="vi">{e.math}</span> {e.en}</p>
                    ))}
                  </>
                )}
              </div>
              {answers.length > 0 && (
                <div className="qz-bi-ans">
                  <p className="qz-bi-ans-title">Đáp án bằng tiếng Anh</p>
                  <ul aria-label="Đáp án Việt – Anh">
                    {answers.map((a, i) => (
                      <li key={`${i}-${a.vi}`}><span lang="vi">{a.vi}</span> <b lang="en">{a.en}</b></li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="button" className="qz-bi-listen" onClick={listen}>
                <Volume2 aria-hidden="true" /> {speaking ? 'Dừng' : 'Nghe tiếng Anh'}
              </button>
              {(me.numbers.length > 0 || me.operators.length > 0 || me.terms.length > 0) && (
                <ul className="qz-bi-words" aria-label="Từ vựng Toán Anh – Việt">
                  {me.numbers.map((x) => <li key={`n${x.n}`}><b>{x.n}</b> <span lang="en">{x.en}</span></li>)}
                  {me.operators.map((x) => <li key={`o${x.sign}`} className="is-op"><b>{x.sign}</b> <span lang="en">{x.en}</span></li>)}
                  {me.terms.map((x) => <li key={`t${x.vi}`} className="is-term"><b>{x.vi}</b> <span lang="en">{x.en}</span></li>)}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
