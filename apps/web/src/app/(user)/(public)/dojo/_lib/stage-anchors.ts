import type { JourneyStage } from "@mahjong-scoring/features/journey/journey";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

/**
 * 道場で開いた級（次の目標）の各段のセクションの id
 * 段のアンカー
 *
 * 開く級は常に 1 つなので、級を id に含めなくても重ならない。進み具合の
 * ステップ表示（ダッシュボード・道場）がここへ送る。アンカーは web 固有の
 * ため features の `routes.ts` ではなくここに置く。
 */
export const DOJO_STAGE_ANCHOR: Readonly<Record<JourneyStage, string>> = {
  learn: "stage-learn",
  practice: "stage-practice",
  exam: "stage-exam",
};

/** 道場で開いた級の、指定した段のセクションへのパス */
export function dojoStageHref(stage: JourneyStage): string {
  return `${DOJO_PATH}#${DOJO_STAGE_ANCHOR[stage]}`;
}
