import { FLUENT_CDN_GROUPS, FLUENT_CDN_VER } from './fluent-cdn-data';
import { F3D_VI } from './f3d-catalog';

/**
 * URL CDN jsDelivr cho hình Fluent Emoji 3D
 * Ảnh định dạng .webp chuẩn nén ~5KB, không lưu trên host server
 */
export const fluentCdnUrl = (code: string) =>
  `https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@${FLUENT_CDN_VER}/assets/${code}.webp`;

/**
 * Fallback CDN nếu jsDelivr bị mạng chặn hoặc quá tải
 */
export const fluentCdnFallbackUrl = (code: string) =>
  `https://fastly.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@${FLUENT_CDN_VER}/assets/${code}.webp`;

export { FLUENT_CDN_GROUPS, FLUENT_CDN_VER };

/**
 * Từ điển tìm kiếm nhanh cho 1600 hình Fluent CDN
 */
export type CdnEmojiItem = { code: string; slug: string; name: string; url: string };

const codeToNameMap = new Map<string, string>();
for (const [key, vi] of Object.entries(F3D_VI)) {
  codeToNameMap.set(key, vi);
}

export const ALL_FLUENT_CDN_ITEMS: CdnEmojiItem[] = FLUENT_CDN_GROUPS.flatMap((g) =>
  g.items.map(([code, slug]) => {
    const vi = codeToNameMap.get(slug);
    const friendlyName = vi ? `${vi} (${slug})` : slug.replace(/-/g, ' ');
    return {
      code,
      slug,
      name: friendlyName,
      url: fluentCdnUrl(code),
    };
  })
);
