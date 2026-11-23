// Thẻ tài nguyên Cộng đồng — dùng chung cho Kho chia sẻ, Đã đăng, Đã lưu. Bấm vào thẻ → trang chi tiết (xem trước, sao chép, mở file).
import { BookOpen, ClipboardList, Copy, FileQuestion, FileText, Link2, Paperclip, Presentation, Bookmark, EyeOff, ShieldCheck, School, Globe } from 'lucide-react';
import { KIND_LABEL, LICENSE_INFO, type ResourceCard as Card, type ResourceKind } from '@/lib/community/types';
import Link from 'next/link';
import { fmtSize } from '@/lib/community/files';
import '@/styles/cdg.css';

const KIND_ICON: Record<ResourceKind, typeof BookOpen> = {
  bai_giang: Presentation, giao_an: FileText, de_kiem_tra: ClipboardList, phieu: BookOpen, cau_hoi: FileQuestion, tai_lieu: Paperclip, lien_ket: Link2,
};

export default function ResourceCard({ r, subjectName }: { r: Card; subjectName: string }) {
  const Icon = KIND_ICON[r.kind] ?? FileText;
  const lic = LICENSE_INFO[r.license];
  const meta = [subjectName, r.grade ? `Lớp ${r.grade}` : '', r.slides ? `${r.slides} trang` : '', r.file ? fmtSize(r.file.size) : '', r.link?.host.replace(/^www\./, '')].filter(Boolean).join(' · ');
  return (
    <article className={`cdg-card kind-${r.kind}`}>
      <div className="cdg-card-top">
        <span className="cdg-kind"><Icon aria-hidden="true" /> {KIND_LABEL[r.kind]}</span>
        {r.status !== 'hien' && <span className="cdg-flag"><EyeOff aria-hidden="true" /> {r.status === 'an' ? 'Đang ẩn' : 'Đã gỡ'}</span>}
      </div>
      <h3 className="cdg-title"><Link href={`/giao-vien/cong-dong/${r.id}`} className="cdg-stretch">{r.title}</Link></h3>
      {meta && <p className="cdg-meta">{meta}</p>}
      {r.lessonRef && r.lessonRef !== r.title && <p className="cdg-ref">{r.lessonRef}</p>}
      {r.summary && <p className="cdg-sum">{r.summary}</p>}
      <div className="cdg-badges">
        <span className={`cdg-lic is-${r.license}`} title={lic.desc}><ShieldCheck aria-hidden="true" /> {lic.short}</span>
        <span className="cdg-vis" title={r.visibility === 'truong' ? 'Giáo viên cùng trường' : 'Mọi giáo viên EduChain'}>
          {r.visibility === 'truong' ? <School aria-hidden="true" /> : <Globe aria-hidden="true" />}{r.visibility === 'truong' ? 'Trong trường' : 'Mọi giáo viên'}
        </span>
      </div>
      <footer className="cdg-foot">
        <span className="cdg-author"><b>{r.mine ? 'Thầy cô' : r.author.name}</b>{r.author.school && <small>{r.author.school}</small>}</span>
        <span className="cdg-stats">
          <span title="Lượt lưu"><Bookmark aria-hidden="true" className={r.saved ? 'is-on' : ''} /> {r.saves}</span>
          <span title="Lượt sao chép về sửa"><Copy aria-hidden="true" /> {r.copies}</span>
        </span>
      </footer>
    </article>
  );
}
