
"use server";

import { pool } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSession,
  deleteSession,
} from "@/lib/auth/session";
import { redirect } from "next/navigation";

// 新規登録
export async function register(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  // サーバー側でも入力チェック
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    password.length < 8
  ) {
    throw new Error("入力内容を確認してください");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // パスワードをそのままDBには保存しない
  const passwordHash = await hashPassword(password);

  let userId: number;

  try {
    const result = await pool.query<{ id: number }>(
      `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id;
      `,
      [normalizedEmail, passwordHash]
    );

    userId = result.rows[0].id;
  } catch (error) {
    // PostgreSQLの一意制約違反
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("このメールアドレスは登録済みです");
    }

    throw error;
  }

  await createSession(userId);

  redirect("/characters");
}

type LoginUser = {
  id: number;
  passwordHash: string;
};

// ログイン
export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new Error("入力内容を確認してください");
  }

  const result = await pool.query<LoginUser>(
    `
      SELECT
        id,
        password_hash AS "passwordHash"
      FROM users
      WHERE email = $1;
    `,
    [email.trim().toLowerCase()]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("メールアドレスまたはパスワードが違います");
  }

  const isValid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!isValid) {
    throw new Error("メールアドレスまたはパスワードが違います");
  }

  await createSession(user.id);

  redirect("/characters");
}

// ログアウト
export async function logout() {
  await deleteSession();

  redirect("/");
}
