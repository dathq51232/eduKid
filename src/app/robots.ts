import type { MetadataRoute } from 'next';
import { IS_INDEXABLE, PRIVATE_PATHS, SITE_URL } from '@/lib/site';

// /robots.txt — bản xem trước chặn hết để Google không lập chỉ mục trùng với tên miền chính
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
