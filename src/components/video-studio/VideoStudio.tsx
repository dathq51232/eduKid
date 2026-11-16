'use client';

// Xưởng video stickman (giáo viên + quản trị): soạn phân cảnh ~10 giây/cảnh, giữ nhân vật và bối cảnh đồng nhất,
// xuất câu lệnh tự đủ cho Google Flow (Veo) kèm danh sách ảnh tham chiếu. Phương pháp theo chế độ A · Director của
// kaomei/stickman-video-director (MIT). Nội dung có thể lấy thẳng từ bài học của EduChain hoặc tự viết bất kỳ chủ đề nào.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, BookOpen, Check, ClipboardCopy, CopyPlus, Download, ExternalLink, FolderOpen, Minus, Plus, Save, Sparkles, Trash2, TriangleAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BUILTIN_CHARACTERS, BUILTIN_SETTINGS, MUSIC, STYLES, VOICES, alias, styleOf, voiceOf, type LibItem, type Ratio } from '@/lib/video-studio/presets';
import { buildClipPrompt, buildPackage, checkProject, clipRefs, emptyClip, newProject, uid, type VsClip, type VsProject } from '@/lib/video-studio/prompt';
import { deleteProject, listProjects, loadLibrary, loadProject, saveProject, signRefs, type ProjectRow } from '@/lib/video-studio/store';
import LibraryPanel from './LibraryPanel';
import '@/styles/ct.css';
import '@/styles/btn.css';
import '@/styles/vs.css';

/** Bài học rút gọn do trang máy chủ chuyển xuống (không đưa cả kho nội dung vào trình duyệt) */
export type VsLesson = { id: string; subject: string; grade: number; title: string; unit: string; ref: string; description: string; samples: string[] };
const SUBJECT: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const DRAFT_KEY = 'vs-ban-nhap';
type Tab = 'phan-canh' | 'nhan-vat' | 'boi-canh' | 'du-an';
const time = (i: number) => `${Math.floor((i * 10) / 60)}:${String((i * 10) % 60).padStart(2, '0')}`;

function download(name: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'video';

export default function VideoStudio({ lessons, isAdmin, defaultGrade }: { lessons: VsLesson[]; isAdmin: boolean; defaultGrade?: number }) {
  const sb = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [tab, setTab] = useState<Tab>('phan-canh');
  const [me, setMe] = useState<string | null>(null);
  const [cloud, setCloud] = useState(false);
  const [dbChars, setDbChars] = useState<LibItem[]>([]);
  const [dbSets, setDbSets] = useState<LibItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [p, setP] = useState<VsProject>(newProject);
  const [shared, setShared] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<'' | 'ai' | 'save'>('');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pick, setPick] = useState({ grade: defaultGrade && defaultGrade >= 1 && defaultGrade <= 5 ? defaultGrade : 3, subject: 'tieng-anh', lesson: '' });

  const lib = useMemo(() => ({ characters: [...BUILTIN_CHARACTERS, ...dbChars], settings: [...BUILTIN_SETTINGS, ...dbSets] }), [dbChars, dbSets]);

  // nạp thư viện, danh sách dự án, bản nháp trên máy
  useEffect(() => {
    try { const d = localStorage.getItem(DRAFT_KEY); if (d) setP(JSON.parse(d) as VsProject); } catch { /* bỏ qua */ }
    if (!sb) return;
    void (async () => {
      const { data } = await sb.auth.getUser();
      setMe(data.user?.id ?? null);
      const l = await loadLibrary(sb);
      if (!l) return;
      setCloud(true); setDbChars(l.characters); setDbSets(l.settings);
      setProjects((await listProjects(sb)) ?? []);
    })();
  }, [sb]);
  // nhớ bản nháp trên máy (gom lại 600 ms, không ghi mỗi phím)
  useEffect(() => {
    const t = window.setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)); } catch { /* đầy bộ nhớ */ } }, 600);
    return () => window.clearTimeout(t);
  }, [p]);
  // ký đường dẫn ảnh tham chiếu đang dùng
  const allRefs = useMemo(() => [...lib.characters, ...lib.settings].flatMap((x) => x.refs).join('|'), [lib]);
  const refreshUrls = useCallback(async (extra: string[] = []) => {
    if (!sb) return;
    const paths = [...allRefs.split('|').filter(Boolean), ...extra];
    if (paths.length) setUrls(await signRefs(sb, paths));
  }, [sb, allRefs]);
  useEffect(() => { void refreshUrls(); }, [refreshUrls]);

  const set = (patch: Partial<VsProject>) => setP((x) => ({ ...x, ...patch }));
  const setClip = (id: string, patch: Partial<VsClip>) => setP((x) => ({ ...x, clips: x.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const setCount = (n: number) => setP((x) => {
    const k = Math.max(1, Math.min(18, n));
    const last = x.clips[x.clips.length - 1];
    const add = Array.from({ length: Math.max(0, k - x.clips.length) }, () => emptyClip(last?.settingId, last?.cast));
    return { ...x, clips: [...x.clips, ...add].slice(0, k) };
  });
  const move = (i: number, d: -1 | 1) => setP((x) => {
    const c = [...x.clips]; const j = i + d;
    if (j < 0 || j >= c.length) return x;
    [c[i], c[j]] = [c[j], c[i]];
    return { ...x, clips: c };
  });
  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg((m) => (m === t ? '' : m)), 4000); };
  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied(null), 1600); } catch { flash('Trình duyệt chặn sao chép — bôi đen và chép tay nhé.'); }
  };

  // ---------- nội dung từ bài học ----------
  const subjects = useMemo(() => [...new Set(lessons.filter((l) => l.grade === pick.grade).map((l) => l.subject))], [lessons, pick.grade]);
  const pickList = useMemo(() => lessons.filter((l) => l.grade === pick.grade && l.subject === pick.subject), [lessons, pick.grade, pick.subject]);
  const insertLesson = () => {
    const l = lessons.find((x) => x.id === pick.lesson);
    if (!l) return;
    const brief = [
      `Video bài học ${SUBJECT[l.subject] ?? l.subject} lớp ${l.grade}: ${l.title}${l.unit ? ` (${l.unit})` : ''}${l.ref ? ` — ${l.ref}` : ''}.`,
      l.description ? `Nội dung chính: ${l.description}` : '',
      l.samples.length ? `Ví dụ câu luyện tập trong bài:\n- ${l.samples.join('\n- ')}` : '',
      'Mục tiêu: giúp các em hiểu và nhớ kiến thức, kết thúc bằng lời mời luyện tập bài này trên EduChain Kids.',
    ].filter(Boolean).join('\n');
    set({ brief, title: p.title === 'Video mới' ? l.title.slice(0, 100) : p.title });
  };

  // ---------- AI soạn phân cảnh ----------
  const castPool = useMemo(() => [...new Set(p.clips.flatMap((c) => c.cast))], [p.clips]);
  const aiDraft = async () => {
    if (p.brief.trim().length < 5) { flash('Nhập nội dung video trước (hoặc lấy từ bài học).'); return; }
    if (p.clips.some((c) => c.beats.some((b) => b.trim())) && !window.confirm('AI sẽ thay các cảnh hiện tại. Tiếp tục?')) return;
    setBusy('ai'); setMsg('');
    const pool = castPool.length ? castPool : ['b-chain', 'b-co-mai'];
    try {
      const res = await fetch('/api/ai/video-storyboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: p.brief, clipCount: p.clips.length, ratio: p.ratio, narration: voiceOf(p.voiceKey).narration,
          characters: lib.characters.filter((c) => pool.includes(c.id)).map((c) => ({ id: c.id, name: alias(c.name), note: c.note })),
          settings: lib.settings.map((s) => ({ id: s.id, name: s.name, note: s.note })),
        }),
      });
      const j = (await res.json()) as { error?: string; title?: string; clips?: Omit<VsClip, 'id'>[] };
      if (!res.ok || !j.clips) { flash(j.error ?? 'AI chưa soạn được, thử lại sau.'); return; }
      setP((x) => ({ ...x, title: x.title === 'Video mới' && j.title ? j.title : x.title, clips: j.clips!.map((c) => ({ ...c, id: uid() })) }));
      flash(`AI đã soạn ${j.clips.length} cảnh — đọc lại, sửa cho đúng ý rồi mới chép sang Flow.`);
    } catch { flash('Mất kết nối, thử lại nhé.'); } finally { setBusy(''); }
  };

  // ---------- lưu / mở dự án ----------
  const save = async () => {
    if (!sb || !cloud) { flash('Chưa bật lưu dự án (migration 0064) — bản nháp vẫn được giữ trên máy này.'); return; }
    setBusy('save');
    try {
      const id = await saveProject(sb, p, shared);
      setP((x) => ({ ...x, id }));
      setProjects((await listProjects(sb)) ?? []);
      flash('Đã lưu dự án.');
    } catch (e) { flash(`Chưa lưu được: ${(e as Error).message}`); } finally { setBusy(''); }
  };
  const openProject = async (id: string) => {
    if (!sb) return;
    const r = await loadProject(sb, id);
    if (!r) { flash('Không mở được dự án.'); return; }
    setP(r.owner === me ? r.project : { ...r.project, id: undefined, title: `${r.project.title} (bản của tôi)` });
    setShared(r.owner === me ? r.shared : false);
    setTab('phan-canh');
    flash(r.owner === me ? 'Đã mở dự án.' : 'Đã mở bản sao dự án của đồng nghiệp — lưu sẽ thành dự án của bạn.');
  };
  const removeProject = async (row: ProjectRow) => {
    if (!sb || !window.confirm(`Xoá dự án "${row.title}"?`)) return;
    try { await deleteProject(sb, row.id); setProjects((x) => x.filter((r) => r.id !== row.id)); if (p.id === row.id) set({ id: undefined }); } catch (e) { flash(`Chưa xoá được: ${(e as Error).message}`); }
  };

  const checks = useMemo(() => checkProject(p, lib), [p, lib]);
  const style = styleOf(p.styleKey), voice = voiceOf(p.voiceKey);
  const ok = checks.filter((c) => c.ok).length;

  return (
    <div className="ct vs">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Dạy học · Google Flow (Veo)</p>
          <h1><span aria-hidden="true">🎬</span> Xưởng video stickman</h1>
        </div>
        <div className="ct-actions">
          <a className="btn btn-outline btn-sm" href="https://labs.google/fx/tools/flow" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Mở Google Flow</a>
        </div>
      </div>

      <nav className="vs-tabs" aria-label="Xưởng video">
        {([['phan-canh', '🎞️ Phân cảnh'], ['nhan-vat', `🧍 Nhân vật (${lib.characters.length})`], ['boi-canh', `🏞️ Bối cảnh (${lib.settings.length})`], ['du-an', `📁 Dự án đã lưu (${projects.length})`]] as [Tab, string][]).map(([k, t]) => (
          <button key={k} type="button" className={tab === k ? 'is-on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t}</button>
        ))}
      </nav>
      {msg && <p className="vs-msg" role="status">{msg}</p>}

      {tab === 'nhan-vat' && <LibraryPanel kind="character" items={lib.characters} sb={sb} cloud={cloud} me={me} isAdmin={isAdmin} urls={urls} onChange={(xs) => setDbChars(xs.filter((x) => !x.builtin))} />}
      {tab === 'boi-canh' && <LibraryPanel kind="setting" items={lib.settings} sb={sb} cloud={cloud} me={me} isAdmin={isAdmin} urls={urls} onChange={(xs) => setDbSets(xs.filter((x) => !x.builtin))} />}

      {tab === 'du-an' && (
        <div className="vs-projects">
          {!cloud && <p className="vs-warn">Chưa bật lưu dự án: chạy <code>supabase/migrations/0064_video_studio.sql</code>. Bản nháp đang làm vẫn được giữ trên máy này.</p>}
          {cloud && !projects.length && <p className="vs-muted">Chưa có dự án nào. Soạn ở tab Phân cảnh rồi bấm “Lưu dự án”.</p>}
          <ul className="vs-plist">
            {projects.map((r) => (
              <li key={r.id}>
                <button type="button" className="vs-plink" onClick={() => void openProject(r.id)}><FolderOpen aria-hidden="true" /> <b>{r.title}</b>
                  <small>{new Date(r.updated_at).toLocaleString('vi-VN')}{r.owner === me ? '' : ' · của đồng nghiệp'}{r.shared ? ' · dùng chung' : ''}</small></button>
                {(r.owner === me || isAdmin) && <button type="button" className="vs-mini is-danger" onClick={() => void removeProject(r)}><Trash2 aria-hidden="true" /> Xoá</button>}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { if (window.confirm('Bắt đầu video mới? Bản nháp hiện tại chưa lưu sẽ mất.')) { setP(newProject()); setShared(false); setTab('phan-canh'); } }}><Plus aria-hidden="true" /> Video mới</button>
        </div>
      )}

      {tab === 'phan-canh' && (
        <div className="vs-grid">
          <div className="vs-main">
            <section className="vs-box">
              <h2>1. Thiết lập</h2>
              <div className="vs-row">
                <label className="vs-field is-wide"><span>Tên video</span><input value={p.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /></label>
                <div className="vs-field"><span>Khổ hình</span>
                  <div className="vs-seg" role="group" aria-label="Khổ hình">
                    {(['16:9', '9:16'] as Ratio[]).map((r) => <button key={r} type="button" className={p.ratio === r ? 'is-on' : ''} aria-pressed={p.ratio === r} onClick={() => set({ ratio: r })}>{r === '16:9' ? '▭ 16:9 ngang' : '▯ 9:16 Shorts'}</button>)}
                  </div>
                </div>
                <div className="vs-field"><span>Số cảnh (~10 giây/cảnh)</span>
                  <div className="vs-count">
                    <button type="button" onClick={() => setCount(p.clips.length - 1)} aria-label="Bớt một cảnh"><Minus aria-hidden="true" /></button>
                    <b>{p.clips.length}</b><small>≈ {time(p.clips.length)}</small>
                    <button type="button" onClick={() => setCount(p.clips.length + 1)} aria-label="Thêm một cảnh"><Plus aria-hidden="true" /></button>
                  </div>
                </div>
              </div>
              <div className="vs-row">
                <label className="vs-field"><span>Phong cách</span>
                  <select value={p.styleKey} onChange={(e) => set({ styleKey: e.target.value })}>{STYLES.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}</select>
                  <small className="vs-muted">{style.desc}</small>
                </label>
                <label className="vs-field"><span>Giọng đọc</span>
                  <select value={p.voiceKey} onChange={(e) => set({ voiceKey: e.target.value })}>{VOICES.map((v) => <option key={v.key} value={v.key}>{v.name}</option>)}</select>
                  {voice.hint && <small className="vs-muted">{voice.hint}</small>}
                </label>
                <label className="vs-field"><span>Nhạc nền</span>
                  <select value={p.musicKey} onChange={(e) => set({ musicKey: e.target.value })}>{MUSIC.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}</select>
                </label>
              </div>
            </section>

            <section className="vs-box">
              <h2>2. Nội dung</h2>
              <div className="vs-lesson">
                <BookOpen aria-hidden="true" />
                <select value={pick.grade} onChange={(e) => setPick({ grade: Number(e.target.value), subject: pick.subject, lesson: '' })} aria-label="Khối">{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
                <select value={pick.subject} onChange={(e) => setPick({ ...pick, subject: e.target.value, lesson: '' })} aria-label="Môn">{subjects.map((s) => <option key={s} value={s}>{SUBJECT[s] ?? s}</option>)}</select>
                <select value={pick.lesson} onChange={(e) => setPick({ ...pick, lesson: e.target.value })} aria-label="Bài học" className="vs-grow">
                  <option value="">— Chọn bài học ({pickList.length}) —</option>
                  {pickList.map((l) => <option key={l.id} value={l.id}>{l.ref && !l.title.startsWith(l.ref) ? `${l.ref} · ` : ''}{l.title}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={insertLesson} disabled={!pick.lesson}>Lấy nội dung bài</button>
              </div>
              <label className="vs-field"><span>Nội dung video (bài học, mẹo học, câu chuyện… bất kỳ chủ đề nào)</span>
                <textarea rows={5} value={p.brief} maxLength={6000} onChange={(e) => set({ brief: e.target.value })}
                  placeholder="Ví dụ: Mẹo học 20 phút nghỉ 5 phút cho học sinh lớp 3; Bé Chain hay mất tập trung, Cô Mai chỉ cách dùng đồng hồ hẹn giờ…" />
              </label>
              <div className="vs-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void aiDraft()} disabled={busy === 'ai'}><Sparkles aria-hidden="true" /> {busy === 'ai' ? 'AI đang soạn…' : `AI soạn ${p.clips.length} cảnh`}</button>
                <span className="vs-muted">Dùng API key AI của thầy cô (Trợ lý AI → Cài đặt API). Nhân vật AI dùng: {castPool.map((id) => lib.characters.find((c) => c.id === id)?.name ?? id).join(', ') || 'Bé Chain, Cô Mai'}.</span>
              </div>
            </section>

            <section className="vs-box">
              <h2>3. Phân cảnh</h2>
              <ol className="vs-clips">
                {p.clips.map((c, i) => {
                  const prompt = open === c.id ? buildClipPrompt(p, i, lib) : '';
                  const refs = open === c.id ? clipRefs(p, i, lib) : [];
                  return (
                    <li key={c.id} className="vs-clip">
                      <header>
                        <b>Cảnh {i + 1}</b><span className="vs-muted">{time(i)}–{time(i + 1)}</span>
                        <span className="vs-clip-tools">
                          <button type="button" className="vs-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Lên"><ArrowUp aria-hidden="true" /></button>
                          <button type="button" className="vs-icon" onClick={() => move(i, 1)} disabled={i === p.clips.length - 1} aria-label="Xuống"><ArrowDown aria-hidden="true" /></button>
                          <button type="button" className="vs-icon" onClick={() => setP((x) => ({ ...x, clips: [...x.clips.slice(0, i + 1), { ...c, id: uid() }, ...x.clips.slice(i + 1)].slice(0, 18) }))} aria-label="Nhân bản cảnh"><CopyPlus aria-hidden="true" /></button>
                          <button type="button" className="vs-icon is-danger" onClick={() => setP((x) => ({ ...x, clips: x.clips.length > 1 ? x.clips.filter((y) => y.id !== c.id) : x.clips }))} disabled={p.clips.length === 1} aria-label="Xoá cảnh"><Trash2 aria-hidden="true" /></button>
                        </span>
                      </header>
                      <div className="vs-row">
                        <label className="vs-field"><span>Bối cảnh</span>
                          <select value={c.settingId} onChange={(e) => setClip(c.id, { settingId: e.target.value })}>
                            {lib.settings.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            {!lib.settings.some((s) => s.id === c.settingId) && <option value={c.settingId}>(đã bị xoá)</option>}
                          </select>
                        </label>
                        <div className="vs-field is-wide"><span>Nhân vật trong cảnh</span>
                          <div className="vs-chips">
                            {lib.characters.map((ch) => {
                              const on = c.cast.includes(ch.id);
                              return <button key={ch.id} type="button" className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => setClip(c.id, { cast: on ? c.cast.filter((x) => x !== ch.id) : [...c.cast, ch.id].slice(0, 4) })}>{on && <Check aria-hidden="true" />}{ch.name}</button>;
                            })}
                          </div>
                        </div>
                      </div>
                      <label className="vs-field"><span>Khung đầu (tiếng Anh · trống = nối từ khung cuối cảnh trước)</span>
                        <input value={c.firstFrame} onChange={(e) => setClip(c.id, { firstFrame: e.target.value })} placeholder={i === 0 ? 'Be Chain sits at a desk on the left, Co Mai stands by the board on the right.' : 'Để trống để kế thừa'} lang="en" />
                      </label>
                      <div className="vs-beats">
                        {(['0–3 giây', '3–7 giây', '7–10 giây'] as const).map((t, k) => (
                          <label key={t} className="vs-field"><span>{t} · hành động (tiếng Anh)</span>
                            <textarea rows={2} value={c.beats[k]} lang="en" onChange={(e) => { const b = [...c.beats] as VsClip['beats']; b[k] = e.target.value; setClip(c.id, { beats: b }); }}
                              placeholder={['Be Chain raises a hand with a puzzled face.', 'Co Mai draws a big clock icon and points at it.', 'Be Chain nods, smiles and opens a notebook.'][k]} />
                          </label>
                        ))}
                      </div>
                      {voice.narration !== 'none' && (
                        <label className="vs-field"><span>Lời người dẫn chuyện ({voice.narration === 'vi' ? 'tiếng Việt, ≤ ~30 từ' : 'tiếng Anh, ≤ ~25 từ'})</span>
                          <textarea rows={2} value={c.dialogue} onChange={(e) => setClip(c.id, { dialogue: e.target.value })} />
                        </label>
                      )}
                      <div className="vs-row">
                        <label className="vs-field is-wide"><span>Khung cuối (tiếng Anh · cảnh sau nối tiếp từ đây)</span>
                          <input value={c.endFrame} onChange={(e) => setClip(c.id, { endFrame: e.target.value })} lang="en" placeholder="Be Chain walks off to the right holding the notebook." />
                        </label>
                        <label className="vs-field"><span>Chữ chèn khi dựng (không vào Flow)</span>
                          <input value={c.overlay} maxLength={80} onChange={(e) => setClip(c.id, { overlay: e.target.value })} placeholder="20 phút học · 5 phút nghỉ" />
                        </label>
                      </div>
                      <div className="vs-actions">
                        <button type="button" className="vs-mini" onClick={() => { setOpen(open === c.id ? null : c.id); }}>{open === c.id ? 'Ẩn câu lệnh' : 'Xem câu lệnh Flow'}</button>
                        <button type="button" className="vs-mini" onClick={() => void copy(c.id, buildClipPrompt(p, i, lib))}>{copied === c.id ? <><Check aria-hidden="true" /> Đã chép</> : <><ClipboardCopy aria-hidden="true" /> Chép câu lệnh cảnh {i + 1}</>}</button>
                      </div>
                      {open === c.id && (
                        <div className="vs-out">
                          {refs.length > 0 && (
                            <div className="vs-out-refs">
                              <p className="vs-muted">Tải các ảnh này lên Flow (Ingredients / ảnh tham chiếu) cùng câu lệnh:</p>
                              <div className="vs-refs">
                                {refs.map((r) => (
                                  <a key={r.path} className="vs-ref" href={urls[r.path]} download target="_blank" rel="noreferrer" title={`Tải ảnh ${r.label}`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh ký tạm từ Supabase Storage */}
                                    {urls[r.path] ? <img src={urls[r.path]} alt={r.label} /> : <span className="vs-ref-ph">…</span>}
                                    <small>{r.label}</small>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <pre className="vs-prompt" lang="en">{prompt}</pre>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCount(p.clips.length + 1)} disabled={p.clips.length >= 18}><Plus aria-hidden="true" /> Thêm cảnh</button>
            </section>
          </div>

          <aside className="vs-side">
            <section className="vs-box">
              <h2>4. Kiểm tra ({ok}/{checks.length})</h2>
              <ul className="vs-checks">
                {checks.map((c) => <li key={c.text} className={c.ok ? 'is-ok' : 'is-bad'}>{c.ok ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}<span>{c.text}</span></li>)}
              </ul>
            </section>
            <section className="vs-box">
              <h2>5. Xuất và lưu</h2>
              <div className="vs-stack">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy('all', buildPackage(p, lib))}>{copied === 'all' ? <><Check aria-hidden="true" /> Đã chép cả gói</> : <><ClipboardCopy aria-hidden="true" /> Chép cả gói câu lệnh</>}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => download(`${slug(p.title)}.md`, buildPackage(p, lib), 'text/markdown;charset=utf-8')}><Download aria-hidden="true" /> Tải gói .md</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => download(`${slug(p.title)}.json`, JSON.stringify({ ...p, library: { characters: lib.characters.filter((c) => castPool.includes(c.id)) } }, null, 2), 'application/json')}><Download aria-hidden="true" /> Tải dự án .json</button>
                <label className="vs-check"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> Cho đồng nghiệp xem dự án</label>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => void save()} disabled={busy === 'save'}><Save aria-hidden="true" /> {busy === 'save' ? 'Đang lưu…' : p.id ? 'Lưu thay đổi' : 'Lưu dự án'}</button>
              </div>
            </section>
            <section className="vs-box vs-howto">
              <h2>Cách dùng với Google Flow</h2>
              <ol>
                <li>Tạo nhân vật một lần ở tab Nhân vật, kèm 2–4 ảnh tham chiếu.</li>
                <li>Mỗi cảnh: tải ảnh tham chiếu lên Flow, dán câu lệnh của cảnh, tạo video ~8–10 giây.</li>
                <li>Tạo lần lượt cảnh 1 → cuối; nghe so giọng giữa các cảnh, cảnh nào lệch thì chỉ tạo lại cảnh đó.</li>
                <li>Ghép các cảnh theo “Hướng dẫn ghép” trong gói .md, chèn chữ và lời mời luyện tập khi dựng.</li>
                <li>Xem kỹ video thật trước khi đăng: tạo thành công chưa chắc nhân vật đã đồng nhất.</li>
              </ol>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
