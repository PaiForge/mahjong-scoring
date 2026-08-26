"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { DemoFuChoiceGrid } from "../../_components/demo-fu-choice-grid";
import { MACHI_FU_OPTIONS } from "../_lib/fu-options";
import { MachiFuPrompt } from "./machi-fu-prompt";
import { QuestionPrompt } from "../../_components/question-prompt";

/** デモ用の固定例: 嵌張待ち（二萬・四萬で三萬待ち） */
const DEMO_TILES: readonly HaiKindId[] = [HaiKind.ManZu2, HaiKind.ManZu4];
const DEMO_AGARI: HaiKindId = HaiKind.ManZu3;

/**
 * 待ち符練習の「問題方式」ビジュアルデモ
 * 待ち符 遊び方デモ
 *
 * 実際の出題盤面（待ち形・和了牌の提示と2択）を、出題時（未回答）のまま
 * 静的に再現する。提示部分と選択肢は盤面（MachiFuBoard）と同じ実装を
 * 共有するため、盤面を変えるとデモも追従する。
 */
export function MachiFuHowToPlay() {
  const t = useTranslations("machiFu");

  return (
    <div className="space-y-5">
      {/* Machi tiles / agari */}
      <MachiFuPrompt tiles={DEMO_TILES} agariHai={DEMO_AGARI} />

      {/* Question */}
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Fu options */}
      <DemoFuChoiceGrid
        options={MACHI_FU_OPTIONS}
        columnsClassName="grid-cols-2"
        translationNamespace="machiFu"
      />
    </div>
  );
}
