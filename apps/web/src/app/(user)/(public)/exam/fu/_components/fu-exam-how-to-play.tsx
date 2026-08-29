"use client";

import { useTranslations } from "next-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import { DemoFuChoiceGrid } from "@/app/(user)/(public)/practice/_components/demo-fu-choice-grid";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { TehaiDisplay } from "@/app/(user)/(public)/practice/_components/tehai-display";
import {
  DEMO_FU_CONTEXT,
  DEMO_FU_TEHAI,
} from "@/app/(user)/(public)/practice/_lib/demo-tehai";

/**
 * 昇級試験（手牌の合計符）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と符の選択）を、出題時（未回答）のまま静的に
 * 再現する。合計符の練習と同じ牌姿を使う — 出題形式は同じで、違うのは
 * セッションのルール（ミス1回で終了）と合格ラインだけだから。
 */
export function FuExamHowToPlay() {
  const t = useTranslations("fuExamChallenge");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      <QuestionPrompt>{t("prompt")}</QuestionPrompt>

      <DemoFuChoiceGrid
        options={FU_VALUES}
        columnsClassName="grid-cols-3"
        translationNamespace="fuExamChallenge"
      />
    </div>
  );
}
