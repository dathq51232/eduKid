import { STATUS_LABEL, type LessonStatus } from '@/lib/admin/types';

export default function StatusBadge({ status }: { status: LessonStatus }) {
  return <span className={`adm-badge is-${status}`}>{STATUS_LABEL[status]}</span>;
}
