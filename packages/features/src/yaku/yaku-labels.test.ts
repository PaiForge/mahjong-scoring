import { describe, expect, it } from "vitest";

import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import {
  SCORE_YAKU_NAME_MAP,
  SITUATIONAL_YAKU_KEYS,
} from "@mahjong-scoring/core/core/yaku-names";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { YAKU_TO_KEY, yakuLabel } from "./yaku-labels";

/**
 * 練習の役名の辞書（`agariScore.yaku`）と core の役名の対応の検査
 *
 * 練習の内訳・選択肢は役名を `yakuLabel(core の役名, agariScore.yaku の t)` で描く。
 * 対応表に無い名前は core の日本語のまま出るので、英語のページに漢字が残る。
 * core が役の内訳に出せる名前がすべて対応表と辞書にあることをここで固定する。
 */
const jaYaku: Readonly<Record<string, string>> = jaMessages.agariScore.yaku;

/**
 * core が役の内訳（`yakuDetails.name`）に出せる名前
 *
 * - `YAKU_HAN_ENTRIES` の役名（翻数の表）
 * - ライブラリの役名を日本語にした表（`SCORE_YAKU_NAME_MAP`）のうち、出題に出ない
 *   状況役（海底・河底・嶺上・槍槓 等）を除いたもの
 * - 役ではない加算: ドラ（`build-question.ts` の `DORA_NAME`）・裏ドラ（`reconciler.ts`）
 * - 内訳の並べ替えが読み替える名前: 場風牌・自風牌・連風牌（`YAKUHAI_ALIASES`）・
 *   ダブル立直（`POSITION_ALIASES`。出題をやめる前に保存された内訳に残る）
 */
const SITUATIONAL_NAMES = new Set(
  SITUATIONAL_YAKU_KEYS.map((key) => SCORE_YAKU_NAME_MAP[key]),
);
const CORE_YAKU_NAMES: readonly string[] = [
  ...new Set([
    ...YAKU_HAN_ENTRIES.map((entry) => entry.name),
    ...Object.values(SCORE_YAKU_NAME_MAP).filter(
      (name) => !SITUATIONAL_NAMES.has(name),
    ),
    "ドラ",
    "裏ドラ",
    "場風牌",
    "自風牌",
    "連風牌",
    "ダブル立直",
  ]),
];

describe("YAKU_TO_KEY", () => {
  it.each(CORE_YAKU_NAMES)("core の役名「%s」は辞書キーを持つ", (name) => {
    expect(YAKU_TO_KEY[name]).toBeDefined();
  });

  it.each(CORE_YAKU_NAMES)(
    "core の役名「%s」の辞書キーが日本語の agariScore.yaku にある",
    (name) => {
      const key = YAKU_TO_KEY[name];
      expect(key).toBeDefined();
      if (key !== undefined) expect(jaYaku[key], key).toBeDefined();
    },
  );
});

describe("yakuLabel", () => {
  /** 日本語の `agariScore.yaku` を引く翻訳関数 */
  const tJa = (key: string): string => jaYaku[key] ?? key;

  it("対応表にある役名は辞書の表示名にする", () => {
    expect(yakuLabel("断么九", tJa)).toBe(jaMessages.agariScore.yaku.tanyao);
    expect(yakuLabel("ドラ", tJa)).toBe("ドラ");
    expect(yakuLabel("裏ドラ", tJa)).toBe("裏ドラ");
    expect(yakuLabel("連風牌", tJa)).toBe("連風牌");
    expect(yakuLabel("役牌", tJa)).toBe("役牌");
  });

  it("辞書キーで翻訳関数を引く", () => {
    const t = (key: string): string => `<${key}>`;
    expect(yakuLabel("ドラ", t)).toBe("<dora>");
    expect(yakuLabel("裏ドラ", t)).toBe("<uraDora>");
    expect(yakuLabel("連風牌", t)).toBe("<renfonpai>");
    expect(yakuLabel("役牌 東", t)).toBe("<ton>");
  });

  it("対応表に無い名前は core の名前をそのまま返す", () => {
    const t = (key: string): string => `<${key}>`;
    expect(yakuLabel("未知の役", t)).toBe("未知の役");
  });
});
