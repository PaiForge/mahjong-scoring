import { useTranslations } from "use-intl";

import {
  OperationHelp,
  operationHelpSteps,
} from "../components/operation-help";

/** 説明する順（web の `DojoSpotlightTour` の手順と同じ） */
const STEP_KEYS = [
  "currentRank",
  "nextRank",
  "stages",
  "blackBelt",
  "locked",
] as const;

/**
 * 道場の見方（見出しの「?」。web の `DojoSpotlightTour`）
 * 道場の見方ヘルプ
 *
 * 段級位と黒帯への道の読み方を 1 枚ずつ説明する。常に読ませる必要のある
 * 内容ではない（カード自体に状態・進み具合・施錠の注記が出ている）ので、
 * 知りたい人が開く形にしている。黒帯（初段）が何の認定かもここで説明する。
 */
export function DojoHelp() {
  const t = useTranslations("dojo.tour");
  return (
    <OperationHelp
      namespace="dojo.tour"
      steps={operationHelpSteps(t, STEP_KEYS)}
    />
  );
}
