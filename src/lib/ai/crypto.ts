import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Mã hoá API key của giáo viên trước khi lưu database (AES-256-GCM).
// Khóa mã hoá suy ra từ biến môi trường AI_KEY_ENCRYPTION_SECRET — chỉ đặt ở máy chủ,
// không bao giờ đặt tên NEXT_PUBLIC_*. Đổi chuỗi này = các key đã lưu thành rác (thầy cô nhập lại).
// Định dạng lưu: v1:<iv hex>:<tag hex>:<cipher hex>.

export function hasKeyEncryptionSecret(): boolean {
  const s = process.env.AI_KEY_ENCRYPTION_SECRET;
  return typeof s === 'string' && s.trim().length >= 16;
}

function deriveKey(): Buffer {
  const s = process.env.AI_KEY_ENCRYPTION_SECRET?.trim();
  if (!s || s.length < 16) throw new Error('Thiếu biến môi trường AI_KEY_ENCRYPTION_SECRET (≥ 16 ký tự). Xem docs/tro-ly-ai.md.');
  return createHash('sha256').update(s).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', deriveKey(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('hex'), c.getAuthTag().toString('hex'), enc.toString('hex')].join(':');
}

/** Giải mã chuỗi do encryptSecret sinh ra; trả null nếu sai khóa hoặc dữ liệu hỏng. */
export function decryptSecret(payload: string): string | null {
  try {
    const [v, ivHex, tagHex, dataHex] = payload.split(':');
    if (v !== 'v1' || !ivHex || !tagHex || !dataHex) return null;
    const d = createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivHex, 'hex'));
    d.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([d.update(Buffer.from(dataHex, 'hex')), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}
