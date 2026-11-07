import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import EnglishStudio from '@/components/english/EnglishStudio';

export const metadata: Metadata = { title: 'English Journey · EduChain Kids' };

export default function EnglishPage() {
  return <><LearnHeader /><main className="wrap en-page"><EnglishStudio /></main></>;
}
