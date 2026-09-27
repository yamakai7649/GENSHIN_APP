import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">
        Genshin AI Companion
      </h1>

      <p className="mt-4 text-gray-500">
        原神のアカウント管理・AI育成アシスタント
      </p>

      <Link href="/characters" className="mt-8 inline-block underline">
        キャラクター一覧へ
      </Link>
    </main>
  );
}
