import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { logout } from "@/lib/actions/auth"

export default async function Header() {
  const currentUser = await getCurrentUser()

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-bold">
          Genshin AI Companion
        </Link>

        {currentUser ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {currentUser.email}
            </span>

            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:underline"
              >
                ログアウト
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:underline">
              ログイン
            </Link>

            <Link
              href="/register"
              className="rounded-md bg-black px-3 py-1.5 text-sm text-white"
            >
              新規登録
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
