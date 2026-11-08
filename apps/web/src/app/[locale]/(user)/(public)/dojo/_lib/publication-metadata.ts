import type { Metadata } from "next";

import { robotsForPublication } from "@/app/_lib/metadata";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * 道場のページの metadata に、その言語の公開状態の robots を合成する
 * 公開状態のmetadata合成
 *
 * 道場（`/dojo`・`/dojo/ranks/<級>`）は日本語では索引対象、英語では閲覧者ごとの
 * 内容のため `published-noindex` で出す。robots は公開状態の表から引き
 * （`robotsForPublication`）、言語で分岐しない。
 *
 * noindex で出すときは hreflang（`alternates.languages`）も外し、自己 canonical
 * だけを残す。hreflang の組（`getIndexableAlternates`）はパス単位で、日本語が
 * 索引対象なら英語のページにも `ja`・`x-default` が載る。索引させないページから
 * 相互の対応を宣言すると、検索エンジンへ「このページは日本語版の翻訳で、
 * 索引しない」という食い違った指示になる。日本語（indexable）は入力のまま
 * 返すので、日本語の出力は変わらない。
 *
 * @param metadata - ページの言語で組んだ metadata（`path` を渡して canonical 付き）
 * @param path - ロケール非依存のパス
 * @param locale - ページの言語
 */
export function withPublicationRobots(
  metadata: Metadata,
  path: string,
  locale: SupportedLocale,
): Metadata {
  const robots = robotsForPublication(path, locale);
  if (robots === undefined) return metadata;
  const canonical = metadata.alternates?.canonical;
  return {
    ...metadata,
    robots,
    ...(canonical === undefined || canonical === null
      ? {}
      : { alternates: { canonical } }),
  };
}
