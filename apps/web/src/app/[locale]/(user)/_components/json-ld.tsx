/**
 * JSON-LD を埋め込む script タグ
 * 構造化データ
 *
 * 用語集の DefinedTermSet / DefinedTerm、教本の Article、トップの
 * Organization / WebSite、`Breadcrumb` の BreadcrumbList を出すための薄い
 * ラッパーで、`data` は schema.org の JSON をそのまま受け取る。
 *
 * `<` は `\u003c` にエスケープして埋め込む。`JSON.stringify` は `</script>` を
 * そのまま出すため、文字列に `</script><script>...` を含むデータ（お知らせの
 * タイトルのような DB 由来の値）を渡すと script 要素を抜けて HTML として
 * 解釈される。`\u003c` は JSON としては同じ文字なので、構造化データの意味は
 * 変わらない。script 要素を自前で書かず必ずこれを通すこと。
 */
export function JsonLd({ data }: { readonly data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/** script 要素の中に置いても抜けられない JSON 文字列にする */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
