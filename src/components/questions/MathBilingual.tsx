'use client';
// Toán song ngữ: bật lên thì dưới đề hiện bản dịch tiếng Anh cả đề (khi đề có quy tắc dịch — xem docs/QUY-TAC-SONG-NGU.md),
// nếu chưa có thì hiện phép tính đọc bằng tiếng Anh; kèm số, từ vựng Toán Anh – Việt và nút nghe giọng Anh. Bật / tắt lưu trên máy em (dùng chung mọi bài Toán).
import { useEffect, useMemo, useState } from 'react';
import { Languages, Volume2 } from 'lucide-react';
import { englishSpeech, mathEnglishFor } from '@/lib/math-english';
import { speakSegments, stopSpeaking } from '@/lib/speech';
import '@/styles/qz.css';

const KEY = 'educhain-math-bilingual-v1';

type Props = { prompt: string; blanks?: string[] };

export default function MathBilingual({ prompt, blanks }: Props) {
  const [on, setOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    try { setOn(localStorage.getItem(KEY) === '1'); } catch { /* bộ nhớ bị chặn: mặc định tắt */ }
  }, []);
  // đổi câu thì dừng đọc
  useEffect(() => () => { stopSpeaking(); setSpeaking(false); }, [prompt]);

  const me = useMemo(() => mathEnglishFor(prompt, blanks), [prompt, blanks]);
  const say = englishSpeech(me);
  const hasAny = Boolean(say);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* bỏ qua */ }
    if (!next) { stopSpeaking(); setSpeaking(false); }
  };

  const listen = async () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const r = await speakSegments([{ text: say, lang: 'en' }], { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
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
