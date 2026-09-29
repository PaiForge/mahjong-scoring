/**
 * Amazon アソシエイトのリンクの組み立て
 * Amazon リンク
 *
 * ASIN で指す広告のリンクは `https://www.amazon.co.jp/dp/<ASIN>?tag=<トラッキング ID>`
 * の形で表示のたびに組み立てる。アソシエイトの規約上、この形のリンクは
 * サイトストライプで作ったリンクと同じく成果の対象になる。商品情報の API
 * （Creators API）は直近の売上実績が利用条件で、広告を始める前には使えない
 * ため、書名・説明・見た目は管理画面（シード）で持つ。
 *
 * トラッキング ID はコードに書かない（`ad_network_settings` の TSDoc 参照）。
 */

/** `ad_network_settings.network` の Amazon.co.jp の値 */
export const AMAZON_NETWORK = "amazon_jp";

const AMAZON_ORIGIN = "https://www.amazon.co.jp";

/** ASIN の形（英大文字・数字 10 桁）。書籍は ISBN-10 がそのまま ASIN */
const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

/**
 * トラッキング ID の形。Amazon.co.jp の ID は `<英数字・ハイフン>-22`。
 * 他の文字を通すと、リンクのクエリに意図しない値が入る
 */
const TRACKING_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,60}-22$/;

export function isValidAsin(value: string): boolean {
  return ASIN_PATTERN.test(value);
}

export function isValidTrackingId(value: string): boolean {
  return TRACKING_ID_PATTERN.test(value);
}

/**
 * ASIN とトラッキング ID から商品ページへのアフィリエイトリンクを作る
 * Amazon 商品リンク
 */
export function amazonProductUrl(asin: string, trackingId: string): string {
  const url = new URL(`/dp/${encodeURIComponent(asin)}`, AMAZON_ORIGIN);
  url.searchParams.set("tag", trackingId);
  return url.toString();
}

/**
 * 管理画面に貼られた Amazon の商品ページの URL から ASIN を取り出す。
 * ASIN そのものが渡されればそのまま返す。読めなければ undefined
 *
 * 検索結果から開いた商品ページの URL は `/<書名>/dp/<ASIN>/ref=…?…` の形で、
 * 書名や検索語が長く付く。`/dp/` か `/gp/product/` の直後だけを見る。
 */
export function extractAsin(input: string): string | undefined {
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  if (isValidAsin(upper)) return upper;
  const match = /\/(?:dp|gp\/product)\/([A-Za-z0-9]{10})(?:[/?#]|$)/.exec(
    trimmed,
  );
  const asin = match?.[1]?.toUpperCase();
  return asin !== undefined && isValidAsin(asin) ? asin : undefined;
}

/**
 * 広告のリンクを決める。URL を持てばそれ、ASIN ならトラッキング ID と
 * 組み立てたリンク。トラッキング ID が未設定の ASIN 広告は undefined —
 * 画面には出さない（成果に結び付かないリンクを出さない）
 * 広告リンク解決
 */
export function resolveAdHref(
  link: { readonly href: string | null; readonly asin: string | null },
  trackingId: string | undefined,
): string | undefined {
  if (link.href !== null) return link.href;
  if (link.asin === null || trackingId === undefined) return undefined;
  return amazonProductUrl(link.asin, trackingId);
}
