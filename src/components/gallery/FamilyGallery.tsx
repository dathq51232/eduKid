'use client';

// Phòng triển lãm — trang gia đình (học sinh / phụ huynh): đi xem phòng 3D của lớp, tìm tác phẩm của con, thả tim,
// em tự nộp tranh / bài viết (chờ cô duyệt), xem Hành trình nét chữ.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GalleryHorizontalEnd, PenLine, TrendingUp, Upload } from 'lucide-react';
import GalleryView from './GalleryView';
import ScanUpload from './ScanUpload';
import WritingJourney from './WritingJourney';
import ArtViewer from './ArtViewer';
import { galleryError, loadGallery, toggleHeart } from '@/lib/gallery/client';
import { SEEN_KEY, type GalleryData, type HeartEmoji } from '@/lib/gallery/types';

export type FamilyClass = { class_id: string; class_name: string; grade: number; student_id: string; student_name: string };
type Tab = 'phong' | 'nop' | 'net-chu';

export default function FamilyGallery({ cls, canSubmit }: { cls: FamilyClass; canSubmit: boolean }) {
  const [tab, setTab] = useState<Tab>('phong');
  const [data, setData] = useState<GalleryData | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try { setData(await loadGallery(cls.class_id)); setErr(''); } catch (e) { setErr(e instanceof Error ? e.message : galleryError(e)); }
  }, [cls.class_id]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { try { localStorage.setItem(`${SEEN_KEY}:${cls.class_id}`, new Date().toISOString()); } catch { /* bỏ qua */ } }, [cls.class_id, data]);

  const heart = async (id: string, e: HeartEmoji) => {
    try {
      const r = await toggleHeart(id, e);
      setData((d) => (d ? { ...d, items: d.items.map((i) => (i.id === id ? { ...i, hearts: r.hearts, my_heart: r.my_heart } : i)) } : d));
    } catch (x) { setErr(galleryError(x)); }
  };
  const items = data?.items ?? [];
  const myPending = items.filter((i) => i.status === 'pending');
  const kids = (data?.mine ?? [cls.student_id]).map((id) => ({ id, name: id === cls.student_id ? cls.student_name : items.find((i) => i.student_id === id)?.student_name ?? 'Con' }));

  return (
    <div className="gm is-family">
      <header className="gm-head">
        <div>
          <h1>Phòng triển lãm lớp {cls.class_name}</h1>
          <p className="dash-muted">Tác phẩm của {cls.student_name} có <b>ngôi sao vàng</b> và khung vàng. Bấm vào tranh để xem lớn và thả tim khen các con.</p>
        </div>
        <Link href="/luyen-chu" className="btn btn-outline btn-sm"><PenLine aria-hidden="true" /> Luyện chữ</Link>
      </header>
      <nav className="gm-tabs" role="tablist" aria-label="Phòng triển lãm">
        <button type="button" role="tab" aria-selected={tab === 'phong'} className={tab === 'phong' ? 'is-on' : ''} onClick={() => setTab('phong')}><GalleryHorizontalEnd aria-hidden="true" /> Phòng triển lãm</button>
        {canSubmit && <button type="button" role="tab" aria-selected={tab === 'nop'} className={tab === 'nop' ? 'is-on' : ''} onClick={() => setTab('nop')}><Upload aria-hidden="true" /> Nộp tác phẩm{myPending.length ? <span className="gm-badge">{myPending.length}</span> : null}</button>}
        <button type="button" role="tab" aria-selected={tab === 'net-chu'} className={tab === 'net-chu' ? 'is-on' : ''} onClick={() => setTab('net-chu')}><TrendingUp aria-hidden="true" /> Hành trình nét chữ</button>
      </nav>
      {err && <p className="adm-alert is-error">{err}</p>}
      {!data && !err && <p className="dash-muted" role="status">Đang mở phòng triển lãm…</p>}

      {data && tab === 'phong' && (
        <GalleryView items={items} className={cls.class_name} theme={data.settings.theme} mine={data.mine} canHeart onHeart={heart}
          banner={!items.some((i) => i.status === 'shown') ? <p className="adm-alert is-info">Phòng triển lãm của lớp chưa có tác phẩm. Cô sẽ sớm treo tranh và thư khen của các con lên đây!</p> : undefined} />
      )}
      {data && tab === 'nop' && canSubmit && (
        <section className="dash-section">
          <h2>Nộp tranh hoặc bài viết cho cô</h2>
          <p className="dash-muted">Chụp tranh vẽ hoặc trang vở luyện chữ. Cô duyệt xong, tác phẩm sẽ được treo lên tường triển lãm.</p>
          <ScanUpload classId={cls.class_id} ownStudent={cls.student_id} kinds={['art', 'writing']} onSaved={() => void reload()} />
          {myPending.length > 0 && <p className="adm-alert is-info">Đang chờ cô duyệt: {myPending.length} tác phẩm.</p>}
        </section>
      )}
      {data && tab === 'net-chu' && (
        <section className="dash-section"><WritingJourney items={items} students={kids} initial={cls.student_id} onOpen={setOpen} /></section>
      )}
      {open && <ArtViewer list={items} id={open} onClose={() => setOpen(null)} onGo={setOpen} canHeart onHeart={heart} />}
    </div>
  );
}
