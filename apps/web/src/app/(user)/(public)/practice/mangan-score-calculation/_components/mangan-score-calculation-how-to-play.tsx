"use client";

import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { QuestionDisplay } from "../../score/_components/question-display";
import { YakuListDisplay } from "./yaku-list-display";

/**
 * デモ用の固定例: 立直 + 門前清自摸和 + 断么九 + 平和 + ドラ1 = 5翻（満貫）
 * 234m 567m 345p 678s 55s（門前ツモ・両面待ち・ドラ二萬）。
 * 役と翻数が提示され、そこから点数を導く出題形式を示す。
 *
 * ScoreQuestion は Tehai14（ブランド型）を含むため、リポジトリのテスト同様
 * as unknown as で静的構築する（QuestionDisplay は描画にのみ使用するため検証不要）。
 */
const DEMO_QUESTION = {
  tehai: {
    closed: [
      HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4,
      HaiKind.ManZu5, HaiKind.ManZu6, HaiKind.ManZu7,
      HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5,
      HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8,
      HaiKind.SouZu5, HaiKind.SouZu5,
    ],
    exposed: [],
  },
  agariHai: HaiKind.PinZu3,
  isTsumo: true,
  jikaze: HaiKind.Nan,
  bakaze: HaiKind.Ton,
  doraMarkers: [HaiKind.ManZu1],
  isRiichi: true,
  yakuDetails: [
    { name: "立直", han: 1 },
    { name: "門前清自摸和", han: 1 },
    { name: "断么九", han: 1 },
    { name: "平和", han: 1 },
    { name: "ドラ", han: 1 },
  ],
} as unknown as ScoreQuestion;

/**
 * 満貫以上点数計算ドリルの「問題方式」ビジュアルデモ
 * 満貫以上点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況・役一覧の提示）を静的に再現し、出題形式を端的に示す。
 */
export function ManganScoreCalculationHowToPlay() {
  return (
    <div className="space-y-4">
      <QuestionDisplay question={DEMO_QUESTION} />
      {DEMO_QUESTION.yakuDetails && DEMO_QUESTION.yakuDetails.length > 0 && (
        <YakuListDisplay yakuDetails={DEMO_QUESTION.yakuDetails} />
      )}
    </div>
  );
}
