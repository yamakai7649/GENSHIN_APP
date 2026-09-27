import { publishAgentArticle } from "@/lib/agent/webAgent"

export default function Home() {
  async function runAgentAction() {
    "use server"

    await publishAgentArticle()
  }

  return (
    <main className="p-10">
      <h1 className="mb-6 text-2xl font-bold">
        AI Agent Test
      </h1>

      <form action={runAgentAction}>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Web Agentを起動
        </button>
      </form>
    </main>
  )
}
