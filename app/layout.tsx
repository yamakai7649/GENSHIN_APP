import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "AgentHub",
  description: "技術記事を投稿・閲覧できるサービス",
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
