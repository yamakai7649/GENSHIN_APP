import { pool } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { ArticleDetail } from "@/types/article"
import { updateArticle } from "@/lib/actions/article"
import { getCurrentUser } from "@/lib/auth/user"

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const articleId = Number(id)

  if (!Number.isInteger(articleId) || articleId <= 0) {
    notFound()
  }

  const result = await pool.query<ArticleDetail>(
    `
      SELECT
        articles.id,
        articles.author_id AS "authorId",
        articles.title,
        articles.body,
        articles.summary,
        articles.status,
        articles.visibility,
        articles.created_at AS "createdAt",
        articles.updated_at AS "updatedAt",
        articles.published_at AS "publishedAt",
        users.username,
        users.display_name AS "displayName"
      FROM articles
      JOIN users
        ON articles.author_id = users.id
      WHERE articles.id = $1;
    `,
    [articleId]
  )

  const article = result.rows[0]

  if (!article) {
    notFound()
  }

  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (currentUser.id !== article.authorId) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">
        技術記事を編集する
      </h1>

      <form
        className="space-y-6"
        action={updateArticle.bind(null, article.id)}
      >
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
            defaultValue={article.title}
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
            defaultValue={article.summary ?? ""}
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
            defaultValue={article.body}
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
            defaultValue={article.visibility}
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
          更新する
        </button>
      </form>
    </main>
  )
}
