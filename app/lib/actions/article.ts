"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"

const VISIBILITY_VALUES = ["public", "unlisted"] as const

export async function createArticle(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const title = formData.get("title")
  const summary = formData.get("summary")
  const body = formData.get("body")
  const visibility = formData.get("visibility")

  if (
    typeof title !== "string" ||
    typeof summary !== "string" ||
    typeof body !== "string" ||
    typeof visibility !== "string"
  ) {
    throw new Error("入力内容が不正です")
  }

  if (!title.trim() || !body.trim()) {
    throw new Error("タイトルと本文を入力してください")
  }

  if (
    !VISIBILITY_VALUES.includes(
      visibility as (typeof VISIBILITY_VALUES)[number]
    )
  ) {
    throw new Error("公開範囲の値が不正です")
  }

  const result = await pool.query(
    `
      INSERT INTO articles (
        author_id,
        title,
        body,
        summary,
        status,
        visibility,
        published_at
      )
      VALUES ($1, $2, $3, $4, 'published', $5, NOW())
      RETURNING id;
    `,
    [
      currentUser.id,
      title.trim(),
      body.trim(),
      summary.trim() || null,
      visibility,
    ]
  )

  const articleId = result.rows[0].id

  revalidatePath("/articles")
  redirect(`/articles/${articleId}`)
}

export async function updateArticle(
  articleId: number,
  formData: FormData
) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (!Number.isInteger(articleId) || articleId <= 0) {
    throw new Error("記事IDが不正です")
  }

  const title = formData.get("title")
  const summary = formData.get("summary")
  const body = formData.get("body")
  const visibility = formData.get("visibility")

  if (
    typeof title !== "string" ||
    typeof summary !== "string" ||
    typeof body !== "string" ||
    typeof visibility !== "string"
  ) {
    throw new Error("入力内容が不正です")
  }

  if (!title.trim() || !body.trim()) {
    throw new Error("タイトルと本文を入力してください")
  }

  if (
    !VISIBILITY_VALUES.includes(
      visibility as (typeof VISIBILITY_VALUES)[number]
    )
  ) {
    throw new Error("公開範囲の値が不正です")
  }

  const result = await pool.query(
    `
      UPDATE articles
      SET
        title = $1,
        body = $2,
        summary = $3,
        visibility = $4,
        updated_at = NOW()
      WHERE id = $5
        AND author_id = $6
      RETURNING id;
    `,
    [
      title.trim(),
      body.trim(),
      summary.trim() || null,
      visibility,
      articleId,
      currentUser.id,
    ]
  )

  if (result.rows.length === 0) {
    throw new Error("記事が見つかりません")
  }

  revalidatePath("/articles")
  revalidatePath(`/articles/${articleId}`)

  redirect(`/articles/${articleId}`)
}

export async function deleteArticle(articleId: number) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (!Number.isInteger(articleId) || articleId <= 0) {
    throw new Error("記事IDが不正です")
  }

  const result = await pool.query(
    `
      DELETE FROM articles
      WHERE id = $1
        AND author_id = $2
      RETURNING id;
    `,
    [articleId, currentUser.id]
  )

  if (result.rows.length === 0) {
    throw new Error("記事が見つかりません")
  }

  revalidatePath("/articles")
  redirect("/articles")
}
