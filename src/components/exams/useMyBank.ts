'use client';

// Nạp "Ngân hàng của tôi" (migration 0044) cho một môn, một khối và đưa vào kho chọn câu của ma trận đề.
import { useCallback, useEffect, useState } from 'react';
import { bankError, listMine, registerMine, type MyQuestion } from '@/lib/bank/client';
import type { SubjectCode } from '@/lib/types';

export function useMyBank(subject: SubjectCode, grade: number) {
  const [mine, setMine] = useState<MyQuestion[] | null>(null);
  const [error, setError] = useState('');
  const [ver, setVer] = useState(0);
  const apply = useCallback((l: MyQuestion[]) => { registerMine(l); setMine(l); setVer((v) => v + 1); }, []);
  useEffect(() => {
    let live = true;
    setMine(null);
    void listMine(subject, grade).then((l) => { if (live) { apply(l); setError(''); } }, (e) => { if (live) { apply([]); setError(bankError(e)); } });
    return () => { live = false; };
  }, [subject, grade, apply]);
  const add = (rows: MyQuestion[]) => apply([...rows, ...(mine ?? [])]);
  const remove = (ids: string[]) => { const s = new Set(ids); apply((mine ?? []).filter((q) => !s.has(q.id))); };
  return { mine, error, ver, add, remove };
}
