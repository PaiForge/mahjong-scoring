import "server-only";

import {
  parsePracticeProblemArchiveRequest,
  type RuleSettings,
} from "@mahjong-scoring/core";

import type { PracticeProblem } from "@/lib/db";
import { buildProblemReportSnapshot } from "@/lib/problem-reports/snapshot";

import type { ComparableAnswer } from "./answer-comparison";

/**
 * 保存した盤面を、報告者のルール設定のまま今の採点で組み立て直した正解
 * 現在の正解
 *
 * 報告の受付時と同じ組み立て（`buildProblemReportSnapshot`）を今のコードで通す。
 * 報告時の正解と食い違えば、受付の後に採点が変わった（直した）ことになる。
 * 保存形式の検証に通らない盤面（版が古い等）は、その理由を `rebuildError` に返す。
 *
 * @param problem - 報告された問題の行
 * @param ruleSettings - 報告者のルール設定（`problem_reports.snapshot.ruleSettings`）
 */
export function rebuildCurrentAnswer(
  problem: Pick<PracticeProblem, "kind" | "schemaVersion" | "payload">,
  ruleSettings: RuleSettings,
): ComparableAnswer {
  const parsed = parsePracticeProblemArchiveRequest({
    kind: problem.kind,
    schemaVersion: problem.schemaVersion,
    payload: problem.payload,
  });
  if (parsed.isErr()) return { rebuildError: parsed.error };
  return buildProblemReportSnapshot(parsed.value, ruleSettings).answer;
}
