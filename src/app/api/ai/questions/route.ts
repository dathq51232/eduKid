import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { countTodayUsage, loadTeacherAiConfig, logAiUsage } from '@/lib/ai/teacher-keys';
import { chatCompletion, isRetryable, type ProviderId } from '@/lib/ai/providers';

// Sinh câu hỏi (thường là mức 3 – vận dụng) cho "Ngân hàng của tôi" bằng API key chính chủ của thầy cô (migration 0030).
// Tài liệu nguồn do thầy cô nạp (Word, PDF, Excel…) được đọc trên trình duyệt; máy chủ chỉ chuyển phần chữ cho AI, không lưu.
// Kết quả là bản nháp: thầy cô duyệt từng câu trước khi lưu.

export const maxDuration = 60;
const DAILY_LIMIT = 150;

const Body = z.object({
  subject: z.enum(['toan', 'tieng-viet', 'tieng-anh']),
  grade: z.number().int().min(1).max(5),
  lessonTitle: z.string().max(200),
  muc: z.number().int().min(1).max(3),
  count: z.number().int().min(1).max(10),
  kind: z.enum(['choice', 'open', 'mix']),
  source: z.string().max(14000).default(''),
  note: z.string().max(500).default(''),
});

const SUBJECT: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const MUC: Record<number, string> = {
  1: 'Mức 1 – Nhận biết: nhắc lại, nhận ra kiến thức; áp dụng trực tiếp vào tình huống quen thuộc.',
  2: 'Mức 2 – Kết nối: kết nối, sắp xếp vài kiến thức đã học để giải quyết vấn đề tương tự.',
  3: 'Mức 3 – Vận dụng: vận dụng kiến thức vào tình huống mới, bài toán có lời văn nhiều bước, liên hệ thực tế, trả lời có lập luận.',
};

const SYSTEM = `Bạn là giáo viên tiểu học giỏi ở Việt Nam, ra câu hỏi kiểm tra theo Thông tư 27/2020/TT-BGDĐT (3 mức).
Yêu cầu bắt buộc:
- Viết câu hỏi MỚI, không chép nguyên văn câu có sẵn trong tài liệu hay sách giáo khoa; chỉ dựa vào kiến thức, ngữ liệu trong tài liệu.
- Lời văn ngắn, rõ, hợp lứa tuổi tiểu học; số liệu, kiến thức đúng phạm vi lớp đã cho.
- Đáp án phải đúng tuyệt đối; với Toán hãy tự tính lại trước khi trả lời.
- Trắc nghiệm: đúng 4 phương án, chỉ 1 phương án đúng, phương án nhiễu hợp lí; "answer" là nguyên văn phương án đúng.
- Tự luận / điền đáp án: "answer" là đáp án ngắn gọn (số kèm đơn vị, từ, câu); "explanation" là lời giải / hướng dẫn chấm ngắn.
- Không dùng hình vẽ.
Chỉ trả về JSON đúng dạng: {"questions":[{"type":"single_choice"|"fill_blank","prompt":"…","options":["…","…","…","…"],"answer":"…","explanation":"…","muc":1|2|3}]} — không thêm chữ nào ngoài JSON.`;

const Q = z.object({
  type: z.string(), prompt: z.string().min(3).max(2000), options: z.array(z.coerce.string()).max(8).optional(),
  answer: z.union([z.coerce.string(), z.array(z.coerce.string())]), explanation: z.coerce.string().max(2000).optional(), muc: z.coerce.number().optional(),
});

function parseJson(text: string) {
  const t = text.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  const raw = JSON.parse(s >= 0 && e > s ? t.slice(s, e + 1) : t) as { questions?: unknown[] } | unknown[];
  const arr = Array.isArray(raw) ? raw : raw.questions ?? [];
  return arr.map((x) => Q.safeParse(x)).filter((r) => r.success).map((r) => r.data!);
}

export async function POST(request: Request) {
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ cho AI (xem docs/tro-ly-ai.md).' }, { status: 503 });
  if (!rateLimit(`aiq:${viewer.userId}`, 6, 60_000)) return NextResponse.json({ error: 'Sinh câu nhanh quá — đợi một phút rồi thử lại nhé.' }, { status: 429 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  const b = parsed.data;

  const config = await loadTeacherAiConfig(viewer.userId);
  if (!config?.openai && !config?.gemini) return NextResponse.json({ error: 'Chưa nối API key — mở Trợ lý AI (nút góc dưới) → Cài đặt API để dán key Gemini (miễn phí) hoặc OpenAI.', code: 'no_key' }, { status: 400 });
  if ((await countTodayUsage(viewer.userId)) >= DAILY_LIMIT) return NextResponse.json({ error: `Đã dùng đủ ${DAILY_LIMIT} lượt AI hôm nay — mai làm tiếp nhé.` }, { status: 429 });

  const kind = b.kind === 'choice' ? 'tất cả là trắc nghiệm 4 phương án (single_choice)' : b.kind === 'open' ? 'tất cả là tự luận / điền đáp án (fill_blank)' : 'khoảng một nửa trắc nghiệm (single_choice), còn lại tự luận (fill_blank)';
  const user = [
    `Môn ${SUBJECT[b.subject]} lớp ${b.grade}. Bài / chủ đề: "${b.lessonTitle}".`,
    `Viết ${b.count} câu hỏi ${MUC[b.muc]}`,
    `Dạng câu: ${kind}.`,
    b.subject === 'tieng-anh' ? 'Câu hỏi viết bằng tiếng Anh đơn giản (trình độ tiểu học); explanation viết tiếng Việt.' : '',
    b.note ? `Yêu cầu thêm của giáo viên: ${b.note}` : '',
    b.source.trim() ? `Tài liệu tham khảo của giáo viên (chỉ dùng làm nguồn kiến thức, ngữ liệu):\n<tai_lieu>\n${b.source.trim()}\n</tai_lieu>` : '',
  ].filter(Boolean).join('\n');

  const order: ProviderId[] = config.preferred === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  let lastErr = 'AI chưa trả lời được, thử lại sau.';
  for (const provider of order) {
    const chosen = provider === 'openai' ? config.openai : config.gemini;
    if (!chosen) continue;
    const r = await chatCompletion(provider, chosen.key, { system: SYSTEM, messages: [{ role: 'user', content: user }], model: chosen.model, maxTokens: 4000 });
    await logAiUsage(viewer.userId, provider, chosen.model, 'questions', r.ok, r.ok ? undefined : r.error);
    if (r.ok) {
      try {
        const questions = parseJson(r.data.text).slice(0, b.count);
        if (!questions.length) throw new Error('empty');
        return NextResponse.json({ questions, provider, model: r.data.model });
      } catch {
        lastErr = 'AI trả lời sai định dạng — bấm “Sinh câu” lần nữa nhé.';
        continue;
      }
    }
    lastErr = r.error;
    if (!isRetryable(r.httpStatus ?? 0)) break;
  }
  return NextResponse.json({ error: lastErr }, { status: 502 });
}
