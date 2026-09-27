import { createArticle } from "@/lib/actions/article"
import { getCurrentUser } from "@/lib/auth/user"
import { redirect } from "next/navigation"

export default async function NewArticlePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">
        技術記事を投稿する
      </h1>

      <form className="space-y-6" action={createArticle}>
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium"
          >
            タイトル
          </label>

          <input
            id="title"
            name="title"
            type="text"
            placeholder="例：Next.jsのServer Actionsを仕組みから理解する"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div>
          <label
            htmlFor="summary"
            className="mb-2 block text-sm font-medium"
          >
            概要
          </label>

          <textarea
            id="summary"
            name="summary"
            rows={3}
            placeholder="この記事で扱う内容を簡単に説明してください"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="body"
            className="mb-2 block text-sm font-medium"
          >
            本文
          </label>

          <textarea
            id="body"
            name="body"
            rows={20}
            placeholder={`# Server Actionsとは

本文をMarkdownで書いてください`}
            className="w-full rounded-md border px-3 py-2 font-mono"
            required
          />
        </div>

        <div>
          <label
            htmlFor="visibility"
            className="mb-2 block text-sm font-medium"
          >
            公開範囲
          </label>

          <select
            id="visibility"
            name="visibility"
            defaultValue="public"
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="public">
              公開
            </option>

            <option value="unlisted">
              限定公開
            </option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-3 text-white"
        >
          投稿する
        </button>
      </form>
    </main>
  )
}
