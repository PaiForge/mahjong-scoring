/**
 * 出題盤面（TehaiDisplay / TehaiHand）が引く辞書キーの整合性検証
 *
 * @description
 * 盤面はどの練習でも同じものを出すため、文言を練習ごとの名前空間ではなく
 * `common` に集約している。next-intl のキー欠落は実行時（盤面の描画時）まで
 * 検出されないため、ここで突き合わせる。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

/** TehaiDisplay / TehaiHand が t() で引く common のキー */
const REQUIRED_COMMON_KEYS = [
  // 上段の状況表示
  "round",
  "wind",
  "dealer",
  "nonDealer",
  "riichi",
  // 和了牌のラベル
  "tsumo",
  "ron",
  // ドラ表示（表示牌 / ドラそのものの切り替え分を両方）
  "dora",
  "doraIndicator",
  "uraDora",
  "uraDoraIndicator",
  // ドラの見方モーダル
  "showDetailInfo",
  "doraInfoTitle",
  "doraInfoIndicator",
  "doraInfoActual",
  "close",
] as const;

describe("i18n integrity: common（出題盤面）", () => {
  it.each(REQUIRED_COMMON_KEYS)("%s が定義されている", (key) => {
    expect(Reflect.get(messagesJson.common, key)).toBeTypeOf("string");
  });
});
