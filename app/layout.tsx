import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Press_Start_2P, Silkscreen } from 'next/font/google';
import './globals.css';

const sans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

// Hai phông pixel chỉ có bộ ký tự Latin → chỉ dùng cho số/nhãn ngắn không dấu
const pixel = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
});

const retro = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-retro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VINA-EDUVERSE - Thành Phố Học Tập',
    template: '%s · VINA-EDUVERSE',
  },
  description:
    'Thế giới học tập Khoa học tự nhiên dạng thành phố pixel-art dành cho học sinh THCS: thư viện, Quiz Arcade, trạm sửa lỗi, phòng STEM.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${pixel.variable} ${retro.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
