'use client';

// Quản trị › Marketing: soạn một lần → 3 phiên bản chuẩn cho Fanpage / TikTok / Zalo, link UTM riêng từng kênh,
// chép / chia sẻ để đăng tay (Zalo cá nhân & TikTok không có API đăng), đánh dấu đã đăng, đo lượt bấm link → trang Đăng ký.
// Ảnh / video chỉ dùng trên máy để chia sẻ (không tải lên máy chủ).
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, ExternalLink, FilePlus2, ImagePlus, Save, Share2, Sparkles, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CH, CHANNELS, TEMPLATES, autoVariants, slug, withUtm, type Channel } from '@/lib/social/compose';

export type MPost = { id: string; title: string; campaign: string; link: string | null; body: string; hashtags: string; variants: Partial<Record<Channel, string>>; posted: Partial<Record<Channel, string>>; created_at: string };
export type MReport = { campaign: string; source: string; clicks: number; signups: number; last_day: string };

const EMPTY: Record<Channel, string> = { facebook: '', tiktok: '', zalo: '' };
const dayVi = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    try {
      const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0';
      document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok;
    } catch { return false; }
  }
}

export default function MarketingStudio({ posts, report }: { posts: MPost[]; report: MReport[] }) {
  const router = useRouter();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  // Địa chỉ app (đọc sau khi gắn để HTML máy chủ và trình duyệt khớp nhau)
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [campaign, setCampaign] = useState('');
  const [campEdited, setCampEdited] = useState(false);
  const [link, setLink] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('EduChainKids');
  const [v, setV] = useState<Record<Channel, string>>(EMPTY);
  const [posted, setPosted] = useState<Partial<Record<Channel, string>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const camp = campaign || slug(title) || 'chien-dich';
  const target = link || (origin ? `${origin}/` : '');
  const hasV = CHANNELS.some((c) => v[c].trim());
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && files.length > 0 && navigator.canShare({ files });

  const flash = (ok: boolean, text: string) => { setNote({ ok, text }); window.setTimeout(() => setNote(null), 4000); };
  const reset = () => { setId(null); setTitle(''); setCampaign(''); setCampEdited(false); setLink(''); setBody(''); setHashtags('EduChainKids'); setV(EMPTY); setPosted({}); setFiles([]); setConsent(false); };
  const load = (p: MPost) => {
    setId(p.id); setTitle(p.title); setCampaign(p.campaign); setCampEdited(true); setLink(p.link ?? ''); setBody(p.body); setHashtags(p.hashtags);
    setV({ ...EMPTY, ...p.variants }); setPosted(p.posted ?? {}); setFiles([]); setConsent(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    if ((body.trim() || hasV) && !window.confirm('Thay nội dung đang soạn bằng mẫu này?')) return;
    setTitle(t.title); setBody(t.body); setHashtags(t.hashtags); setV(EMPTY);
    if (!campEdited) setCampaign('');
  };
  const generate = () => {
    if (!body.trim()) { flash(false, 'Nhập nội dung gốc trước.'); return; }
    if (hasV && !window.confirm('Tạo lại 3 phiên bản? Các chỉnh sửa riêng từng kênh sẽ bị thay.')) return;
    setV(autoVariants(body, target, camp, hashtags));
  };

  const save = async (nextPosted = posted) => {
    if (!supabase) return null;
    if (!title.trim()) { flash(false, 'Nhập tiêu đề (chỉ để em quản lý, không đăng lên).'); return null; }
    setBusy(true);
    const row = { title: title.trim().slice(0, 160), campaign: camp, link: target || null, body, hashtags, variants: v, posted: nextPosted, updated_at: new Date().toISOString() };
    const r = id ? await supabase.from('marketing_posts').update(row).eq('id', id).select('id').single() : await supabase.from('marketing_posts').insert(row).select('id').single();
    setBusy(false);
    if (r.error || !r.data) { flash(false, 'Chưa lưu được — thử lại.'); return null; }
    const nid = (r.data as { id: string }).id;
    setId(nid); router.refresh();
    return nid;
  };

  const copy = async (c: Channel) => { const ok = await copyText(v[c]); flash(ok, ok ? `Đã chép nội dung ${CH[c].name} — dán vào bài đăng.` : 'Trình duyệt chặn chép — bôi đen và chép tay.'); };
  const share = async (c: Channel) => {
    await copyText(v[c]); // một số app (TikTok) bỏ qua chữ khi nhận tệp → chép sẵn để dán
    try {
      if (files.length && !consent) { flash(false, 'Xác nhận đã có đồng ý của phụ huynh trước khi chia sẻ ảnh / video.'); return; }
      await navigator.share(canShareFiles ? { files, text: v[c] } : { text: v[c] });
    } catch { /* em đóng bảng chia sẻ */ }
  };
  const togglePosted = async (c: Channel) => {
    const next = { ...posted };
    if (next[c]) delete next[c]; else next[c] = new Date().toISOString();
    setPosted(next);
    if (id) await save(next);
  };
  const remove = async (p: MPost) => {
    if (!supabase || !window.confirm(`Xoá bài "${p.title}"?`)) return;
    await supabase.from('marketing_posts').delete().eq('id', p.id);
    if (p.id === id) reset();
    router.refresh();
  };

  const totals = useMemo(() => {
    const m = new Map<string, { campaign: string; clicks: number; signups: number; by: MReport[] }>();
    for (const r of report) {
      const x = m.get(r.campaign) ?? { campaign: r.campaign, clicks: 0, signups: 0, by: [] };
      x.clicks += Number(r.clicks); x.signups += Number(r.signups); x.by.push(r); m.set(r.campaign, x);
    }
    return [...m.values()];
  }, [report]);

  return (
    <div className="adm-stack mk">
      <div className="mk-head">
        <div>
          <h1>📣 Marketing</h1>
          <p className="adm-muted">Soạn một lần → 3 bản chuẩn cho Fanpage, TikTok, Zalo. Mỗi bản có link theo dõi riêng (UTM) để biết kênh nào đưa người dùng tới trang Đăng ký. Đăng tay bằng nút Chép / Chia sẻ, hoặc dán vào Meta Business Suite để hẹn giờ.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={reset}><FilePlus2 aria-hidden="true" /> Bài mới</button>
      </div>

      {note && <p className={`mk-note${note.ok ? ' is-ok' : ' is-bad'}`} role="status">{note.text}</p>}

      <section className="adm-card mk-src" aria-labelledby="mk-src-h">
        <div className="mk-row-h">
          <h2 id="mk-src-h">① Nội dung gốc</h2>
          <div className="mk-tpl" role="group" aria-label="Mẫu bài">
            {TEMPLATES.map((t) => <button key={t.id} type="button" onClick={() => applyTemplate(t)}>{t.label}</button>)}
          </div>
        </div>
        <div className="mk-fields">
          <label>Tiêu đề <small>(để quản lý, không đăng)</small>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="VD: Giới thiệu app tháng 11" />
          </label>
          <label>Tên chiến dịch <small>(utm_campaign)</small>
            <input value={campEdited ? campaign : camp} onChange={(e) => { setCampEdited(true); setCampaign(slug(e.target.value)); }} maxLength={40} />
          </label>
          <label className="mk-wide">Link đích
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder={target || 'https://…'} />
          </label>
          <label className="mk-wide">Nội dung
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={6000} placeholder="Viết nội dung chính một lần — bấm “Tạo 3 phiên bản” để app chuẩn hoá cho từng kênh." />
          </label>
          <label className="mk-wide">Hashtag <small>(cách nhau bằng dấu phẩy)</small>
            <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} maxLength={500} />
          </label>
          <div className="mk-wide mk-media">
            <label className="btn btn-outline btn-sm mk-pick"><ImagePlus aria-hidden="true" /> Chọn ảnh / video để chia sẻ
              <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { setFiles(Array.from(e.target.files ?? []).slice(0, 10)); setConsent(false); }} />
            </label>
            {files.length > 0 && (
              <>
                <span className="mk-files">{files.map((f) => f.name).join(', ')} <button type="button" onClick={() => setFiles([])} aria-label="Bỏ tệp đã chọn"><X aria-hidden="true" /></button></span>
                <label className="mk-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Ảnh / video có học sinh đã được phụ huynh đồng ý cho đăng (hoặc không có học sinh)</label>
              </>
            )}
            <small className="adm-muted">Tệp chỉ nằm trên máy này để chia sẻ (điện thoại: chọn app Zalo / TikTok / Facebook), không tải lên máy chủ.</small>
          </div>
        </div>
        <div className="mk-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={generate}><Sparkles aria-hidden="true" /> Tạo 3 phiên bản</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={async () => { if (await save()) flash(true, 'Đã lưu bài.'); }} disabled={busy}><Save aria-hidden="true" /> {id ? 'Lưu thay đổi' : 'Lưu bài'}</button>
        </div>
      </section>

      {hasV && (
        <section aria-labelledby="mk-out-h" className="mk-out">
          <h2 id="mk-out-h">② Bản cho từng kênh <small>— sửa trực tiếp, rồi Chép / Chia sẻ</small></h2>
          <div className="mk-cards">
            {CHANNELS.map((c) => {
              const n = [...v[c]].length, over = n > CH[c].limit;
              return (
                <article key={c} className={`mk-card is-${c}`}>
                  <header>
                    <span className="mk-pf">{CH[c].short}</span><b>{CH[c].name}</b>
                    <span className={`mk-count${over ? ' is-over' : ''}`}>{n.toLocaleString('vi-VN')}/{CH[c].limit.toLocaleString('vi-VN')}</span>
                  </header>
                  <p className="mk-hint">{CH[c].hint}</p>
                  <textarea value={v[c]} onChange={(e) => setV({ ...v, [c]: e.target.value })} rows={10} aria-label={`Nội dung ${CH[c].name}`} />
                  {c === 'tiktok' && target && (
                    <p className="mk-bio">Link đặt ở bio: <code>{withUtm(target, 'tiktok', camp)}</code> <button type="button" onClick={async () => flash(await copyText(withUtm(target, 'tiktok', camp)), 'Đã chép link bio TikTok.')}><Copy aria-hidden="true" /> Chép</button></p>
                  )}
                  <div className="mk-card-act">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => copy(c)}><Copy aria-hidden="true" /> Chép</button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && <button type="button" className="btn btn-outline btn-sm" onClick={() => share(c)}><Share2 aria-hidden="true" /> Chia sẻ</button>}
                    <a className="btn btn-outline btn-sm" href={CH[c].open} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /> {CH[c].openLabel}</a>
                    <button type="button" className={`mk-done${posted[c] ? ' is-on' : ''}`} aria-pressed={Boolean(posted[c])} onClick={() => togglePosted(c)}>
                      <Check aria-hidden="true" /> {posted[c] ? `Đã đăng ${dayVi(posted[c]!)}` : 'Đánh dấu đã đăng'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="adm-card" aria-labelledby="mk-rep-h">
        <h2 id="mk-rep-h">③ Hiệu quả link (90 ngày)</h2>
        {!totals.length ? (
          <p className="adm-muted">Chưa có lượt bấm nào. Khi có người bấm link trong bài đăng, số liệu hiện ở đây (mỗi người tính 1 lần / ngày; không lưu thông tin cá nhân).</p>
        ) : (
          <div className="mk-table-wrap">
            <table className="mk-table">
              <thead><tr><th>Chiến dịch</th><th>Kênh</th><th className="is-n">Người bấm link</th><th className="is-n">Vào trang Đăng ký</th><th className="is-n">Tỉ lệ</th><th>Gần nhất</th></tr></thead>
              <tbody>
                {totals.map((t) => t.by.map((r, i) => (
                  <tr key={`${r.campaign}-${r.source}`} className={i === 0 ? 'is-first' : ''}>
                    {i === 0 && <td rowSpan={t.by.length}><b>{t.campaign}</b><small>{t.clicks} bấm · {t.signups} đăng ký</small></td>}
                    <td><span className={`mk-pf is-${r.source}`}>{CH[r.source as Channel]?.short ?? r.source}</span></td>
                    <td className="is-n">{Number(r.clicks).toLocaleString('vi-VN')}</td>
                    <td className="is-n">{Number(r.signups).toLocaleString('vi-VN')}</td>
                    <td className="is-n">{Number(r.clicks) ? `${Math.round((Number(r.signups) / Number(r.clicks)) * 100)}%` : '–'}</td>
                    <td>{dayVi(r.last_day)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adm-card" aria-labelledby="mk-his-h">
        <h2 id="mk-his-h">Bài đã soạn ({posts.length})</h2>
        {!posts.length ? <p className="adm-muted">Chưa có bài nào. Soạn và bấm “Lưu bài” để dùng lại sau.</p> : (
          <ul className="mk-list">
            {posts.map((p) => (
              <li key={p.id} className={p.id === id ? 'is-cur' : ''}>
                <button type="button" className="mk-list-main" onClick={() => load(p)}>
                  <b>{p.title}</b>
                  <small>{dayVi(p.created_at)} · {p.campaign}</small>
                </button>
                <span className="mk-list-ch">
                  {CHANNELS.map((c) => <span key={c} className={`mk-pf is-${c}${p.posted?.[c] ? '' : ' is-off'}`} title={p.posted?.[c] ? `${CH[c].name}: đã đăng ${dayVi(p.posted[c]!)}` : `${CH[c].name}: chưa đăng`}>{CH[c].short}{p.posted?.[c] ? ' ✓' : ''}</span>)}
                </span>
                <button type="button" className="mk-del" onClick={() => remove(p)} aria-label={`Xoá bài ${p.title}`}><Trash2 aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
