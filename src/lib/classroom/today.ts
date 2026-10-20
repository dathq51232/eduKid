// "Việc hôm nay" của giáo viên: gom từ dữ liệu sẵn có của app (giáo án đã xếp lịch, bài đã giao, kỳ đánh giá,
// học sinh chưa luyện bài) thành danh sách việc cần làm, việc sắp đến hạn. Không có lịch / danh sách việc riêng.

import { periodsFor } from './comments';
import { examsFor } from './school';

export type TodayItem = { tone: 'urgent' | 'soon' | 'info' | 'done'; title: string; detail: string; href: string; cta: string };

type PlanRow = { id: string; title: string; subject: string; teach_date: string | null; period: number | null };
type AssignmentRow = { id: string; title: string; due_at: string | null; status: string; assigned: number; done: number };

const VN = 7 * 3600_000;
const vnIso = (ms: number) => { const d = new Date(ms + VN); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
const ddmm = (ms: number) => { const d = new Date(ms + VN); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`; };
const SUBJ: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };

export function buildToday(opts: {
  classId: string; grade: number; now?: number; plans: PlanRow[] | null; assignments: AssignmentRow[] | null;
  students: number; activeLast7: number; recordsOn: boolean;
}): TodayItem[] {
  const now = opts.now ?? Date.now();
  const base = `/giao-vien/lop/${opts.classId}`;
  const items: TodayItem[] = [];
  const today = vnIso(now), tomorrow = vnIso(now + 86400_000);
  const dow = new Date(now + VN).getUTCDay(); // 0 = CN

  // 1) Giáo án hôm nay / ngày mai
  if (opts.plans) {
    const describe = (list: PlanRow[]) => list.sort((a, b) => (a.period ?? 99) - (b.period ?? 99))
      .map((p) => `${p.period ? `Tiết ${p.period}: ` : ''}${SUBJ[p.subject] ?? ''} – ${p.title}`).join(' · ');
    const t = opts.plans.filter((p) => p.teach_date === today);
    const m = opts.plans.filter((p) => p.teach_date === tomorrow);
    if (t.length) items.push({ tone: 'info', title: `Hôm nay dạy ${t.length} tiết đã soạn`, detail: describe(t), href: `${base}/ke-hoach`, cta: 'Mở giáo án' });
    const nextIsSchoolDay = ![5, 6].includes(dow); // thứ Sáu, thứ Bảy: ngày mai là cuối tuần
    if (m.length) items.push({ tone: 'done', title: `Ngày mai: đã soạn ${m.length} tiết`, detail: describe(m), href: `${base}/ke-hoach`, cta: 'Xem lại' });
    else if (nextIsSchoolDay) items.push({ tone: 'soon', title: 'Ngày mai chưa có giáo án', detail: 'Soạn nhanh từ bài trong sách: app điền sẵn yêu cầu cần đạt, hoạt động và dạng lớp còn hay sai.', href: `${base}/ke-hoach`, cta: 'Soạn giáo án' });
  }

  // 2) Bài đã giao: quá hạn chưa đóng, sắp đến hạn trong 3 ngày
  for (const a of (opts.assignments ?? []).filter((x) => x.status === 'open' && x.due_at)) {
    const due = new Date(a.due_at as string).getTime();
    const left = a.assigned - a.done;
    if (due < now && due > now - 3 * 86400_000 && left > 0) {
      items.push({ tone: 'urgent', title: `Quá hạn: “${a.title}”`, detail: `Hết hạn ${ddmm(due)} · còn ${left}/${a.assigned} em chưa làm.`, href: `${base}/giao-bai`, cta: 'Xem em chưa làm' });
    } else if (due >= now && due - now <= 3 * 86400_000) {
      items.push({ tone: left > 0 ? 'soon' : 'done', title: `Sắp hết hạn: “${a.title}”`, detail: `Hạn ${ddmm(due)} · ${a.done}/${a.assigned} em đã làm.`, href: `${base}/giao-bai`, cta: 'Theo dõi' });
    }
  }

  // 3) Học sinh chưa luyện bài 7 ngày qua
  if (opts.students > 0) {
    const idle = opts.students - opts.activeLast7;
    if (idle > 0) items.push({ tone: idle * 2 >= opts.students ? 'soon' : 'info', title: `${idle}/${opts.students} em chưa luyện bài nào 7 ngày qua`, detail: 'Giao một bài ngắn hoặc nhắn phụ huynh nhắc các em.', href: `${base}/giao-bai`, cta: 'Giao bài' });
  }

  // 4) Kỳ kiểm tra định kỳ sắp tới (trong 21 ngày)
  const exams = examsFor(opts.grade) as string[];
  const next = periodsFor(new Date(now)).filter((p) => p.exam && exams.includes(p.exam) && p.to.getTime() > now).sort((a, b) => a.to.getTime() - b.to.getTime())[0];
  if (next) {
    const days = Math.ceil((next.to.getTime() - now) / 86400_000);
    if (days <= 21) {
      const name = next.label.replace(/\s*\(.*\)$/, '');
      items.push({ tone: days <= 7 ? 'urgent' : 'soon', title: `${name}: còn khoảng ${days} ngày`, detail: `Lập ma trận, ra đề (4 mã đề, đáp án, hướng dẫn chấm)${opts.recordsOn ? '; sau khi chấm nhập điểm và nhận xét' : ''}.`, href: `${base}/de-kiem-tra`, cta: 'Lập đề' });
      if (opts.recordsOn && days <= 7) items.push({ tone: 'soon', title: 'Chuẩn bị nhận xét cuối kỳ', detail: 'App gợi ý mức đạt và lời nhận xét từ bài luyện tập + điểm kiểm tra; thầy cô sửa rồi xuất vnEdu.', href: `${base}/nhan-xet`, cta: 'Mở nhận xét' });
    }
  }

  // 5) Cuối tuần: gửi phiếu báo tiến bộ
  if (dow === 5 || dow === 6 || dow === 0) items.push({ tone: 'info', title: 'Gửi phiếu báo tiến bộ tuần', detail: 'Lời nhắn cho phụ huynh viết sẵn từ bài luyện của từng em; duyệt rồi sao chép gửi Zalo.', href: `${base}/phieu-tien-bo`, cta: 'Mở phiếu' });

  const order = { urgent: 0, soon: 1, info: 2, done: 3 } as const;
  return items.sort((a, b) => order[a.tone] - order[b.tone]);
}
