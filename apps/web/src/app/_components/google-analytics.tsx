import Script from "next/script";

/**
 * Google Analytics（gtag.js）の読み込み。
 *
 * `@next/third-parties` の `GoogleAnalytics` は gtag.js を `afterInteractive` で読み、
 * 初期 HTML に preload を出す。gtag.js は約 180KB・CPU 約 270ms で、LP の本文の
 * 描画（LCP）と同じ時間帯に通信と実行が重なっていた（2026-10 に PageSpeed Insights で実測）。
 *
 * 初期化（`dataLayer` と `gtag()` の定義、`config`）だけを `afterInteractive` の
 * インラインで先に済ませ、gtag.js 本体は `lazyOnload`（`load` 後のアイドル時）に回す。
 * 本体が届くまでの `gtag()` の呼び出しは `dataLayer` に積まれ、本体が読み込み時に
 * 処理するので取りこぼさない。代わりに `load` より前に離脱した訪問は計測されない
 * — 表示速度と引き換えに受け入れたトレードオフ。
 */
export function GoogleAnalytics({ gaId }: { readonly gaId: string }) {
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)});`}
      </Script>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="lazyOnload"
      />
    </>
  );
}
