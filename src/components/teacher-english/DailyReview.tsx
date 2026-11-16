'use client';

// Ôn mỗi ngày (Tiếng Anh sư phạm): thẻ lật từ vựng / mẫu câu theo lịch nhắc lại.
// Mỗi ngày: thẻ đến hạn + tối đa 10 thẻ mới. Lật thẻ (phím cách), tự chấm: Chưa nhớ (1) · Nhớ (2) · Dễ (3).
// Chiều thẻ: Anh → Việt (hiểu nghĩa) hoặc Việt → Anh (tự nói ra câu tiếng Anh — luyện cho lúc đứng lớp).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Cloud, HardDrive, PartyPopper, RotateCcw, Volume2 } from 'lucide-react';
import { speakSegments, stopSpeaking } from '@/lib/speech';
import {
  MASTERED_BOX, NEW_PER_DAY, addDays, nextGapLabel, todayQueue, todayVN, type Card, type Grade, type useReview,
} from '@/lib/teacher-english/review';
import '@/styles/adm.css';
import '@/styles/ct.css';
import '@/styles/rv.css';
import '@/styles/te.css';
import '@/styles/btn.css';
import '@/styles/dash.css';

type Review = ReturnType<typeof useReview>;
type Dir = 'en-vi' | 'vi-en';
const DIR_KEY = 'gv-ta-on-tap-chieu';
const KIND: Record<Card['kind'], string> = { vocab: 'Từ vựng', expr: 'Mẫu câu', phrase: 'Câu của tôi' };
const fmtDay = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

export default function DailyReview({ deck, review }: { deck: Card[]; review: Review }) {
  const { map, newToday, sync, grade } = review;
  const [dir, setDir] = useState<Dir>('en-vi');
  const [session, setSession] = useState<Card[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ again: 0, good: 0, easy: 0 });
  const [playing, setPlaying] = useState(false);

  useEffect(() => { try { const d = localStorage.getItem(DIR_KEY); if (d === 'en-vi' || d === 'vi-en') setDir(d); } catch { /* bỏ qua */ } }, []);
  useEffect(() => () => stopSpeaking(), []);
  const chooseDir = (d: Dir) => { setDir(d); try { localStorage.setItem(DIR_KEY, d); } catch { /* bỏ qua */ } };

  const today = todayVN();
  const { due, fresh, queue } = useMemo(() => todayQueue(deck, map, newToday, today), [deck, map, newToday, today]);
  const learning = deck.filter((c) => map[c.id] && map[c.id].box < MASTERED_BOX).length;
  const mastered = deck.filter((c) => map[c.id] && map[c.id].box >= MASTERED_BOX).length;
  const unseen = deck.filter((c) => !map[c.id]).length;
  const nextDue = useMemo(() => deck.map((c) => map[c.id]?.due).filter((d): d is string => !!d && d > today).sort()[0] ?? null, [deck, map, today]);
  const sources = useMemo(() => [...new Set(deck.map((c) => c.source))], [deck]);

  const card = session ? session[pos] ?? null : null;
  const done = !!session && pos >= session.length;

  const speak = useCallback((text: string) => {
    stopSpeaking(); setPlaying(true);
    void speakSegments([{ text, lang: 'en' }], { rate: 0.9, onEnd: () => setPlaying(false) }).then((r) => { if (!r.ok) setPlaying(false); });
  }, []);

  const start = () => { setSession(queue); setPos(0); setFlipped(false); setTally({ again: 0, good: 0, easy: 0 }); };
  const flip = useCallback(() => {
    setFlipped(true);
    // Việt → Anh: lật ra là đọc luôn câu tiếng Anh để cô so cách nói của mình
    if (card && dir === 'vi-en') speak(card.en);
  }, [card, dir, speak]);
  const answer = useCallback((g: Grade) => {
    if (!card || !session) return;
    grade(card.id, g);
    setTally((t) => ({ ...t, [g]: t[g] + 1 }));
    // Chưa nhớ: đưa thẻ xuống cuối buổi để gặp lại ngay hôm nay
    if (g === 'again') setSession([...session, card]);
    setPos((p) => p + 1); setFlipped(false); stopSpeaking(); setPlaying(false);
  }, [card, session, grade]);

  // Phím tắt: cách / Enter = lật, 1–3 = chấm
  useEffect(() => {
    if (!card) return;
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
      else if (flipped && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); answer((['again', 'good', 'easy'] as Grade[])[Number(e.key) - 1]); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [card, flipped, flip, answer]);

  /* ───────── Đang ôn ───────── */
  if (card && session) {
    const st = map[card.id];
    const front = dir === 'en-vi' ? card.en : card.vi;
    const back = dir === 'en-vi' ? card.vi : card.en;
    return (
      <section className="rv" aria-label="Ôn thẻ">
        <div className="rv-top">
          <button type="button" className="ct-link" onClick={() => { setSession(null); stopSpeaking(); }}>‹ Dừng ôn</button>
          <span className="rv-count">{pos + 1}/{session.length}</span>
        </div>
        <div className="rv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={session.length} aria-valuenow={pos}><i style={{ width: `${(pos / session.length) * 100}%` }} /></div>

        <div className={`rv-card${flipped ? ' is-flipped' : ''}`}>
          <p className="rv-tag">{KIND[card.kind]} · {card.source}{!st && <b className="rv-new">Mới</b>}</p>
          <p className={`rv-front${card.kind === 'vocab' ? ' is-word' : ''}`} lang={dir === 'en-vi' ? 'en' : 'vi'}>{front}</p>
          {dir === 'en-vi' && card.ipa && <p className="rv-ipa">{card.ipa}</p>}
          {dir === 'en-vi' && (
            <button type="button" className={`te-ic${playing ? ' is-on' : ''}`} onClick={() => speak(card.en)} aria-label={`Nghe: ${card.en}`} title="Nghe · Listen"><Volume2 aria-hidden="true" /></button>
          )}
          {!flipped ? (
            <>
              <p className="rv-hint">{dir === 'vi-en' ? 'Nói to câu tiếng Anh, rồi lật thẻ để so.' : 'Nhớ lại nghĩa, rồi lật thẻ để kiểm tra.'}</p>
              <button type="button" className="btn btn-primary rv-flip" onClick={flip}>Lật thẻ <kbd>Phím cách</kbd></button>
            </>
          ) : (
            <>
              <hr className="rv-sep" />
              <p className={`rv-back${dir === 'vi-en' && card.kind === 'vocab' ? ' is-word' : ''}`} lang={dir === 'en-vi' ? 'vi' : 'en'}>{back}</p>
              {dir === 'vi-en' && card.ipa && <p className="rv-ipa">{card.ipa}</p>}
              {dir === 'vi-en' && (
                <button type="button" className={`te-ic${playing ? ' is-on' : ''}`} onClick={() => speak(card.en)} aria-label={`Nghe lại: ${card.en}`} title="Nghe lại"><Volume2 aria-hidden="true" /></button>
              )}
            </>
          )}
        </div>

        {flipped && (
          <div className="rv-grades" role="group" aria-label="Cô nhớ thẻ này thế nào?">
            {([['again', 'Chưa nhớ', '1'], ['good', 'Nhớ', '2'], ['easy', 'Dễ', '3']] as [Grade, string, string][]).map(([g, label, key]) => (
              <button key={g} type="button" className={`rv-g is-${g}`} onClick={() => answer(g)}>
                <b>{label}</b><small>{nextGapLabel(st, g)}</small><kbd>{key}</kbd>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  /* ───────── Tổng quan / xong buổi ───────── */
  return (
    <section className="rv" aria-labelledby="rv-h">
      {done && (
        <div className="rv-done" role="status">
          <PartyPopper aria-hidden="true" />
          <div>
            <h2>Xong buổi ôn!</h2>
            <p>Nhớ {tally.good + tally.easy} lượt · Chưa nhớ {tally.again} lượt. Thẻ chưa nhớ sẽ gặp lại vào ngày mai.</p>
          </div>
        </div>
      )}
      <div className="rv-head">
        <div>
          <h2 id="rv-h">Ôn mỗi ngày <span lang="en">· Daily review</span></h2>
          <p className="dash-muted">Mỗi ngày 5–10 phút. Thẻ nhớ tốt sẽ lâu mới gặp lại (1 → 3 → 7 → 14 → 30 ngày…), thẻ hay quên sẽ gặp lại sớm. Thẻ lấy từ các bài cô đã bắt đầu học và <b>Câu của tôi</b>.</p>
        </div>
        <span className={`te-sync is-${sync}`} title={sync === 'cloud' ? 'Lịch ôn lưu vào tài khoản' : 'Chưa bật lưu trên tài khoản (migration 0060): tạm lưu trên máy này'}>
          {sync === 'cloud' ? <Cloud aria-hidden="true" /> : <HardDrive aria-hidden="true" />}
          {sync === 'loading' ? 'Đang tải…' : sync === 'cloud' ? 'Đã đồng bộ' : 'Lưu trên máy'}
        </span>
      </div>

      <ul className="rv-stats">
        <li className="is-due"><b>{due.length}</b><span>Đến hạn hôm nay</span></li>
        <li className="is-new"><b>{fresh.length}</b><span>Thẻ mới hôm nay <small>(tối đa {NEW_PER_DAY})</small></span></li>
        <li><b>{learning}</b><span>Đang học</span></li>
        <li className="is-ok"><b>{mastered}</b><span>Đã thuộc</span></li>
      </ul>

      <div className="rv-dir" role="radiogroup" aria-label="Chiều thẻ">
        <span><ArrowLeftRight aria-hidden="true" /> Chiều thẻ:</span>
        <button type="button" role="radio" aria-checked={dir === 'en-vi'} onClick={() => chooseDir('en-vi')}>Anh → Việt <small>hiểu nghĩa</small></button>
        <button type="button" role="radio" aria-checked={dir === 'vi-en'} onClick={() => chooseDir('vi-en')}>Việt → Anh <small>tự nói ra câu</small></button>
      </div>

      {queue.length > 0 ? (
        <button type="button" className="btn btn-primary rv-start" onClick={start}>
          {done ? <RotateCcw aria-hidden="true" /> : null} {done ? 'Ôn tiếp' : 'Bắt đầu ôn'} · {queue.length} thẻ
        </button>
      ) : (
        <p className="adm-alert is-ok rv-empty">🎉 Hôm nay đã ôn xong.{nextDue ? ` Lần ôn tới: ngày ${fmtDay(nextDue)}${nextDue === addDays(today, 1) ? ' (mai)' : ''}.` : ''}{unseen ? ` Còn ${unseen} thẻ mới, mai sẽ mở thêm.` : ''}</p>
      )}

      <p className="dash-muted rv-src">Bộ thẻ: {deck.length} thẻ từ {sources.join(', ')}. Học thêm bài mới ở <b>Lộ trình</b> hoặc đánh dấu ★ ở <b>Ngân hàng mẫu câu</b> để có thêm thẻ.</p>
    </section>
  );
}
