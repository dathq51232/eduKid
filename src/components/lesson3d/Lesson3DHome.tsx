'use client';

// Trang "Bài giảng 3D": bài của tôi · bài mẫu dựng sẵn · 76 bài STEM lớp 1–5 (tạo bài 3D từ khung STEM 5 bước).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Box, Copy, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STEM_LESSONS, FIT_LABEL, stemKey, type StemLesson } from '@/lib/lesson3d/stem-catalog';
import { TEMPLATES, lessonFromStem } from '@/lib/lesson3d/templates';
import { emptyLesson, type Lesson3D } from '@/lib/lesson3d/types';
import { fold } from '@/lib/classroom/teacher-nav';

export type Lesson3DRow = { id: string; title: string; grade: number; stem_ref: string | null; updated_at: string };
type Tab = 'mine' | 'tpl' | 'stem';
const BOOK_KEY = 'gv-bo-sach';
const BOOKS = { KNTT: 'Kết nối tri thức', CTST: 'Chân trời sáng tạo', CD: 'Cánh diều' } as const;
type Book = keyof typeof BOOKS;

export default function Lesson3DHome({ classId, className, grade, lessons, missing }: { classId: string; className: string; grade: number; lessons: Lesson3DRow[]; missing: boolean }) {
  const router = useRouter();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [tab, setTab] = useState<Tab>(lessons.length ? 'mine' : 'stem');
  const [list, setList] = useState(lessons);
  const [g, setG] = useState(grade);
  const [fit, setFit] = useState<'all' | 'cao'>('all');
  const [q, setQ] = useState('');
  const [book, setBook] = useState<Book>('KNTT');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  useEffect(() => { try { const b = localStorage.getItem(BOOK_KEY) as Book | null; if (b && b in BOOKS) setBook(b); } catch { /* bỏ qua */ } }, []);
  const pickBook = (b: Book) => { setBook(b); try { localStorage.setItem(BOOK_KEY, b); } catch { /* bỏ qua */ } };

  const create = async (L: Lesson3D, key: string) => {
    if (!supabase) return;
    setBusy(key); setErr('');
    const { data, error } = await supabase.from('lessons3d').insert({ title: L.title.slice(0, 120), grade: L.grade, stem_ref: L.stem ?? null, class_id: classId, data: L }).select('id').single();
    if (error || !data) { setBusy(''); setErr(/too_many/.test(error?.message ?? '') ? 'Mỗi thầy cô lưu tối đa 200 bài 3D.' : /relation|does not exist|schema cache/i.test(error?.message ?? '') ? 'Chưa bật Xưởng 3D: hãy chạy supabase/migrations/0034_lessons3d.sql trên Supabase.' : 'Chưa tạo được bài. Thử lại nhé.'); return; }
    router.push(`/giao-vien/lop/${classId}/bai-giang-3d/${(data as { id: string }).id}`);
  };
  const duplicate = async (r: Lesson3DRow) => {
    if (!supabase) return; setBusy(r.id);
    const { data } = await supabase.from('lessons3d').select('data').eq('id', r.id).single();
    const L = (data as { data: Lesson3D } | null)?.data; if (!L) { setBusy(''); return; }
    await create({ ...L, title: `${r.title} (bản sao)` }, r.id);
  };
  const remove = async (id: string) => {
    if (!supabase) return; setBusy(id);
    const { error } = await supabase.from('lessons3d').delete().eq('id', id);
    setBusy(''); setConfirmDel(null);
    if (!error) setList((l) => l.filter((x) => x.id !== id)); else setErr('Chưa xóa được.');
  };

  const f = fold(q);
  const stems = STEM_LESSONS.filter((s) => s.g === g && (fit === 'all' || s.fit === 'cao') && (!f || fold(`${s.title} ${s.lead} ${s.integrated.join(' ')}`).includes(f)));
  const counts = [1, 2, 3, 4, 5].map((x) => STEM_LESSONS.filter((s) => s.g === x).length);
  const mineByStem = new Map(list.filter((r) => r.stem_ref).map((r) => [r.stem_ref as string, r]));

  return (
    <div className="ct s3h">
      <div className="ct-head">
        <div><p className="ct-sub">Lớp {className} · Dạy học</p><h1>Bài giảng 3D</h1></div>
        <div className="ct-actions">
          <button type="button" className="btn btn-primary" disabled={missing || !!busy} onClick={() => void create(emptyLesson(grade), 'new')}><Plus aria-hidden="true" /> Bài trống</button>
        </div>
      </div>
      <p className="s3h-lead">Soạn bài giảng trực quan bằng mô hình 3D: kéo đồ vật vào sa bàn, gắn điểm chạm, hiệu ứng, chia cảnh như slide và thêm thử thách cuối bài. Trình chiếu lên máy chiếu hoặc bảng tương tác.</p>
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0034_lessons3d.sql</code> trên Supabase nên chưa lưu được bài 3D.</p>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}

      <div className="s3h-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>Bài của tôi <span>{list.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'tpl'} onClick={() => setTab('tpl')}>Bài mẫu <span>{TEMPLATES.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'stem'} onClick={() => setTab('stem')}>Bài STEM lớp 1–5 <span>{STEM_LESSONS.length}</span></button>
      </div>

      {tab === 'mine' && (list.length === 0 ? (
        <div className="s3h-empty"><Box aria-hidden="true" /><b>Chưa có bài giảng 3D nào</b><span>Bắt đầu từ một bài mẫu hoặc một bài STEM đúng tuần đang dạy.</span><button type="button" className="btn btn-outline btn-sm" onClick={() => setTab('stem')}>Xem bài STEM lớp {grade}</button></div>
      ) : (
        <ul className="s3h-cards">{list.map((r) => (
          <li key={r.id} className="s3h-card">
            <Link href={`/giao-vien/lop/${classId}/bai-giang-3d/${r.id}`} className="s3h-card-main">
              <span className="s3h-badge">Lớp {r.grade}{r.stem_ref ? ` · STEM ${r.stem_ref.split('-')[1]}` : ''}</span>
              <b>{r.title}</b>
              <small>Sửa lần cuối {new Date(r.updated_at).toLocaleDateString('vi-VN')}</small>
            </Link>
            <span className="s3h-card-act">
              <button type="button" className="ct-link" disabled={!!busy} onClick={() => void duplicate(r)}><Copy aria-hidden="true" /> Nhân bản</button>
              {confirmDel === r.id
                ? <><button type="button" className="ct-link is-danger" onClick={() => void remove(r.id)}>Xóa hẳn?</button><button type="button" className="ct-link" onClick={() => setConfirmDel(null)}>Thôi</button></>
                : <button type="button" className="ct-link" onClick={() => setConfirmDel(r.id)}><Trash2 aria-hidden="true" /> Xóa</button>}
            </span>
          </li>
        ))}</ul>
      ))}

      {tab === 'tpl' && (
        <ul className="s3h-cards">{TEMPLATES.map((t) => (
          <li key={t.id} className="s3h-card">
            <div className="s3h-card-main">
              <span className="s3h-badge">Lớp {t.grade} · {t.subject}</span>
              <b>{t.title}</b>
              <small>{t.desc}</small>
            </div>
            <span className="s3h-card-act"><button type="button" className="btn btn-primary btn-sm" disabled={missing || !!busy} onClick={() => void create(t.make(), t.id)}><Sparkles aria-hidden="true" /> {busy === t.id ? 'Đang tạo…' : 'Dùng bài mẫu'}</button></span>
          </li>
        ))}</ul>
      )}

      {tab === 'stem' && (
        <>
          <div className="s3h-filter">
            <div className="s3h-grades" role="group" aria-label="Khối lớp">{[1, 2, 3, 4, 5].map((x, i) => <button key={x} type="button" aria-pressed={g === x} onClick={() => setG(x)}>Lớp {x} <span>{counts[i]}</span></button>)}</div>
            <label className="s3h-search"><Search aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bài, môn…" aria-label="Tìm bài STEM" /></label>
            <select value={book} onChange={(e) => pickBook(e.target.value as Book)} aria-label="Bộ sách của trường">{(Object.keys(BOOKS) as Book[]).map((b) => <option key={b} value={b}>Sách {BOOKS[b]}</option>)}</select>
            <label className="s3h-chk"><input type="checkbox" checked={fit === 'cao'} onChange={(e) => setFit(e.target.checked ? 'cao' : 'all')} /> Chỉ bài rất hợp 3D</label>
          </div>
          <p className="s3h-note">Danh mục bài học STEM lớp 1–5 kèm thời điểm dạy theo bộ sách và vật liệu cho mỗi nhóm. Bài có bài mẫu 3D sẽ mở bài mẫu; bài khác tạo khung 5 bước STEM (Nêu vấn đề → Kiến thức nền → Giải pháp → Chế tạo, thử nghiệm → Chia sẻ) với đồ vật 3D gợi ý.</p>
          <ul className="s3h-stems">{stems.map((s) => <StemCard key={stemKey(s)} s={s} book={book} mine={mineByStem.get(stemKey(s))} classId={classId} busy={busy === stemKey(s)} disabled={missing || !!busy} onCreate={() => void create(lessonFromStem(s), stemKey(s))} />)}</ul>
          {!stems.length && <p className="dash-muted">Không có bài phù hợp.</p>}
        </>
      )}
    </div>
  );
}

function StemCard({ s, book, mine, classId, busy, disabled, onCreate }: { s: StemLesson; book: Book; mine?: Lesson3DRow; classId: string; busy: boolean; disabled: boolean; onCreate: () => void }) {
  const time = s.timing[book];
  return (
    <li className={`s3h-stem fit-${s.fit}`}>
      <span className="s3h-no">Bài {s.no}</span>
      <div className="s3h-stem-main">
        <b>{s.title}</b>
        <span className="s3h-meta">{s.lead}{s.integrated.length ? ` · tích hợp ${s.integrated.join(', ')}` : ''}</span>
        {time && <span className="s3h-meta">Dạy cùng: {time} <i>({BOOKS[book]})</i></span>}
        {s.materials.length > 0 && <details><summary>Vật liệu cho nhóm ({s.materials.length})</summary><ul>{s.materials.map((m) => <li key={m}>{m}</li>)}</ul></details>}
      </div>
      <div className="s3h-stem-act">
        <span className={`s3h-fit is-${s.fit}`}>{FIT_LABEL[s.fit]}{s.tpl ? ' · có bài mẫu' : ''}</span>
        {mine ? <Link href={`/giao-vien/lop/${classId}/bai-giang-3d/${mine.id}`} className="btn btn-outline btn-sm">Mở bài của tôi</Link>
          : <button type="button" className={`btn btn-sm ${s.fit === 'thap' ? 'btn-outline' : 'btn-primary'}`} disabled={disabled} onClick={onCreate}>{busy ? 'Đang tạo…' : 'Tạo bài 3D'}</button>}
      </div>
    </li>
  );
}
