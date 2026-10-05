import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

import { hanCountScreens } from "./boards/han-count";
import { jantouFuScreens } from "./boards/jantou-fu";
import { manganScoreCalculationScreens } from "./boards/mangan-score-calculation";
import { machiFuScreens } from "./boards/machi-fu";
import { mentsuFuScreens } from "./boards/mentsu-fu";
import { mentsuJantouFuScreens } from "./boards/mentsu-jantou-fu";
import { scoreCalculationScreens } from "./boards/score-calculation";
import { scoreTableScreens } from "./boards/score-table";
import { totalFuScreens } from "./boards/total-fu";
import { yakuScreens } from "./boards/yaku";
import { yakuHanScreens } from "./boards/yaku-han";
import { manganExamScreens } from "./boards/mangan-exam";
import { fuExamScreens } from "./boards/fu-exam";
import { chiitoitsuExamScreens } from "./boards/chiitoitsu-exam";
import { pinfuExamScreens } from "./boards/pinfu-exam";
import { fuScoreExamScreens } from "./boards/fu-score-exam";
import { scoreExamScreens } from "./boards/score-exam";
import type { PracticeScreens } from "./practice-screens";

/**
 * slug → 練習の画面一式
 * 練習画面レジストリ
 *
 * 練習の一覧・パス・辞書キーは features のレジストリ（`PRACTICE_MENU_REGISTRY`・
 * `PRACTICE_CATALOG`）が正典で、ここは「その練習の盤面をモバイルで描けるか」
 * だけを持つ。載っていない練習は一覧に出さない。
 */
const PRACTICE_SCREENS: Partial<Record<PracticeMenuSlug, PracticeScreens>> = {
  "jantou-fu": jantouFuScreens,
  "machi-fu": machiFuScreens,
  "mentsu-fu": mentsuFuScreens,
  "mentsu-jantou-fu": mentsuJantouFuScreens,
  "total-fu": totalFuScreens,
  "yaku-han": yakuHanScreens,
  yaku: yakuScreens,
  "han-count": hanCountScreens,
  "score-table": scoreTableScreens,
  "mangan-score-calculation": manganScoreCalculationScreens,
  "score-calculation": scoreCalculationScreens,
  "mangan-exam": manganExamScreens,
  "fu-exam": fuExamScreens,
  "chiitoitsu-exam": chiitoitsuExamScreens,
  "pinfu-exam": pinfuExamScreens,
  "fu-score-exam": fuScoreExamScreens,
  "score-exam": scoreExamScreens,
};

/** 練習の画面一式（モバイルに未移植なら undefined） */
export function practiceScreensFor(
  slug: PracticeMenuSlug,
): PracticeScreens | undefined {
  return PRACTICE_SCREENS[slug];
}
