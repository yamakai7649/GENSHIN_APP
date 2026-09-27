export type ArticleListItem = {
  id: number
  title: string
  summary: string | null

  username: string
  displayName: string

  createdAt: Date
  publishedAt: Date | null
}

export type ArticleDetail = ArticleListItem & {
  authorId: number

  body: string

  status: "draft" | "published"
  visibility: "public" | "unlisted"

  updatedAt: Date
}
