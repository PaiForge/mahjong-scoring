/**
 * 点数表早引きドリルの型定義
 * 点数表ドリル型
 */

/**
 * ロン和了の正解
 * ロン正解
 */
export interface RonAnswer {
  readonly type: 'ron';
  readonly score: number;
}

/**
 * 親ツモ和了の正解
 * 親ツモ正解
 */
export interface OyaTsumoAnswer {
  readonly type: 'oyaTsumo';
  /** オール点数 */
  readonly scoreAll: number;
}

/**
 * 子ツモ和了の正解
 * 子ツモ正解
 */
export interface KoTsumoAnswer {
  readonly type: 'koTsumo';
  /** 子からの支払い */
  readonly scoreFromKo: number;
  /** 親からの支払い */
  readonly scoreFromOya: number;
}

/**
 * 点数表ドリルの正解型（ロン / 親ツモ / 子ツモ）
 * 点数表正解
 */
export type ScoreTableAnswer = RonAnswer | OyaTsumoAnswer | KoTsumoAnswer;

/**
 * 点数表早引きドリルの1問分のデータ
 * 点数表問題
 */
export interface ScoreTableQuestion {
  readonly id: string;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  readonly fu: number;
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

/**
 * 問題生成オプション（将来の拡張用）
 * 点数表生成オプション
 */
export interface ScoreTableGeneratorOptions {
  /** 翻数の最小値（既定: 1） */
  readonly minHan?: number;
  /** 翻数の最大値（既定: 3） */
  readonly maxHan?: number;
  /** 符の最小値（既定: 20） */
  readonly minFu?: number;
  /** 符の最大値（既定: 60） */
  readonly maxFu?: number;
}
