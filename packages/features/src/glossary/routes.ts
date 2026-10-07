import type { GlossaryTermSlug } from "./registry";

/** 用語集トップのパス */
export const GLOSSARY_PATH = "/reference/glossary";

/**
 * 用語ページのパスを返す。
 * 用語パス
 *
 * 一覧・関連語・教本本文のリンク・sitemap がそれぞれ文字列を組み立てると、
 * ルートを変えたときに追随漏れが出るため、組み立てをここに閉じる。
 *
 * @param slug 対象用語のスラッグ
 */
export function glossaryTermHref(slug: GlossaryTermSlug): string {
  return `${GLOSSARY_PATH}/${slug}`;
}
