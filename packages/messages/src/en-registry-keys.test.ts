import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";

/**
 * レジストリから組み立てて引く辞書キーが、英語の完訳の名前空間に揃っているか
 *
 * 画面はこれらのキーを文字列を組んで引く（`t(`${key}.title`)` 等）ので、型では
 * 存在を検査できない。messages パッケージはレジストリ（features・core）に依存しない
 * （依存の向きは features → messages）ため、ここではキーの一覧を写して持ち、
 * 写し元を各行のコメントに書く。レジストリにキーを足したら、ここにも足す。
 *
 * 完訳の名前空間は日本語と同じキーを持つこと自体を `en.test.ts` が検査するので、
 * 日本語にあるキーは英語にもある。ここでは、写した一覧が日本語にも英語にも
 * 実在すること（写し間違い・レジストリとのずれ）を確かめる。
 *
 * 未着手の名前空間に属するレジストリ由来のキー（`practice.practices.<messageKey>`・
 * `<namespace>.variants.<key>`・`ranks.names.<slug>`・カリキュラム・用語集）は対象外。
 * それらの名前空間を完訳にするときに、ここへ足す。
 */
const REGISTRY_KEYS: readonly (readonly [string, readonly string[]])[] = [
  // features `reference/related-references.ts` の ReferenceKey →
  // `reference.scoreTable.title` 等（`related-references-section.tsx` が引く）
  [
    "reference",
    ["scoreTable", "yaku", "glossary"].flatMap((key) => [
      `${key}.title`,
      `${key}.description`,
    ]),
  ],
  // core `HIGH_SCORES` の nameKey（`score/tiers.ts` の表示する区分）→
  // `scoreTable.mangan` 等（`high-score-table.tsx` の `t(item.nameKey)`）
  ["scoreTable", ["mangan", "haneman", "baiman", "sanbaiman", "yakuman"]],
  // web `(user)/_components/_lib/nav-items.tsx` の labelKey → `nav.home` 等
  [
    "nav",
    [
      "home",
      "dojo",
      "practice",
      "learn",
      "scoreTable",
      "reference",
      "leaderboard",
      "settings",
    ],
  ],
  // features `notifications/message.ts` の key → `notifications.messages.planExpired` 等
  [
    "notifications",
    [
      "purchaseCompletedPass",
      "purchaseCompletedLifetime",
      "purchaseCompleted",
      "benefitGrantedUntil",
      "benefitGranted",
      "planExpired",
      "purchaseRefunded",
      "purchaseRevoked",
      "benefitGrantRevoked",
      "unknown",
    ].map((key) => `messages.${key}`),
  ],
];

/** `a.b.c` のパスで辞書の値を引く */
function lookup(dictionary: object, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? Object.entries(node).find(([key]) => key === segment)?.[1]
          : undefined,
      dictionary,
    );
}

describe("レジストリ由来の辞書キー（英語の完訳の名前空間）", () => {
  it.each(REGISTRY_KEYS)("%s", (namespace, keys) => {
    for (const key of keys) {
      const path = `${namespace}.${key}`;
      expect(typeof lookup(ja, path), `ja: ${path}`).toBe("string");
      expect(typeof lookup(en, path), `en: ${path}`).toBe("string");
    }
  });
});
