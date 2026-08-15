"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { DemoFuChoiceGrid } from "../../_components/demo-fu-choice-grid";
import { MACHI_FU_OPTIONS } from "../_lib/fu-options";
import { MachiFuPrompt } from "./machi-fu-prompt";

/** デモ用の固定例: 嵌張待ち（二萬・四萬で三萬待ち） → 2符 */
const DEMO_TILES: readonly HaiKindId[] = [HaiKind.ManZu2, HaiKind.ManZu4];
const DEMO_AGARI: HaiKindId = HaiKind.ManZu3;
const DEMO_ANSWER = 2;

/**
 * 待ち符練習の「問題方式」ビジュアルデモ
 * 待ち符 遊び方デモ
 *
 * 実際の出題盤面（待ち形・和了牌の提示と2択）を静的に再現し、
 * 正解の符をハイライトしてプレイ方法を端的に示す。提示部分と選択肢は
 * 盤面（MachiFuBoard）と同じ実装を共有するため、盤面を変えるとデモも追従する。
 */
export function MachiFuHowToPlay() {
  const t = useTranslations("machiFu");

  return (
    <div className="space-y-5">
      {/* Machi tiles / agari */}
      <MachiFuPrompt tiles={DEMO_TILES} agariHai={DEMO_AGARI} />

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <DemoFuChoiceGrid
        options={MACHI_FU_OPTIONS}
        answer={DEMO_ANSWER}
        columnsClassName="grid-cols-2"
        translationNamespace="machiFu"
      />
    </div>
  );
}
