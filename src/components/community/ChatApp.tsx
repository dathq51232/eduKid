'use client';

// Tin nhắn giữa thầy cô cùng trường (kiểu Zalo): danh sách cuộc trò chuyện bên trái, nội dung bên phải (điện thoại: một cột).
// Trò chuyện riêng (1-1) và nhóm; gửi chữ, tài liệu, ảnh (≤ 20 MB). Dữ liệu: hàm chat_* (migration 0080).
// Tin mới đến ngay qua Supabase Realtime (bảng chat_messages, RLS chỉ cho thành viên); dự phòng tải lại mỗi 20 giây.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, Image as ImageIcon, LogOut, MessageCirclePlus, Paperclip, Search, SendHorizontal, Trash2, UserPlus, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ACCEPT, fileProblem, fileUrl, fmtSize, isImage, uploadFile, type FileMeta } from '@/lib/community/files';
import { fold } from '@/lib/classroom/teacher-nav';
import '@/styles/cdg.css';

type Thread = { id: string; kind: 'rieng' | 'nhom'; title: string; lastAt: string; lastPreview: string; lastMine: boolean; isAdmin: boolean; members: number; other: string | null; unread: number };
type Msg = { id: string; sender: string; senderName: string; mine: boolean; body: string; file: FileMeta | null; deleted: boolean; createdAt: string };
type Teacher = { id: string; name: string };
type Picker = { mode: 'rieng' | 'nhom' | 'them'; title: string; chosen: string[]; q: string } | null;

const ERR: Record<string, string> = {
  not_allowed: 'Thầy cô không có quyền thực hiện việc này.', rate_limited: 'Gửi nhanh quá, thầy cô chờ một chút rồi gửi lại.',
  title_required: 'Đặt tên nhóm (ít nhất 2 chữ).', empty_message: 'Tin nhắn đang trống.', bad_file: 'File không hợp lệ.',
};
const MISSING = /could not find the function|PGRST202|does not exist/i;
const errText = (m?: string) => (m && MISSING.test(m) ? 'Tin nhắn chưa được bật trên máy chủ (cần chạy migration 0080).' : null)
  ?? (m && Object.entries(ERR).find(([k]) => m.includes(k))?.[1]) ?? 'Chưa thực hiện được, thầy cô thử lại.';
const initials = (name: string) => name.trim().split(/\s+/).slice(-1)[0]?.charAt(0).toUpperCase() ?? '?';
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
function timeLabel(iso: string, withDay = false) {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, new Date())) return hm;
  const dm = `${d.getDate()}/${d.getMonth() + 1}`;
  return withDay ? `${hm} · ${dm}` : dm;
}

/** File trong tin nhắn: ảnh hiện thu nhỏ, tài liệu hiện tên + cỡ; bấm để mở bằng link ký (10 phút) */
function FileChip({ f }: { f: FileMeta }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage(f.mime)) return;
    let live = true;
    void fileUrl(createClient(), f.path).then((u) => { if (live) setSrc(u); });
    return () => { live = false; };
  }, [f.path, f.mime]);
  const open = async () => { const u = await fileUrl(createClient(), f.path); if (u) window.open(u, '_blank', 'noopener'); };
  if (isImage(f.mime)) return (
    <button type="button" className="cdg-msg-img" onClick={open} title={`Mở ảnh ${f.name}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh qua link ký Supabase, hết hạn sau 10 phút: không qua bộ tối ưu ảnh */}
      {src ? <img src={src} alt={f.name} loading="lazy" /> : <span><ImageIcon aria-hidden="true" /> {f.name}</span>}
    </button>
  );
  return (
    <button type="button" className="cdg-msg-file" onClick={open} title="Mở / tải file">
      <FileText aria-hidden="true" /><span><b>{f.name}</b><small>{fmtSize(f.size)}</small></span>
    </button>
  );
}

export default function ChatApp({ meId }: { meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get('t');
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [missing, setMissing] = useState(false); // chưa chạy migration 0080
  const listEnd = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const active = threads?.find((t) => t.id === activeId) ?? null;
  const go = useCallback((id: string | null) => router.push(id ? `/giao-vien/cong-dong/tin-nhan?t=${id}` : '/giao-vien/cong-dong/tin-nhan'), [router]);

  const loadThreads = useCallback(async () => {
    const { data, error } = await sb.rpc('chat_threads_list');
    if (!error) setThreads((data ?? []) as Thread[]);
    else { setThreads((t) => t ?? []); if (MISSING.test(`${error.code} ${error.message}`)) setMissing(true); }
  }, [sb]);
  const loadMsgs = useCallback(async (id: string, quiet = false) => {
    if (!quiet) setLoadingMsgs(true);
    const { data, error } = await sb.rpc('chat_messages_list', { p_thread: id, p_limit: 80 });
    if (activeRef.current !== id) return;
    if (!error) {
      setMsgs((data ?? []) as Msg[]);
      void sb.rpc('chat_mark_read', { p_thread: id }).then(() => setThreads((ts) => ts?.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) ?? ts));
    }
    setLoadingMsgs(false);
  }, [sb]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => { setMsgs([]); setNote(''); if (activeId) void loadMsgs(activeId); }, [activeId, loadMsgs]);
  useEffect(() => { listEnd.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, activeId]);

  // Realtime: mọi thay đổi ở chat_messages mà mình được đọc (RLS) → tải lại danh sách + cuộc đang mở. Gom trong 300 ms.
  useEffect(() => {
    let timer: number | null = null;
    const refresh = (threadId?: string) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void loadThreads();
        const cur = activeRef.current;
        if (cur && (!threadId || threadId === cur)) void loadMsgs(cur, true);
      }, 300);
    };
    const ch = sb.channel(`chat-${meId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (p) => refresh((p.new as { thread_id?: string })?.thread_id))
      .subscribe();
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 20000);
    return () => { if (timer) window.clearTimeout(timer); window.clearInterval(poll); void sb.removeChannel(ch); };
  }, [sb, meId, loadThreads, loadMsgs]);

  const send = async (file?: File) => {
    if (!activeId || busy) return;
    const body = text.trim();
    if (!body && !file) return;
    setBusy(true); setNote('');
    try {
      let meta: FileMeta | null = null;
      if (file) {
        const bad = fileProblem(file);
        if (bad) { setNote(bad); return; }
        meta = await uploadFile(sb, `chat/${activeId}`, file);
      }
      const { error } = await sb.rpc('chat_send', { p_thread: activeId, p_body: file ? '' : body, p_file: meta });
      if (error) { setNote(errText(error.message)); return; }
      if (!file) setText('');
      await Promise.all([loadMsgs(activeId, true), loadThreads()]);
    } catch (e) {
      setNote(`Chưa gửi được file: ${(e as Error).message}`);
    } finally { setBusy(false); }
  };

  const recall = async (id: string) => {
    if (!window.confirm('Thu hồi tin nhắn này? Mọi người sẽ thấy “Tin đã thu hồi”.')) return;
    const { error } = await sb.rpc('chat_delete_message', { p_id: id });
    if (error) setNote(errText(error.message)); else if (activeId) void loadMsgs(activeId, true);
  };

  const openPicker = async (mode: 'rieng' | 'nhom' | 'them') => {
    setPicker({ mode, title: '', chosen: [], q: '' });
    if (!teachers) {
      const { data } = await sb.rpc('chat_teachers');
      setTeachers((data ?? []) as Teacher[]);
    }
  };
  const confirmPicker = async () => {
    if (!picker) return;
    setBusy(true);
    try {
      if (picker.mode === 'rieng') {
        const { data, error } = await sb.rpc('chat_open_direct', { p_user: picker.chosen[0] });
        if (error) return setNote(errText(error.message));
        setPicker(null); await loadThreads(); go(data as string);
      } else if (picker.mode === 'nhom') {
        const { data, error } = await sb.rpc('chat_create_group', { p_title: picker.title, p_members: picker.chosen });
        if (error) return setNote(errText(error.message));
        setPicker(null); await loadThreads(); go(data as string);
      } else if (activeId) {
        const { error } = await sb.rpc('chat_add_members', { p_thread: activeId, p_members: picker.chosen });
        if (error) return setNote(errText(error.message));
        setPicker(null); await loadThreads();
      }
    } finally { setBusy(false); }
  };
  const leave = async () => {
    if (!activeId || !window.confirm('Rời nhóm này? Thầy cô sẽ không nhận tin của nhóm nữa.')) return;
    const { error } = await sb.rpc('chat_leave', { p_thread: activeId });
    if (error) setNote(errText(error.message)); else { await loadThreads(); go(null); }
  };

  const shown = (threads ?? []).filter((t) => !filter || fold(t.title).includes(fold(filter)));
  const pickList = (teachers ?? []).filter((t) => !picker?.q || fold(t.name).includes(fold(picker.q)));

  return (
    <div className={`cdg-chat${activeId ? ' has-active' : ''}`}>
      {missing && <p className="cdg-note cdg-chat-missing" role="alert">Tin nhắn chưa được bật trên máy chủ: quản trị cần chạy migration supabase/migrations/0080_community_chat.sql trên Supabase, rồi tải lại trang.</p>}
      <aside className="cdg-chat-list" aria-label="Cuộc trò chuyện">
        <div className="cdg-chat-list-top">
          <label className="cdg-q is-small"><Search aria-hidden="true" /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Tìm cuộc trò chuyện" aria-label="Tìm cuộc trò chuyện" /></label>
          <button type="button" className="cdg-icon" onClick={() => openPicker('rieng')} title="Nhắn riêng" aria-label="Nhắn riêng một đồng nghiệp"><MessageCirclePlus aria-hidden="true" /></button>
          <button type="button" className="cdg-icon" onClick={() => openPicker('nhom')} title="Tạo nhóm" aria-label="Tạo nhóm"><Users aria-hidden="true" /></button>
        </div>
        {threads === null ? <p className="cdg-chat-hint">Đang tải…</p> : shown.length === 0 ? (
          <div className="cdg-chat-hint">
            <p>{threads.length ? 'Không có cuộc trò chuyện khớp.' : 'Chưa có cuộc trò chuyện nào.'}</p>
            {!threads.length && <button type="button" className="cdg-btn" onClick={() => openPicker('rieng')}>Nhắn đồng nghiệp</button>}
          </div>
        ) : (
          <ul>
            {shown.map((t) => (
              <li key={t.id}>
                <button type="button" className={`cdg-thread${t.id === activeId ? ' is-on' : ''}${t.unread ? ' is-unread' : ''}`} onClick={() => go(t.id)}>
                  <span className={`cdg-av${t.kind === 'nhom' ? ' is-group' : ''}`} aria-hidden="true">{t.kind === 'nhom' ? <Users /> : initials(t.title)}</span>
                  <span className="cdg-thread-txt">
                    <b>{t.title}</b>
                    <small>{t.lastPreview ? `${t.lastMine ? 'Bạn: ' : ''}${t.lastPreview}` : t.kind === 'nhom' ? `${t.members} thành viên` : 'Bắt đầu trò chuyện'}</small>
                  </span>
                  <span className="cdg-thread-meta">
                    <small>{timeLabel(t.lastAt)}</small>
                    {t.unread > 0 && <span className="cdg-unread" aria-label={`${t.unread} tin chưa đọc`}>{t.unread > 99 ? '99+' : t.unread}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="cdg-chat-main" aria-label="Nội dung trò chuyện">
        {!activeId ? (
          <div className="cdg-chat-empty">
            <MessageCirclePlus aria-hidden="true" />
            <h2>Trao đổi với đồng nghiệp cùng trường</h2>
            <p>Nhắn riêng hoặc lập nhóm tổ chuyên môn; gửi giáo án, đề, ảnh (Word, Excel, PowerPoint, PDF, ảnh — tối đa 20 MB).</p>
            <div className="cdg-row"><button type="button" className="cdg-btn" onClick={() => openPicker('rieng')}>Nhắn riêng</button><button type="button" className="cdg-btn is-ghost" onClick={() => openPicker('nhom')}>Tạo nhóm</button></div>
          </div>
        ) : (
          <>
            <header className="cdg-chat-head">
              <button type="button" className="cdg-icon cdg-back" onClick={() => go(null)} aria-label="Về danh sách"><ArrowLeft aria-hidden="true" /></button>
              <span className={`cdg-av${active?.kind === 'nhom' ? ' is-group' : ''}`} aria-hidden="true">{active?.kind === 'nhom' ? <Users /> : initials(active?.title ?? '?')}</span>
              <span className="cdg-chat-title"><b>{active?.title ?? '…'}</b>{active?.kind === 'nhom' && <small>{active.members} thành viên</small>}</span>
              {active?.kind === 'nhom' && active.isAdmin && <button type="button" className="cdg-icon" onClick={() => openPicker('them')} title="Thêm thành viên" aria-label="Thêm thành viên"><UserPlus aria-hidden="true" /></button>}
              {active?.kind === 'nhom' && <button type="button" className="cdg-icon" onClick={leave} title="Rời nhóm" aria-label="Rời nhóm"><LogOut aria-hidden="true" /></button>}
            </header>
            <div className="cdg-msgs" aria-live="polite">
              {loadingMsgs && !msgs.length ? <p className="cdg-chat-hint">Đang tải tin nhắn…</p> : !msgs.length ? <p className="cdg-chat-hint">Chưa có tin nhắn. Gửi lời chào đầu tiên nhé!</p> : msgs.map((m, i) => {
                const prev = msgs[i - 1];
                const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt));
                const showName = active?.kind === 'nhom' && !m.mine && (newDay || prev?.sender !== m.sender);
                return (
                  <div key={m.id}>
                    {newDay && <p className="cdg-day">{new Date(m.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</p>}
                    <div className={`cdg-msg${m.mine ? ' is-mine' : ''}`}>
                      {showName && <small className="cdg-msg-name">{m.senderName}</small>}
                      <div className="cdg-bubble">
                        {m.deleted ? <i className="cdg-recalled">Tin đã thu hồi</i> : <>
                          {m.file && <FileChip f={m.file} />}
                          {m.body && <p>{m.body}</p>}
                        </>}
                        <span className="cdg-msg-time">{timeLabel(m.createdAt, true)}</span>
                      </div>
                      {m.mine && !m.deleted && <button type="button" className="cdg-recall" onClick={() => recall(m.id)} aria-label="Thu hồi tin nhắn" title="Thu hồi"><Trash2 aria-hidden="true" /></button>}
                    </div>
                  </div>
                );
              })}
              <div ref={listEnd} />
            </div>
            {note && <p className="cdg-note" role="alert">{note}</p>}
            <form className="cdg-compose" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void send(f); }} />
              <button type="button" className="cdg-icon" onClick={() => fileInput.current?.click()} disabled={busy} title="Gửi file (tối đa 20 MB)" aria-label="Gửi file"><Paperclip aria-hidden="true" /></button>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={4000} placeholder={busy ? 'Đang gửi…' : 'Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)'}
                aria-label="Nội dung tin nhắn" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} />
              <button type="submit" className="cdg-send" disabled={busy || !text.trim()} aria-label="Gửi"><SendHorizontal aria-hidden="true" /></button>
            </form>
          </>
        )}
      </section>

      {picker && createPortal(
        <div className="cdg-modal-bg" onClick={() => setPicker(null)}>
          <div className="cdg-modal" role="dialog" aria-modal="true" aria-label={picker.mode === 'rieng' ? 'Nhắn riêng' : picker.mode === 'nhom' ? 'Tạo nhóm' : 'Thêm thành viên'} onClick={(e) => e.stopPropagation()}>
            <header><h2>{picker.mode === 'rieng' ? 'Nhắn riêng đồng nghiệp' : picker.mode === 'nhom' ? 'Tạo nhóm trò chuyện' : 'Thêm thành viên'}</h2>
              <button type="button" className="cdg-icon" onClick={() => setPicker(null)} aria-label="Đóng"><X aria-hidden="true" /></button></header>
            {picker.mode === 'nhom' && <input className="cdg-input" value={picker.title} onChange={(e) => setPicker({ ...picker, title: e.target.value })} maxLength={80} placeholder="Tên nhóm, vd. Tổ chuyên môn khối 1" aria-label="Tên nhóm" />}
            <label className="cdg-q is-small"><Search aria-hidden="true" /><input value={picker.q} onChange={(e) => setPicker({ ...picker, q: e.target.value })} placeholder="Tìm thầy cô cùng trường" aria-label="Tìm thầy cô" /></label>
            <ul className="cdg-pick">
              {teachers === null ? <li className="cdg-chat-hint">Đang tải…</li> : pickList.length === 0 ? <li className="cdg-chat-hint">{teachers.length ? 'Không tìm thấy.' : 'Trường chưa có thầy cô nào khác trên EduChain.'}</li> : pickList.map((t) => {
                const on = picker.chosen.includes(t.id);
                return (
                  <li key={t.id}>
                    <label className={on ? 'is-on' : ''}>
                      <input type={picker.mode === 'rieng' ? 'radio' : 'checkbox'} name="gv" checked={on}
                        onChange={() => setPicker({ ...picker, chosen: picker.mode === 'rieng' ? [t.id] : on ? picker.chosen.filter((x) => x !== t.id) : [...picker.chosen, t.id] })} />
                      <span className="cdg-av" aria-hidden="true">{initials(t.name)}</span>{t.name}
                    </label>
                  </li>
                );
              })}
            </ul>
            {note && <p className="cdg-note" role="alert">{note}</p>}
            <footer>
              <button type="button" className="cdg-btn is-ghost" onClick={() => setPicker(null)}>Huỷ</button>
              <button type="button" className="cdg-btn" disabled={busy || !picker.chosen.length || (picker.mode === 'nhom' && picker.title.trim().length < 2)} onClick={confirmPicker}>
                {picker.mode === 'rieng' ? 'Nhắn tin' : picker.mode === 'nhom' ? `Tạo nhóm (${picker.chosen.length + 1} người)` : `Thêm ${picker.chosen.length} người`}
              </button>
            </footer>
          </div>
        </div>,
        document.body,
      )}
      <Link href="/giao-vien/cong-dong" className="sr-only">Về Kho chia sẻ</Link>
    </div>
  );
}
