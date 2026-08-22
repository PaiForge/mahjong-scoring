/**
 * 練習種別レジストリと i18n メッセージファイル (ja.json) の整合性検証
 *
 * @description
 * 練習種別は `menuTypeToMessageKey()` で camelCase のキーに変換され、
 * 練習一覧（`practice.practices`）とランキングアイコンの2つの名前空間から
 * 参照される。レジストリに1行足しても JSON の追記漏れは実行時まで
 * 検出されないため、ここで突き合わせる。
 *
 * 練習名は `practice.practices.<key>.title`（正式名）と `.shortTitle`
 * （マイページ・ランキングで使う短い名）の2つを持つ。
 *
 * learn 側の curriculum-i18n-integrity.test.ts と同じパターン。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

import {
  menuTypeToMessageKey,
  practiceMenuBySlug,
  PRACTICE_MENU_SLUGS,
  PRACTICE_MENU_TYPES,
} from "../practice-menu-types";

const messages = messagesJson as unknown as {
  readonly practice: { readonly practices: Record<string, unknown> };
  readonly leaderboard: {
    readonly moduleIcon: Record<string, unknown>;
  };
} & Record<string, { readonly title?: unknown } | undefined>;

/** 練習種別ごとのキーを持つ名前空間 */
const NAMESPACES = [
  ["practice.practices", messages.practice.practices],
  ["leaderboard.moduleIcon", messages.leaderboard.moduleIcon],
] as const;

describe.each(NAMESPACES)("i18n integrity: %s", (namespace, entries) => {
  it("全ての練習種別のキーが定義されている", () => {
    const missing = PRACTICE_MENU_TYPES.map(menuTypeToMessageKey).filter(
      (key) => !(key in entries),
    );

    expect(missing, `${namespace} に不足: ${missing.join(", ")}`).toEqual([]);
  });

  it("レジストリに無い余分なキーを持たない", () => {
    const known = new Set<string>(
      PRACTICE_MENU_TYPES.map(menuTypeToMessageKey),
    );
    const extra = Object.keys(entries).filter((key) => !known.has(key));

    expect(extra, `${namespace} に余分: ${extra.join(", ")}`).toEqual([]);
  });
});

/**
 * マイページ・ランキングは練習名の短い方（shortTitle）を引く。
 * title だけ足して shortTitle を忘れると実行時までわからないため検証する。
 */
describe("i18n integrity: practice.practices.<key>.shortTitle", () => {
  it.each(PRACTICE_MENU_TYPES.map(menuTypeToMessageKey))(
    "%s が title と shortTitle を持つ",
    (key) => {
      const entry = messages.practice.practices[key] as
        { readonly title?: unknown; readonly shortTitle?: unknown } | undefined;

      expect(typeof entry?.title, `${key}.title が無い`).toBe("string");
      expect(typeof entry?.shortTitle, `${key}.shortTitle が無い`).toBe(
        "string",
      );
    },
  );
});

/**
 * レジストリの `namespace` は練習ページ・結果ページ・ローディングの
 * 3ファクトリが練習名（`<namespace>.title`）を引くのに使う。
 * 綴りを間違えても型では検出できないため、辞書側の存在をここで突き合わせる。
 */
describe("i18n integrity: 練習ページの namespace", () => {
  it.each(PRACTICE_MENU_SLUGS)("%s の <namespace>.title が存在する", (slug) => {
    const { namespace } = practiceMenuBySlug(slug);
    const section = messages[namespace];

    expect(typeof section?.title, `${namespace}.title が ja.json に無い`).toBe(
      "string",
    );
  });
});
