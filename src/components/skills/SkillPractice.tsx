'use client';
// Luyện một kỹ năng: tình huống "Em sẽ làm gì?" (chọn → giải thích ngay) + thử thách ở nhà (đánh dấu đã làm, lưu trên máy).
import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import type { Scenario } from '@/lib/skills/hub';

const DONE_KEY = 'educhain-skill-missions-v1';

export default function SkillPractice({ skillKey, scenarios, mission }: { skillKey: string; scenarios: Scenario[]; mission: string }) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const finished = i >= scenarios.length;
  const sc = scenarios[Math.min(i, scenarios.length - 1)];

  useEffect(() => {
    try { setMissionDone(((JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')) as string[]).includes(skillKey)); } catch { /* bộ nhớ bị chặn: vẫn dùng được */ }
  }, [skillKey]);
  const toggleMission = () => {
    const next = !missionDone;
    setMissionDone(next);
    try {
      const list = new Set((JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')) as string[]);
      if (next) list.add(skillKey); else list.delete(skillKey);
      localStorage.setItem(DONE_KEY, JSON.stringify([...list]));
    } catch { /* bỏ qua */ }
  };
  const choose = (k: number) => {
    if (pick !== null) return;
    setPick(k);
    if (k === sc.a) setRight((r) => r + 1);
  };
  const next = () => { setPick(null); setI((v) => v + 1); };
  const again = () => { setPick(null); setI(0); setRight(0); };

  return (
    <>
      <section className="kn-card kn-play" aria-labelledby="kn-play">
        <div className="kn-play-head">
          <h2 id="kn-play"><Sparkles aria-hidden="true" /> Em sẽ làm gì?</h2>
          <span className="kn-step">{finished ? 'Hoàn thành' : `Tình huống ${i + 1}/${scenarios.length}`}</span>
        </div>
        {finished ? (
          <div className="kn-done">
            <p className="kn-done-big">{right === scenarios.length ? '🌟 Tuyệt vời!' : right >= scenarios.length - 1 ? '👏 Giỏi lắm!' : '💪 Cố lên nhé!'}</p>
            <p>Em chọn đúng <b>{right}/{scenarios.length}</b> tình huống.</p>
            <button type="button" className="kn-btn is-ghost" onClick={again}><RotateCcw aria-hidden="true" /> Làm lại</button>
          </div>
        ) : (
          <>
            <p className="kn-q">{sc.q}</p>
            <div className="kn-opts">
              {sc.opts.map((o, k) => {
                const state = pick === null ? '' : k === sc.a ? ' is-right' : k === pick ? ' is-wrong' : ' is-dim';
                return (
                  <button key={o} type="button" className={`kn-opt${state}`} onClick={() => choose(k)} disabled={pick !== null} aria-pressed={pick === k}>
                    <span className="kn-opt-l">{'ABC'[k]}</span><span>{o}</span>
                    {pick !== null && k === sc.a && <CheckCircle2 aria-hidden="true" className="kn-opt-ic" />}
                    {pick !== null && k === pick && k !== sc.a && <XCircle aria-hidden="true" className="kn-opt-ic" />}
                  </button>
                );
              })}
            </div>
            {pick !== null && (
              <div className={`kn-why${pick === sc.a ? ' is-right' : ''}`} role="status">
                <b>{pick === sc.a ? 'Đúng rồi!' : 'Chưa đúng — cùng xem nhé:'}</b> {sc.why}
                <button type="button" className="kn-btn" onClick={next}>{i + 1 < scenarios.length ? 'Tình huống tiếp' : 'Xem kết quả'}</button>
              </div>
            )}
          </>
        )}
      </section>

      <section className={`kn-card kn-mission${missionDone ? ' is-done' : ''}`} aria-labelledby="kn-mission">
        <h2 id="kn-mission">🏠 Thử thách tuần này</h2>
        <p>{mission}</p>
        <button type="button" className={`kn-btn${missionDone ? ' is-ghost' : ''}`} onClick={toggleMission} aria-pressed={missionDone}>
          {missionDone ? <><CheckCircle2 aria-hidden="true" /> Em đã làm (bấm để bỏ)</> : 'Em đã làm xong thử thách'}
        </button>
      </section>
    </>
  );
}
