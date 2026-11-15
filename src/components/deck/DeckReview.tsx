'use client';

// Trang góp ý của đồng nghiệp (tổ chuyên môn): xem bài thao giảng từng trang (chỉ xem) + góp ý cho trang đang xem.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Send, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { normalizeDeck, type Deck } from '@/lib/deck/types';
import { addComment, deleteComment, reviewError, timeAgo, type DeckComment } from '@/lib/deck/review';
import SlideView, { SlideFrame } from './SlideView';

type Info = { deckId: string; deck: Deck; owner: string; isOwner: boolean };

export default function DeckReview({ token }: { token: string }) {
  const sb = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [info, setInfo] = useState<Info | null | 'none'>(null);
  const [list, setList] = useState<DeckComment[]>([]);
  const [cur, setCur] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const loadComments = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.rpc('deck_review_comments', { p_token: token });
    if (error) { setErr(reviewError(error)); return; }
    setList((data ?? []) as DeckComment[]);
  }, [sb, token]);

  useEffect(() => {
    if (!sb) return;
    let live = true;
    void (async () => {
      const { data, error } = await sb.rpc('deck_review_get', { p_token: token });
      if (!live) return;
      if (error) { setErr(reviewError(error)); setInfo('none'); return; }
      const row = (data as { deck_id: string; title: string; data: unknown; owner_name: string; is_owner: boolean }[] | null)?.[0];
      if (!row) { setInfo('none'); return; }
      setInfo({ deckId: row.deck_id, deck: normalizeDeck(row.data, row.title), owner: row.owner_name, isOwner: row.is_owner });
      void loadComments();
    })();
    return () => { live = false; };
  }, [sb, token, loadComments]);

  const deck = info && info !== 'none' ? info.deck : null;
  const n = deck?.slides.length ?? 0;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest?.('textarea, input')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setCur((c) => Math.min(n - 1, c + 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setCur((c) => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [n]);

  if (info === null) return <p className="dash-muted">Đang mở bài…</p>;
  if (info === 'none' || !deck) return (
    <section className="dash-card"><h1>Không mở được bài</h1><p className="dash-muted">{err || 'Link góp ý không đúng hoặc cô soạn bài đã tắt link. Thầy cô nhờ người soạn gửi lại link mới.'}</p></section>
  );

  const slide = deck.slides[Math.min(cur, n - 1)];
  const mine = list.filter((c) => c.slide_id === slide.id);
  const count = (id: string) => list.filter((c) => c.slide_id === id && !c.resolved).length;
  const send = async () => {
    const b = text.trim(); if (!sb || !b) return;
    setBusy(true); setErr('');
    try { await addComment(sb, info.deckId, slide.id, b, token); setText(''); await loadComments(); } catch (e) { setErr(reviewError(e)); } finally { setBusy(false); }
  };
  const del = async (c: DeckComment) => {
    if (!sb || !window.confirm('Xoá góp ý của thầy cô?')) return;
    try { await deleteComment(sb, c.id); setList((l) => l.filter((x) => x.id !== c.id)); } catch (e) { setErr(reviewError(e)); }
  };

  return (
    <div className="rvw">
      <header className="rvw-head">
        <div><h1>{deck.title}</h1><p className="dash-muted">Bài của {info.owner} · Lớp {deck.grade} · {n} trang{info.isOwner ? ' · (đây là bài của thầy cô — xem như đồng nghiệp)' : ''}</p></div>
        <span className="rvw-badge"><MessageSquare aria-hidden="true" /> {list.filter((c) => !c.resolved).length} góp ý chưa sửa</span>
      </header>
      <div className="rvw-main">
        <section className="rvw-stage" aria-label={`Trang ${cur + 1}`}>
          <SlideFrame className="rvw-frame">{(k) => <SlideView slide={slide} mode="thumb" scale={k} />}</SlideFrame>
          <div className="rvw-nav">
            <button type="button" className="btn btn-outline" disabled={cur === 0} onClick={() => setCur(cur - 1)}><ChevronLeft aria-hidden="true" /> Trang trước</button>
            <b>Trang {cur + 1} / {n}{slide.phase ? ` · ${slide.phase}` : ''}</b>
            <button type="button" className="btn btn-outline" disabled={cur >= n - 1} onClick={() => setCur(cur + 1)}>Trang sau <ChevronRight aria-hidden="true" /></button>
          </div>
          {slide.notes?.trim() && <p className="rvw-notes"><b>Ghi chú của người soạn:</b> {slide.notes}</p>}
        </section>
        <aside className="rvw-side" aria-label="Góp ý cho trang này">
          <h2>Góp ý trang {cur + 1}</h2>
          {!mine.length && <p className="dash-muted">Trang này chưa có góp ý.</p>}
          {mine.map((c) => (
            <article key={c.id} className={`dkc-c${c.resolved ? ' is-done' : ''}${c.mine ? ' is-mine' : ''}`}>
              <header><b>{c.mine ? 'Thầy cô' : c.author_name}</b><time dateTime={c.created_at}>{timeAgo(c.created_at)}</time></header>
              <p>{c.body}</p>
              {(c.resolved || c.mine) && <footer>{c.resolved && <span className="dkc-done">✓ Người soạn đã sửa</span>}{c.mine && <button type="button" className="is-del" onClick={() => void del(c)} aria-label="Xoá góp ý"><Trash2 aria-hidden="true" /></button>}</footer>}
            </article>
          ))}
          {err && <p className="dk-msg is-error" role="alert">{err}</p>}
          <div className="dkc-new">
            <textarea value={text} maxLength={1000} rows={4} placeholder="Góp ý cho trang này: nội dung, chữ, hình, hoạt động…" onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} aria-label={`Góp ý cho trang ${cur + 1}`} />
            <button type="button" className="btn btn-primary" disabled={busy || !text.trim()} onClick={() => void send()}><Send aria-hidden="true" /> Gửi góp ý</button>
          </div>
        </aside>
      </div>
      <nav className="rvw-strip" aria-label="Các trang">
        {deck.slides.map((s, i) => (
          <button key={s.id} type="button" className={i === cur ? 'is-on' : ''} aria-current={i === cur} aria-label={`Trang ${i + 1}`} onClick={() => setCur(i)}>
            <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} />}</SlideFrame>
            <span className="cv-th-n">{i + 1}</span>
            {count(s.id) > 0 && <span className="cv-th-cmt"><MessageSquare aria-hidden="true" />{count(s.id)}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
