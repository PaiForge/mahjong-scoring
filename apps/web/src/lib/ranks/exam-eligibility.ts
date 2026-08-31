import {
  nextRank,
  rankRequiringMenu,
  type ChallengeScoreRequirement,
  type RankDefinition,
  type RankSlug,
} from "./registry";

/**
 * 昇級試験の受験資格の内訳（共通部分）
 * 受験資格
 */
interface ExamEligibilityBase {
  /** その試験が昇級試験になっているランク */
  readonly rank: RankDefinition;
  /** そのランクの合格要件（合格点の表示等に使う） */
  readonly requirement: ChallengeScoreRequirement;
}

/** 次に取る級の試験 — 受験できる */
export interface ExamEligible extends ExamEligibilityBase {
  readonly kind: "eligible";
}

/** 達成済みの級の試験 — 再挑戦（ランキング更新）として受験できる */
export interface ExamRetryable extends ExamEligibilityBase {
  readonly kind: "retryable";
}

/** 未達成の上位級の試験 — 先に下の級を取るまで受験できない */
export interface ExamLocked extends ExamEligibilityBase {
  readonly kind: "locked";
  /** 先に合格すべき級（= 現在の次の級） */
  readonly requiredRank: RankDefinition;
}

/**
 * 昇級試験の受験資格
 * 受験資格
 */
export type ExamEligibility = ExamEligible | ExamRetryable | ExamLocked;

/**
 * 昇級試験の受験資格を判定する
 * 受験資格判定
 *
 * @description
 * 段級位は飛び級できない（保持する級は常に最下位からの連続区間）。その
 * 順序を受験の側から支える判定で、受験できるのは「次に取る級の試験」と
 * 「達成済みの級の試験（再挑戦）」だけ。未達成の上位級の試験は `locked` に
 * なる。
 *
 * 純関数でクライアント・サーバーどちらからも使える。表示の出し分け
 * （試験説明ページの開始ボタン）と強制（play ページのリダイレクト・
 * `savePracticeResult` の保存拒否）の両方がこの1つの判定を使い、
 * 基準が食い違わないようにする。
 *
 * 過去の仕様で級が飛び番で付与されたユーザー（例: 5級と2級のみ保持）は
 * 剥奪しない。その場合も「次に取る級」は最下位の未達成（3級）で、達成済みの
 * 2級は再挑戦できる — 判定はどちらも保持集合だけから導けるため、特別扱いは
 * 要らない。
 *
 * @param menuType - 練習種別（例: "pinfu_exam"）
 * @param achievedSlugs - ユーザーの達成済み段級位スラッグ
 * @returns 受験資格。昇級試験でない練習（どのランクの要件でもない）は
 *   undefined — 資格の概念がなく、誰でも遊べる
 */
export function evaluateExamEligibility(
  menuType: string,
  achievedSlugs: readonly RankSlug[],
): ExamEligibility | undefined {
  const exam = rankRequiringMenu(menuType);
  if (!exam) return undefined;

  const achieved = new Set<string>(achievedSlugs);
  if (achieved.has(exam.rank.slug)) {
    return { kind: "retryable", ...exam };
  }

  const next = nextRank(achievedSlugs);
  // 試験の級が未達成なら、未達成ランクは少なくとも1つあるので next は
  // 必ず存在する。型の上で undefined になる残余は受験可に倒す（強制は
  // 保存側にもあるため、ここで塞ぎ込む必要はない）
  if (next === undefined || next.slug === exam.rank.slug) {
    return { kind: "eligible", ...exam };
  }
  return { kind: "locked", ...exam, requiredRank: next };
}
