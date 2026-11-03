'use client';

// Cảnh 3D (từ "Bài 3D của tôi") đặt trong một trang thao giảng: khi trình chiếu, cô kéo để xoay, cuộn để phóng to.
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizeLesson } from '@/lib/lesson3d/types';

export default function Scene3DBox({ lessonId, title }: { lessonId: string; title: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState<string | null>('Đang mở cảnh 3D…');
  useEffect(() => {
    let alive = true;
    let dispose: (() => void) | null = null;
    void (async () => {
      try {
        const { data } = await createClient().from('lessons3d').select('title, data').eq('id', lessonId).maybeSingle();
        if (!alive) return;
        if (!data) { setMsg('Không tìm thấy bài 3D này (có thể đã bị xoá).'); return; }
        const row = data as { title: string; data: unknown };
        const [{ Stage3D }, { listAssets }, { registerUserAssets }] = await Promise.all([
          import('@/lib/lesson3d/engine'), import('@/lib/assets/client'), import('@/lib/lesson3d/user-assets'),
        ]);
        try { registerUserAssets(await listAssets(['model', 'image'])); } catch { /* chưa có kho: bỏ qua */ }
        if (!alive || !el.current) return;
        const eng = new Stage3D(el.current, {});
        eng.setLesson(normalizeLesson(row.data, row.title));
        dispose = () => eng.dispose();
        setMsg(null);
      } catch { if (alive) setMsg('Chưa mở được cảnh 3D.'); }
    })();
    return () => { alive = false; dispose?.(); };
  }, [lessonId]);
  return (
    <div className="dk-scene" ref={el} onPointerDown={(e) => e.stopPropagation()}>
      {msg && <p className="dk-scene-msg">{msg}</p>}
      <span className="dk-scene-tag">🧊 {title} · kéo để xoay</span>
    </div>
  );
}
