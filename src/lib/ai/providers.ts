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
// Khi model đang dùng báo quá tải (503) / lỗi máy chủ: thử lại một lần rồi chuyển sang model nhẹ hơn cùng key miễn phí
// (mỗi model có sức chứa riêng nên thường vẫn trả lời được). Model nào tài khoản không có (404) thì bỏ qua.
const GEMINI_BUSY_FALLBACK = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
  const b = body as {
    error?: {
      message?: string;
      status?: string;
      details?: { quotaId?: string; retryDelay?: string; violations?: { quotaId?: string }[] }[];
    };
  } | null;
  const raw = b?.error?.message || `Không gọi được ${provider} (HTTP ${status}).`;
  if (/API key not valid|API_KEY_INVALID|invalid_api_key|Incorrect API key/i.test(raw)) {
    return `API key ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} không hợp lệ — kiểm tra lại key (đã copy đủ, chưa bị thu hồi).`;
  }
  if (status === 429) {
    // Google kèm mã giới hạn bị chạm (quotaId) và thời gian được hỏi lại (retryDelay) trong details —
    // hiện ra để biết bị chặn theo phút hay theo ngày.
    const details = b?.error?.details ?? [];
    const quota = details.map((x) => x.quotaId ?? x.violations?.[0]?.quotaId).find(Boolean) ?? '';
    const delay = details.map((x) => x.retryDelay).find(Boolean) ?? '';
    const perDay = /PerDay/i.test(quota);
    return `Gemini hết lượt (429${quota ? ` · ${quota}` : ''}${delay ? ` · hỏi lại sau ${delay}` : ''}) — ${perDay ? 'hết lượt của HÔM NAY, mai hỏi tiếp' : 'nghỉ khoảng 1 phút rồi hỏi tiếp'}; hoặc nối thêm key GPT ở Cài đặt API để có phương án dự phòng.`;
  }
  if (status === 503) return `Máy chủ ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} đang quá tải — thử lại sau ít phút, hoặc chuyển sang nhà cung cấp khác trong Cài đặt API.`;
  return raw;
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

/** Đọc Response SSE (data: {json} mỗi dòng) và nhả ra stream chữ đã ghép từ các phần phản hồi. */
function sseTextStream(res: Response, kind: 'gemini' | 'openai'): ReadableStream<Uint8Array> {
  type SsePayload = { candidates?: { content?: { parts?: { text?: string }[] } }[]; choices?: { delta?: { content?: string } }[] };
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const pick = (json: SsePayload) =>
    kind === 'gemini'
      ? (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
      : (json.choices?.[0]?.delta?.content ?? '');
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      let buf = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, idx).replace(/\r$/, '');
            buf = buf.slice(idx + 1);
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const text = pick(JSON.parse(payload) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; choices?: { delta?: { content?: string } }[] });
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* dòng JSON hỏng giữa đường: bỏ qua */ }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

/** Chat streaming (SSE) — chữ về từng phần. Cùng cơ chế tự đổi model / tắt thinking như bản không stream. */
export async function streamChatCompletion(
  provider: ProviderId,
  key: string,
  opts: ChatOptions,
): Promise<{ ok: true; stream: ReadableStream<Uint8Array>; model: string; busy?: boolean } | { ok: false; error: string; httpStatus?: number }> {
  const k = key.trim();
  const maxTokens = opts.maxTokens ?? 1600;
  const messages = [{ role: 'system', content: opts.system }, ...opts.messages.map((m) => ({ role: m.role, content: m.content }))];
  try {
    if (provider === 'gemini') {
      const call = (model: string, noThinking: boolean) => fetch(`${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(k)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: opts.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        }),
        signal: AbortSignal.timeout(55_000),
      });
      let model = opts.model;
      let noThinking = true;
      let waited429 = false;
      let busy = false;
      const spare = GEMINI_BUSY_FALLBACK.filter((m) => m !== opts.model);
      for (let tries = 0; tries < 9; tries++) {
        const res = await call(model, noThinking);
        if (res.status === 200 && res.body) return { ok: true, stream: sseTextStream(res, 'gemini'), model, busy };
        // quá tải / lỗi máy chủ: chuyển sang model dự phòng cùng key (không lưu làm mặc định)
        if ((res.status === 503 || res.status === 500 || res.status === 502 || (busy && res.status === 404)) && spare.length) {
          model = spare.shift()!; busy = true; noThinking = true; await sleep(400); continue;
        }
        const msg = apiError(await res.json().catch(() => null), res.status, 'gemini');
        const alt = /use models\/([a-z0-9.-]+)/i.exec(msg)?.[1];
        if (alt && alt !== model) { model = alt; continue; }
        if (/thinking/i.test(msg) && noThinking) { noThinking = false; continue; }
        // Gói miễn phí giới hạn ~10 lượt/phút: tự nghỉ 22 giây rồi thử lại một lần —
        // thầy cô chỉ thấy "Đang soạn…" dài thêm chút thay vì nhận thông báo lỗi.
        // Hết lượt NGÀY (PerDay) thì chờ vô ích — báo luôn.
        if (res.status === 429 && !waited429 && !/PerDay/i.test(msg)) { waited429 = true; await new Promise((r) => setTimeout(r, 22_000)); continue; }
        return { ok: false, error: msg, httpStatus: res.status };
      }
      return { ok: false, error: 'Không gọi được Gemini sau các lần thử.' };
    }
    const newGen = /^(gpt-5|o\d)/.test(opts.model);
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k}` },
      body: JSON.stringify({ model: opts.model, messages, stream: true, ...(newGen ? { max_completion_tokens: maxTokens } : { temperature: 0.7, max_tokens: maxTokens }) }),
      signal: AbortSignal.timeout(55_000),
    });
    if (res.status === 200 && res.body) return { ok: true, stream: sseTextStream(res, 'openai'), model: opts.model };
    return { ok: false, error: apiError(await res.json().catch(() => null), res.status, 'openai'), httpStatus: res.status };
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') return { ok: false, error: 'Model trả lời quá chậm — thử câu ngắn hơn hoặc thử lại.' };
    return { ok: false, error: 'Không kết nối được tới nhà cung cấp AI — kiểm tra mạng rồi thử lại.' };
  }
}

/** Gọi chat (không stream) và trả văn bản trả lời. */
export async function chatCompletion(provider: ProviderId, key: string, opts: ChatOptions): Promise<ProviderResult<{ text: string; model: string; busy?: boolean }>> {
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
      let busy = false; // trả lời bằng model dự phòng lúc quá tải — không lưu làm model mặc định
      let noThinking = true;
      let res = await call(model, noThinking);
      for (let tries = 0; tries < 3 && res.status !== 200; tries++) {
        const msg = apiError(res.body, res.status, 'gemini');
        const alt = /use models\/([a-z0-9.-]+)/i.exec(msg)?.[1];
        if (alt && alt !== model) { model = alt; res = await call(model, noThinking); continue; }
        if (/thinking/i.test(msg) && noThinking) { noThinking = false; res = await call(model, noThinking); continue; }
        return { ok: false, error: msg, httpStatus: res.status };
      }
      if (res.status === 503 || res.status === 500 || res.status === 502) {
        const first = res;
        for (const alt of [model, ...GEMINI_BUSY_FALLBACK.filter((m) => m !== model)]) {
          await sleep(alt === model ? 2500 : 400);
          let r2 = await call(alt, true);
          if (r2.status !== 200 && /thinking/i.test(apiError(r2.body, r2.status, 'gemini'))) r2 = await call(alt, false);
          if (r2.status === 200) { res = r2; model = alt; busy = alt !== opts.model; break; }
          if (r2.status === 429) break; // hết lượt của key: đổi model cũng không giúp
        }
        if (res.status !== 200) res = first;
      }
      if (res.status !== 200) return { ok: false, error: apiError(res.body, res.status, 'gemini'), httpStatus: res.status };
      const parts = (res.body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? '').join('').trim();
      if (!text) return { ok: false, error: 'Gemini trả về đáp án rỗng — thử gửi lại câu hỏi.' };
      return { ok: true, data: { text, model, busy } };
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
