// Soạn bài marketing đa kênh (dùng được ở cả trình duyệt và máy chủ): soạn một lần → 3 phiên bản chuẩn cho
// Fanpage / TikTok / Zalo (đăng tay), link có UTM riêng từng kênh, giới hạn ký tự, mẫu bài theo mùa.

export type Channel = 'facebook' | 'tiktok' | 'zalo';
export const CHANNELS: Channel[] = ['facebook', 'tiktok', 'zalo'];
export const CH: Record<Channel, { name: string; short: string; limit: number; hint: string; open: string; openLabel: string }> = {
  facebook: { name: 'Fanpage', short: 'FB', limit: 5000, hint: 'Bài đầy đủ + link dùng thử. Nên kèm 1–4 ảnh hoặc 1 video; hẹn giờ bằng Meta Business Suite.', open: 'https://business.facebook.com/latest/composer', openLabel: 'Mở Meta Business Suite' },
  tiktok: { name: 'TikTok', short: 'TT', limit: 2200, hint: 'Chú thích ≤ 2.200 ký tự; link không bấm được trong chú thích → để link ở bio. Video dọc 9:16, 15–60 giây.', open: 'https://www.tiktok.com/tiktokstudio/upload', openLabel: 'Mở TikTok Studio' },
  zalo: { name: 'Zalo', short: 'Zalo', limit: 1000, hint: 'Bản ngắn gửi nhóm phụ huynh / đăng nhật ký. Zalo cá nhân không có API → đăng tay.', open: 'https://chat.zalo.me/', openLabel: 'Mở Zalo Web' },
};

const L = (...lines: string[]) => lines.join('\n');
/** Mẫu bài theo mùa (điền sẵn tiêu đề, nội dung gốc, hashtag — sửa lại cho phù hợp) */
export const TEMPLATES: { id: string; label: string; title: string; body: string; hashtags: string }[] = [
  {
    id: 'gioi-thieu', label: 'Giới thiệu app', title: 'Giới thiệu EduChain Kids', hashtags: 'EduChainKids, học vui mỗi ngày, tiểu học, phụ huynh',
    body: L('Mỗi ngày 10 phút cùng EduChain Kids 🦉', '',
      '✅ Bài luyện Toán, Tiếng Việt, Tiếng Anh theo đúng chương trình lớp 1–5',
      '✅ Câu dễ trước, câu khó sau — con tự tin hơn mỗi ngày',
      '✅ Phụ huynh xem được con học gì, đúng sai ở đâu', '',
      'Miễn phí cho học sinh và phụ huynh.'),
  },
  {
    id: 'khai-giang', label: 'Khai giảng / đầu kỳ', title: 'Đầu năm học – ôn lại kiến thức', hashtags: 'EduChainKids, năm học mới, tiểu học',
    body: L('Năm học mới bắt đầu rồi! 🎒', '',
      'Giúp con khởi động nhẹ nhàng: mỗi ngày một bài nhỏ, ôn lại kiến thức cũ và làm quen bài mới.', '',
      'Giáo viên có thể giao bài cho cả lớp và xem kết quả ngay.'),
  },
  {
    id: '20-11', label: '20/11', title: 'Tri ân thầy cô 20/11', hashtags: 'EduChainKids, 20 tháng 11, tri ân thầy cô',
    body: L('Mừng Ngày Nhà giáo Việt Nam 20/11 💐', '',
      'Cảm ơn thầy cô đã đồng hành cùng các con mỗi ngày. EduChain Kids miễn phí cho giáo viên: giao bài, chấm tự động, sổ liên lạc với phụ huynh.'),
  },
  {
    id: 'on-thi', label: 'Ôn thi học kỳ', title: 'Ôn thi học kỳ cùng con', hashtags: 'EduChainKids, ôn thi học kỳ, tiểu học',
    body: L('Sắp kiểm tra học kỳ 📚', '',
      'EduChain Kids có đề luyện theo từng bài và đề kiểm tra tổng hợp, chỉnh được thời gian làm bài theo đúng quy định của trường. Con làm xong biết ngay đúng sai và lời giải.'),
  },
  {
    id: 'tinh-nang', label: 'Tính năng mới', title: 'Tính năng mới', hashtags: 'EduChainKids, tính năng mới',
    body: L('✨ Tính năng mới trên EduChain Kids: …', '', 'Dùng thế nào: …', '', 'Ai dùng được: học sinh / phụ huynh / giáo viên.'),
  },
];

/** Bỏ dấu tiếng Việt → chuỗi a-z0-9 nối bằng gạch ngang (dùng làm tên chiến dịch trong UTM) */
export function slug(s: string, max = 40): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/, '');
}

/** Gắn UTM vào link (giữ nguyên tham số sẵn có). Link không hợp lệ thì trả nguyên văn. */
export function withUtm(url: string, source: Channel, campaign: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', 'social');
    if (campaign) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch { return url; }
}

/** Chuẩn hoá hashtag (bỏ dấu, bỏ khoảng trắng, giữ chữ hoa): "EduChainKids, học vui, #toán lớp 1" → "#EduChainKids #hocvui #toanlop1" */
export function tags(raw: string): string {
  const clean = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9_]/g, '').slice(0, 30);
  return [...new Set(raw.split(/[,\n]|\s(?=#)/).map(clean).filter(Boolean))].map((t) => `#${t}`).join(' ');
}

/** Tạo 3 phiên bản từ nội dung gốc (sửa từng bản sau đó) */
export function autoVariants(body: string, link: string, campaign: string, hashtags: string): Record<Channel, string> {
  const b = body.trim();
  const h = tags(hashtags);
  const fbLink = link ? withUtm(link, 'facebook', campaign) : '';
  const zaloLink = link ? withUtm(link, 'zalo', campaign) : '';
  const short = b.length > 600 ? `${b.slice(0, 600).replace(/\s+\S*$/, '')}…` : b;
  const tt = [b, link ? '👉 Link dùng thử ở bio' : '', h].filter(Boolean).join('\n\n');
  return {
    facebook: [b, fbLink ? `👉 Dùng thử miễn phí: ${fbLink}` : '', h].filter(Boolean).join('\n\n'),
    tiktok: tt.length > CH.tiktok.limit ? `${tt.slice(0, CH.tiktok.limit - 1)}…` : tt,
    zalo: [short, zaloLink ? `👉 ${zaloLink}` : ''].filter(Boolean).join('\n\n'),
  };
}
