'use client';

import SlideView, { SlideFrame } from '@/components/deck/SlideView';
import { studentSlide } from '@/lib/deck/fromIdeas';

const phase = { n: 'Luyện tập', c: '#2563eb' };
const samples = [
  ['Quiz', studentSlide({ q: '2 + 3 = ?', quiz: { opts: ['4', '5', '6', '7'], a: 1 } }, phase, 1, [], 'class')],
  ['Sắp xếp', studentSlide({ q: 'Xếp các số từ bé đến lớn!', sort: ['1', '2', '3', '4'] }, phase, 1, [], 'class', 1)],
  ['Kéo thả (4 ô)', studentSlide({ q: 'Kéo từng con vật vào đúng môi trường sống.', drop: { zones: [{ label: 'Rừng', ok: [0] }, { label: 'Biển', ok: [1] }, { label: 'Nông trại', ok: [2] }, { label: 'Nhà', ok: [3] }], items: [{ text: '🦊 Cáo' }, { text: '🐟 Cá' }, { text: '🐄 Bò' }, { text: '🐈 Mèo' }] }, reveal: 'Cùng kiểm tra đáp án!' }, phase, 1, [], 'class', 2)],
];

export default function SlidePreviewPage() {
  return <main style={{ minHeight: '100vh', padding: 24, background: '#f1f5f9', color: '#0f172a' }}>
    <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>Bản xem thử bố cục slide</h1>
    <p style={{ margin: '0 0 20px' }}>Ví dụ quiz, sắp xếp thứ tự và kéo thả trong cùng một bài học.</p>
    <div style={{ display: 'grid', gap: 24 }}>
      {samples.map(([title, slide]) => <section key={title as string} style={{ padding: 16, borderRadius: 16, background: 'white', boxShadow: '0 4px 18px #0f172a14' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>{title as string}</h2>
        <SlideFrame style={{ width: '100%', maxWidth: 1100 }}>
          {(scale) => <SlideView slide={slide as ReturnType<typeof studentSlide>} mode="thumb" scale={scale} />}
        </SlideFrame>
      </section>)}
    </div>
  </main>;
}
