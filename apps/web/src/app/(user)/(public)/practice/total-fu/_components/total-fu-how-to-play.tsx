"use client";

import { useTranslations } from "next-intl";
import type { FuDetail } from "@mahjong-scoring/core";
import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { TehaiDisplay } from "../../_components/tehai-display";
import { DEMO_FU_CONTEXT, DEMO_FU_TEHAI } from "../../_lib/demo-tehai";
import { FuBreakdown } from "./fu-breakdown";
import { QuestionPrompt } from "../../_components/question-prompt";

/**
 * デモ用の固定例: 東場・南家・七筒ツモ（{@link DEMO_FU_TEHAI}）
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 * 副底20 + ツモ2 + 么九牌暗刻子8 + 雀頭(自風)2 = 32符 → 40符
 */

/** 上記の手牌に対する符の内訳（値はライブラリの符計算と一致することを確認済み） */
const DEMO_DETAILS: readonly FuDetail[] = [
  { reason: "副底", fu: 20 },
  { reason: "ツモ", fu: 2 },
  { reason: "么九牌暗刻子", fu: 8 },
  { reason: "雀頭(自風)", fu: 2 },
];

const DEMO_ANSWER = 40;

/**
 * 合計符練習の「問題方式」ビジュアルデモ
 * 合計符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と1つの符の選択）を静的に再現し、
 * 内訳を足して切り上げるまでの流れを示す。
 */
export function TotalFuHowToPlay() {
  const t = useTranslations("totalFu");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      <QuestionPrompt>{t("prompt")}</QuestionPrompt>

      {/* 正解の符 */}
      <div className="flex items-center justify-center gap-2 rounded-xl border-3 border-ink bg-primary-50 p-4">
        <span className="flex size-4 items-center justify-center rounded-full bg-primary-500">
          <CheckIcon className="size-2.5 text-white" />
        </span>
        <span className="text-2xl font-bold text-primary-700">
          {t("fuSuffix", { value: DEMO_ANSWER })}
        </span>
      </div>

      {/* 内訳（回答後に表示されるもの） */}
      <FuBreakdown details={DEMO_DETAILS} answer={DEMO_ANSWER} />
    </div>
  );
}
