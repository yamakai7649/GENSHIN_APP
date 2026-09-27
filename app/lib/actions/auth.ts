"use server"

import { pool } from "@/lib/db"
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password"
import {
  createSession,
  deleteSession,
} from "@/lib/auth/session"
import { redirect } from "next/navigation"

export async function register(formData: FormData) {
  const username = formData.get("username")
  const displayName = formData.get("displayName")
  const bio = formData.get("bio")
  const avatarUrl = formData.get("avatarUrl")
  const email = formData.get("email")
  const password = formData.get("password")

  if (
    typeof username !== "string" ||
    typeof displayName !== "string" ||
    typeof bio !== "string" ||
    typeof avatarUrl !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new Error("入力内容が不正です")
  }

  if (
    !username.trim() ||
    !displayName.trim() ||
    !email.trim() ||
    !password
  ) {
    throw new Error("必須項目を入力してください")
  }

  if (password.length < 8) {
    throw new Error("パスワードは8文字以上で入力してください")
  }

  const normalizedUsername = username.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  const passwordHash = await hashPassword(password)

  const client = await pool.connect()

  let userId: number

  try {
    await client.query("BEGIN")

    const userResult = await client.query<{ id: number }>(
      `
        INSERT INTO users (
          username,
          display_name,
          bio,
          avatar_url,
          user_type
        )
        VALUES ($1, $2, $3, $4, 'human')
        RETURNING id;
      `,
      [
        normalizedUsername,
        displayName.trim(),
        bio.trim() || null,
        avatarUrl.trim() || null,
      ]
    )

    userId = userResult.rows[0].id

    await client.query(
      `
        INSERT INTO human_accounts (
          user_id,
          email,
          password_hash
        )
        VALUES ($1, $2, $3);
      `,
      [
        userId,
        normalizedEmail,
        passwordHash,
      ]
    )

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error(
        "そのユーザー名またはメールアドレスはすでに使用されています"
      )
    }

    throw error
  } finally {
    client.release()
  }

  await createSession(userId)

  redirect("/articles")
}

type LoginUser = {
  id: number
  passwordHash: string
}

export async function login(formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new Error(
      "メールアドレスとパスワードを入力してください"
    )
  }

  const normalizedEmail = email.trim().toLowerCase()

  const result = await pool.query<LoginUser>(
    `
      SELECT
        users.id,
        human_accounts.password_hash AS "passwordHash"
      FROM human_accounts
      JOIN users
        ON human_accounts.user_id = users.id
      WHERE human_accounts.email = $1;
    `,
    [normalizedEmail]
  )

  const user = result.rows[0]

  if (!user) {
    throw new Error(
      "メールアドレスまたはパスワードが違います"
    )
  }

  const isValidPassword = await verifyPassword(
    password,
    user.passwordHash
  )

  if (!isValidPassword) {
    throw new Error(
      "メールアドレスまたはパスワードが違います"
    )
  }

  await createSession(user.id)

  redirect("/articles")
}

export async function logout() {
  await deleteSession()

  redirect("/articles")
}
