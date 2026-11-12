/* eslint-disable @next/next/no-img-element -- hình 3D có sẵn trong public */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import { SKILL_GROUPS, groupById } from '@/lib/skills/hub';

type Params = { params: Promise<{ nhom: string }> };

// chỉ các nhóm / kỹ năng có thật (đường dẫn khác → 404)
export const dynamicParams = false;

export function generateStaticParams() {
  return SKILL_GROUPS.map((g) => ({ nhom: g.id }));
}
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const g = groupById((await params).nhom);
  return { title: g ? `${g.name} · Phát triển kỹ năng` : 'Phát triển kỹ năng' };
}

/** Một nhóm kỹ năng: các kỹ năng con (kỹ năng đã có trong app thì có thêm nút vào trang luyện sẵn có) */
export default async function SkillGroupPage({ params }: Params) {
  const g = groupById((await params).nhom);
  if (!g) notFound();
  return (
    <>
      <LearnHeader />
      <main className="wrap kn" style={{ '--kn-tone': g.tone } as React.CSSProperties}>
        <Link href="/ky-nang" className="kn-back"><ArrowLeft aria-hidden="true" /> Phát triển kỹ năng</Link>
        <header className="kn-ghead">
          <img src={g.icon} alt="" />
          <div>
            <p className="kn-eyebrow">{g.no} · {g.en}</p>
            <h1>{g.name}</h1>
            <p>{g.blurb}</p>
          </div>
        </header>
        <ul className="kn-skills">
          {g.skills.map((s) => (
            <li key={s.id}>
              <Link href={`/ky-nang/${g.id}/${s.id}`} className="kn-skill">
                <img src={s.icon} alt="" />
                <span className="kn-skill-main">
                  <b>{s.name}</b>
                  <span>{s.goal}</span>
                </span>
                <ChevronRight aria-hidden="true" className="kn-skill-go" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
