/* eslint-disable @next/next/no-img-element -- hình 3D có sẵn trong public */
import type { Metadata } from 'next';
import Link from 'next/link';
import LearnHeader from '@/components/LearnHeader';
import { SKILL_GROUPS } from '@/lib/skills/hub';

export const metadata: Metadata = { title: 'Phát triển kỹ năng · EduChain Kids' };

/** Phát triển kỹ năng (Skill Development Hub): 6 nhóm kỹ năng cho học sinh tiểu học */
export default function SkillHubPage() {
  return (
    <>
      <LearnHeader />
      <main className="wrap kn">
        <header className="kn-hero">
          <p className="kn-eyebrow">Skill Development Hub</p>
          <h1>Phát triển kỹ năng</h1>
          <p>Sáu nhóm kỹ năng giúp em tự tin, khoẻ mạnh và sống tốt mỗi ngày. Chọn một nhóm để bắt đầu nhé!</p>
        </header>
        <ul className="kn-groups">
          {SKILL_GROUPS.map((g) => (
            <li key={g.id}>
              <Link href={`/ky-nang/${g.id}`} className="kn-group" style={{ '--kn-tone': g.tone } as React.CSSProperties}>
                <span className="kn-no">{g.no}</span>
                <img src={g.icon} alt="" className="kn-group-ic" />
                <h2>{g.name}</h2>
                <p className="kn-en">{g.en}</p>
                <ul className="kn-chips" aria-label={`Kỹ năng trong nhóm ${g.name}`}>
                  {g.skills.map((s) => <li key={s.id}>{s.name}</li>)}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
