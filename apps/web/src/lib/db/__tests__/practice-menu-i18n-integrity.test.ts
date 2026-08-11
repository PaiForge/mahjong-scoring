/**
 * 練習種別レジストリと i18n メッセージファイル (ja.json) の整合性検証
 *
 * @description
 * 練習種別は `menuTypeToMessageKey()` で camelCase のキーに変換され、
 * 4つの名前空間（練習一覧・マイページ・ランキング名・ランキングアイコン）
 * から参照される。レジストリに1行足しても4箇所の JSON 追記漏れは
 * 実行時まで検出されないため、ここで突き合わせる。
 *
 * learn 側の curriculum-i18n-integrity.test.ts と同じパターン。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

import {
  menuTypeToMessageKey,
  PRACTICE_MENU_TYPES,
} from "../practice-menu-types";

const messages = messagesJson as unknown as {
  readonly practice: { readonly practices: Record<string, unknown> };
  readonly mypage: {
    readonly challenges: { readonly menuTypes: Record<string, unknown> };
  };
  readonly leaderboard: {
    readonly module: Record<string, unknown>;
    readonly moduleIcon: Record<string, unknown>;
  };
};

/** 練習種別ごとのキーを持つ名前空間 */
const NAMESPACES = [
  ["practice.practices", messages.practice.practices],
  ["mypage.challenges.menuTypes", messages.mypage.challenges.menuTypes],
  ["leaderboard.module", messages.leaderboard.module],
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
