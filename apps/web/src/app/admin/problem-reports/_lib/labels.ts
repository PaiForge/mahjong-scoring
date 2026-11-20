/**
 * 問題の報告の DB の値（理由・出した画面・段階・種別）が既知のものか
 *
 * 管理画面は辞書のラベルで出し、未知の値（後から足した値を古い辞書で読む等）は
 * 生の文字列のまま出す。`t()` に未知のキーを渡さないための判定だけを置く。
 */
import { ARCHIVE_KINDS, type ArchiveKind } from "@mahjong-scoring/core";
import {
  PROBLEM_REPORT_CONTEXTS,
  PROBLEM_REPORT_REASONS,
  type ProblemReportContext,
  type ProblemReportReason,
  type ProblemReportStage,
} from "@mahjong-scoring/features/problem-reports/problem-report";

/** 段階の一覧（`ProblemReportStage`） */
const PROBLEM_REPORT_STAGES: readonly ProblemReportStage[] = [
  "answering",
  "machiRevealed",
  "revealed",
];

/** 理由が既知の値か */
export function isKnownReason(value: string): value is ProblemReportReason {
  return PROBLEM_REPORT_REASONS.some((reason) => reason === value);
}

/** 出した画面が既知の値か */
export function isKnownContext(value: string): value is ProblemReportContext {
  return PROBLEM_REPORT_CONTEXTS.some((context) => context === value);
}

/** 段階が既知の値か */
export function isKnownStage(value: string): value is ProblemReportStage {
  return PROBLEM_REPORT_STAGES.some((stage) => stage === value);
}

/** 問題の種別が既知の値か */
export function isKnownKind(value: string): value is ArchiveKind {
  return ARCHIVE_KINDS.some((kind) => kind === value);
}
