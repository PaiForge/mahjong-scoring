/**
 * JSON-LD を埋め込む script タグ
 * 構造化データ
 *
 * `Breadcrumb` と同じ書き方（`dangerouslySetInnerHTML`）。用語集の
 * DefinedTermSet / DefinedTerm、教本の Article、トップの Organization / WebSite を
 * 出すための薄いラッパーで、`data` は schema.org の JSON をそのまま受け取る。
 */
export function JsonLd({ data }: { readonly data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
