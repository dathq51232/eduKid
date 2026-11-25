import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { SKILL_GROUPS } from '@/lib/skills/hub';
import { GAMES } from '@/lib/games/catalog';

// /sitemap.xml — chỉ các trang công khai. Thêm trang công khai mới (vd. trang bài học /hoc/...) thì bổ sung ở đây.
type Entry = [path: string, priority: number, freq: 'daily' | 'weekly' | 'monthly'];

const STATIC: Entry[] = [
  ['/', 1, 'weekly'],
  ['/chon-bai', 0.9, 'weekly'],
  ['/ky-nang', 0.8, 'monthly'],
  ['/tro-choi', 0.8, 'monthly'],
  ['/tieng-anh', 0.8, 'monthly'],
  ['/luyen-chu', 0.7, 'monthly'],
  ['/co', 0.6, 'monthly'],
  ['/co/tuong', 0.5, 'monthly'],
  ['/co/vua', 0.5, 'monthly'],
  ['/thanh-tich', 0.4, 'monthly'],
  ['/demo-hoc-sinh', 0.5, 'monthly'],
  ['/dang-ky', 0.6, 'monthly'],
  ['/gop-y', 0.3, 'monthly'],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: Entry[] = [
    ...STATIC,
    ...GAMES.map((g): Entry => [`/tro-choi/${g.slug}`, 0.6, 'monthly']),
    ...SKILL_GROUPS.flatMap((g): Entry[] => [
      [`/ky-nang/${g.id}`, 0.6, 'monthly'],
      ...g.skills.map((s): Entry => [`/ky-nang/${g.id}/${s.id}`, 0.5, 'monthly']),
    ]),
  ];
  return entries.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
