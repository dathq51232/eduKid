'use client';
// Demo "Bản đồ kiến thức" (tiến độ mẫu) cho trang /demo-hoc-sinh?lop=bando (thêm &khoi=1…5 để xem khối khác)
import { useEffect, useState } from 'react';
import KnowledgeMap from './KnowledgeMap';
import { DEMO_STATE } from './knowledge-map-toan4';
import { MAPS } from './knowledge-maps';
import type { MapState } from './knowledge-map-types';

/** tiến độ mẫu cho khối chưa có bộ mẫu riêng: vài trạm sáng, một trạm cần ôn, một trạm đang học */
function sampleState(grade: number): MapState {
  const levels = [5, 4, 3, 2, 3, 1, 4, 2];
  return Object.fromEntries(MAPS[grade].nodes.map((n, i) => [n.id, { level: i < levels.length ? levels[i] : 0, weak: i === 3, current: i === 5 }]));
}

export default function KnowledgeMapDemo() {
  const [grade, setGrade] = useState(4);
  useEffect(() => {
    const k = Number(new URLSearchParams(location.search).get('khoi'));
    if (MAPS[k]) setGrade(k);
  }, []);
  return <KnowledgeMap grade={grade} state={grade === 4 ? DEMO_STATE : sampleState(grade)} />;
}
