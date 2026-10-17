import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">
        ページが見つかりません
      </h1>

      <p className="mt-4 text-sm text-gray-500">
        お探しのページは存在しないか、移動した可能性があります。
      </p>

      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-black px-4 py-2 text-sm text-white"
      >
        トップへ戻る
      </Link>
    </main>
  );
}
