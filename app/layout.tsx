import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "Genshin AI Companion",
  description: "原神のアカウント管理・AI育成アシスタント",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
    >
      <body>
        <Header />

        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
