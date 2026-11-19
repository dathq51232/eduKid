'use client';
// Luyện gõ 10 ngón (nhóm kỹ năng Sử dụng máy tính): chọn bài theo hàng phím, gõ theo dòng mẫu,
// bàn phím minh hoạ tô màu theo ngón và sáng phím kế tiếp. Kết quả (độ chính xác, chữ/phút) tính khi gõ xong,
// kỷ lục mỗi bài lưu trên máy em.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, RotateCcw, Trophy } from 'lucide-react';
import '@/styles/kn.css';

type Lesson = { id: string; name: string; hint: string; lines: string[] };

const LESSONS: Lesson[] = [
  { id: 'co-so', name: 'Hàng cơ sở', hint: 'a s d f – j k l ;', lines: ['fff jjj fff jjj', 'ddd kkk sss lll', 'fj dk sl a; fj dk', 'asdf jkl; asdf jkl;', 'a sad lad; ask dad'] },
  { id: 'tren', name: 'Hàng trên', hint: 'q w e r t – y u i o p', lines: ['rrr uuu ttt yyy', 'eee iii www ooo', 'qwer uiop qwer uiop', 'we were here', 'your top toy'] },
  { id: 'duoi', name: 'Hàng dưới', hint: 'z x c v b – n m , .', lines: ['vvv mmm bbb nnn', 'ccc ,,, xxx ...', 'zxcv bnm, zxcv bnm.', 'a cab; a van; a man', 'mix and match.'] },
  { id: 'tieng-viet', name: 'Tiếng Việt không dấu', hint: 'từ quen thuộc, chưa cần gõ dấu', lines: ['ba me con', 'di hoc dung gio', 'em yeu truong lop', 'hoc vui moi ngay', 'con meo trong nha'] },
  { id: 'cau', name: 'Câu ngắn', hint: 'cả bàn phím, có dấu chấm, dấu phẩy', lines: ['i like my school.', 'the sun is hot, the sky is blue.', 'em gap sach vo gon gang.', 'milo the owl can read.'] },
];

// ngón tay phụ trách từng phím (bàn phím QWERTY)
const FINGER: Record<string, { id: string; name: string }> = {};
const set = (keys: string, id: string, name: string) => { for (const k of keys) FINGER[k] = { id, name }; };
set('qaz', 'lp', 'ngón út trái'); set('wsx', 'lr', 'ngón áp út trái'); set('edc', 'lm', 'ngón giữa trái'); set('rfvtgb', 'li', 'ngón trỏ trái');
set('yhnujm', 'ri', 'ngón trỏ phải'); set('ik,', 'rm', 'ngón giữa phải'); set('ol.', 'rr', 'ngón áp út phải'); set("p;/'", 'rp', 'ngón út phải');
FINGER[' '] = { id: 'th', name: 'ngón cái' };
const ROWS = ['qwertyuiop', "asdfghjkl;", 'zxcvbnm,./'];

const BEST_KEY = 'educhain-typing-best-v1';
type Best = Record<string, { wpm: number; acc: number }>;
const readBest = (): Best => { try { return JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}') as Best; } catch { return {}; } };

export default function TypingPractice() {
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ wpm: number; acc: number; record: boolean } | null>(null);
  const [best, setBest] = useState<Best>({});
  const inputRef = useRef<HTMLInputElement>(null);
  // thống kê cả bài (không cần hiển thị liên tục nên để trong ref, chỉ setState khi xong bài)
  const stats = useRef({ start: 0, keys: 0, wrong: 0, chars: 0 });

  const lesson = LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0];
  const target = lesson.lines[lineIdx] ?? '';
  const next = target[typed.length] ?? '';
  const finger = FINGER[next.toLowerCase()];

  useEffect(() => { setBest(readBest()); }, []);

  const reset = (id = lessonId) => {
    setLessonId(id); setLineIdx(0); setTyped(''); setResult(null);
    stats.current = { start: 0, keys: 0, wrong: 0, chars: 0 };
    inputRef.current?.focus();
  };

  const finishLesson = () => {
    const s = stats.current;
    const minutes = Math.max((Date.now() - s.start) / 60000, 1 / 60);
    const wpm = Math.round(s.chars / 5 / minutes);
    const acc = s.keys ? Math.round(((s.keys - s.wrong) / s.keys) * 100) : 100;
    const all = readBest();
    const prev = all[lesson.id];
    const record = !prev || acc > prev.acc || (acc === prev.acc && wpm > prev.wpm);
    if (record) {
      all[lesson.id] = { wpm, acc };
      try { localStorage.setItem(BEST_KEY, JSON.stringify(all)); } catch { /* bỏ qua */ }
      setBest(all);
    }
    setResult({ wpm, acc, record });
  };

  const onChange = (value: string) => {
    if (result) return;
    const s = stats.current;
    if (!s.start) s.start = Date.now();
    let line = lineIdx, prev = typed, rest = value;
    // gõ nhanh qua cuối dòng: phần gõ tràn chuyển sang dòng sau (dấu cách ngay sau cuối dòng được bỏ qua)
    for (;;) {
      const goal = lesson.lines[line];
      const v = rest.slice(0, goal.length);
      for (let i = prev.length; i < v.length; i++) { s.keys++; if (v[i] !== goal[i]) s.wrong++; }
      if (v !== goal) { setLineIdx(line); setTyped(v); return; }
      s.chars += goal.length + 1;
      if (line + 1 >= lesson.lines.length) { setLineIdx(line); setTyped(v); finishLesson(); return; }
      line++; prev = ''; rest = rest.slice(goal.length).replace(/^ /, '');
    }
  };

  const keyboard = useMemo(() => ROWS.map((row) => [...row]), []);

  return (
    <section className="kn-card kn-ty" aria-labelledby="kn-ty-title">
      <h2 id="kn-ty-title"><Keyboard aria-hidden="true" /> Luyện gõ ngay</h2>

      <div className="kn-ty-lessons" role="radiogroup" aria-label="Chọn bài luyện gõ">
        {LESSONS.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={l.id === lessonId} className="kn-ty-lesson" onClick={() => reset(l.id)}>
            <b>{l.name}</b>
            <small>{best[l.id] ? `Kỷ lục ${best[l.id].wpm} chữ/phút · ${best[l.id].acc}%` : l.hint}</small>
          </button>
        ))}
      </div>

      {result ? (
        <div className="kn-done kn-ty-done" role="status">
          <Trophy aria-hidden="true" className="kn-ty-cup" />
          <p className="kn-done-big">{result.acc}% đúng · {result.wpm} chữ/phút</p>
          <p>{result.acc >= 95 ? 'Tay em gõ rất chuẩn! Lần sau thử gõ nhanh hơn một chút nhé.' : 'Em gõ chậm lại một chút cho đúng hơn — đúng trước, nhanh sau.'}{result.record ? ' 🎉 Kỷ lục mới của em!' : ''}</p>
          <button type="button" className="kn-btn" onClick={() => reset()}><RotateCcw aria-hidden="true" /> Luyện lại bài này</button>
        </div>
      ) : (
        <>
          <p className="kn-step">Dòng {lineIdx + 1}/{lesson.lines.length}</p>
          <p className="kn-ty-target" aria-label={`Dòng cần gõ: ${target}`} onClick={() => inputRef.current?.focus()}>
            {[...target].map((ch, i) => {
              const cls = i < typed.length ? (typed[i] === ch ? 'is-ok' : 'is-bad') : i === typed.length ? 'is-cur' : '';
              return <span key={i} className={cls}>{ch === ' ' ? ' ' : ch}</span>;
            })}
          </p>
          <input
            ref={inputRef}
            className="kn-ty-input"
            value={typed}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Ô gõ chữ"
            placeholder="Bấm vào đây rồi gõ theo dòng trên…"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
          <p className="kn-ty-next" aria-live="polite">
            {next ? <>Phím tiếp theo: <kbd>{next === ' ' ? 'Space' : next}</kbd>{finger ? <> — dùng <b>{finger.name}</b></> : null}</> : 'Gõ đúng hết dòng để sang dòng mới.'}
            {typed && typed !== target.slice(0, typed.length) ? <span className="kn-ty-warn"> · Có chữ sai — bấm ⌫ để sửa</span> : null}
          </p>
          <div className="kn-ty-kb" aria-hidden="true">
            {keyboard.map((row, r) => (
              <div key={r} className={`kn-ty-row r${r}`}>
                {row.map((k) => (
                  <span key={k} className={`kn-ty-key f-${FINGER[k]?.id ?? 'x'}${k === next.toLowerCase() ? ' is-next' : ''}${k === 'f' || k === 'j' ? ' is-bump' : ''}`}>{k}</span>
                ))}
              </div>
            ))}
            <div className="kn-ty-row"><span className={`kn-ty-key kn-ty-space f-th${next === ' ' ? ' is-next' : ''}`}>Space</span></div>
          </div>
        </>
      )}
    </section>
  );
}
