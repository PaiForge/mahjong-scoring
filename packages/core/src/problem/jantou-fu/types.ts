import type { Kazehai, HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 雀頭の符計算問題（JantouFu question）
 * 雀頭符計算練習の1問分のデータ
 */
export interface JantouFuQuestion {
  readonly id: string;
  readonly context: {
    readonly bakaze: Kazehai;
    readonly jikaze: Kazehai;
  };
  readonly choices: readonly JantouFuChoice[];
}

export interface JantouFuChoice {
  readonly hai: HaiKindId;
  readonly isCorrect: boolean;
  readonly fu: number;
  readonly explanation: string;
}
