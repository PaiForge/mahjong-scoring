import {
  MentsuType,
  haiIdToMspz,
  haisToMspz,
  kazeIdToMspz,
  tehaiToMspz,
  type Furo,
  type MentsuJantouFuItem,
  type MentsuJantouFuQuestion,
} from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import {
  hasValidOptionalFuro,
  isCompletedMentsuType,
} from "../../_lib/mentsu-serialization";
import { hasFieldTypes } from "../../_lib/shape-guards";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("mentsu-jantou-fu");

/**
 * 回答行 1 つ（面子 1 つ、または雀頭）の結果データ
 * 面子雀頭符行結果
 *
 * 結果ページは出題時と同じ体裁で行を描き直すため、牌そのものだけでなく
 * 面子種別と副露まで持つ。副露と槓子は牌を横倒しで晒して見せる要素で、
 * 平らに並べ直すと符の根拠（明刻か暗刻か）が読めなくなる。
 */
export interface MentsuJantouFuItemResult {
  /** 行の牌（MSPZ） */
  readonly tiles: string;
  /** 面子種別。雀頭は "Pair" */
  readonly type: MentsuType | "Pair";
  /** 鳴いて晒しているか */
  readonly isOpen: boolean;
  /** 副露の種別と出所。鳴いていない行では持たない */
  readonly furo?: Furo;
  /** 正解の符 */
  readonly correctFu: number;
  /** ユーザーが選んだ符 */
  readonly userFu: number;
}

/**
 * 面子と雀頭の符練習の 1 問ごとの結果データ
 * 面子雀頭符問題結果
 *
 * 結果ページで手牌と回答行を再表示するため、出題そのものを MSPZ 文字列として
 * 持つ。sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、牌はすべて文字列に落として保存する。
 */
export interface MentsuJantouFuQuestionResult {
  /** 手牌（Extended MSPZ。副露・暗槓を含む） */
  readonly tehai: string;
  /** 和了牌（MSPZ） */
  readonly agariHai: string;
  /** 場風（MSPZ） */
  readonly bakaze: string;
  /** 自風（MSPZ） */
  readonly jikaze: string;
  readonly isTsumo: boolean;
  /** 手牌の表示順に並んだ回答行 */
  readonly items: readonly MentsuJantouFuItemResult[];
  /** 全行の符を当てられたか（1 行でも外せば不正解） */
  readonly isCorrect: boolean;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 面子雀頭符問題結果生成
 *
 * @param userFuList - 回答行と同じ並びの、ユーザーが選んだ符
 */
export function toQuestionResult(
  question: MentsuJantouFuQuestion,
  userFuList: readonly number[],
): MentsuJantouFuQuestionResult {
  const { context } = question;
  const items = question.items.map((item, index) =>
    toItemResult(item, userFuList[index]),
  );

  return {
    tehai: tehaiToMspz(question.tehai),
    agariHai: haiIdToMspz(context.agariHai),
    bakaze: kazeIdToMspz(context.bakaze),
    jikaze: kazeIdToMspz(context.jikaze),
    isTsumo: context.isTsumo,
    items,
    isCorrect: items.every((item) => item.userFu === item.correctFu),
  };
}

/** 回答行 1 つを保存形式に変換する */
function toItemResult(
  item: MentsuJantouFuItem,
  userFu: number,
): MentsuJantouFuItemResult {
  const furo = item.originalMentsu?.furo;
  return {
    tiles: haisToMspz(item.tiles),
    type: item.type,
    isOpen: item.isOpen,
    ...(furo ? { furo } : {}),
    correctFu: item.fu,
    userFu,
  };
}

/**
 * 値が回答行の種別として妥当か検証する
 *
 * 回答行は完成面子か雀頭のいずれか。未完成面子（対子・塔子）は和了形を
 * 出題する以上あり得ない。
 */
function isValidItemType(value: unknown): value is MentsuType | "Pair" {
  return value === "Pair" || isCompletedMentsuType(value);
}

/** 値が回答行の結果として妥当か検証する */
function isValidItemResult(value: unknown): value is MentsuJantouFuItemResult {
  if (
    !hasFieldTypes(value, {
      tiles: "string",
      isOpen: "boolean",
      correctFu: "number",
      userFu: "number",
    })
  ) {
    return false;
  }
  return (
    isValidItemType(Reflect.get(value, "type")) && hasValidOptionalFuro(value)
  );
}

/**
 * sessionStorage から取得した値が MentsuJantouFuQuestionResult として妥当か検証する
 * 面子雀頭符問題結果バリデーション
 */
function isValidQuestionResult(
  value: unknown,
): value is MentsuJantouFuQuestionResult {
  if (
    !hasFieldTypes(value, {
      tehai: "string",
      agariHai: "string",
      bakaze: "string",
      jikaze: "string",
      isTsumo: "boolean",
      isCorrect: "boolean",
    })
  ) {
    return false;
  }
  const items: unknown = Reflect.get(value, "items");
  return Array.isArray(items) && items.every(isValidItemResult);
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 面子雀頭符問題結果パース
 */
export const parseMentsuJantouFuResults: (
  raw: string | undefined,
) => readonly MentsuJantouFuQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
