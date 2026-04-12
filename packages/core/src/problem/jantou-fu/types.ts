import type { Kazehai, HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 雀頭の符計算問題（JantouFu question）
 * 雀頭符計算練習の1問分のデータ
 */
export interface JantouFuQuestion {
  id: string;
  context: {
    bakaze: Kazehai;
    jikaze: Kazehai;
  };
  choices: readonly JantouFuChoice[];
}

export interface JantouFuChoice {
  hai: HaiKindId;
  isCorrect: boolean;
  fu: number;
  explanation: string;
}
