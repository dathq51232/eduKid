import { Lightbulb } from 'lucide-react';
import type { Knowledge } from '@/lib/content/knowledge';

/** Ô "Kiến thức cần nhớ" ở màn hình bắt đầu làm bài (mở sẵn, có thể thu gọn) */
export default function KnowledgeCard({ knowledge }: { knowledge: Knowledge }) {
  return (
    <details className="knowledge-card" open>
      <summary>
        <Lightbulb size={20} aria-hidden="true" />
        <span>Kiến thức cần nhớ</span>
      </summary>
      <ul>
        {knowledge.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {knowledge.example && (
        <div className="knowledge-example">
          <span className="knowledge-example-label">Ví dụ</span>
          {/* Ví dụ nhiều dòng là phép tính đặt cột: dùng chữ đều cột để các chữ số thẳng hàng */}
          <pre className={knowledge.example.includes('\n') ? 'is-column' : undefined}>{knowledge.example}</pre>
          {knowledge.note && <p className="knowledge-note">{knowledge.note}</p>}
        </div>
      )}
    </details>
  );
}
