/**
 * 試験盤面のルール設定非依存の構造検証
 *
 * @description
 * 試験の公平性は「盤面が端末ローカルのルール設定を読まない」ことで成立する
 * （合格ラインが全受験者に同じ 1 本のため）。出題条件そのものの検証は
 * `@mahjong-scoring/features` の `exam/score/types.test.ts` にある。
 */
import { describe, it } from "vitest";

import { expectRuleSettingsIndependence } from "../../../_lib/__tests__/expect-rule-settings-independence";

describe("試験盤面のルール設定非依存", () => {
  it("盤面を構成するモジュールがルール設定ストアを import しない", () => {
    expectRuleSettingsIndependence("score");
  });
});
