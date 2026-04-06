import { headers } from "next/headers";

/**
 * リクエストヘッダーからクライアント IP アドレスを取得する。
 * x-forwarded-for の先頭 IP を返す。取得できない場合は undefined。
 * クライアントIP取得
 */
export async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (!forwarded) return undefined;
  return forwarded.split(",")[0].trim() || undefined;
}
