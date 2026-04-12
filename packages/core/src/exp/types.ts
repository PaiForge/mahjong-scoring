/**
 * EXP 計算用の型定義
 * 経験値型
 */

/** 経験値計算の入力 */
export interface ExpInput {
  /** 正答数 */
  readonly score: number;
  /** 誤答数（0〜3） */
  readonly incorrectAnswers: number;
  /** 練習種別 */
  readonly menuType: string;
}

/** 経験値計算の結果 */
export interface ExpResult {
  /** 重みを掛ける前後のベースEXP（`score * weight`） */
  readonly baseExp: number;
  /** 精度ボーナスの倍率 */
  readonly accuracyMultiplier: number;
  /** 最終獲得 EXP */
  readonly totalExp: number;
}

/** レベル進捗情報 */
export interface LevelProgress {
  readonly level: number;
  /** 現レベルの必要累計 EXP */
  readonly currentLevelExp: number;
  /** 次レベルの必要累計 EXP */
  readonly nextLevelExp: number;
  /** 現レベル内の進捗率（0.0〜1.0） */
  readonly progress: number;
}

/**
 * クライアント/サーバー間で受け渡す EXP 付与結果
 * 経験値付与結果
 */
export interface ExpInfo {
  /** 今回獲得した EXP */
  readonly earnedExp: number;
  /** 付与後の累計 EXP */
  readonly totalExp: number;
  /** 付与後のレベル */
  readonly level: number;
  /** 今回の付与でレベルアップしたか */
  readonly levelUp: boolean;
  /** 現レベル内の進捗率（0〜100 の整数） */
  readonly progressPercent: number;
}
