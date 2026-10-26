export function getMcpDevUserId(): number {
  const value = process.env.MCP_DEV_USER_ID;

  if (!value) {
    throw new Error("MCP_DEV_USER_IDが設定されていません。");
  }

  const userId = Number(value);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("MCP_DEV_USER_IDが不正です。");
  }

  return userId;
}
