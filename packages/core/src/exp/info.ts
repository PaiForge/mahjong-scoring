/**
 * EXP 付与結果の組み立て
 * 経験値付与結果
 *
 * @description
 * 1 回の付与（獲得量と付与後の累計）から、結果画面に出す `ExpInfo` を作る。
 * web の結果ページとアプリの結果画面が同じ判定（レベルアップ・進捗率）で
 * 描くため、サーバーの DB 操作から切り離してここに置く。
 */
import { getLevel, getLevelProgress } from "./level";
import type { ExpInfo } from "./types";

/**
 * 獲得量と付与後の累計 EXP から `ExpInfo` を作る
 * 経験値付与結果作成
 *
 * @param args.earned 今回獲得した EXP
 * @param args.totalExpAfter 付与後の累計 EXP
 */
export function buildExpInfo(args: {
  readonly earned: number;
  readonly totalExpAfter: number;
}): ExpInfo {
  const { earned, totalExpAfter } = args;
  const levelAfter = getLevel(totalExpAfter);
  const levelBefore = getLevel(totalExpAfter - earned);
  const progress = getLevelProgress(totalExpAfter);
  return {
    earnedExp: earned,
    totalExp: totalExpAfter,
    level: levelAfter,
    levelUp: levelAfter > levelBefore,
    progressPercent: Math.round(progress.progress * 100),
  };
}
