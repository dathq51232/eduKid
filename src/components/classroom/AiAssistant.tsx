'use client';

// Trợ lý AI của giáo viên: nút nổi góc phải (trên ô Hẹn giờ) + bảng hội thoại.
// Dùng API key chính chủ (BYOK): thầy cô dán key Gemini (miễn phí) hoặc OpenAI trong Cài đặt API;
// key được máy chủ mã hoá lưu lại, không bao giờ trả về trình duyệt. Hội thoại chỉ giữ ở máy thầy cô.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, KeyRound, Loader2, Send, Sparkles, Trash2, X } from 'lucide-react';

type KeyStatus = { setupOk: boolean; hasOpenai: boolean; hasGemini: boolean; preferred: 'openai' | 'gemini' };
type Msg = { role: 'user' | 'assistant'; content: string };
type Provider = 'openai' | 'gemini';

const SUGGESTIONS = [
  'Soạn giáo án: Phép cộng trong phạm vi 10 (Toán lớp 1)',
  'Gợi ý 5 trò chơi khởi động tiết học',
  'Viết nhận xét tuần cho em tiến bộ về đọc',
  'Ra 10 câu trắc nghiệm bảng nhân 3 (Toán lớp 3)',
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [provider, setProvider] = useState<Provider | null>(null);
  // form cài đặt key
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [preferred, setPreferred] = useState<Provider>('gemini');
  const [saving, setSaving] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/keys');
      if (!res.ok) return null;
      const data = (await res.json()) as KeyStatus;
      setStatus(data);
      setPreferred(data.preferred);
      setProvider((p) => p ?? (data.hasGemini || data.hasOpenai ? data.preferred : null));
      return data;
    } catch {
      return null;
    }
  }, []);

  // lần đầu mở panel: tải trạng thái key; chưa nối key nào thì mở luôn phần Cài đặt API
  useEffect(() => {
    if (!open || loadedOnce.current) return;
    loadedOnce.current = true;
    void (async () => {
      const s = await refreshStatus();
      if (s && !s.hasOpenai && !s.hasGemini) setShowSettings(true);
    })();
  }, [open, refreshStatus]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, busy]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setNotice('');
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setBusy(true);
    void (async () => {
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, provider: provider ?? undefined }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          setMessages(messages); // bỏ câu hỏi vừa gửi
          setInput(q);
          if (data.code === 'no_key') { setNotice(data.error ?? 'Chưa nối API key.'); setShowSettings(true); }
          else setNotice(data.error ?? 'Không trả lời được — thử lại nhé.');
          return;
        }
        // đọc stream: chữ hiện dần từng phần
        const reader = (res.body as ReadableStream<Uint8Array>).getReader();
        const dec = new TextDecoder();
        setMessages([...next, { role: 'assistant', content: '' }]);
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value, { stream: true });
          if (chunk) { received += chunk.length; setMessages((m) => { const c = [...m]; const last = c.length - 1; c[last] = { role: 'assistant', content: (c[last]?.content ?? '') + chunk }; return c; }); }
        }
        if (!received) {
          setMessages(m => m.slice(0, -1)); // stream kết thúc mà không có chữ nào
          setNotice('Trợ lý chưa trả lời được — thử gửi lại nhé.');
        }
      } catch {
        setMessages(messages);
        setInput(q);
        setNotice('Mất kết nối giữa chừng — thử lại nhé.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const saveKeys = () => {
    if (saving) return;
    const body: Record<string, string> = {};
    if (openaiKey.trim()) body.openaiKey = openaiKey.trim();
    if (geminiKey.trim()) body.geminiKey = geminiKey.trim();
    if (status && preferred !== status.preferred) body.preferred = preferred;
    if (Object.keys(body).length === 0) { setShowSettings(false); return; }
    setSaving(true);
    setNotice('');
    void (async () => {
      try {
        const res = await fetch('/api/ai/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.ok) {
          setOpenaiKey(''); setGeminiKey('');
          await refreshStatus();
          setShowSettings(false);
        } else {
          setNotice(data.error ?? 'Không lưu được key.');
        }
      } catch {
        setNotice('Mất kết nối — kiểm tra mạng rồi thử lại.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const removeKey = (p: Provider) => {
    if (saving) return;
    setSaving(true);
    setNotice('');
    void (async () => {
      try {
        const res = await fetch('/api/ai/keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: p }) });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.ok) {
          setProvider((cur) => (cur === p ? null : cur));
          await refreshStatus();
        } else setNotice(data.error ?? 'Không gỡ được key.');
      } catch {
        setNotice('Mất kết nối — kiểm tra mạng rồi thử lại.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const hasAnyKey = status?.hasGemini || status?.hasOpenai;

  return (
    <>
      {!open && (
        <button type="button" className="aiw-btn" onClick={() => setOpen(true)} aria-label="Mở Trợ lý AI" title="Trợ lý AI">
          <Sparkles aria-hidden="true" />
        </button>
      )}
      {open && (
        <section className="aiw" aria-label="Trợ lý AI">
          <header className="aiw-head">
            <span className="aiw-head-ic" aria-hidden="true"><Bot /></span>
            <div className="aiw-head-txt">
              <b>Trợ lý AI</b>
              <span>dùng API key của thầy cô</span>
            </div>
            <div className="aiw-prov" role="group" aria-label="Chọn nhà cung cấp AI">
              <button type="button" className={provider === 'gemini' ? 'is-on' : ''} disabled={!status?.hasGemini} onClick={() => setProvider('gemini')} title="Google Gemini (miễn phí)">Gemini</button>
              <button type="button" className={provider === 'openai' ? 'is-on' : ''} disabled={!status?.hasOpenai} onClick={() => setProvider('openai')} title="OpenAI GPT">GPT</button>
            </div>
            <button type="button" className="aiw-icon" onClick={() => setShowSettings((v) => !v)} aria-label="Cài đặt API key" title="Cài đặt API key"><KeyRound aria-hidden="true" /></button>
            <button type="button" className="aiw-icon" onClick={() => setOpen(false)} aria-label="Đóng Trợ lý AI"><X aria-hidden="true" /></button>
          </header>

          {showSettings ? (
            <div className="aiw-set">
              {status && !status.setupOk && (
                <p className="aiw-warn" role="alert">Máy chủ chưa cấu hình đủ (AI_KEY_ENCRYPTION_SECRET / SUPABASE_SERVICE_ROLE_KEY) — chưa lưu được key. Xem docs/tro-ly-ai.md.</p>
              )}
              <p className="aiw-set-intro">Dán API key của riêng thầy cô — key được <b>mã hoá</b> lưu trên máy chủ, chỉ dùng cho tài khoản này. Đề nghị bắt đầu với <b>Gemini (miễn phí)</b>.</p>

              <div className="aiw-field">
                <label htmlFor="aiw-key-gemini">Google Gemini <span className="aiw-free">miễn phí</span></label>
                <input id="aiw-key-gemini" className="aiw-key" type="password" autoComplete="off" spellCheck={false} value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)} placeholder="Dán API key (bắt đầu AIza…)" />
                <p className="aiw-field-hint">
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Lấy key miễn phí tại aistudio.google.com <ExternalLink aria-hidden="true" /></a>
                  {status?.hasGemini && <span className="aiw-ok">Đã nối</span>}
                  {status?.hasGemini && <button type="button" className="aiw-del" onClick={() => removeKey('gemini')} disabled={saving}><Trash2 aria-hidden="true" />Gỡ</button>}
                </p>
              </div>

              <div className="aiw-field">
                <label htmlFor="aiw-key-openai">OpenAI (GPT) <span className="aiw-paid">tính phí theo lượt dùng</span></label>
                <input id="aiw-key-openai" className="aiw-key" type="password" autoComplete="off" spellCheck={false} value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)} placeholder="Dán API key (bắt đầu sk-…)" />
                <p className="aiw-field-hint">
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Lấy key tại platform.openai.com <ExternalLink aria-hidden="true" /></a>
                  {status?.hasOpenai && <span className="aiw-ok">Đã nối</span>}
                  {status?.hasOpenai && <button type="button" className="aiw-del" onClick={() => removeKey('openai')} disabled={saving}><Trash2 aria-hidden="true" />Gỡ</button>}
                </p>
              </div>

              <fieldset className="aiw-pref">
                <legend>Dùng mặc định</legend>
                <label><input type="radio" name="aiw-pref" checked={preferred === 'gemini'} onChange={() => setPreferred('gemini')} /> Gemini (miễn phí)</label>
                <label><input type="radio" name="aiw-pref" checked={preferred === 'openai'} onChange={() => setPreferred('openai')} /> GPT (OpenAI)</label>
              </fieldset>

              {notice && <p className="aiw-warn" role="alert">{notice}</p>}
              <div className="aiw-set-actions">
                <button type="button" className="aiw-save" onClick={saveKeys} disabled={saving}>
                  {saving ? <><Loader2 aria-hidden="true" />Đang kiểm tra key…</> : 'Lưu & kiểm tra key'}
                </button>
                <button type="button" className="aiw-ghost" onClick={() => { setShowSettings(false); setNotice(''); }} disabled={saving}>Đóng</button>
              </div>
              <p className="aiw-note">Máy chủ kiểm tra key với Google / OpenAI trước khi lưu (không tốn lượt sinh văn bản).</p>
            </div>
          ) : (
            <>
              <div className="aiw-body" ref={bodyRef}>
                {messages.length === 0 && !busy && (
                  <div className="aiw-hello">
                    <p>Chào thầy cô 👋 Em giúp soạn giáo án, ra câu hỏi, viết nhận xét, gợi ý trò chơi và xử lý tình huống lớp học. Hỏi bất cứ điều gì ạ!</p>
                    <div className="aiw-sug">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} type="button" onClick={() => send(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  m.role === 'assistant' && !m.content ? null : (
                    <div key={i} className={`aiw-m${m.role === 'user' ? ' is-me' : ' is-ai'}`}>{m.content}</div>
                  )
                ))}
                {busy && !(messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content) && (
                  <div className="aiw-m is-ai is-typing"><Loader2 aria-hidden="true" />Đang soạn câu trả lời…</div>
                )}
                {notice && <p className="aiw-notice" role="alert">{notice}</p>}
              </div>
              <footer className="aiw-foot">
                <textarea className="aiw-in" rows={2} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder={hasAnyKey ? 'Hỏi trợ lý AI… (Enter để gửi)' : 'Chưa nối API key — bấm ô khoá ở trên để dán key (Gemini miễn phí)…'}
                  aria-label="Nội dung hỏi trợ lý AI" />
                <button type="button" className="aiw-send" onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Gửi câu hỏi"><Send aria-hidden="true" /></button>
              </footer>
              <p className="aiw-note">Trả lời chỉ là gợi ý — thầy cô rà soát trước khi dùng chính thức.</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
