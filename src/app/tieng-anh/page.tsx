import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import EnglishStudio from '@/components/english/EnglishStudio';

export const metadata: Metadata = { title: 'English Journey · EduChain Kids' };

export default function EnglishPage() {
  // English Journey là kỹ năng “English Thinking & Reflex” của nhóm Ngôn ngữ & giao tiếp (Phát triển kỹ năng)
  return <><LearnHeader /><main className="wrap en-page"><Link href="/ky-nang/ngon-ngu" className="kn-back"><ArrowLeft aria-hidden="true" /> Phát triển kỹ năng · Ngôn ngữ &amp; giao tiếp</Link><EnglishStudio /></main></>;
}
