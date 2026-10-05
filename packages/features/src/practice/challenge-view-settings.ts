import {
  isExamMenuType,
  practiceMenuBySlug,
  type PracticeMenuSlug,
  type PracticeMenuType,
} from "../practice-menu-types";
import { rankRequiringMenu } from "../ranks/registry";

/**
 * チャレンジ・トレーニングの画面が練習ごとに読む設定
 * チャレンジ画面設定
 */
export interface ChallengeViewSettings {
  /** 練習の翻訳名前空間（見出しの `title` を引く） */
  readonly namespace: string;
  readonly menuType: PracticeMenuType;
  /** チャレンジのミス上限（レジストリが正典） */
  readonly mistakeLimit: number;
  /** チャレンジの制限時間（秒。レジストリが正典） */
  readonly timeLimit: number;
  /**
   * 昇級試験か練習か。中断の文言・結果の扱い・模試の見出しが分かれる
   */
  readonly kind: "exam" | "practice";
  /**
   * この正解数に届いたらチャレンジを終える（昇級試験の合格点）。練習は無い
   *
   * 昇級試験は合格点に届いた時点で合否が決まり、その先を解いても結果は
   * 変わらない。サーバーも合格点に届いた挑戦を終わったものとして扱う。
   */
  readonly goalCount: number | undefined;
}

/**
 * 練習のスラッグからチャレンジ・トレーニングの画面設定を引く
 * チャレンジ画面設定取得
 */
export function challengeViewSettings(
  slug: PracticeMenuSlug,
): ChallengeViewSettings {
  const { namespace, menuType, mistakeLimit, timeLimit } =
    practiceMenuBySlug(slug);
  return {
    namespace,
    menuType,
    mistakeLimit,
    timeLimit,
    kind: isExamMenuType(menuType) ? "exam" : "practice",
    goalCount: rankRequiringMenu(menuType)?.requirement.minScore,
  };
}
