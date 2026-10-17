export async function fetchHoyolabJson(
  url: string,
  options?: RequestInit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HoYoLAB APIエラー: HTTP ${res.status}`);
  }

  const result = await res.json();

  if (result.retcode !== 0) {
    throw new Error(`HoYoLAB APIエラー: ${result.message ?? result.retcode}`);
  }

  return result.data;
}
