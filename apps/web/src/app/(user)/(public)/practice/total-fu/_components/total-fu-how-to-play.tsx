"use client";

import { useTranslations } from "next-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import { DemoFuChoiceGrid } from "../../_components/demo-fu-choice-grid";
import { TehaiDisplay } from "../../_components/tehai-display";
import { DEMO_FU_CONTEXT, DEMO_FU_TEHAI } from "../../_lib/demo-tehai";
import { QuestionPrompt } from "../../_components/question-prompt";

/**
 * 合計符練習の「問題方式」ビジュアルデモ
 * 合計符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と符の選択）を、出題時（未回答）のまま静的に
 * 再現する。符の内訳は回答後に出るものなので、ここには含めない
 * （符の数え方は教本ページで扱う）。
 *
 * デモ用の固定例: 東場・南家・七筒ツモ（{@link DEMO_FU_TEHAI}）
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
export function TotalFuHowToPlay() {
  const t = useTranslations("totalFu");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      <QuestionPrompt>{t("prompt")}</QuestionPrompt>

      <DemoFuChoiceGrid
        options={FU_VALUES}
        columnsClassName="grid-cols-3"
        translationNamespace="totalFu"
      />
    </div>
  );
}
