import { Suspense } from 'react';
import LessonsManager from '@/components/admin/LessonsManager';

export default function LessonsPage() {
  return (
    <Suspense fallback={null}>
      <LessonsManager />
    </Suspense>
  );
}
