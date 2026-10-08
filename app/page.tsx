import SyncButton from "@/components/SyncButton";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          GENSHIN APP
        </h1>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          HoYoLABから原神のキャラクターや装備データを同期して、
          <br className="hidden sm:block" />
          GENSHIN APPで管理できます。
        </p>

        <div className="mt-8">
          <SyncButton />
        </div>
      </div>
    </main>
  );
}
