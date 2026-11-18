'use client';
// Demo "Bản đồ kiến thức" (tiến độ mẫu) cho trang /demo-hoc-sinh?lop=bando
import KnowledgeMap from './KnowledgeMap';
import { DEMO_STATE } from './knowledge-map-toan4';

export default function KnowledgeMapDemo() {
  return <KnowledgeMap state={DEMO_STATE} />;
}
