import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePin, studentEmail, studentPassword } from '@/lib/auth/student-credentials';

export const POLICY_VERSION = 'lop-hoc-2026-10';

/** Mã lỗi từ hàm database -> mã HTTP + lời nhắn cho giáo viên */
export function dbError(err: { code?: string; message?: string } | null): { status: number; message: string } {
  const m = err?.message ?? '';
  if (err?.code === '42501' || m.includes('not_allowed')) return { status: 403, message: 'Bạn không có quyền với lớp hoặc học sinh này.' };
  if (m.includes('consent_required')) return { status: 400, message: 'Cần xác nhận nhà trường đã có sự đồng ý của phụ huynh.' };
  if (m.includes('class_full')) return { status: 400, message: 'Lớp đã đủ 60 học sinh.' };
  if (m.includes('class_inactive')) return { status: 400, message: 'Lớp đang lưu trữ, hãy mở lại lớp trước.' };
  if (m.includes('invalid_name') || m.includes('invalid_names')) return { status: 400, message: 'Tên học sinh cần từ 1 đến 60 ký tự, tối đa 50 bạn mỗi lần.' };
  return { status: 400, message: 'Không thực hiện được. Vui lòng thử lại.' };
}

/** Tạo (hoặc đặt lại mật khẩu) tài khoản đăng nhập cho học sinh với PIN mới. Trả PIN để in thẻ.
 *  PIN được lưu ở bảng student_pins (migration 0009) — chỉ giáo viên của lớp đọc được qua hàm teacher_class_pins. */
export async function issueStudentPin(studentId: string, displayName: string): Promise<{ pin: string } | { error: string }> {
  const admin = createAdminClient();
  const pin = generatePin();
  const password = studentPassword(studentId, pin);
  const { data: row } = await admin.from('students').select('user_id').eq('id', studentId).maybeSingle();

  if (row?.user_id) {
    const { error } = await admin.auth.admin.updateUserById(row.user_id as string, { password });
    if (error) return { error: 'Không đổi được PIN.' };
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: studentEmail(studentId),
      password,
      email_confirm: true,
      app_metadata: { account_type: 'student', student_id: studentId },
      user_metadata: { display_name: displayName },
    });
    if (error || !data.user) return { error: 'Không tạo được tài khoản.' };
    const { error: linkErr } = await admin.from('students').update({ user_id: data.user.id }).eq('id', studentId);
    if (linkErr) return { error: 'Không gắn được tài khoản.' };
  }
  // Lưu PIN để giáo viên xem lại (bảng chỉ máy chủ ghi; chưa chạy migration 0009 thì bỏ qua, không làm hỏng việc tạo PIN)
  await admin.from('student_pins').upsert({ student_id: studentId, pin, updated_at: new Date().toISOString() });
  await admin.from('student_login_guards').upsert({ student_id: studentId, failed_count: 0, locked_until: null, last_failed_at: null, updated_at: new Date().toISOString() });
  return { pin };
}
