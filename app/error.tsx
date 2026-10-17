"use client";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">
        予期しないエラーが発生しました
      </h1>

      <p className="mt-4 text-sm text-gray-500">
        {error.message || "しばらくしてから再度お試しください。"}
      </p>

      <button
        onClick={() => unstable_retry()}
        className="mt-8 rounded-md bg-black px-4 py-2 text-sm text-white"
      >
        もう一度試す
      </button>
    </main>
  );
}
