import {
  type HaiKindId,
  type Kazehai,
  type ScoreResult,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { countDoraInTehai } from "../../core/hai-names";
import { getYakuNameJa } from "../../core/constants";
import type { ScoreQuestion, YakuDetail } from "./types";

/**
 * detectYaku の結果から YakuDetail 配列を構築する
 * 役詳細構築
 */
export function buildYakuDetailsFromResult(
  yakuResult: readonly (readonly [string, number])[],
): YakuDetail[] {
  return yakuResult.map(([name, han]) => ({
    name: getYakuNameJa(name),
    han,
  }));
}

/**
 * ScoreQuestion 組立パラメータ
 * 問題組立入力
 */
interface AssembleScoreQuestionInput {
  readonly tehai: Tehai14;
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly doraMarkers: readonly HaiKindId[];
  readonly isRiichi: boolean;
  readonly uraDoraMarkers: readonly HaiKindId[] | undefined;
  /** 最終的な ScoreResult（リーチ・役牌補正適用済み） */
  readonly answer: ScoreResult;
  /** convertScoreDetailToFuDetails のソースとなる元の answer（補正前） */
  readonly originalAnswer: ScoreResult;
  /** 全ての yakuDetails（ドラは含まない） */
  readonly yakuDetails: readonly YakuDetail[];
}

/**
 * 共通の ScoreQuestion 組立処理
 *
 * ドラの加算と fuDetails の計算を行い、最終的な ScoreQuestion を返す。
 * 問題組立
 */
export function assembleScoreQuestion(input: AssembleScoreQuestionInput): ScoreQuestion {
  const {
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    isRiichi,
    uraDoraMarkers,
    answer,
    originalAnswer,
    yakuDetails: baseYakuDetails,
  } = input;

  const yakuDetails = [...baseYakuDetails];

  const doraHan = countDoraInTehai(tehai, doraMarkers);
  if (doraHan > 0 && !yakuDetails.find((d) => d.name === "ドラ")) {
    yakuDetails.push({ name: "ドラ", han: doraHan });
  }

  const fuDetails = originalAnswer.detail
    ? convertScoreDetailToFuDetails(originalAnswer.detail, { agariHai, isTsumo, bakaze, jikaze })
    : undefined;

  return {
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    isRiichi,
    uraDoraMarkers,
    answer,
    fuDetails,
    yakuDetails,
  };
}
