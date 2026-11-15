'use client';

// Bảng "Góp ý" trong trình soạn bài giảng (kiểu bình luận Canva): bật link cho tổ chuyên môn, đọc góp ý theo trang,
// trả lời, đánh dấu Đã sửa, xoá. Dữ liệu: bảng slide_deck_comments (migration 0061).
import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Check, Copy, Link2, MessageSquare, RotateCcw, Send, Trash2 } from 'lucide-react';
import type { Slide } from '@/lib/deck/types';
import { addComment, deleteComment, ownerComments, reviewError, reviewHref, reviewToken, setResolved, setReviewLink, timeAgo, type DeckComment } from '@/lib/deck/review';

export default function DeckComments({ sb, deckId, slides, cur, onGo, onCount }: {
  sb: SupabaseClient | null; deckId: string; slides: Slide[]; cur: number; onGo: (i: number) => void; onCount?: (byslide: Record<string, number>) => void;
}) {
  const [list, setList] = useState<DeckComment[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [scope, setScope] = useState<'page' | 'all'>('all');
  const [hideDone, setHideDone] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const slideId = slides[cur]?.id ?? '';

  const load = useCallback(async () => {
    if (!sb) return;
    try { const [l, t] = await Promise.all([ownerComments(sb, deckId), reviewToken(sb, deckId)]); setList(l); setToken(t); setErr(''); }
    catch (e) { setList([]); setErr(reviewError(e)); }
  }, [sb, deckId]);
  useEffect(() => { void load(); }, [load]);
  // góp ý mới của đồng nghiệp: tải lại mỗi khi quay lại thẻ trình duyệt
  useEffect(() => { const f = () => { if (document.visibilityState === 'visible') void load(); }; document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, [load]);
  useEffect(() => {
    if (!list || !onCount) return;
    const m: Record<string, number> = {};
    for (const c of list) if (!c.resolved) m[c.slide_id] = (m[c.slide_id] ?? 0) + 1;
    onCount(m);
  }, [list, onCount]);

  const url = token && typeof window !== 'undefined' ? `${window.location.origin}${reviewHref(token)}` : '';
  const toggleLink = async (on: boolean) => {
    if (!sb) return;
    if (!on && !window.confirm('Tắt link góp ý? Đồng nghiệp sẽ không mở được bài nữa (góp ý cũ vẫn giữ). Bật lại sẽ dùng link cũ.')) return;
    setBusy(true);
    try { setToken(await setReviewLink(sb, deckId, on)); setErr(''); } catch (e) { setErr(reviewError(e)); } finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { window.prompt('Chép link góp ý:', url); } };
  const send = async () => {
    const b = text.trim(); if (!sb || !b || !slideId) return;
    setBusy(true);
    try { await addComment(sb, deckId, slideId, b); setText(''); await load(); } catch (e) { setErr(reviewError(e)); } finally { setBusy(false); }
  };
  const resolve = async (c: DeckComment) => {
    if (!sb) return;
    setList((l) => l?.map((x) => (x.id === c.id ? { ...x, resolved: !c.resolved } : x)) ?? l);
    try { await setResolved(sb, c.id, !c.resolved); } catch (e) { setErr(reviewError(e)); setList((l) => l?.map((x) => (x.id === c.id ? c : x)) ?? l); }
  };
  const del = async (c: DeckComment) => {
    if (!sb || !window.confirm('Xoá góp ý này?')) return;
    const before = list;
    setList((l) => l?.filter((x) => x.id !== c.id) ?? l);
    try { await deleteComment(sb, c.id); } catch (e) { setErr(reviewError(e)); setList(before); }
  };

  const idx = new Map(slides.map((s, i) => [s.id, i]));
  const shown = (list ?? []).filter((c) => (scope === 'all' || c.slide_id === slideId) && (!hideDone || !c.resolved));
  const groups = [...new Set(shown.map((c) => c.slide_id))].sort((a, b) => (idx.get(a) ?? 999) - (idx.get(b) ?? 999));
  const open = (list ?? []).filter((c) => !c.resolved).length;

  return (
    <div className="dkc">
      <h3 className="dkc-h"><MessageSquare aria-hidden="true" /> Góp ý {list ? <small>{open ? `${open} chưa sửa` : 'không có góp ý chưa sửa'}</small> : null}</h3>
      <section className="dkc-link">
        <b><Link2 aria-hidden="true" /> Link góp ý cho tổ chuyên môn</b>
        {token ? <>
          <div className="dkc-url"><input readOnly value={url} aria-label="Link góp ý" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" onClick={() => void copy()}>{copied ? <><Check aria-hidden="true" /> Đã chép</> : <><Copy aria-hidden="true" /> Chép</>}</button></div>
          <small>Gửi link cho thầy cô trong tổ: đăng nhập tài khoản giáo viên là xem được từng trang (chỉ xem) và góp ý. Ảnh trong Kho của cô có thể không hiện với người khác.</small>
          <button type="button" className="dkc-off" disabled={busy} onClick={() => void toggleLink(false)}>Tắt link</button>
        </> : <>
          <small>Bật link để đồng nghiệp xem bài và góp ý từng trang. Chỉ người có link và đăng nhập tài khoản giáo viên mới mở được.</small>
          <button type="button" className="btn btn-primary dkc-on" disabled={busy || !sb} onClick={() => void toggleLink(true)}><Link2 aria-hidden="true" /> Bật link góp ý</button>
        </>}
      </section>

      <div className="cv-chips dkc-filter">
        <button type="button" className={scope === 'all' ? 'is-on' : ''} onClick={() => setScope('all')}>Cả bài</button>
        <button type="button" className={scope === 'page' ? 'is-on' : ''} onClick={() => setScope('page')}>Trang {cur + 1}</button>
        <label className="dkc-hide"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Ẩn đã sửa</label>
      </div>
      {err && <p className="dk-msg is-error" role="alert">{err}</p>}
      {list === null ? <p className="dk-hint">Đang tải góp ý…</p> : !shown.length ? <p className="dk-hint">{scope === 'page' ? `Trang ${cur + 1} chưa có góp ý.` : 'Chưa có góp ý nào.'}</p> : groups.map((sid) => {
        const i = idx.get(sid);
        return (
          <div key={sid} className="dkc-g">
            <button type="button" className={`dkc-gh${i === cur ? ' is-cur' : ''}`} onClick={() => i !== undefined && onGo(i)} disabled={i === undefined}>{i === undefined ? 'Trang đã xoá' : `Trang ${i + 1}`}</button>
            {shown.filter((c) => c.slide_id === sid).map((c) => (
              <article key={c.id} className={`dkc-c${c.resolved ? ' is-done' : ''}${c.mine ? ' is-mine' : ''}`}>
                <header><b>{c.mine ? 'Cô (người soạn)' : c.author_name}</b><time dateTime={c.created_at}>{timeAgo(c.created_at)}</time></header>
                <p>{c.body}</p>
                <footer>
                  <button type="button" onClick={() => void resolve(c)} aria-pressed={c.resolved}>{c.resolved ? <><RotateCcw aria-hidden="true" /> Mở lại</> : <><Check aria-hidden="true" /> Đã sửa</>}</button>
                  <button type="button" className="is-del" onClick={() => void del(c)} aria-label="Xoá góp ý"><Trash2 aria-hidden="true" /></button>
                </footer>
              </article>
            ))}
          </div>
        );
      })}

      <div className="dkc-new">
        <textarea value={text} maxLength={1000} rows={3} placeholder={`Trả lời / ghi chú cho trang ${cur + 1}…`} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} aria-label={`Góp ý cho trang ${cur + 1}`} />
        <button type="button" className="btn btn-primary" disabled={busy || !text.trim() || !sb} onClick={() => void send()}><Send aria-hidden="true" /> Gửi</button>
      </div>
    </div>
  );
}
