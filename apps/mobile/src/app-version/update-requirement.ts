import { parseMobileAppVersionResponse } from "@mahjong-scoring/features/app-version/mobile-api";
import { isBelowMinimumVersion } from "@mahjong-scoring/features/app-version/version";

/**
 * 最低バージョンの API の応答から、アップデートを求めるかを決める
 * アップデート要否判定
 *
 * 形の違う応答・最低バージョンの無い応答では求めない。止めるのはサーバーが
 * はっきり下回ると答えたときだけにし、通信や設定の誤りで締め出さない。
 *
 * @param body - API の応答の本文
 * @param currentVersion - このアプリの版。読めなければ求めない
 */
export function isUpdateRequired(
  body: unknown,
  currentVersion: string | undefined,
): boolean {
  if (currentVersion === undefined) return false;
  const minimumVersion = parseMobileAppVersionResponse(body)?.minimumVersion;
  return (
    minimumVersion !== undefined &&
    isBelowMinimumVersion(currentVersion, minimumVersion)
  );
}
