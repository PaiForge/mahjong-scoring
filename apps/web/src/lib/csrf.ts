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

  const self = requestOrigin(request.headers);
  if (self && originMatches(origin, self)) {
    return true;
  }

  return originMatches(origin, SITE_URL);
}

/**
 * このリクエストが届いた自分自身のオリジン（`https://host`）
 * リクエストオリジン
 *
 * `Host` / `X-Forwarded-Host` と `X-Forwarded-Proto` から組み立てる。
 * ホストが分からなければ undefined。
 *
 * `SITE_URL` ではなくこれを使うのは、ローカルやプレビュー環境で
 * `NEXT_PUBLIC_SITE_URL` が未設定だと `SITE_URL` が本番 URL に落ちるため
 * （Stripe Checkout の戻り先のように「今いる環境へ戻す」URL に使う）。
 * Server Action からは `headers()` を渡す。
 */
export function requestOrigin(headers: Headers): string | undefined {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return undefined;
  return `${protocolFor(host, headers)}://${host}`;
}

/**
 * プロキシが申告するスキーム。無ければローカルのみ http、それ以外は https
 *
 * ローカルには `*.localhost`（手元の dev は `mahjong.localhost`）も含める。
 * ブラウザは `*.localhost` をループバックに解決し、同じ Mac で動かす別プロダクトと
 * cookie を分けるためにその名前で開いている。
 */
function protocolFor(host: string, headers: Headers): string {
  const forwarded = headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim();
  return isLoopbackHost(host) ? "http" : "https";
}

/** `Host` の値（ポート付きでもよい）がこの機械自身を指すか */
function isLoopbackHost(host: string): boolean {
  const name = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : host.replace(/:\d+$/, "");
  return (
    name === "localhost" ||
    name.endsWith(".localhost") ||
    name === "127.0.0.1" ||
    name === "[::1]"
  );
}
