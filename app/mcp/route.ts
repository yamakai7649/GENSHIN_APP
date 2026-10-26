import { createMcpHandler } from "@modelcontextprotocol/server";

import { getMcpDevUserId } from "@/lib/mcp/auth";

import { createMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(() => {
  const userId = getMcpDevUserId();

  return createMcpServer(userId);
});

export async function POST(request: Request) {
  return handler.fetch(request);
}

export async function GET(request: Request) {
  return handler.fetch(request);
}

export async function DELETE(request: Request) {
  return handler.fetch(request);
}
