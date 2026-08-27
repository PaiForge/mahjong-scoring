/**
 * 面子分解モーダル（TehaiMentsuBreakdown）が引く辞書キーの整合性検証
 *
 * @description
 * 分解はどの練習でも同じものを出すため、文言を練習ごとの名前空間ではなく
 * `common` に集約している。next-intl のキー欠落は実行時（モーダルを開いた
 * 時点）まで検出されないため、ここで突き合わせる。面子種別のラベルは
 * 明暗で書き分けるので、刻子・槓子は2キーずつ要る。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

/** TehaiMentsuBreakdown が t() で引く common のキー */
const REQUIRED_COMMON_KEYS = [
  // 導線とモーダルの枠
  "mentsuBreakdown",
  "close",
  // 面子・雀頭のラベル
  "shuntsu",
  "ankou",
  "minkou",
  "ankan",
  "minkan",
  "jantou",
  // 表の見出し
  "mentsuBreakdownColHai",
  "mentsuBreakdownColType",
  // 注記（ロンで完成した刻子の扱い）
  "mentsuBreakdownMinkouNote",
] as const;

describe("i18n integrity: common（面子分解モーダル）", () => {
  it.each(REQUIRED_COMMON_KEYS)("%s が定義されている", (key) => {
    expect(Reflect.get(messagesJson.common, key)).toBeTypeOf("string");
  });
});
