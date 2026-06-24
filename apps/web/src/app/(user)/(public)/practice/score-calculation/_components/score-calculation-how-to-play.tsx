"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { CheckIcon } from "@/app/_components/icons/check-icon";
import { QuestionDisplay } from "../../score/_components/question-display";

/**
 * デモ用の固定例: 平和 + 断么九 + 門前清自摸和 = 3翻20符
 * 234m 567m 345p 678s 55s（門前ツモ・両面待ち）。子のツモで 700 / 1300。
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
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
  answer: {
    han: 3,
    fu: 20,
    scoreLevel: "Normal",
    payment: { type: "koTsumo", amount: [700, 1300] },
  },
  // ScoreQuestion は Tehai14（ブランド型）を含むため、リポジトリのテスト同様
  // as unknown as で静的構築する（QuestionDisplay は描画にのみ使用するため検証不要）
} as unknown as ScoreQuestion;

/**
 * 点数計算練習の「問題方式」ビジュアルデモ
 * 点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況の提示と点数の回答）を静的に再現し、
 * 正解の点数をハイライトしてプレイ方法を端的に示す。
 */
export function ScoreCalculationHowToPlay() {
  const t = useTranslations("scoreCalculationChallenge");

  return (
    <div className="space-y-5">
      <QuestionDisplay question={DEMO_QUESTION} />

      {/* Instruction */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectScore")}
      </p>

      {/* Correct score（正解をハイライト） */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500 bg-green-50 p-4 text-green-700">
        <span className="flex size-5 items-center justify-center rounded-full bg-green-500">
          <CheckIcon className="size-3 text-white" />
        </span>
        <span className="text-sm font-bold">
          {t("tsumo")} ── {t("fromKo")} 700 / {t("fromOya")} 1300
        </span>
      </div>
    </div>
  );
}
