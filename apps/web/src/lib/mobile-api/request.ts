/**
 * アプリ向け API の要求本文を JSON として読む。上限を超えた・JSON でなければ undefined
 * アプリAPI本文読み取り
 *
 * 本文はクライアントが自由に決められるので、読む前に大きさを絞る。
 * `Content-Length` は嘘をつけるため、読んだ実際の長さで判定する。
 *
 * @param maxBytes - 受け付ける本文の上限（UTF-8 のバイト数）
 */
export async function readMobileJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return undefined;
  const text = await request.text().catch(() => undefined);
  if (text === undefined || new TextEncoder().encode(text).length > maxBytes)
    return undefined;
  try {
    const body: unknown = JSON.parse(text);
    return body;
  } catch {
    return undefined;
  }
}
