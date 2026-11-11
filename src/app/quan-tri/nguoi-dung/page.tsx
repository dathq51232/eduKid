import { Suspense } from 'react';
import UsersManager from '@/components/admin/UsersManager';

export default function UsersPage() {
  // UsersManager đọc ?q=, ?vai=, ?moi= trên địa chỉ trang
  return (
    <Suspense fallback={null}>
      <UsersManager />
    </Suspense>
  );
}
