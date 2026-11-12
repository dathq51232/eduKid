/* eslint-disable @next/next/no-img-element -- hình 3D có sẵn trong public */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lightbulb, Users } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import SkillPractice from '@/components/skills/SkillPractice';
import { SKILL_GROUPS, groupById, skillById } from '@/lib/skills/hub';

type Params = { params: Promise<{ nhom: string; kn: string }> };

// chỉ các nhóm / kỹ năng có thật (đường dẫn khác → 404)
export const dynamicParams = false;

export function generateStaticParams() {
  return SKILL_GROUPS.flatMap((g) => g.skills.map((s) => ({ nhom: g.id, kn: s.id })));
}
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await params;
  const s = skillById(p.nhom, p.kn);
  return { title: s ? `${s.name} · Phát triển kỹ năng` : 'Phát triển kỹ năng' };
}

/** Một kỹ năng: mục tiêu, em cần nhớ, tình huống "Em sẽ làm gì?", thử thách ở nhà, gợi ý cho bố mẹ */
export default async function SkillPage({ params }: Params) {
  const p = await params;
  const g = groupById(p.nhom), s = skillById(p.nhom, p.kn);
  if (!g || !s) notFound();
  return (
    <>
      <LearnHeader />
      <main className="wrap kn kn-one" style={{ '--kn-tone': g.tone } as React.CSSProperties}>
        <Link href={`/ky-nang/${g.id}`} className="kn-back"><ArrowLeft aria-hidden="true" /> {g.name}</Link>
        <header className="kn-shead">
          <img src={s.icon} alt="" />
          <div>
            <p className="kn-eyebrow">{g.no} · {g.name}</p>
            <h1>{s.name}</h1>
            <p className="kn-goal">🎯 {s.goal}</p>
          </div>
          {s.href && <Link href={s.href} className="kn-open">{s.hrefLabel ?? 'Vào luyện'} <ArrowRight aria-hidden="true" /></Link>}
        </header>

        <section className="kn-card" aria-labelledby="kn-tips">
          <h2 id="kn-tips"><Lightbulb aria-hidden="true" /> Em cần nhớ</h2>
          <ol className="kn-tips">{s.tips.map((t) => <li key={t}>{t}</li>)}</ol>
        </section>

        <SkillPractice skillKey={`${g.id}/${s.id}`} scenarios={s.scenarios} mission={s.mission} />

        <section className="kn-card kn-parent" aria-labelledby="kn-parent">
          <h2 id="kn-parent"><Users aria-hidden="true" /> Gợi ý cho bố mẹ, thầy cô</h2>
          <p>{s.parent}</p>
        </section>
      </main>
    </>
  );
}
