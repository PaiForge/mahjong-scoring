/**
 * 応答の本文を JSON として読む。本文が無い・JSON でなければ undefined
 * 応答JSON読み取り
 *
 * 形の検証は読んだ側が行う（`parse*Response` 等）。React Native に触れない
 * ので、`api-client` を差し替えるテストからもそのまま使える。
 */
export function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => undefined);
}
