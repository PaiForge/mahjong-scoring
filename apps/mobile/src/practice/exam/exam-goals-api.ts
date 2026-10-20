import {
  MOBILE_EXAM_GOALS_API_PATH,
  parseMobileExamGoalsResponse,
  type MobileExamGoalsResponse,
} from "@mahjong-scoring/features/exam/mobile-api";

import { readPublicMobileApi } from "../../auth/read-public-mobile-api";

/**
 * 昇級試験の合格ラインをサーバーから読む。読めなければ undefined
 * 試験合格ライン取得
 *
 * 誰が読んでも同じ値なのでトークンを付けない（`callMobileApi` を通さない）。
 */
export function fetchExamGoals(): Promise<MobileExamGoalsResponse | undefined> {
  return readPublicMobileApi(
    MOBILE_EXAM_GOALS_API_PATH,
    parseMobileExamGoalsResponse,
  );
}
