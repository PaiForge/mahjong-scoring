/**
 * 問題の報告の受付時に、利用者に出していた正解を組み立て直して写す
 * 問題報告スナップショット
 *
 * @description
 * 報告の行（`problem_reports.snapshot`）に、受付の時点の正解・報告者のルール設定・
 * デプロイの版を残す。管理画面で「何が誤って出ていたか」を読むための記録で、
 * 採点を直した後も書き換えない。
 *
 * @design 正解はサーバーが受付時に組み立て直す。クライアントからは受け取らない
 * 盤面の保存形式（`practice_problems.payload`）は正解を持たず、読み戻すたびに
 * 現行の採点で組み立て直す（採点の修正に追随させるため）。そのままだと、採点を
 * 直した後は誤って出ていた正解が残らない。クライアントが画面の正解を送る形は、
 * 検証しきれない自由な JSON を受け取ることになるので採らない。入力は盤面と
 * 報告者のルール設定（真偽値 7 つ）だけにし、サーバーが同じ採点（core の
 * `rebuildAgariQuestion` / `rebuildTenpaiQuestion`）で組み立てる。サーバーの採点は
 * 同じデプロイのクライアントと同じコードなので、受付時に組み立てれば画面に
 * 出ていたものと同じ正解になる（どのデプロイかを `revision` に残す）。
 *
 * @design 組み立てに失敗しても報告は受け付け、失敗の理由を残す
 * 報告者のルールでは出題できない盤面（符が選択肢の外に出る等）も、盤面そのものの
 * 誤りを知らせる報告としては意味がある。報告を断らず、`answer` に理由を入れる。
 *
 * 構造解釈の詳細（`ScoreResult.detail`）は載せない。符の内訳はライブラリの内部の
 * 形で大きく、盤面とルールから組み立て直せる。
 */
import "server-only";

import {
  rebuildAgariQuestion,
  rebuildTenpaiQuestion,
  type ArchiveRebuildError,
  type Payment,
  type PracticeProblemArchiveRequest,
  type RuleSettings,
  type ScoreQuestion,
} from "@mahjong-scoring/core";
import { ruleConfigOfSettings } from "@mahjong-scoring/features/daily-problem/question";

/**
 * 1 つの和了（和了形の 1 問、聴牌形の待ち 1 つのツモ・ロン）について出した正解
 * 表示した点数
 */
export interface ShownScore {
  readonly han: number;
  readonly fu: number;
  /** 点数区分（ライブラリの `ScoreLevel`） */
  readonly scoreLevel: ScoreQuestion["answer"]["scoreLevel"];
  /** 支払い（ライブラリの `Payment` をそのまま） */
  readonly payment: Payment;
  /** 役満何個分か（0 は役満でない） */
  readonly yakumanMultiplier: number;
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yaku: readonly { readonly name: string; readonly han: number }[];
}

/**
 * 受付時に出していた正解（問題の種別ごと）
 * 表示した正解
 *
 * 聴牌形のロンが `null` の待ちは、ロンでは役が無い（「役なし」が正解）。
 */
export type ShownAnswer =
  | { readonly kind: "agari-score"; readonly score: ShownScore }
  | {
      readonly kind: "tenpai-score";
      readonly waits: readonly {
        readonly agariHai: number;
        readonly tsumo: ShownScore;
        readonly ron: ShownScore | null;
      }[];
    };

/**
 * 報告の行に残す受付時の記録（`problem_reports.snapshot`）
 * 問題報告スナップショット
 */
export interface ProblemReportSnapshot {
  /** 報告者のルール設定（正解はこの設定で組み立てた） */
  readonly ruleSettings: RuleSettings;
  /** 受付時のデプロイ（`VERCEL_GIT_COMMIT_SHA`。無ければ null） */
  readonly revision: string | null;
  /** 受付時の採点で組み立て直した正解。組み立てられなければ理由 */
  readonly answer: ShownAnswer | { readonly rebuildError: ArchiveRebuildError };
}

/** 組み立てた問題から、画面に出す正解の部分だけを取り出す */
function shownScoreOf(question: ScoreQuestion): ShownScore {
  const { answer } = question;
  return {
    han: answer.han,
    fu: answer.fu,
    scoreLevel: answer.scoreLevel,
    payment: answer.payment,
    yakumanMultiplier: answer.yakumanMultiplier,
    yaku: question.yakuDetails.map(({ name, han }) => ({ name, han })),
  };
}

/** 盤面を報告者のルールで組み立て直した正解。組み立てられなければ理由 */
function shownAnswerOf(
  request: PracticeProblemArchiveRequest,
  ruleSettings: RuleSettings,
): ProblemReportSnapshot["answer"] {
  const ruleConfig = ruleConfigOfSettings(ruleSettings);
  if (request.kind === "agari-score") {
    const rebuilt = rebuildAgariQuestion(request.payload, ruleConfig);
    if (rebuilt.isErr()) return { rebuildError: rebuilt.error };
    return { kind: "agari-score", score: shownScoreOf(rebuilt.value) };
  }
  const rebuilt = rebuildTenpaiQuestion(request.payload, ruleConfig);
  if (rebuilt.isErr()) return { rebuildError: rebuilt.error };
  return {
    kind: "tenpai-score",
    waits: rebuilt.value.waits.map((wait) => ({
      agariHai: wait.agariHai,
      tsumo: shownScoreOf(wait.tsumo),
      ron: wait.ron ? shownScoreOf(wait.ron) : null,
    })),
  };
}

/**
 * 報告の受付時の記録を組み立てる
 * 問題報告スナップショット構築
 *
 * @param request - 検証済みの盤面（`parsePracticeProblemArchiveRequest` を通ったもの）
 * @param ruleSettings - 報告者のルール設定（検証済みの真偽値 7 つ）
 */
export function buildProblemReportSnapshot(
  request: PracticeProblemArchiveRequest,
  ruleSettings: RuleSettings,
): ProblemReportSnapshot {
  return {
    ruleSettings,
    revision: process.env.VERCEL_GIT_COMMIT_SHA || null,
    answer: shownAnswerOf(request, ruleSettings),
  };
}
