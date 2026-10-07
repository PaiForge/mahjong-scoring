import {
  buildScoreGeneratorOptions,
  type ScoreGeneratorOptions,
  type ScorePracticeModeFlags as SharedScorePracticeModeFlags,
} from "@mahjong-scoring/features/practice/score/generator-options";
import {
  HAND_SHAPE_PARAM,
  parseHandShape,
} from "@mahjong-scoring/features/practice/score/hand-shape-param";

import { RANGE_PARAM, parseRangeValues } from "../../_lib/range-params";
import { ROLE_PARAM, parseRoleValues } from "../../_lib/role-params";
import { YAKU_PARAM, parseYakuValues } from "./yaku-filter-params";

/**
 * 無限練習（score）のクエリパラメータから問題生成オプションを組み立てる
 * 練習パラメータ解析
 *
 * - `ranges`: "non" / "plus" の複数指定。未指定時は両方
 * - `roles`: "oya" / "ko" の複数指定。未指定時は両方
 * - `yaku`: 出題役トークンの複数指定（OR）。未指定時は絞り込みなし
 * - `hand`: "menzen" / "furo" で手の形を絞る。未指定時は両方出す
 *
 * 絞り込みからオプションを組む部分はモバイルと共有する（`buildScoreGeneratorOptions`）。
 */
export function parseGeneratorOptionsFromParams(
  params: URLSearchParams,
): ScoreGeneratorOptions {
  const ranges = parseRangeValues(params.getAll(RANGE_PARAM));
  const roles = parseRoleValues(params.getAll(ROLE_PARAM));
  return buildScoreGeneratorOptions({
    includeNonMangan: ranges.includeNonMangan,
    includeManganPlus: ranges.includeManganPlus,
    includeParent: roles.includeOya,
    includeChild: roles.includeKo,
    requiredYaku: parseYakuValues(params.getAll(YAKU_PARAM)),
    handShape: parseHandShape(params.get(HAND_SHAPE_PARAM)),
  });
}

/** 無限練習（score）の判定モードフラグ（共通の判定モード + web だけの回答時間の計測） */
export interface ScorePracticeModeFlags extends SharedScorePracticeModeFlags {
  /**
   * 回答時間を計測して表示する（Pro の拡張機能）。
   * 設定画面は Pro のときだけこのフラグを付け、盤面は特典の有無を
   * サーバーの返事（`beginPracticeQuestion`）で改めて確かめる
   */
  readonly measureTime: boolean;
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
    measureTime: params.get("measure") === "1",
  };
}
