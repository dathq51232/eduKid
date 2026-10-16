'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function TeacherRequestForm({ schoolHint }: { schoolHint: string }) {
  const router = useRouter();
  const [school, setSchool] = useState(schoolHint);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await createClient().rpc('request_teacher_role', { p_school_name: school.trim(), p_note: note.trim() || null });
    setBusy(false);
    if (err) return setError(err.message.includes('invalid_school_name') ? 'Tên trường cần từ 2 đến 180 ký tự.' : 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
    router.refresh();
  };
  return (
    <form className="dash-form" onSubmit={submit}>
      <label className="adm-field"><span>Trường đang dạy</span>
        <input required minLength={2} maxLength={180} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Trường Tiểu học …" />
      </label>
      <label className="adm-field"><span>Ghi chú cho quản trị viên (không bắt buộc)</span>
        <input maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: chủ nhiệm lớp 1A" />
      </label>
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}><Send aria-hidden="true" /> Gửi yêu cầu duyệt</button>
    </form>
  );
}

export function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: err } = await createClient().rpc('teacher_create_class', { p_name: name.trim(), p_grade: grade });
    setBusy(false);
    if (err) {
      setError(err.message.includes('not_allowed') ? 'Tài khoản chưa được duyệt làm giáo viên.' : err.message.includes('too_many') ? 'Mỗi giáo viên tối đa 20 lớp.' : 'Chưa tạo được lớp.');
      return;
    }
    router.push(`/giao-vien/lop/${data}`);
  };
  return (
    <form className="dash-form is-row" onSubmit={submit}>
      <label className="adm-field"><span>Tên lớp</span>
        <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="1A" />
      </label>
      <label className="adm-field"><span>Khối</span>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
        </select>
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}><Plus aria-hidden="true" /> Tạo lớp</button>
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}
    </form>
  );
}
