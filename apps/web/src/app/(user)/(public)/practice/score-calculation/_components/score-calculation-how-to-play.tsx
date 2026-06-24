"use client";

import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { QuestionDisplay } from "../../score/_components/question-display";

/**
 * デモ用の固定例: 平和 + 断么九 + 門前清自摸和（子・門前ツモ・両面待ち）
 * 234m 567m 345p 678s 55s。手牌・状況から点数を読み取る出題形式を示す。
 *
 * ScoreQuestion は Tehai14（ブランド型）を含むため、リポジトリのテスト同様
 * as unknown as で静的構築する（QuestionDisplay は描画にのみ使用するため検証不要）。
 */
const DEMO_QUESTION = {
  tehai: {
    closed: [
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
      HaiKind.ManZu7,
      HaiKind.PinZu3,
      HaiKind.PinZu4,
      HaiKind.PinZu5,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.SouZu5,
      HaiKind.SouZu5,
    ],
    exposed: [],
  },
  agariHai: HaiKind.PinZu3,
  isTsumo: true,
  jikaze: HaiKind.Nan,
  bakaze: HaiKind.Ton,
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
} as unknown as ScoreQuestion;

/**
 * 点数計算練習の「問題方式」ビジュアルデモ
 * 点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況の提示）を静的に再現し、出題形式を端的に示す。
 */
export function ScoreCalculationHowToPlay() {
  return <QuestionDisplay question={DEMO_QUESTION} />;
}
