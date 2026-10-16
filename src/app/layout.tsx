import type { Metadata, Viewport } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';

// Quicksand: phông chữ của bộ nhận diện EduChain Kids — nét tròn, thân thiện, có đủ dấu tiếng Việt.
// Tiêu đề dùng Bold (700), nội dung Medium (500), phụ đề Regular (400), chú thích Light (300).
const display = Quicksand({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const body = display;

export const metadata: Metadata = {
  title: 'EduChain Kids — Học vui · Khám phá · Phát triển',
  description: 'Nền tảng học tập cho học sinh tiểu học: học đúng chương trình, phát triển tư duy và khám phá thế giới theo cách vui vẻ nhất.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f8fe' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1424' },
  ],
};

// Gắn chế độ sáng/tối trước khi trang hiện ra để không bị nháy màu.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('educhain-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
