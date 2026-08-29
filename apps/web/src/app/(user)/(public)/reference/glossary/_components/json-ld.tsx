/**
 * JSON-LD を埋め込む script タグ
 *
 * `Breadcrumb` と同じ書き方（`dangerouslySetInnerHTML`）で、用語集の
 * DefinedTermSet / DefinedTerm を出すためだけの薄いラッパー。
 */
export function JsonLd({ data }: { readonly data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
