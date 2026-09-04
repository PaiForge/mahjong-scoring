"use client";

import { useTranslations } from "next-intl";
import { DemoChoiceCell } from "../../_components/demo-choice-cell";
import { HaiKind } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { buildDemoTehai } from "../../_lib/demo-tehai";
import { QuestionPrompt } from "../../_components/question-prompt";
import { HAN_OPTIONS, hanCountLabel } from "../_lib/han-options";

/**
 * デモ用の固定例: 立直 + 門前清自摸和 + 断么九（3翻）
 * 234m 567m 345p 555s 88s（門前ツモ・リーチ）。刻子があるため平和は不成立。
 */
const DEMO_TEHAI = buildDemoTehai([
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.ManZu5,
  HaiKind.ManZu6,
  HaiKind.ManZu7,
  HaiKind.PinZu3,
  HaiKind.PinZu4,
  HaiKind.PinZu5,
  HaiKind.SouZu5,
  HaiKind.SouZu5,
  HaiKind.SouZu5,
  HaiKind.SouZu8,
  HaiKind.SouZu8,
]);

/**
 * デモの和了状況。実際の出題と同じくドラ表示牌を出し、リーチしているので
 * 裏ドラ表示牌も添える（出題は必ず両方を盤面に出す）。
 *
 * 表示牌はどちらも手牌に乗らない牌を選んでいる（一索→二索、九筒→一筒）。
 * ドラが乗ると上の 3 翻の例と食い違うため。
 */
const DEMO_CONTEXT = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.SouZu8,
  isTsumo: true,
  isRiichi: true,
  doraMarkers: [HaiKind.SouZu1],
  uraDoraMarkers: [HaiKind.PinZu9],
} as const;

/**
 * 翻数即答練習の「問題方式」ビジュアルデモ
 * 翻数即答 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と翻数の選択）を、出題時（未回答）のまま
 * 静的に再現する。
 */
export function HanCountHowToPlay() {
  const t = useTranslations("hanCountChallenge");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_TEHAI} context={DEMO_CONTEXT} />

      {/* Instruction */}
      <QuestionPrompt>{t("selectHan")}</QuestionPrompt>

      {/* Han options（出題時と同じ未選択の並び） */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {HAN_OPTIONS.map((han) => (
          <DemoChoiceCell key={han} className="text-sm font-semibold">
            {hanCountLabel(han, t)}
          </DemoChoiceCell>
        ))}
      </div>
    </div>
  );
}
