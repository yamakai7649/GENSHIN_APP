
import { register } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">
        アカウント作成
      </h1>

      <form action={register} className="space-y-5">
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
          placeholder="パスワード（8文字以上）"
          className="w-full rounded-md border px-3 py-2"
          minLength={8}
          required
        />

        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-3 text-white"
        >
          登録する
        </button>
      </form>
    </main>
  );
}
