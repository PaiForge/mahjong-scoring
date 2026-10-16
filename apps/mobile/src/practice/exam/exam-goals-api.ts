import {
  MOBILE_EXAM_GOALS_API_PATH,
  parseMobileExamGoalsResponse,
  type MobileExamGoalsResponse,
} from "@mahjong-scoring/features/exam/mobile-api";

import { readJson } from "../../auth/read-json";
import { SITE_URL } from "../../lib/app-site-url";

/**
 * 昇級試験の合格ラインをサーバーから読む。読めなければ undefined
 * 試験合格ライン取得
 *
 * 誰が読んでも同じ値なのでトークンを付けない（`callMobileApi` を通さない）。
 */
export async function fetchExamGoals(): Promise<
  MobileExamGoalsResponse | undefined
> {
  try {
    const response = await fetch(`${SITE_URL}${MOBILE_EXAM_GOALS_API_PATH}`);
    if (!response.ok) return undefined;
    return parseMobileExamGoalsResponse(await readJson(response));
  } catch {
    return undefined;
  }
}
