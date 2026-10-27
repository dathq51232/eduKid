// Tin nhắn phụ huynh → giáo viên (migration 0037): kiểu dữ liệu và nhãn hiển thị dùng chung.
export type MsgKind = 'leave' | 'question' | 'other';
export type MsgStatus = 'new' | 'read' | 'approved' | 'declined' | 'answered';
export type ParentMsg = {
  id: string; kind: MsgKind; sender_name: string; sender_relation: string | null;
  leave_from: string | null; leave_to: string | null; body: string;
  status: MsgStatus; reply: string | null; replied_at: string | null; created_at: string;
};
export type TeacherMsg = ParentMsg & { student_id: string; student_name: string };
export type Inbox = { unread: number; pending_leave: number; items: TeacherMsg[] };

export const KIND_LABEL: Record<MsgKind, string> = { leave: 'Xin phép nghỉ', question: 'Hỏi cô', other: 'Nhắn khác' };
export const KIND_ICON: Record<MsgKind, string> = { leave: '🏥', question: '❓', other: '💬' };
export const STATUS_TEXT: Record<MsgStatus, string> = { new: 'Cô chưa xem', read: 'Cô đã xem', approved: 'Cô đã đồng ý', declined: 'Cô chưa đồng ý', answered: 'Cô đã trả lời' };

/** "Mẹ Nguyễn Thị Lan" / "Nguyễn Thị Lan" */
export const senderLabel = (m: Pick<ParentMsg, 'sender_name' | 'sender_relation'>) => (m.sender_relation ? `${m.sender_relation} ${m.sender_name}` : m.sender_name);

const ddmm = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const wd = (iso: string) => WD[new Date(`${iso}T00:00:00`).getDay()];
/** "T5 29/10 → T2 2/11" hoặc "T5 29/10" */
export const leaveRange = (m: Pick<ParentMsg, 'leave_from' | 'leave_to'>) =>
  !m.leave_from ? '' : m.leave_from === m.leave_to ? `${wd(m.leave_from)} ${ddmm(m.leave_from)}` : `${wd(m.leave_from)} ${ddmm(m.leave_from)} → ${wd(m.leave_to!)} ${ddmm(m.leave_to!)}`;

/** Thời gian tương đối: "vừa xong", "15 phút trước", "hôm qua 20:15", "12/10 08:30" */
export function ago(iso: string, now = Date.now()): string {
  const t = Date.parse(iso); const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  const d = new Date(t); const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  if (s < 86400 * 1) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 2) return `hôm qua ${hm}`;
  const day = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  return `${day} ${hm}`;
}

export const SEND_ERROR: Record<string, string> = {
  not_student: 'Hãy đăng nhập bằng tài khoản của con (mã lớp + PIN) để nhắn cô.',
  no_class: 'Con chưa vào lớp nào nên chưa nhắn cô được.',
  need_name: 'Vui lòng ghi tên người gửi.',
  need_body: 'Vui lòng nhập nội dung tin nhắn.',
  invalid_days: 'Ngày xin nghỉ chưa hợp lệ (tối đa 14 ngày, bắt đầu không quá 7 ngày trước).',
  too_many: 'Hôm nay gia đình đã gửi 10 tin. Vui lòng gọi điện hoặc nhắn Zalo cho cô nếu cần gấp.',
  missing: 'Chưa bật tính năng nhắn tin: cần chạy migration 0037_parent_messages.sql trên Supabase.',
};
export const isMissing = (msg?: string) => /function|does not exist|schema cache|Could not find/i.test(msg ?? '');
