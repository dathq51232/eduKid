import type { Metadata, Viewport } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';
import VisitTracker from '@/components/VisitTracker';
import SeasonLayer from '@/components/season/SeasonLayer';
import { seasonScript } from '@/lib/season-ranges';
import { IS_INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';

// Quicksand: phông chữ của bộ nhận diện EduChain Kids — nét tròn, thân thiện, có đủ dấu tiếng Việt.
// Tiêu đề dùng Bold (700), nội dung Medium (500), phụ đề Regular (400), chú thích Light (300).
const display = Quicksand({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const body = display;

// SEO chung: tên miền chính (link tuyệt đối cho ảnh xem trước), ảnh chia sẻ Facebook / Zalo, chặn lập chỉ mục ở bản xem trước.
// Không đặt canonical ở đây (layout áp cho mọi trang con) — trang nào cần thì tự khai báo.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['học tiểu học', 'bài tập lớp 1', 'bài tập lớp 2', 'bài tập lớp 3', 'bài tập lớp 4', 'bài tập lớp 5', 'toán tiểu học', 'tiếng Việt tiểu học', 'Kết nối tri thức', 'lịch báo giảng', 'nhận xét học sinh'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'EduChain Kids — học vui cùng Milo' }],
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION, images: ['/og.jpg'] },
  robots: IS_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f8fe' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1424' },
  ],
};

// Gắn chế độ sáng/tối trước khi trang hiện ra để không bị nháy màu.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('educhain-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

// Gắn mùa lễ (Noel, Tết, 20/11…) lên <html data-season> — danh sách mùa ở src/lib/seasons.ts.
const SEASON_SCRIPT = seasonScript();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SEASON_SCRIPT }} />
      </head>
      <body>
        {children}
        <VisitTracker />
        <SeasonLayer />
      </body>
    </html>
  );
}
