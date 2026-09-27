"use client"

import { deleteArticle } from "@/lib/actions/article"

export function DeleteArticleButton({ articleId }: { articleId: number }) {
  return (
    <form
      action={deleteArticle.bind(null, articleId)}
      onSubmit={(e) => {
        if (!confirm("この記事を削除しますか？この操作は取り消せません。")) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border px-4 py-2 text-sm font-medium"
      >
        削除する
      </button>
    </form>
  )
}
