import { pool } from "@/lib/db"
import { notFound } from "next/navigation"
import type { ArticleDetail } from "@/types/article"
import Link from "next/link"
import { DeleteArticleButton } from "./DeleteArticleButton"
import { getCurrentUser } from "@/lib/auth/user"
import Markdown from 'react-markdown'

export default async function ArticleDetailPage({
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
  const isOwner = currentUser?.id === article.authorId

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/articles"
          className="text-sm text-gray-500 hover:underline"
        >
          ← 記事一覧へ
        </Link>

        {isOwner && (
          <div className="flex gap-2">
            <Link
              href={`/articles/${article.id}/edit`}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              編集する
            </Link>

            <DeleteArticleButton articleId={article.id} />
          </div>
        )}
      </div>

      <article>
        <h1 className="text-3xl font-bold leading-tight">
          {article.title}
        </h1>

        {article.summary && (
          <p className="mt-4 text-gray-600">
            {article.summary}
          </p>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>
            {article.displayName} @{article.username}
          </p>

          <p className="mt-1">
            {(
              article.publishedAt ?? article.createdAt
            ).toLocaleDateString("ja-JP")}
          </p>
        </div>

        <hr className="my-8" />

        <div className="prose">
          <Markdown>
            {article.body}
          </Markdown>
        </div>
      </article>
    </main>
  )
}
