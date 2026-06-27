/**
 * 点数表早引き練習の型定義
 * 点数表練習型
 */

/**
 * ロン和了の正解
 * ロン正解
 */
export interface RonAnswer {
  readonly type: "ron";
  readonly score: number;
}

/**
 * 親ツモ和了の正解
 * 親ツモ正解
 */
export interface OyaTsumoAnswer {
  readonly type: "oyaTsumo";
  /** オール点数 */
  readonly scoreAll: number;
}

/**
 * 子ツモ和了の正解
 * 子ツモ正解
 */
export interface KoTsumoAnswer {
  readonly type: "koTsumo";
  /** 子からの支払い */
  readonly scoreFromKo: number;
  /** 親からの支払い */
  readonly scoreFromOya: number;
}

/**
 * 点数表練習の正解型（ロン / 親ツモ / 子ツモ）
 * 点数表正解
 */
export type ScoreTableAnswer = RonAnswer | OyaTsumoAnswer | KoTsumoAnswer;

/**
 * 点数表早引き練習の1問分のデータ
 * 点数表問題
 */
export interface ScoreTableQuestion {
  readonly id: string;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /**
   * 符。満貫以上（manganPlus）の問題では点数が符に依存しないため `undefined`。
   * 満貫未満の問題では必ず数値が入る。
   */
  readonly fu?: number;
  readonly correctAnswer: ScoreTableAnswer;
}

/**
 * ユーザーの回答（現時点では正解と同一構造）
 * 点数表ユーザー回答
 *
 * 正解型とは意味的に区別する。将来的にユーザー回答固有のフィールド
 * （回答時間、確信度など）を追加する可能性がある。
 */
export type ScoreTableUserAnswer = ScoreTableAnswer;

/** 出題する役割（親 / 子） */
export type ScoreTableRole = "oya" | "ko";

/** 出題する和了方法（ツモ / ロン） */
export type ScoreTableWin = "tsumo" | "ron";

/** 出題する点数帯（満貫未満 / 満貫以上） */
export type ScoreTableRange = "nonMangan" | "manganPlus";

/**
 * 問題生成オプション
 * 点数表生成オプション
 */
export interface ScoreTableGeneratorOptions {
  /** 翻数の最小値（満貫未満帯のみに作用。既定: 1） */
  readonly minHan?: number;
  /** 翻数の最大値（満貫未満帯のみに作用。既定: 3） */
  readonly maxHan?: number;
  /** 符の最小値（満貫未満帯のみに作用。既定: 20） */
  readonly minFu?: number;
  /** 符の最大値（満貫未満帯のみに作用。既定: 60） */
  readonly maxFu?: number;
  /** 出題する役割。既定: 親・子の両方 */
  readonly roles?: readonly ScoreTableRole[];
  /** 出題する和了方法。既定: ツモ・ロンの両方 */
  readonly wins?: readonly ScoreTableWin[];
  /** 出題する点数帯。既定: 満貫未満のみ（後方互換のため） */
  readonly ranges?: readonly ScoreTableRange[];
}
