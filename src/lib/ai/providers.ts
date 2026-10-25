import 'server-only';

// Gọi thẳng REST API của Google Gemini và OpenAI bằng fetch — không thêm dependency.
// Cùng một interface validateKey / chatCompletion cho cả hai nhà cung cấp để route và UI không phân nhánh.

export type ProviderId = 'gemini' | 'openai';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type ProviderResult<T> = { ok: true; data: T } | { ok: false; error: string; httpStatus?: number };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const OPENAI_BASE = 'https://api.openai.com/v1';

// Ưu tiên model rẻ/nhanh, tiếng Việt tốt; nếu tài khoản không có thì tự chọn model flash/gpt gần nhất.
// Gemini: Google ngừng cho tài khoản mới dùng model cũ dần dần (2.5-flash bị chặn với user mới 10/2026),
// nên đặt model mới nhất lên đầu; chat vẫn có cơ chế tự chuyển theo model Google khuyên dùng khi bị chặn.
const GEMINI_PREFERRED = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const OPENAI_PREFERRED = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-5-mini', 'gpt-4.1-nano', 'gpt-4o'];

const clean = (s: string) => s.replace(/^models\//, '').trim();

function pickGeminiModel(names: string[]): string | null {
  const list = names.map(clean).filter((n) => n.startsWith('gemini'));
  for (const p of GEMINI_PREFERRED) if (list.includes(p)) return p;
  const flash = list.filter((n) => n.includes('flash') && !/tts|image|live/i.test(n)).sort().reverse();
  if (flash.length) return flash[0];
  return list.find((n) => !/embedding|aqa|imagen|veo|robotics/i.test(n)) ?? null;
}

function pickOpenaiModel(ids: string[]): string | null {
  for (const p of OPENAI_PREFERRED) if (ids.includes(p)) return p;
  return ids.filter((i) => /^gpt-[45]/.test(i)).sort().at(-1) ?? ids.find((i) => i.startsWith('gpt-')) ?? null;
}

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(55_000) });
  const body = (await res.json().catch(() => null)) as unknown;
  return { status: res.status, body };
}

function apiError(body: unknown, status: number, provider: string): string {
  const b = body as { error?: { message?: string; status?: string } } | null;
  const msg = b?.error?.message || `Không gọi được ${provider} (HTTP ${status}).`;
  if (/API key not valid|API_KEY_INVALID|invalid_api_key|Incorrect API key/i.test(msg)) {
    return `API key ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} không hợp lệ — kiểm tra lại key (đã copy đủ, chưa bị thu hồi).`;
  }
  if (status === 429) return `Vượt giới hạn calls của ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} — đợi ít phút rồi thử lại (gói miễn phí giới hạn số lần mỗi phút).`;
  if (status === 503) return `Máy chủ ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} đang quá tải — thử lại sau ít phút, hoặc chuyển sang nhà cung cấp khác trong Cài đặt API.`;
  return msg;
}

/** Trả true nếu lỗi có thể retry hoặc đáng fallback sang nhà cung cấp khác (quá tải / hạn mức). */
export function isRetryable(status: number): boolean {
  return status === 429 || status === 503;
}

/** Kiểm tra key bằng cách gọi endpoint danh sách model (rẻ, không tốn token) và chọn model mặc định. */
export async function validateKey(provider: ProviderId, key: string): Promise<ProviderResult<{ model: string }>> {
  const k = key.trim();
  if (k.length < 20) return { ok: false, error: `API key ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} quá ngắn — có vẻ chưa dán đủ.` };
  try {
    if (provider === 'gemini') {
      const { status, body } = await fetchJson(`${GEMINI_BASE}/models?key=${encodeURIComponent(k)}&pageSize=200`, { method: 'GET' });
      if (status !== 200) return { ok: false, error: apiError(body, status, 'gemini') };
      const models = ((body as { models?: { name?: string }[] })?.models ?? []).map((m) => m.name ?? '');
      const model = pickGeminiModel(models);
      if (!model) return { ok: false, error: 'Key Gemini hợp lệ nhưng không tìm thấy model chat phù hợp trong tài khoản.' };
      return { ok: true, data: { model } };
    }
    const { status, body } = await fetchJson(`${OPENAI_BASE}/models`, { headers: { Authorization: `Bearer ${k}` } });
    if (status !== 200) return { ok: false, error: apiError(body, status, 'openai') };
    const ids = ((body as { data?: { id?: string }[] })?.data ?? []).map((m) => m.id ?? '');
    const model = pickOpenaiModel(ids);
    if (!model) return { ok: false, error: 'Key OpenAI hợp lệ nhưng không tìm thấy model chat (gpt-*) trong tài khoản.' };
    return { ok: true, data: { model } };
  } catch {
    return { ok: false, error: 'Không kết nối được tới nhà cung cấp AI — kiểm tra mạng rồi thử lại.' };
  }
}

export type ChatOptions = { system: string; messages: ChatMessage[]; model: string; maxTokens?: number };

/** Gọi chat (không stream) và trả văn bản trả lời. */
export async function chatCompletion(provider: ProviderId, key: string, opts: ChatOptions): Promise<ProviderResult<{ text: string; model: string }>> {
  const k = key.trim();
  const maxTokens = opts.maxTokens ?? 1600;
  try {
    if (provider === 'gemini') {
      // Model flash thế hệ mới (3.x) mặc định "suy nghĩ" (thinking) rất lâu trước khi trả lời — với chat trợ lý
      // cần nhanh nên tắt thinking (thinkingBudget 0, model flash được phép); model nào không nhận cấu hình này
      // thì thử lại không kèm nó. Kèm cơ chế chuyển model khi Google chặn model cũ với tài khoản mới.
      const call = (model: string, noThinking: boolean) => fetchJson(`${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(k)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: opts.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        }),
      });
      let model = opts.model;
      let noThinking = true;
      let res = await call(model, noThinking);
      for (let tries = 0; tries < 3 && res.status !== 200; tries++) {
        const msg = apiError(res.body, res.status, 'gemini');
        const alt = /use models\/([a-z0-9.-]+)/i.exec(msg)?.[1];
        if (alt && alt !== model) { model = alt; res = await call(model, noThinking); continue; }
        if (/thinking/i.test(msg) && noThinking) { noThinking = false; res = await call(model, noThinking); continue; }
        return { ok: false, error: msg, httpStatus: res.status };
      }
      if (res.status !== 200) return { ok: false, error: apiError(res.body, res.status, 'gemini'), httpStatus: res.status };
      const parts = (res.body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? '').join('').trim();
      if (!text) return { ok: false, error: 'Gemini trả về đáp án rỗng — thử gửi lại câu hỏi.' };
      return { ok: true, data: { text, model } };
    }
    // Model thế hệ mới (gpt-5*, o*) không nhận max_tokens/temperature như cũ.
    const newGen = /^(gpt-5|o\d)/.test(opts.model);
    const { status, body } = await fetchJson(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k}` },
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: 'system', content: opts.system }, ...opts.messages.map((m) => ({ role: m.role, content: m.content }))],
        ...(newGen ? { max_completion_tokens: maxTokens } : { temperature: 0.7, max_tokens: maxTokens }),
      }),
    });
    if (status !== 200) return { ok: false, error: apiError(body, status, 'openai'), httpStatus: status };
    const text = ((body as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? '').trim();
    if (!text) return { ok: false, error: 'OpenAI trả về đáp án rỗng — thử gửi lại câu hỏi.' };
    return { ok: true, data: { text, model: opts.model } };
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') return { ok: false, error: 'Model trả lời quá chậm — thử câu ngắn hơn hoặc thử lại.' };
    return { ok: false, error: 'Không kết nối được tới nhà cung cấp AI — kiểm tra mạng rồi thử lại.' };
  }
}
