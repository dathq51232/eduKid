// Pháo giấy nhỏ bung khoảng 1 giây khi trả lời đúng. Chỉ hiện khi bật hiệu ứng (lớp CSS tự tắt khi máy giảm chuyển động).
const COLORS = ['#e2483d', '#2f6fed', '#ffc83d', '#1f9d6b', '#8b5cf6', '#f08a24'];

export default function Confetti({ burst }: { burst: string }) {
  // Vị trí cố định theo chỉ số (không ngẫu nhiên lúc vẽ) để kết quả ổn định
  return (
    <div className="confetti" key={burst} aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => {
        const ang = (i / 22) * Math.PI * 2;
        const dist = 90 + (i % 4) * 28;
        return (
          <span
            key={i}
            className={`confetti-bit${i % 3 === 0 ? ' is-round' : ''}`}
            style={{
              background: COLORS[i % COLORS.length],
              ['--dx' as string]: `${Math.round(Math.cos(ang) * dist * 1.6)}px`,
              ['--dy' as string]: `${Math.round(Math.sin(ang) * dist - 40)}px`,
              ['--r' as string]: `${(i * 47) % 360}deg`,
              ['--delay' as string]: `${(i % 5) * 25}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
