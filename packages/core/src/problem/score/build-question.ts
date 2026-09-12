import { err, ok, type Result } from "neverthrow";
import {
  calculateScoreForTehai,
  countDora,
  detectYaku,
  type HaiKindId,
  type RuleConfig,
  type ScoreResult,
  type Tehai14,
  type YakuResult,
} from "@pai-forge/riichi-mahjong";
import { ScoreLevel } from "../../core/constants";
import { isOya } from "../../core/kaze";
import { recalculateScore } from "../../score/calculator";
import type { AgariContext } from "../shared/agari-context";
import {
  assembleScoreQuestion,
  buildYakuDetailsFromResult,
} from "./assemble-question";
import type { ScoreQuestion, ScoreRange, YakuDetail } from "./types";
import { applyRiichiAndUraDora } from "./utils/reconciler";

/**
 * 点数計算入力
 * 点数計算入力
 *
 * 共通の和了状況（{@link AgariContext}）に、点数計算にだけ必要なドラ表示牌と
 * ルール設定を足したもの。
 */
interface ScoringInput extends AgariContext {
  readonly doraMarkers: readonly HaiKindId[];
  readonly ruleConfig: RuleConfig;
}

/**
 * リーチしている手の追加情報
 * リーチ情報
 *
 * リーチはライブラリの概念ではなく、翻と裏ドラをアプリ側で後付けする。
 * 裏ドラ表示牌はリーチしている手だけが持つため、リーチと同じ構造体に置いて
 * 「リーチしているのに裏ドラ表示牌が無い」状態を型で作れなくする。
 */
export interface RiichiInput {
  /** ダブル立直か（立直の 1 翻ではなく 2 翻を足す） */
  readonly isDouble: boolean;
  readonly uraDoraMarkers: readonly HaiKindId[];
}

/**
 * 1 つの和了形から点数計算問題を組み立てるための入力
 * 問題構築入力
 */
export interface ScoreQuestionBuildInput extends ScoringInput {
  readonly tehai: Tehai14;
  /** リーチしていれば渡す。門前でない手には渡さないこと（呼び出し側の責務） */
  readonly riichi?: RiichiInput;
}

/**
 * 点数計算問題を組み立てられない理由
 * 問題構築エラー
 *
 * - `noYaku`: 役が 1 つも無く和了できない（形式聴牌の和了牌）
 * - `unsupportedYakuman`: 役満 3 個分以上。回答の点数選択肢がダブル役満まで
 *   しか無く、選べない問題になるため出題しない
 */
export type ScoreQuestionBuildError = "noYaku" | "unsupportedYakuman";

/**
 * ライブラリで点数と役を計算する
 * 点数役計算
 *
 * 役が1つも成立しない手（形式和了）は `calculateScoreForTehai` が Err で
 * 返す。その場合はこちらも undefined を返す。
 */
function computeScoreAndYaku(
  tehai: Tehai14,
  context: ScoringInput,
):
  | {
      readonly answer: ScoreResult;
      readonly yakuResult: YakuResult;
    }
  | undefined {
  const { agariHai, isTsumo, jikaze, bakaze, doraMarkers, ruleConfig } =
    context;
  const answer = calculateScoreForTehai(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
  });
  if (answer.isErr()) return undefined;
  const yakuResult = detectYaku(tehai, {
    agariHai,
    bakaze,
    jikaze,
    doraMarkers,
    isTsumo,
    ruleConfig,
  });
  return { answer: answer.value, yakuResult };
}

/**
 * 和了形 1 つと和了状況から点数計算問題を組み立てる
 * 点数計算問題構築
 *
 * 手牌の生成と出題条件の絞り込み（点数帯・役の指定など）は持たない。
 * 「この 14 枚をこの状況で和了したら何点か」を、内訳（役・符）付きの
 * {@link ScoreQuestion} にする部分だけを担う。点数計算総合演習は生成した
 * 手牌を 1 回渡し、待ち別点数計算は聴牌形の待ち牌ごと・ツモロンごとに渡す。
 * 両者が同じ経路を通るため、同じ和了形に対して同じ答えが出る。
 *
 * 手順:
 * 1. ライブラリで点数と役を計算する。役牌（三元牌・場風・自風）はライブラリが
 *    判定して返すので、ここで手牌を数えて補完しない（補完すると二重に数える）
 * 2. リーチなら立直の翻と裏ドラを後付けして点数を再計算する
 * 3. 翻数を役の内訳の合計に合わせる。内訳の合計を翻数の正典にし、内訳と翻数と
 *    点数が画面上で必ず一致することを保証する（結果表示が役の内訳を出すため、
 *    ここがずれると見えてしまう）。ライブラリ 0.5 までは `detectYaku` と
 *    `calculateScoreForTehai` が同じ手牌で食い違うことがあった（門前の
 *    清一色・混一色・混全帯么九を含む手で後者が副露のときの値で数え、
 *    30000 手中 19 件で 1〜2 翻少なかった）。0.6 で両者の解釈が統一されて
 *    以降は一致するはずだが、内訳と翻数の一致は画面の前提なので、この補正は
 *    防波堤として残す
 * 4. 役満 3 個分以上は組み立てない（{@link ScoreQuestionBuildError}）
 */
export function buildScoreQuestion(
  input: ScoreQuestionBuildInput,
): Result<ScoreQuestion, ScoreQuestionBuildError> {
  const {
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
    riichi,
  } = input;

  const scored = computeScoreAndYaku(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
  });
  if (!scored) return err("noYaku");

  let finalAnswer = scored.answer;
  let yakuDetails: YakuDetail[] = buildYakuDetailsFromResult(scored.yakuResult);

  if (riichi) {
    const riichiRes = applyRiichiAndUraDora({
      tehai,
      currentAnswer: finalAnswer,
      uraDoraMarkers: riichi.uraDoraMarkers,
      isDoubleRiichi: riichi.isDouble,
      isTsumo,
      jikaze,
      ruleConfig,
    });
    finalAnswer = riichiRes.answer;
    yakuDetails = [...yakuDetails, ...riichiRes.additionalYakuDetails];
  }

  // この時点の `yakuDetails` は表ドラを持たない（`assembleScoreQuestion` が
  // 後で足す）ため、合計にはドラの翻を明示的に加える
  const doraHan = countDora(tehai, doraMarkers);
  const detailsHan =
    yakuDetails.reduce((total, yaku) => total + yaku.han, 0) + doraHan;
  if (detailsHan !== finalAnswer.han) {
    finalAnswer = recalculateScore(finalAnswer, detailsHan, {
      isTsumo,
      isOya: isOya(jikaze),
      ruleConfig,
    });
  }

  if (finalAnswer.yakumanMultiplier >= 3) return err("unsupportedYakuman");

  return ok(
    assembleScoreQuestion({
      tehai,
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
      isRiichi: riichi !== undefined,
      uraDoraMarkers: riichi?.uraDoraMarkers,
      answer: finalAnswer,
      originalAnswer: scored.answer,
      yakuDetails,
    }),
  );
}

/**
 * 点数区分（満貫未満 / 満貫以上）が出題する点数帯に入るか
 * 点数帯判定
 *
 * 点数帯を 1 つだけ指定したときに絞り込む。両方（または空）なら絞らない。
 * 引数を文字列で受けるのは、ライブラリが `ScoreLevel` の型を公開していない
 * ため（`core/constants` の `ScoreLevel` 参照）。
 */
export function isScoreLevelAllowed(
  scoreLevel: string,
  allowedRanges: readonly ScoreRange[],
): boolean {
  if (allowedRanges.length !== 1) return true;
  const isNormal = scoreLevel === ScoreLevel.Normal;
  return allowedRanges[0] === "nonMangan" ? isNormal : !isNormal;
}
