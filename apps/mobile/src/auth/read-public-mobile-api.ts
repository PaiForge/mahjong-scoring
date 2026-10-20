import { SITE_URL } from "../lib/app-site-url";
import { readJson } from "./read-json";

/**
 * 認証なしの GET を送り、成功なら応答を検証して返す。読めなければ undefined
 * 公開アプリAPI読み取り
 *
 * 誰が読んでも同じ値（試験の合格ライン・販売中の商品・広告）を読む経路で、
 * ログインのトークンを付ける `callMobileApi` を通さない。通信の失敗・中断・
 * 失敗の応答・契約と違う形はすべて undefined に丸める — 呼び出し側は
 * 「読めなかった」ことだけ分かればよく、理由で分岐しない。
 *
 * @param path - API のパス（`SITE_URL` に続ける）
 * @param parse - 成功の本文を契約の形に検証する。形が違えば undefined
 * @param init - `fetch` に渡す指定（中断の `signal` 等）
 */
export async function readPublicMobileApi<T>(
  path: string,
  parse: (body: unknown) => T | undefined,
  init?: RequestInit,
): Promise<T | undefined> {
  try {
    const response = await fetch(`${SITE_URL}${path}`, init);
    if (!response.ok) return undefined;
    return parse(await readJson(response));
  } catch {
    return undefined;
  }
}
