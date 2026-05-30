import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moli Teaching Games",
  description: "Interactive teaching games for vocabulary learning",
};

// Root layout required by Next.js - provides <html> and <body>.
// All routes are redirected to /[locale]/ by middleware.tsx.
// Providers and GlobalHeader are added in app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
