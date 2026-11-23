'use client';

// Nút "Chia sẻ" đặt trong trình soạn bài giảng (DeckStudio) và Kế hoạch bài dạy (LessonPlanner).
// Bấm → hộp ShareDialog (tên, môn, khối, bài điền sẵn từ bài đang soạn) → đăng → mở trang tài nguyên trên Cộng đồng.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Deck } from '@/lib/deck/types';
import type { LessonPlan } from '@/lib/plans/generate';
import { publishDeck, publishPlan, shareError } from '@/lib/community/share';
import ShareDialog, { type ShareResult } from './ShareDialog';

export function ShareDeckButton({ deckId, getDeck, beforeShare, className }: { deckId: string; getDeck: () => Deck; beforeShare?: () => Promise<void>; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deck = open ? getDeck() : null;
  const submit = async ({ form }: ShareResult, onStep: (t: string) => void) => {
    const sb = createClient();
    await beforeShare?.();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) throw new Error('Phiên đăng nhập đã hết, thầy cô đăng nhập lại nhé.');
    try {
      const id = await publishDeck(sb, u.user.id, deckId, getDeck(), form, onStep);
      setOpen(false);
      router.push(`/giao-vien/cong-dong/${id}`);
    } catch (e) { throw new Error(shareError((e as Error).message)); }
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} title="Chia sẻ bài giảng cho đồng nghiệp trên Cộng đồng"><Share2 aria-hidden="true" /> Chia sẻ</button>
      {open && deck && <ShareDialog kind="bai_giang" defaults={{ title: deck.title, grade: deck.grade, subject: deck.src?.subject ?? '', lessonRef: deck.title }} onClose={() => setOpen(false)} onSubmit={submit} />}
    </>
  );
}

export function SharePlanButton({ planId, plan, className, disabledHint }: { planId: string | null; plan: LessonPlan; className?: string; disabledHint?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const submit = async ({ form }: ShareResult) => {
    if (!planId) return;
    try {
      const id = await publishPlan(createClient(), planId, plan, form);
      setOpen(false);
      router.push(`/giao-vien/cong-dong/${id}`);
    } catch (e) { throw new Error(shareError((e as Error).message)); }
  };
  return (
    <>
      <button type="button" className={className} disabled={!planId} title={planId ? 'Chia sẻ giáo án cho đồng nghiệp trên Cộng đồng' : disabledHint} onClick={() => setOpen(true)}><Share2 aria-hidden="true" /> Chia sẻ</button>
      {open && <ShareDialog kind="giao_an" defaults={{ title: plan.title, grade: plan.grade, subject: plan.subject, lessonRef: plan.title }} onClose={() => setOpen(false)} onSubmit={submit} />}
    </>
  );
}
