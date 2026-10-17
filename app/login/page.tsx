"use client"

import { useState } from "react"
import { unstable_rethrow } from "next/navigation"
import { login } from "@/lib/actions/auth"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)

    try {
      const result = await login(formData)

      if (result?.error) {
        setError(result.error)
      }
    } catch (e) {
      unstable_rethrow(e)

      console.error(e)
      setError("エラーが発生しました。しばらくしてからもう一度お試しください。")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">
        ログイン
      </h1>

      <form action={handleSubmit} className="space-y-5">
        <input
          name="email"
          type="email"
          placeholder="メールアドレス"
          className="w-full rounded-md border px-3 py-2"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="パスワード"
          className="w-full rounded-md border px-3 py-2"
          required
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </main>
  )
}
