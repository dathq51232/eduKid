'use client';
/* eslint-disable @next/next/no-img-element -- hình dán / biểu tượng nhỏ có sẵn trong dự án */

// Tab "Bài thao giảng" trong trang Bài giảng 3D: bài của tôi + tạo bài trống / từ mẫu hoạt động.
import OfflineSaveButton from '@/components/offline/OfflineSaveButton';
import { saveDeckOfflineById } from '@/lib/offline/save';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Copy, MonitorPlay, Plus, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BGS, emptyDeck, type Deck } from '@/lib/deck/types';
import { SLIDE_TEMPLATES, deckFromTemplate } from '@/lib/deck/templates';

const DeckFromLesson = dynamic(() => import('./DeckFromLesson'), { ssr: false, loading: () => <p className="dk-hint">Đang mở…</p> });

export type DeckRow = { id: string; title: string; grade: number; updated_at: string; slides?: number; plan?: string };

export default function DeckHome({ classId, grade, decks, missing, openPlan }: { classId: string; grade: number; decks: DeckRow[]; missing: boolean; /** mở sẵn bảng tạo bài cho tiết (giáo án) này — từ trang Kế hoạch bài dạy */ openPlan?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [list, setList] = useState(decks);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [wiz, setWiz] = useState(!!openPlan);
  const [ok, setOk] = useState('');

  const create = async (D: Deck, key: string) => {
    if (!supabase) return;
    setBusy(key); setErr('');
    const { data, error } = await supabase.from('slide_decks').insert({ title: D.title.slice(0, 120), grade: D.grade, class_id: classId, data: D }).select('id').single();
    if (error || !data) {
      setBusy('');
      setErr(/too_many/.test(error?.message ?? '') ? 'Mỗi thầy cô lưu tối đa 200 bài thao giảng.' : /relation|does not exist|schema cache/i.test(error?.message ?? '') ? 'Chưa bật Bài thao giảng: hãy chạy supabase/migrations/0046_slide_decks.sql trên Supabase.' : 'Chưa tạo được bài. Thử lại nhé.');
      return;
    }
    router.push(`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${(data as { id: string }).id}`);
  };
  /** tạo nhiều bài cùng lúc (theo lịch báo giảng); một bài thì mở luôn trình soạn */
  const createMany = async (Ds: Deck[]) => {
    if (Ds.length === 1) { await create(Ds[0], 'lesson'); return; }
    if (!supabase) return;
    setBusy('lesson'); setErr(''); setOk('');
    const { data, error } = await supabase.from('slide_decks').insert(Ds.map((D) => ({ title: D.title.slice(0, 120), grade: D.grade, class_id: classId, data: D }))).select('id, title, grade, updated_at');
    setBusy('');
    if (error || !data) { setErr(/too_many/.test(error?.message ?? '') ? 'Mỗi thầy cô lưu tối đa 200 bài thao giảng.' : 'Chưa tạo được bài. Thử lại nhé.'); return; }
    const rows = (data as DeckRow[]).map((r, i) => ({ ...r, slides: Ds[i]?.slides.length, plan: Ds[i]?.src?.plan }));
    setList((l) => [...rows, ...l]); setWiz(false);
    setOk(`Đã tạo ${rows.length} bài thao giảng. Bấm vào từng bài để sửa hoặc trình chiếu.`);
  };
  const made = useMemo(() => new Set(list.map((r) => r.plan).filter((x): x is string => !!x)), [list]);
  const name = () => title.trim() || 'Bài thao giảng mới';
  const fromTpl = (id: string) => { const D = emptyDeck(name(), grade); D.slides = deckFromTemplate(id, name()); void create(D, id); };
  const duplicate = async (r: DeckRow) => {
    if (!supabase) return; setBusy(r.id);
    const { data } = await supabase.from('slide_decks').select('data').eq('id', r.id).single();
    const D = (data as { data: Deck } | null)?.data; if (!D) { setBusy(''); return; }
    await create({ ...D, title: `${r.title} (bản sao)` }, r.id);
  };
  const remove = async (id: string) => {
    if (!supabase) return; setBusy(id);
    const { error } = await supabase.from('slide_decks').delete().eq('id', id);
    setBusy(''); setConfirmDel(null);
    if (!error) setList((l) => l.filter((x) => x.id !== id)); else setErr('Chưa xóa được.');
  };

  return (
    <div className="dh">
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0046_slide_decks.sql</code> trên Supabase nên chưa lưu được bài thao giảng.</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {ok && <p className="adm-alert is-ok" role="status">{ok}</p>}
      <div className="dh-new">
        <label className="dh-name"><span>Tên bài</span><input value={title} maxLength={120} placeholder="vd: Toán 1 – Bài 7: Các số 0, 1, 2, 3, 4, 5" onChange={(e) => setTitle(e.target.value)} /></label>
        <button type="button" className="dh-blank" disabled={missing || !!busy} onClick={() => void create(emptyDeck(name(), grade), 'blank')}>
          <img src="/emoji/tool/bai-giang-3d.webp" alt="" /><span><b><Plus aria-hidden="true" /> {busy === 'blank' ? 'Đang tạo…' : 'Bài thao giảng trống'}</b><small>Trang 16:9 có sẵn trang tiêu đề</small></span>
        </button>
        <button type="button" className="dh-blank is-lesson" disabled={missing || !!busy} aria-expanded={wiz} onClick={() => setWiz(!wiz)}>
          <img src="/brand/milo-professor-sm.webp" alt="" /><span><b><Sparkles aria-hidden="true" /> Tạo từ bài học</b><small>Theo lịch báo giảng hoặc kho bài học</small></span>
        </button>
      </div>
      {wiz && <DeckFromLesson classId={classId} grade={grade} busy={busy === 'lesson'} made={made} openPlan={openPlan} onClose={() => setWiz(false)} onCreate={(Ds) => void createMany(Ds)} />}

      {list.length > 0 && <>
        <h2 className="dh-h">Bài thao giảng của tôi <span>{list.length}</span></h2>
        <ul className="s3h-cards">{list.map((r) => (
          <li key={r.id} className="s3h-card">
            <Link href={`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${r.id}`} className="s3h-card-main">
              <span className="s3h-badge">Lớp {r.grade}{r.slides ? ` · ${r.slides} trang` : ''}</span>
              <b>{r.title}</b>
              <small>Sửa lần cuối {new Date(r.updated_at).toLocaleDateString('vi-VN')}</small>
            </Link>
            <span className="s3h-card-act">
              <Link className="ct-link" href={`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${r.id}/trinh-chieu`}><MonitorPlay aria-hidden="true" /> Chiếu</Link>
              <OfflineSaveButton kind="deck" id={r.id} className="ct-link" run={(pg) => saveDeckOfflineById(r.id, classId, pg)} />
              <button type="button" className="ct-link" disabled={!!busy} onClick={() => void duplicate(r)}><Copy aria-hidden="true" /> Nhân bản</button>
              {confirmDel === r.id
                ? <><button type="button" className="ct-link is-danger" onClick={() => void remove(r.id)}>Xóa hẳn?</button><button type="button" className="ct-link" onClick={() => setConfirmDel(null)}>Thôi</button></>
                : <button type="button" className="ct-link" onClick={() => setConfirmDel(r.id)}><Trash2 aria-hidden="true" /> Xóa</button>}
            </span>
          </li>
        ))}</ul>
      </>}

      <h2 className="dh-h">Bắt đầu từ mẫu hoạt động <small>· bài mới gồm trang tiêu đề + trang mẫu, sửa thoải mái</small></h2>
      <ul className="dh-tpls">{SLIDE_TEMPLATES.filter((t) => t.id !== 'title').map((t) => (
        <li key={t.id}>
          <button type="button" disabled={missing || !!busy} onClick={() => fromTpl(t.id)}>
            <span className="dh-pv" style={{ background: BGS.find((b) => b.id === t.bg)?.css }}>
              {t.preview.map((p) => (
                <img key={p} src={p} alt="" />))}
            </span>
            <b>{busy === t.id ? 'Đang tạo…' : t.title}</b><small>{t.desc}</small>
          </button>
        </li>
      ))}</ul>
    </div>
  );
}
