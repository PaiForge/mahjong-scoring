/**
 * 配信中のアプリのビルドを識別する契約
 * アプリバージョン
 *
 * `next.config.ts` が Vercel のデプロイ ID（無ければコミット SHA）を
 * `NEXT_PUBLIC_BUILD_ID` としてクライアントとサーバーの両方のバンドルに
 * 焼き込む。この値はビルドの瞬間に決まり、同じデプロイの中では一致する。
 *
 * - サーバー側: `/api/version` が今配信しているビルドの ID を返す
 * - クライアント側: `AppVersionWatcher` が自分の ID と比べ、違っていれば
 *   新版へ乗り換える
 *
 * ローカルビルドでは undefined（監視は何もしない）。
 */

/**
 * このバンドルを作ったビルドの ID。デプロイ外のビルドでは undefined
 *
 * `process.env.NEXT_PUBLIC_BUILD_ID` をそのまま書くのは、Next がビルド時に
 * 文字列へ置き換える対象がこのリテラルな参照だけだから（変数名で間接参照
 * すると置き換わらない）。
 */
export const APP_BUILD_ID: string | undefined =
  process.env.NEXT_PUBLIC_BUILD_ID;

/** 配信中のビルド ID を返すエンドポイント */
export const APP_VERSION_ENDPOINT = "/api/version";

/** `/api/version` の応答。デプロイ外では `buildId` を持たない */
export interface AppVersionResponse {
  readonly buildId?: string;
}

/** 値が `/api/version` の応答の形をしているかの型ガード */
export function isAppVersionResponse(
  value: unknown,
): value is AppVersionResponse {
  if (typeof value !== "object" || value === null) return false;
  if (!("buildId" in value)) return true;
  return typeof value.buildId === "string" || value.buildId === undefined;
}
