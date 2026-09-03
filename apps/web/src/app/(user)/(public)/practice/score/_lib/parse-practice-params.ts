import type {
  QuestionGeneratorOptions,
  ScoreRange,
} from "@mahjong-scoring/core";

import { RANGE_PARAM, parseRangeValues } from "../../_lib/range-params";
import { ROLE_PARAM, parseRoleValues } from "../../_lib/role-params";
import {
  HAND_SHAPE_FURO,
  HAND_SHAPE_MENZEN,
  HAND_SHAPE_PARAM,
  parseHandShape,
} from "./hand-shape-param";
import { YAKU_PARAM, parseYakuValues } from "./yaku-filter-params";

/**
 * 無限練習（score）のクエリパラメータから問題生成オプションを組み立てる
 * 練習パラメータ解析
 *
 * - `ranges`: "non" / "plus" の複数指定。未指定時は両方
 * - `roles`: "oya" / "ko" の複数指定。未指定時は両方
 * - `yaku`: 出題役トークンの複数指定（OR）。未指定時は絞り込みなし
 * - `hand`: "menzen" / "furo" で手の形を絞る。未指定時は両方出す
 */
export function parseGeneratorOptionsFromParams(
  params: URLSearchParams,
): Pick<
  QuestionGeneratorOptions,
  | "allowedRanges"
  | "includeParent"
  | "includeChild"
  | "requiredYaku"
  | "includeFuro"
  | "requireFuro"
> {
  const ranges = parseRangeValues(params.getAll(RANGE_PARAM));
  const allowedRanges: ScoreRange[] = [];
  if (ranges.includeNonMangan) allowedRanges.push("nonMangan");
  if (ranges.includeManganPlus) allowedRanges.push("manganPlus");

  const roles = parseRoleValues(params.getAll(ROLE_PARAM));

  const requiredYaku = parseYakuValues(params.getAll(YAKU_PARAM));
  const handShape = parseHandShape(params.get(HAND_SHAPE_PARAM));

  return {
    allowedRanges,
    includeParent: roles.includeOya,
    includeChild: roles.includeKo,
    // requiredYaku と同じく、未指定でも明示的に既定値へ戻す
    includeFuro: handShape !== HAND_SHAPE_MENZEN,
    requireFuro: handShape === HAND_SHAPE_FURO,
    // 未指定は undefined で明示的に上書きする（store の setOptions はマージの
    // ため、キーを省略すると前回セッションの絞り込みが残る）
    requiredYaku: requiredYaku.length > 0 ? requiredYaku : undefined,
  };
}

/** 無限練習（score）の判定モードフラグ */
export interface ScorePracticeModeFlags {
  /** 役の回答を必須にする */
  readonly requireYaku: boolean;
  /** 満貫以上の翻数を簡略化して判定する */
  readonly simplifyMangan: boolean;
  /** 満貫以上でも符の回答を必須にする */
  readonly requireFuForMangan: boolean;
  /** 正解時に自動で次の問題へ進む */
  readonly autoNext: boolean;
}

/**
 * 無限練習（score）のクエリパラメータから判定モードフラグを読み取る
 * 判定モード解析
 */
export function parseModeFlagsFromParams(
  params: URLSearchParams,
): ScorePracticeModeFlags {
  return {
    requireYaku: params.get("mode") === "with_yaku",
    simplifyMangan: params.get("simple") === "1",
    requireFuForMangan: params.get("fu_mangan") === "1",
    autoNext: params.get("auto_next") === "1",
  };
}
