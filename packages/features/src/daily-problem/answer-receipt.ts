/**
 * 本日の問題の選出時スナップショットと受付時の判定
 * 本日の問題の受付判定
 *
 * @description
 * 統計が使う判定はサーバーが解答を受け付けた時点（受付時）のもので、端末が画面に
 * 出した正誤（`is_correct`）とは別に持つ。ここは「盤面 → 標準ルールの正解と属性」
 * 「選出時のスナップショット」「受付時の判定」の 3 つを、DB にも時刻にも触れない
 * 純粋な規則として置く。使うのは web のサーバーだけだが、全員の統計を決める規則なので
 * ミューテーションテストの対象（features の `use-*.ts` 以外）に入れる。
 *
 * @design サーバーは標準ルールで採点する
 * 受付のたびに適格判定（`eligibility.ts`）を掛け、通った盤面だけを判定する。
 * 適格判定は「連風牌の符 × 切り上げ満貫の 4 通りで正解が一致し、役満でない」ことを
 * 判定に使うのと同じ採点の版で確かめるので、閲覧者のルール設定は判定に要らない
 * （非役満の正解に対して、ダブル役満の採否は判定を変えない）。選出時に通ったことは
 * 根拠にしない — 選出後の採点の改修で不適格になった盤面は「採点不能」として残す。
 *
 * @design 「わからない」にも適格判定とスナップショットの比較を行う
 * 採点不能の日の「わからない」を統計の分母に入れないため。適格なら欄ごとの判定は
 * 持たず、総合は不正解にする。
 */
import {
  DEFAULT_RULE_SETTINGS,
  SCORE_YAKU_NAME_MAP,
  SCORING_VERSION,
  extractScoreFacts,
  judgeAnswerFields,
  rebuildAgariQuestion,
} from "@mahjong-scoring/core";
import type {
  AgariProblemPayload,
  AnswerFieldJudgements,
  ArchiveRebuildError,
  ScoreAnswerFacts,
  ScoreFacts,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";

import type { DailyAnswerDetail, SubmittedDailyAnswer } from "./answer-detail";
import {
  dailyAnswerSnapshotSchema,
  type DailyAnswerSnapshot,
} from "./answer-snapshot";
import { isDailyProblemEligible } from "./eligibility";
import { ruleConfigOfSettings } from "./question";

/**
 * 受付時に採点できなかった理由
 *
 * `ineligible` は標準ルールでは組み立てられるが、適格判定を通らない（ルールで正解が
 * 割れる・役満・役 ID に写せない内訳がある）。それ以外は標準ルールでの組み立ての失敗。
 */
export type DailyAnswerJudgeError = "ineligible" | ArchiveRebuildError;

/** 標準ルールで組み立てた問題と、その正解・属性 */
interface StandardDailyProblem {
  readonly question: ScoreQuestion;
  readonly facts: ScoreFacts;
}

type StandardDailyProblemResult =
  | ({ readonly kind: "ok" } & StandardDailyProblem)
  | {
      readonly kind: "unjudgeable";
      readonly judgeError: DailyAnswerJudgeError;
    };

/** 盤面を標準ルールで組み立て、適格なら正解と属性を取り出す */
function standardDailyProblemOf(
  payload: AgariProblemPayload,
): StandardDailyProblemResult {
  const rebuilt = rebuildAgariQuestion(
    payload,
    ruleConfigOfSettings(DEFAULT_RULE_SETTINGS),
  );
  if (rebuilt.isErr())
    return { kind: "unjudgeable", judgeError: rebuilt.error };
  if (!isDailyProblemEligible(payload))
    return { kind: "unjudgeable", judgeError: "ineligible" };
  const facts = extractScoreFacts(rebuilt.value);
  if (facts === undefined)
    return { kind: "unjudgeable", judgeError: "ineligible" };
  return { kind: "ok", question: rebuilt.value, facts };
}

/**
 * 選出時のスナップショットを作る
 * 選出時スナップショット作成
 *
 * 適格な盤面の標準ルールでの正解と属性を、保存形式（`answer-snapshot.ts`）に写す。
 * 保存形式の検証を通した値だけを返すので、書き込む側は JSON の中身を別に確かめなくてよい。
 *
 * @param payload - 選出する和了形の盤面
 * @param revision - 選出したサーバーのデプロイ（ローカルは null）
 * @returns スナップショット。適格でない・保存形式に収まらない盤面は undefined
 */
export function buildDailyAnswerSnapshot(
  payload: AgariProblemPayload,
  revision: string | null,
): DailyAnswerSnapshot | undefined {
  const standard = standardDailyProblemOf(payload);
  if (standard.kind !== "ok") return undefined;
  const parsed = dailyAnswerSnapshotSchema.safeParse({
    v: 1,
    scoringVersion: SCORING_VERSION,
    revision,
    answer: standard.facts.answer,
    facets: standard.facts.facets,
  });
  return parsed.success ? parsed.data : undefined;
}

/** 正解を比較用に正規化する（役の順序に依らない。キーの順を固定して文字列にする） */
function normalizedAnswerKey(answer: ScoreAnswerFacts): string {
  const yaku = answer.yaku.map(({ id, han }) => `${id}:${String(han)}`).sort();
  const { payment } = answer;
  return JSON.stringify([
    answer.han,
    answer.fu,
    answer.scoreLevel,
    answer.yakumanMultiplier,
    payment.type,
    payment.amount,
    yaku,
    answer.doraHan,
    answer.uraDoraHan,
  ]);
}

/**
 * 2 つの正解が同じか（役の順序は見ない）
 * 正解一致判定
 *
 * 比べるのは正解（翻・符・点数区分・役満の倍数・支払い・役・ドラの翻）だけ。
 * 属性・版・デプロイは比べない — 属性の取り出しだけが変わった日も、選出時の分類を使える。
 */
export function isSameDailyAnswer(
  a: ScoreAnswerFacts,
  b: ScoreAnswerFacts,
): boolean {
  return normalizedAnswerKey(a) === normalizedAnswerKey(b);
}

/** 保存する解答の中身を採点の入力に直す（役 ID → 回答の選択肢の役名） */
function userAnswerOf(submitted: SubmittedDailyAnswer): UserAnswer {
  return {
    han: submitted.han,
    fu: submitted.fu,
    score: submitted.score,
    scoreFromKo: submitted.scoreFromKo,
    scoreFromOya: submitted.scoreFromOya,
    yakus: submitted.yaku.map((id) => SCORE_YAKU_NAME_MAP[id]),
  };
}

/**
 * 受付時の判定
 * 受付判定結果
 *
 * - `unjudgeable`: 採点不能。解答と「わからない」のどちらでも起きる。統計から除く
 * - `judged`: 適格。`fields` は解答のときだけ持ち、「わからない」は null で総合は不正解。
 *   `snapshotConsistent` は受付時の正解が選出時の正解と一致したか（選出時の情報が無い日は null）
 */
export type DailyAnswerReceipt =
  | { readonly kind: "unjudgeable"; readonly judgeError: DailyAnswerJudgeError }
  | {
      readonly kind: "judged";
      readonly fields: AnswerFieldJudgements | null;
      readonly judgedCorrect: boolean;
      readonly snapshotConsistent: boolean | null;
    };

/**
 * 受け付けた解答を、受付時の採点で判定する
 * 受付時判定
 *
 * @param payload - その日の和了形の盤面
 * @param detail - 検証済みの解答の詳細
 * @param snapshot - 選出時のスナップショット（無い日は null）
 */
export function judgeDailyAnswerAtReceipt(
  payload: AgariProblemPayload,
  detail: DailyAnswerDetail,
  snapshot: DailyAnswerSnapshot | null,
): DailyAnswerReceipt {
  const standard = standardDailyProblemOf(payload);
  if (standard.kind !== "ok") return standard;
  const snapshotConsistent =
    snapshot === null
      ? null
      : isSameDailyAnswer(snapshot.answer, standard.facts.answer);
  if (detail.outcome === "gaveUp")
    return {
      kind: "judged",
      fields: null,
      judgedCorrect: false,
      snapshotConsistent,
    };
  const fields = judgeAnswerFields(
    standard.question,
    userAnswerOf(detail.answer),
    // 適格な盤面は役満でないので、ダブル役満の採否は判定を変えない
    { ...detail.mode, allowDoubleYakuman: false },
  );
  return {
    kind: "judged",
    fields,
    judgedCorrect:
      fields.score === "correct" &&
      fields.han !== "incorrect" &&
      fields.fu !== "incorrect" &&
      fields.yaku !== "incorrect",
    snapshotConsistent,
  };
}
