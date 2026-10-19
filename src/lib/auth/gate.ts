import type { SupabaseClient } from '@supabase/supabase-js';
import type { Gate } from '@/lib/billing';
import { studentGradeOf } from './student-grade';

// Cổng vào phần học của người đang đăng nhập: có phải học sinh, khối lớp, còn được học không (học phí — migration 0018).
// Đọc bằng phiên đăng nhập (hàm my_learning_gate tự xác định em là ai). Chưa chạy migration 0018 thì vẫn cho học
// (chỉ giới hạn khối như cũ) để không khoá nhầm cả trường.
export async function learningGate(supabase: SupabaseClient, userId: string): Promise<Gate> {
  const { data, error } = await supabase.rpc('my_learning_gate');
  const row = (Array.isArray(data) ? data[0] : data) as Gate | undefined;
  if (!error && row) return { ...row, grade: row.grade == null ? null : Number(row.grade) };
  const grade = await studentGradeOf(supabase, userId);
  return { is_student: grade !== null, grade, active: true, reason: grade !== null ? 'free' : 'not_student', until: null };
}
