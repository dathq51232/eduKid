'use client';

// Xưởng video stickman (CHỈ quản trị): viết / lấy lời kể từ bài học -> tách tự động thành các cảnh 8 giây (thuật toán,
// không cần AI) -> sửa nếu cần -> chép câu lệnh từng cảnh sang Google Flow (Veo) kèm ảnh tham chiếu. Giữ nhân vật và
// bối cảnh đồng nhất theo chế độ A · Director của kaomei/stickman-video-director (MIT).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, BookOpen, Check, ClipboardCopy, CopyPlus, Download, ExternalLink, FolderOpen, Plus, Save, Scissors, Trash2, TriangleAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BUILTIN_CHARACTERS, BUILTIN_SETTINGS, MUSIC, STYLES, VOICES, styleOf, voiceOf, type LibItem, type Ratio } from '@/lib/video-studio/presets';
import { buildClipPrompt, buildPackage, checkProject, clipRefs, emptyClip, newProject, uid, type VsClip, type VsProject } from '@/lib/video-studio/prompt';
import { CLIP_SECONDS, MAX_CLIPS, autoSplit, packClips, wordLimit } from '@/lib/video-studio/split';
import { deleteProject, listProjects, loadLibrary, loadProject, saveProject, signRefs, type ProjectRow } from '@/lib/video-studio/store';
import LibraryPanel from './LibraryPanel';
import '@/styles/ct.css';
import '@/styles/btn.css';
import '@/styles/vs.css';

/** Bài học rút gọn do trang máy chủ chuyển xuống (không đưa cả kho nội dung vào trình duyệt) */
export type VsLesson = { id: string; subject: string; grade: number; title: string; unit: string; ref: string; description: string; samples: string[] };
const SUBJECT: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const DRAFT_KEY = 'vs-ban-nhap';
type Tab = 'lam' | 'nhan-vat' | 'boi-canh' | 'du-an' | 'huong-dan';
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const time = (i: number) => clock(i * CLIP_SECONDS);
const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function download(name: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'video';
/** bản nháp cũ (trước khi có cast / settingId) vẫn mở được */
const fix = (p: VsProject): VsProject => ({ ...newProject(), ...p, cast: p.cast ?? [...new Set(p.clips.flatMap((c) => c.cast))].slice(0, 3), settingId: p.settingId ?? p.clips[0]?.settingId ?? 's-lop' });

export default function VideoStudio({ lessons }: { lessons: VsLesson[] }) {
  const sb = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [tab, setTab] = useState<Tab>('lam');
  const [cloud, setCloud] = useState(false);
  const [dbChars, setDbChars] = useState<LibItem[]>([]);
  const [dbSets, setDbSets] = useState<LibItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [p, setP] = useState<VsProject>(newProject);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pick, setPick] = useState({ grade: 3, subject: 'tieng-anh', lesson: '' });

  const lib = useMemo(() => ({ characters: [...BUILTIN_CHARACTERS, ...dbChars], settings: [...BUILTIN_SETTINGS, ...dbSets] }), [dbChars, dbSets]);

  // nạp thư viện, danh sách dự án, bản nháp trên máy
  useEffect(() => {
    try { const d = localStorage.getItem(DRAFT_KEY); if (d) setP(fix(JSON.parse(d) as VsProject)); } catch { /* bỏ qua */ }
    if (!sb) return;
    void (async () => {
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
  const refreshUrls = useCallback(async () => {
    if (!sb) return;
    const paths = allRefs.split('|').filter(Boolean);
    if (paths.length) setUrls(await signRefs(sb, paths));
  }, [sb, allRefs]);
  useEffect(() => { void refreshUrls(); }, [refreshUrls]);

  const set = (patch: Partial<VsProject>) => setP((x) => ({ ...x, ...patch }));
  const setClip = (id: string, patch: Partial<VsClip>) => setP((x) => ({ ...x, clips: x.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const move = (i: number, d: -1 | 1) => setP((x) => {
    const c = [...x.clips]; const j = i + d;
    if (j < 0 || j >= c.length) return x;
    [c[i], c[j]] = [c[j], c[i]];
    return { ...x, clips: c };
  });
  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg((m) => (m === t ? '' : m)), 4500); };
  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied(null), 1600); } catch { flash('Trình duyệt chặn sao chép — bôi đen và chép tay nhé.'); }
  };

  // ---------- lời kể từ bài học ----------
  const subjects = useMemo(() => [...new Set(lessons.filter((l) => l.grade === pick.grade).map((l) => l.subject))], [lessons, pick.grade]);
  const pickList = useMemo(() => lessons.filter((l) => l.grade === pick.grade && l.subject === pick.subject), [lessons, pick.grade, pick.subject]);
  const insertLesson = () => {
    const l = lessons.find((x) => x.id === pick.lesson);
    if (!l) return;
    const brief = [
      `Xin chào các bạn! Hôm nay chúng mình cùng học bài ${l.title.replace(/^(Bài|Unit)\s*\d+[.:]?\s*/i, '')}.`,
      l.description,
      ...l.samples.slice(0, 3).map((s) => `Ví dụ: ${s.replace(/[.?!]*$/, '')}?`),
      `Cùng luyện tập bài này trên EduChain Kids nhé!`,
    ].filter(Boolean).join('\n');
    set({ brief, title: p.title === 'Video mới' ? l.title.slice(0, 100) : p.title });
  };

  // ---------- tách cảnh tự động ----------
  const voice = voiceOf(p.voiceKey);
  const cast = useMemo(() => (p.cast ?? []).map((id) => lib.characters.find((c) => c.id === id)).filter((x): x is LibItem => Boolean(x)), [p.cast, lib]);
  const setting = lib.settings.find((s) => s.id === p.settingId) ?? lib.settings[0];
  const planned = useMemo(() => packClips(p.brief, wordLimit(voice.narration)).length, [p.brief, voice.narration]);
  const split = () => {
    if (wc(p.brief) < 3) { flash('Viết lời kể (hoặc lấy từ bài học) trước khi tách cảnh.'); return; }
    if (p.clips.some((c) => c.beats.some((b) => b.trim())) && !window.confirm(`Tách lại sẽ thay ${p.clips.length} cảnh hiện tại. Tiếp tục?`)) return;
    const clips = autoSplit({ script: p.brief, narration: voice.narration, cast, settingId: setting.id, settingName: setting.name });
    set({ clips });
    flash(`Đã tách ${clips.length} cảnh × ${CLIP_SECONDS} giây. Đọc lại lời và hành động, sửa nếu cần rồi chép sang Flow.`);
  };

  // ---------- lưu / mở dự án ----------
  const save = async () => {
    if (!sb || !cloud) { flash('Chưa bật lưu dự án (migration 0064 + 0066) — bản nháp vẫn được giữ trên máy này.'); return; }
    setSaving(true);
    try {
      const id = await saveProject(sb, p, true);
      setP((x) => ({ ...x, id }));
      setProjects((await listProjects(sb)) ?? []);
      flash('Đã lưu dự án.');
    } catch (e) { flash(`Chưa lưu được: ${(e as Error).message}`); } finally { setSaving(false); }
  };
  const openProject = async (id: string) => {
    if (!sb) return;
    const r = await loadProject(sb, id);
    if (!r) { flash('Không mở được dự án.'); return; }
    setP(fix(r.project)); setTab('lam'); flash('Đã mở dự án.');
  };
  const removeProject = async (row: ProjectRow) => {
    if (!sb || !window.confirm(`Xoá dự án "${row.title}"?`)) return;
    try { await deleteProject(sb, row.id); setProjects((x) => x.filter((r) => r.id !== row.id)); if (p.id === row.id) set({ id: undefined }); } catch (e) { flash(`Chưa xoá được: ${(e as Error).message}`); }
  };
  const fresh = () => { if (window.confirm('Bắt đầu video mới? Phần chưa lưu sẽ mất.')) { setP(newProject()); setTab('lam'); } };

  const checks = useMemo(() => (p.clips.length ? checkProject(p, lib) : []), [p, lib]);
  const style = styleOf(p.styleKey);
  const ok = checks.filter((c) => c.ok).length;
  const limit = wordLimit(voice.narration);
  const nameOf = (id: string) => lib.characters.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="ct vs">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Quản trị · Google Flow (Veo) · {CLIP_SECONDS} giây/cảnh</p>
          <h1><span aria-hidden="true">🎬</span> Xưởng video stickman</h1>
        </div>
        <div className="ct-actions">
          <a className="btn btn-outline btn-sm" href="https://labs.google/fx/tools/flow" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Mở Google Flow</a>
        </div>
      </div>

      <nav className="vs-tabs" aria-label="Xưởng video">
        {([['lam', '🎬 Làm video'], ['nhan-vat', `🧍 Nhân vật (${lib.characters.length})`], ['boi-canh', `🏞️ Bối cảnh (${lib.settings.length})`], ['du-an', `📁 Dự án (${projects.length})`], ['huong-dan', '📖 Hướng dẫn']] as [Tab, string][]).map(([k, t]) => (
          <button key={k} type="button" className={tab === k ? 'is-on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t}</button>
        ))}
      </nav>
      {msg && <p className="vs-msg" role="status">{msg}</p>}

      {tab === 'nhan-vat' && <LibraryPanel kind="character" items={lib.characters} sb={sb} cloud={cloud} urls={urls} onChange={(xs) => setDbChars(xs.filter((x) => !x.builtin))} />}
      {tab === 'boi-canh' && <LibraryPanel kind="setting" items={lib.settings} sb={sb} cloud={cloud} urls={urls} onChange={(xs) => setDbSets(xs.filter((x) => !x.builtin))} />}
      {tab === 'huong-dan' && <Guide />}

      {tab === 'du-an' && (
        <div className="vs-projects">
          {!cloud && <p className="vs-warn">Chưa bật lưu dự án: chạy <code>0064_video_studio.sql</code> rồi <code>0066_video_studio_admin_only.sql</code>. Bản nháp vẫn được giữ trên máy này.</p>}
          {cloud && !projects.length && <p className="vs-muted">Chưa có dự án nào. Làm video ở tab “Làm video” rồi bấm “Lưu dự án”.</p>}
          <ul className="vs-plist">
            {projects.map((r) => (
              <li key={r.id}>
                <button type="button" className="vs-plink" onClick={() => void openProject(r.id)}><FolderOpen aria-hidden="true" /> <b>{r.title}</b>
                  <small>{new Date(r.updated_at).toLocaleString('vi-VN')}</small></button>
                <button type="button" className="vs-mini is-danger" onClick={() => void removeProject(r)}><Trash2 aria-hidden="true" /> Xoá</button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-outline btn-sm" onClick={fresh}><Plus aria-hidden="true" /> Video mới</button>
        </div>
      )}

      {tab === 'lam' && (
        <div className="vs-grid">
          <div className="vs-main">
            <section className="vs-box">
              <h2><span className="vs-step">1</span> Lời kể</h2>
              <label className="vs-field"><span>Tên video</span><input value={p.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /></label>
              <div className="vs-lesson">
                <BookOpen aria-hidden="true" />
                <span className="vs-lesson-lb">Lấy từ bài học:</span>
                <select value={pick.grade} onChange={(e) => setPick({ grade: Number(e.target.value), subject: pick.subject, lesson: '' })} aria-label="Khối">{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
                <select value={pick.subject} onChange={(e) => setPick({ ...pick, subject: e.target.value, lesson: '' })} aria-label="Môn">{subjects.map((s) => <option key={s} value={s}>{SUBJECT[s] ?? s}</option>)}</select>
                <select value={pick.lesson} onChange={(e) => setPick({ ...pick, lesson: e.target.value })} aria-label="Bài học" className="vs-grow">
                  <option value="">— Chọn bài ({pickList.length}) —</option>
                  {pickList.map((l) => <option key={l.id} value={l.id}>{l.ref && !l.title.startsWith(l.ref) ? `${l.ref} · ` : ''}{l.title}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={insertLesson} disabled={!pick.lesson}>Chèn</button>
              </div>
              <label className="vs-field"><span>Lời người dẫn chuyện — mỗi câu một ý, viết như đang kể cho các em nghe</span>
                <textarea rows={7} value={p.brief} maxLength={6000} onChange={(e) => set({ brief: e.target.value })}
                  placeholder={'Xin chào các bạn! Hôm nay Bé Chain học cách xem đồng hồ.\nKim ngắn chỉ giờ, kim dài chỉ phút.\nVì sao kim dài quay nhanh hơn?\nCùng luyện tập trên EduChain Kids nhé!'} />
              </label>
              <p className="vs-muted">{wc(p.brief)} từ · sẽ tách thành <b>{planned}</b> cảnh × {CLIP_SECONDS} giây ≈ <b>{clock(planned * CLIP_SECONDS)}</b> (mỗi cảnh ≤ {limit} từ){planned >= MAX_CLIPS ? ` · tối đa ${MAX_CLIPS} cảnh, phần dư bị bỏ` : ''}</p>
              <div className="vs-row">
                <div className="vs-field is-wide"><span>Nhân vật chính (tối đa 3)</span>
                  <div className="vs-chips">
                    {lib.characters.map((ch) => {
                      const on = (p.cast ?? []).includes(ch.id);
                      return <button key={ch.id} type="button" className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => set({ cast: on ? (p.cast ?? []).filter((x) => x !== ch.id) : [...(p.cast ?? []), ch.id].slice(-3) })}>{on && <Check aria-hidden="true" />}{ch.name}</button>;
                    })}
                    <button type="button" className="vs-chip-add" onClick={() => setTab('nhan-vat')}><Plus aria-hidden="true" /> Nhân vật mới</button>
                  </div>
                </div>
                <label className="vs-field"><span>Bối cảnh</span>
                  <select value={setting.id} onChange={(e) => set({ settingId: e.target.value })}>{lib.settings.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </label>
              </div>
              <details className="vs-adv">
                <summary>Tuỳ chọn: khổ hình {p.ratio}, {style.name.split(' (')[0].toLowerCase()}, {voice.name.split(' (')[0].toLowerCase()}</summary>
                <div className="vs-row">
                  <div className="vs-field"><span>Khổ hình</span>
                    <div className="vs-seg" role="group" aria-label="Khổ hình">
                      {(['16:9', '9:16'] as Ratio[]).map((r) => <button key={r} type="button" className={p.ratio === r ? 'is-on' : ''} aria-pressed={p.ratio === r} onClick={() => set({ ratio: r })}>{r === '16:9' ? '▭ 16:9 YouTube' : '▯ 9:16 Shorts'}</button>)}
                    </div>
                  </div>
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
              </details>
              <div className="vs-actions">
                <button type="button" className="btn btn-primary vs-big" onClick={split}><Scissors aria-hidden="true" /> Tách thành {planned || '…'} cảnh {CLIP_SECONDS} giây</button>
                <span className="vs-muted">Không cần AI: tách theo câu, tự ghép hành động cho nhân vật.</span>
              </div>
            </section>

            <section className="vs-box">
              <h2><span className="vs-step">2</span> Phân cảnh {p.clips.length > 0 && <small className="vs-muted">· {p.clips.length} cảnh · {clock(p.clips.length * CLIP_SECONDS)}</small>}</h2>
              {!p.clips.length && <p className="vs-empty">Chưa có cảnh nào. Viết lời kể ở bước 1 rồi bấm <b>Tách cảnh</b>.</p>}
              <ol className="vs-clips">
                {p.clips.map((c, i) => {
                  const showPrompt = open === c.id;
                  const refs = showPrompt ? clipRefs(p, i, lib) : [];
                  const n = wc(c.dialogue);
                  return (
                    <li key={c.id} className="vs-clip">
                      <header>
                        <b>Cảnh {i + 1}</b><span className="vs-muted">{time(i)}–{time(i + 1)} · {lib.settings.find((s) => s.id === c.settingId)?.name ?? '(bối cảnh đã xoá)'} · {c.cast.map(nameOf).join(', ') || 'không nhân vật'}</span>
                        <span className="vs-clip-tools">
                          <button type="button" className="vs-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Đưa lên"><ArrowUp aria-hidden="true" /></button>
                          <button type="button" className="vs-icon" onClick={() => move(i, 1)} disabled={i === p.clips.length - 1} aria-label="Đưa xuống"><ArrowDown aria-hidden="true" /></button>
                          <button type="button" className="vs-icon" onClick={() => setP((x) => ({ ...x, clips: [...x.clips.slice(0, i + 1), { ...c, id: uid(), firstFrame: '' }, ...x.clips.slice(i + 1)].slice(0, MAX_CLIPS) }))} aria-label="Nhân bản cảnh"><CopyPlus aria-hidden="true" /></button>
                          <button type="button" className="vs-icon is-danger" onClick={() => setP((x) => ({ ...x, clips: x.clips.filter((y) => y.id !== c.id) }))} aria-label="Xoá cảnh"><Trash2 aria-hidden="true" /></button>
                        </span>
                      </header>
                      <label className="vs-field"><span>{voice.narration === 'none' ? 'Lời đọc (ghi âm riêng khi dựng)' : 'Lời người dẫn chuyện'} <em className={n > limit ? 'vs-over' : ''}>{n}/{limit} từ</em></span>
                        <textarea rows={2} value={c.dialogue} onChange={(e) => setClip(c.id, { dialogue: e.target.value })} />
                      </label>
                      <ol className="vs-beat-view">
                        {c.beats.map((b, k) => <li key={k} lang="en"><span>{['0–3s', '3–6s', '6–8s'][k]}</span>{b || <i className="vs-muted">(trống)</i>}</li>)}
                      </ol>
                      <details className="vs-adv">
                        <summary>Sửa hình ảnh, nhân vật, bối cảnh của cảnh này</summary>
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
                        <label className="vs-field"><span>Khung đầu (tiếng Anh · trống = nối tiếp khung cuối cảnh trước)</span>
                          <input value={c.firstFrame} onChange={(e) => setClip(c.id, { firstFrame: e.target.value })} lang="en" />
                        </label>
                        <div className="vs-beats">
                          {(['0–3 giây', '3–6 giây', '6–8 giây'] as const).map((t, k) => (
                            <label key={t} className="vs-field"><span>{t} (tiếng Anh)</span>
                              <textarea rows={3} value={c.beats[k]} lang="en" onChange={(e) => { const b = [...c.beats] as VsClip['beats']; b[k] = e.target.value; setClip(c.id, { beats: b }); }} />
                            </label>
                          ))}
                        </div>
                        <div className="vs-row">
                          <label className="vs-field is-wide"><span>Khung cuối (tiếng Anh · cảnh sau nối từ đây)</span>
                            <input value={c.endFrame} onChange={(e) => setClip(c.id, { endFrame: e.target.value })} lang="en" />
                          </label>
                          <label className="vs-field"><span>Chữ chèn khi dựng (không vào Flow)</span>
                            <input value={c.overlay} maxLength={80} onChange={(e) => setClip(c.id, { overlay: e.target.value })} placeholder="3 + 4 = 7" />
                          </label>
                        </div>
                      </details>
                      <div className="vs-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy(c.id, buildClipPrompt(p, i, lib))}>{copied === c.id ? <><Check aria-hidden="true" /> Đã chép</> : <><ClipboardCopy aria-hidden="true" /> Chép câu lệnh cảnh {i + 1}</>}</button>
                        <button type="button" className="vs-mini" onClick={() => setOpen(showPrompt ? null : c.id)}>{showPrompt ? 'Ẩn câu lệnh' : 'Xem câu lệnh + ảnh tham chiếu'}</button>
                      </div>
                      {showPrompt && (
                        <div className="vs-out">
                          {refs.length > 0
                            ? <div className="vs-out-refs">
                                <p className="vs-muted">Tải các ảnh này lên Flow (Ingredients) cùng câu lệnh:</p>
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
                            : <p className="vs-muted">Cảnh này chưa có ảnh tham chiếu — thêm ảnh ở tab Nhân vật / Bối cảnh để Flow giữ hình giống hơn.</p>}
                          <pre className="vs-prompt" lang="en">{buildClipPrompt(p, i, lib)}</pre>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {p.clips.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={() => setP((x) => ({ ...x, clips: [...x.clips, emptyClip(setting.id, x.cast ?? [])].slice(0, MAX_CLIPS) }))} disabled={p.clips.length >= MAX_CLIPS}><Plus aria-hidden="true" /> Thêm cảnh trống</button>}
            </section>
          </div>

          <aside className="vs-side">
            <section className="vs-box">
              <h2><span className="vs-step">3</span> Kiểm tra và xuất</h2>
              {checks.length ? (
                <>
                  <p className="vs-muted">{ok}/{checks.length} mục đạt</p>
                  <ul className="vs-checks">
                    {checks.map((c) => <li key={c.text} className={c.ok ? 'is-ok' : 'is-bad'}>{c.ok ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}<span>{c.text}</span></li>)}
                  </ul>
                </>
              ) : <p className="vs-muted">Tách cảnh xong sẽ hiện danh sách kiểm tra ở đây.</p>}
              <div className="vs-stack">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy('all', buildPackage(p, lib))} disabled={!p.clips.length}>{copied === 'all' ? <><Check aria-hidden="true" /> Đã chép cả gói</> : <><ClipboardCopy aria-hidden="true" /> Chép cả gói câu lệnh</>}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => download(`${slug(p.title)}.md`, buildPackage(p, lib), 'text/markdown;charset=utf-8')} disabled={!p.clips.length}><Download aria-hidden="true" /> Tải gói .md</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => void save()} disabled={saving}><Save aria-hidden="true" /> {saving ? 'Đang lưu…' : p.id ? 'Lưu thay đổi' : 'Lưu dự án'}</button>
                <button type="button" className="vs-mini" onClick={fresh}><Plus aria-hidden="true" /> Video mới</button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

/** Hướng dẫn sử dụng cho quản trị viên */
function Guide() {
  return (
    <div className="vs-guide">
      <section className="vs-box">
        <h2>Làm một video trong 5 bước</h2>
        <ol className="vs-guide-steps">
          <li><b>Chuẩn bị nhân vật (làm một lần).</b> Tab <i>Nhân vật</i> → <i>Thêm nhân vật</i>: đặt tên, chọn dáng người, tóc, đồ vật nhận diện và màu. Mô tả tiếng Anh tự ghép. Nên tạo trước 2–4 ảnh tham chiếu (chính diện, nghiêng, vui, ngạc nhiên) bằng Flow hoặc công cụ vẽ ảnh rồi tải lên. Ghi chú có chữ “cô / thầy / giáo viên” thì nhân vật đó giảng bài khi tách cảnh.</li>
          <li><b>Viết lời kể.</b> Tab <i>Làm video</i>: chọn bài học rồi bấm <i>Chèn</i>, hoặc tự viết bất kỳ chủ đề nào. Mỗi câu một ý, câu ngắn. Câu hỏi (có “?”, “vì sao”, “bao nhiêu”…), câu ví dụ, phép tính và câu khen sẽ được dựng hành động riêng.</li>
          <li><b>Chọn nhân vật chính, bối cảnh rồi bấm “Tách cảnh”.</b> Mỗi cảnh dài đúng 8 giây, lời đọc ≤ 20 từ tiếng Việt (≤ 16 từ tiếng Anh). Cảnh đầu đặt vị trí nhân vật, các cảnh sau nối tiếp khung cuối của cảnh trước, cảnh cuối chào tạm biệt.</li>
          <li><b>Đọc lại và sửa.</b> Sửa lời ngay trong ô lời đọc (số từ chuyển đỏ là quá dài). Muốn đổi hành động, bối cảnh hay nhân vật của một cảnh, mở <i>Sửa hình ảnh…</i>. Phép tính tự đưa vào “Chữ chèn khi dựng” vì Veo không vẽ chữ số rõ.</li>
          <li><b>Tạo trên Google Flow.</b> Bấm <i>Mở Google Flow</i> → tạo dự án mới → với từng cảnh theo thứ tự: tải ảnh tham chiếu (nút <i>Xem câu lệnh + ảnh tham chiếu</i>) vào Ingredients, bấm <i>Chép câu lệnh cảnh N</i>, dán vào Flow, chọn 8 giây, tạo. Cảnh nào nhân vật lệch hoặc giọng khác thì chỉ tạo lại cảnh đó.</li>
        </ol>
      </section>
      <section className="vs-box">
        <h2>Ghép và đăng</h2>
        <ul className="vs-guide-tips">
          <li>Tải <i>gói .md</i>: có đủ câu lệnh, thứ tự ghép, chữ chèn cho từng cảnh — dùng khi dựng bằng CapCut hoặc phần mềm dựng phim.</li>
          <li>Ghép các cảnh theo đúng thứ tự, cắt ở chỗ khung cuối cảnh trước khớp khung đầu cảnh sau.</li>
          <li>Chèn chữ (phép tính, từ vựng), logo EduChain Kids và lời mời luyện tập ở bước dựng, không đưa vào Flow.</li>
          <li>Giọng tiếng Việt của Veo chưa chuẩn dấu: chọn giọng <i>Không lời</i> (ở Tuỳ chọn) rồi lồng tiếng bằng VoiceStudio theo lời đọc từng cảnh.</li>
          <li>Xem kỹ cả video trước khi đăng: tạo thành công chưa chắc nhân vật đã giống nhau ở mọi cảnh.</li>
        </ul>
      </section>
      <section className="vs-box">
        <h2>Mẹo cho kết quả đẹp</h2>
        <ul className="vs-guide-tips">
          <li>Mỗi video 1–3 nhân vật; mỗi nhân vật một đồ vật và một màu riêng để Veo không nhầm.</li>
          <li>Video ngắn 6–10 cảnh (≈ 1 phút) cho Shorts; 15–30 cảnh cho bài giảng YouTube.</li>
          <li>Nội dung an toàn cho trẻ: không cảnh đáng sợ, không bạo lực; câu lệnh đã có sẵn điều cấm này.</li>
          <li>Dự án lưu ở tab <i>Dự án</i>, mọi quản trị viên cùng xem và sửa được. Bản nháp đang làm luôn được giữ trên máy này.</li>
        </ul>
      </section>
    </div>
  );
}
