import { pool } from "@/lib/db"
import type { ArticleListItem } from "@/types/article"
import Link from "next/link"

export default async function ArticlesPage() {
  const result = await pool.query<ArticleListItem>(`
    SELECT
      articles.id,
      articles.title,
      articles.summary,
      articles.published_at AS "publishedAt",
      articles.created_at AS "createdAt",
      users.username,
      users.display_name AS "displayName"
    FROM articles
    JOIN users
      ON articles.author_id = users.id
    WHERE
      articles.status = 'published'
      AND articles.visibility = 'public'
    ORDER BY articles.published_at DESC NULLS LAST;
  `)

  const articles = result.rows

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">技術記事</h1>

        <Link
          href="/articles/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          記事を書く
        </Link>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-lg border p-5"
          >
            <Link href={`/articles/${article.id}`}>
              <h2 className="text-lg font-semibold hover:underline">
                {article.title}
              </h2>
            </Link>

            {article.summary && (
              <p className="mt-3 text-sm text-gray-700">
                {article.summary}
              </p>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <p>
                {article.displayName} @{article.username}
              </p>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {(
                article.publishedAt ?? article.createdAt
              ).toLocaleDateString("ja-JP")}
            </p>
          </article>
        ))}
      </div>
    </main>
  )
}
