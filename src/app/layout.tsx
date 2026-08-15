import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UIT Scheduler",
  description:
    "Hệ thống xếp thời khóa biểu tự động, thông minh dành riêng cho sinh viên Đại học Công nghệ Thông tin - ĐHQG-HCM. Hỗ trợ file Excel TKB 1 sheet & 2 sheet, 100% xử lý ngay trên trình duyệt.",
  keywords: [
    "UIT",
    "Thời khóa biểu UIT",
    "Xếp lịch UIT",
    "UIT Scheduler",
    "Đại học Công nghệ Thông tin",
    "TKB",
  ],
  authors: [{ name: "UIT Student Community" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-50 dark:bg-neutral-950 font-sans selection:bg-blue-500/20">
        {children}
      </body>
    </html>
  );
}
