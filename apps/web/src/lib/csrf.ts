import { SITE_URL } from "@/config";

/**
 * Route Handler 向けの CSRF 防御（Origin ヘッダ検証）。
 * CSRFオリジン検証
 *
 * Next.js の Server Action は Origin 検証を内蔵しているが、Route Handler
 * （`route.ts`）は素通しする。同じ防御を多層防御として自前で用意する。
 * blindfold-chess から移植した考え方だが、突き合わせ先は変えている（下記）。
 *
 * ブラウザは POST 等の非単純メソッドでは同一オリジンでも `Origin` を必ず送る。
 * したがって Origin 無しは弾いてよい（curl 等はこの内部 API の想定利用者ではない）。
 */

/** 末尾スラッシュの有無を無視してオリジンを比較する */
export function originMatches(origin: string, allowedOrigin: string): boolean {
  return origin.replace(/\/+$/, "") === allowedOrigin.replace(/\/+$/, "");
}

/**
 * リクエストの `Origin` が自サイトを指しているか。
 * オリジン検証
 *
 * 突き合わせ先は「リクエスト自身のホスト」を第一とし、{@link SITE_URL} は
 * その次に見る。`NEXT_PUBLIC_SITE_URL` だけを正にすると、変数を設定していない
 * プレビュー環境でアップロードが軒並み 403 になるため。ホスト側を見ても
 * CSRF 防御は成立する — ブラウザは Host を宛先の URL から決めるので、攻撃者は
 * 被害者のブラウザに別の Host を送らせられない（Next.js 自身の Server Action の
 * 判定と同じ理屈）。
 */
export function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (
    host &&
    originMatches(origin, `${protocolFor(host, request)}://${host}`)
  ) {
    return true;
  }

  return originMatches(origin, SITE_URL);
}

/** プロキシが申告するスキーム。無ければローカルのみ http、それ以外は https */
function protocolFor(host: string, request: Request): string {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim();
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}
