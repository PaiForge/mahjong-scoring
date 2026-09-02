/**
 * ランキング対象と i18n メッセージファイル (ja.json) の整合性検証
 *
 * @description
 * ランキング一覧のカードは `leaderboard.moduleIcon.<messageKey>` からアイコンを
 * 引く。この名前空間の母集団は練習種別レジストリ全件ではなく `MODULES`
 * （＝ランキングを持つ練習）なので、突き合わせはランキング側で行う。
 *
 * 過不足の両方を見る。不足はアイコンの出ないカードになり、余分は
 * 「ランキングから外したのに辞書だけ残っている」状態になる。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

import { menuTypeToMessageKey } from "@/lib/db/practice-menu-types";
import { MODULES } from "../types";

const moduleIcon = (
  messagesJson as unknown as {
    readonly leaderboard: { readonly moduleIcon: Record<string, unknown> };
  }
).leaderboard.moduleIcon;

describe("i18n integrity: leaderboard.moduleIcon", () => {
  it("ランキング対象すべてのキーが定義されている", () => {
    const missing = MODULES.map(menuTypeToMessageKey).filter(
      (key) => !(key in moduleIcon),
    );

    expect(missing, `不足: ${missing.join(", ")}`).toEqual([]);
  });

  it("ランキング対象に無い余分なキーを持たない", () => {
    // 昇級試験のアイコンが残っていればここで落ちる
    const known = new Set<string>(MODULES.map(menuTypeToMessageKey));
    const extra = Object.keys(moduleIcon).filter((key) => !known.has(key));

    expect(extra, `余分: ${extra.join(", ")}`).toEqual([]);
  });
});
