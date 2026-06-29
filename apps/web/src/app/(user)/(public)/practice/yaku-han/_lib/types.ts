import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "yaku-han-results";

/**
 * 役翻数練習の1問ごとの結果データ
 * 役翻数問題結果
 */
export interface YakuHanQuestionResult {
  /** 出題した役名 */
  readonly yakuName: string;
  /** 門前で出題されたか（false は鳴き） */
  readonly isMenzen: boolean;
  /** 鳴ける役か（門前限定役は状態ラベルを表示しない） */
  readonly canNaki: boolean;
  /** 正解の翻数 */
  readonly correctHan: number;
  /** ユーザーが選択した翻数 */
  readonly userHan: number;
  /** 正誤 */
  readonly isCorrect: boolean;
}

/**
 * sessionStorage から取得した値が YakuHanQuestionResult として妥当か検証する
 * 役翻数問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is YakuHanQuestionResult {
  if (typeof value !== "object" || value === undefined || value === null)
    return false;
  const yakuName = Reflect.get(value, "yakuName");
  const isMenzen = Reflect.get(value, "isMenzen");
  const canNaki = Reflect.get(value, "canNaki");
  const correctHan = Reflect.get(value, "correctHan");
  const userHan = Reflect.get(value, "userHan");
  const isCorrect = Reflect.get(value, "isCorrect");
  return (
    typeof yakuName === "string" &&
    typeof isMenzen === "boolean" &&
    typeof canNaki === "boolean" &&
    typeof correctHan === "number" &&
    typeof userHan === "number" &&
    typeof isCorrect === "boolean"
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 役翻数問題結果パース
 */
export const parseYakuHanResults: (
  raw: string | undefined,
) => readonly YakuHanQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
