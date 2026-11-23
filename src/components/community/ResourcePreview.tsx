'use client';

// Xem trước tài nguyên trên trang chi tiết: bài giảng (lưới trang, ảnh lấy từ kho chung), giáo án (bản A4 như file Word),
// liên kết YouTube / Google Drive (nhúng xem ngay), tài liệu ảnh / PDF (mở bằng link ký, lưu tạm trên máy).
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SlideView, { SlideFrame } from '@/components/deck/SlideView';
import { normalizeDeck } from '@/lib/deck/types';
import { isPlan } from '@/lib/plans/generate';
import { plansDocument } from '@/lib/plans/word';
import { FILE_BUCKET } from '@/lib/community/files';
import type { DeckSnapshot } from '@/lib/community/share';
import '@/styles/dk.css';

function DeckThumbs({ snap }: { snap: DeckSnapshot }) {
  const deck = useMemo(() => normalizeDeck(snap.deck, snap.deck?.title ?? 'Bài giảng'), [snap]);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const paths = snap.assets ?? [];
    if (!paths.length) return;
    void createClient().storage.from(FILE_BUCKET).createSignedUrls(paths, 3600).then(({ data }) => {
      setUrls(new Map((data ?? []).flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl] as [string, string]] : []))));
    });
  }, [snap]);
  const [all, setAll] = useState(false);
  const shown = all ? deck.slides : deck.slides.slice(0, 12);
  return (
    <>
      <div className="cdg-slides">
        {shown.map((s, i) => (
          <figure key={s.id} className="cdg-slide">
            <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={(p) => urls.get(p)} />}</SlideFrame>
            <figcaption>{i + 1}{s.phase ? ` · ${s.phase}` : ''}</figcaption>
          </figure>
        ))}
      </div>
      {deck.slides.length > shown.length && <button type="button" className="cdg-btn is-ghost" onClick={() => setAll(true)}>Xem cả {deck.slides.length} trang</button>}
    </>
  );
}

const youtubeId = (u: URL) => (u.hostname.endsWith('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] ?? '');
function embedOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)) { const id = youtubeId(u); return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null; }
    const d = u.pathname.match(/\/file\/d\/([\w-]+)/) ?? u.pathname.match(/\/(?:document|presentation|spreadsheets)\/d\/([\w-]+)/);
    if (u.hostname === 'drive.google.com' && d) return `https://drive.google.com/file/d/${d[1]}/preview`;
    if (u.hostname === 'docs.google.com' && d) return url.replace(/\/(edit|view)[^/]*$/, '/preview');
    return null;
  } catch { return null; }
}

export default function ResourcePreview({ kind, snapshot, school }: { kind: string; snapshot: Record<string, unknown>; school: string }) {
  if (kind === 'bai_giang' && snapshot.deck) return <DeckThumbs snap={snapshot as unknown as DeckSnapshot} />;
  if (kind === 'giao_an' && isPlan(snapshot.plan)) {
    const html = plansDocument([snapshot.plan], school);
    return <iframe className="cdg-doc" title="Xem trước giáo án" srcDoc={html} sandbox="" />;
  }
  if (kind === 'lien_ket') {
    const url = (snapshot.link as { url?: string } | undefined)?.url ?? '';
    const src = embedOf(url);
    return src ? <iframe className="cdg-embed" title="Xem trước liên kết" src={src} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <p className="cdg-muted">Liên kết này chưa xem trước được trong app — bấm “Mở liên kết”.</p>;
  }
  return null;
}
