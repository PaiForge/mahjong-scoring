/**
 * 出題した問題の誤りの報告を受け付け、運営者に知らせる（入口が共有する本体）
 * 問題報告受付
 *
 * @description
 * 報告の要求は盤面（保存と同じ形）を本文に持つ。ここで盤面を検証し、
 * `practice_problems` に無ければ保存して（`ensurePracticeProblem`）、その行に
 * 報告を結ぶ。受付の時点の正解は、報告者のルール設定でサーバーが組み立て直して
 * `snapshot` に残す（`snapshot.ts`）。入口は web の Server Action
 * （`reportProblemAction`）で、認証・回数の枠・本文の大きさはそちらが確かめる。
 * アプリの入口を足すときは、Route Handler から同じこの関数を呼ぶ。
 *
 * @design スパム対策は 4 段で、ここが受け持つのは後ろの 2 段
 * (a) ログイン必須と BAN・退会処理中のゲート（入口の `guardUserAction`）
 * (b) IP とアカウントの枠 `reportProblem`（5 回 / 10 分。入口）
 * (c) アカウントごとの上限 {@link PROBLEM_REPORT_DAILY_LIMIT} 件 / 24 時間（ここ。閉じた報告も数える）
 * (d) 同じ人 × 同じ問題の未対応は 1 件（部分一意インデックス。重ねて送っても
 *     行もメールも増えず `done` を返す）
 * インメモリの枠（b）はインスタンスごとで全体の厳密な上限ではないので、DB の件数で
 * 数える上限（c）を重ねる。盤面は検証を通るものしか受け付けず、本文は 4KB、詳細は
 * 500 字まで。採らなかった案: CAPTCHA・ハニーポット（ログイン必須なら費用に
 * 見合わない）/ 停止スイッチ（悪用はアカウント単位で BAN できる）。
 *
 * @design メールは「その問題に未対応の報告が他に無いとき」だけ送る
 * 人気の誤りに報告が集まっても運営者へのメールは 1 通にする。確かめるのは書き込みと
 * 同じトランザクションの中だが、別の人の報告が同時に届いたときは両方が「他に無い」と
 * 見て 2 通になりうる（行は正しく 2 件。メールが 1 通増えるだけなので排他は掛けない）。
 *
 * ログに盤面・詳細を出さない（失敗の記録は入口が PostgreSQL のエラーコードだけを残す）。
 */
import "server-only";

import {
  parsePracticeProblemArchiveRequest,
  type ArchiveKind,
  type RuleSettings,
} from "@mahjong-scoring/core";
import {
  isProblemReportReasonAllowed,
  PROBLEM_REPORT_CONTEXTS,
  validateProblemReportInput,
  type ProblemReportContext,
  type ProblemReportRequest,
  type ProblemReportStage,
} from "@mahjong-scoring/features/problem-reports/problem-report";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import { db, problemReports } from "../db";
import { ensurePracticeProblem } from "../practice-problems/archive";
import type { PracticeProblemSource } from "../practice-problems/source";
import { writeAsAccount } from "../users/account-write-lock";

import { notifyOperatorOfProblemReport } from "./notify";
import { buildProblemReportSnapshot } from "./snapshot";
import { ProblemReportStatus } from "./status";

/**
 * 報告の要求本文の上限（JSON にした UTF-8 のバイト数）
 *
 * 盤面は最大構成でも 1KB に届かず（`PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES` と同じ 4KB）、
 * 詳細 500 字（UTF-8 で最大 1.5KB）とルール設定を足しても収まる。
 */
export const PROBLEM_REPORT_BODY_MAX_BYTES = 4096;

/** アカウントごとに直近 24 時間で受け付ける報告の件数（閉じたものも数える） */
export const PROBLEM_REPORT_DAILY_LIMIT = 20;

/**
 * 報告の受付の結果
 *
 * - `done` — 受け付けた（同じ問題に自分の未対応の報告がすでにあれば、行を増やさずに `done`）
 * - `invalidRequest` — 盤面・画面・段階・ルール設定・理由のどれかが検証を通らない
 * - `dailyLimit` — 直近 24 時間の報告が {@link PROBLEM_REPORT_DAILY_LIMIT} 件に達している
 * - `accountClosing` — 報告した人の退会を受け付けた後なので書かなかった
 */
export type CreateProblemReportResult =
  "done" | "invalidRequest" | "dailyLimit" | "accountClosing";

/** 段階の一覧（キーの網羅を型で強制する） */
const STAGES: Record<ProblemReportStage, true> = {
  answering: true,
  machiRevealed: true,
  revealed: true,
};

/** ルール設定はちょうど真偽値 7 つ（余分なキーも欠けたキーも受け付けない） */
const ruleSettingsSchema = z.strictObject({
  renfonpaiAs4Fu: z.boolean(),
  kiriageMangan: z.boolean(),
  suuankouTankiDouble: z.boolean(),
  daisuushiiDouble: z.boolean(),
  kokushiJuusanmenDouble: z.boolean(),
  junseiChuurenDouble: z.boolean(),
  fukugouYakuman: z.boolean(),
}) satisfies z.ZodType<RuleSettings>;

function isProblemReportContext(value: unknown): value is ProblemReportContext {
  return PROBLEM_REPORT_CONTEXTS.some((context) => context === value);
}

function isProblemReportStage(value: unknown): value is ProblemReportStage {
  return typeof value === "string" && Object.hasOwn(STAGES, value);
}

/** 画面と問題の種別が合うか（本日の問題は和了形だけ、練習は同名の種別） */
function contextMatchesKind(
  context: ProblemReportContext,
  kind: ArchiveKind,
): boolean {
  return context === "daily-problem"
    ? kind === "agari-score"
    : context === kind;
}

/**
 * 問題の報告を受け付け、必要なら運営者に知らせる
 * 問題報告受付
 *
 * 順序: 要求の検証 → 24 時間の上限 → 盤面の行の確保 → 退会と直列の書き込み
 * （他の未対応の有無を見てから `INSERT ... ON CONFLICT DO NOTHING`）→ 通知。
 * 検証に落ちた要求・上限に達した要求は盤面も保存しない。
 *
 * @param reporterId - 認証済みの報告者の ID
 * @param request - 要求本文（型は付いているが信頼しない。全項目をここで検証する）
 * @param source - 届いた入口（web の Server Action は `web`）
 * @throws DB の失敗（入口が記録して汎用の失敗を返す）
 */
export async function createProblemReport(
  reporterId: string,
  request: ProblemReportRequest,
  source: PracticeProblemSource,
): Promise<CreateProblemReportResult> {
  const problem = parsePracticeProblemArchiveRequest(request.problem);
  if (problem.isErr()) return "invalidRequest";
  const { context, stage } = request;
  if (!isProblemReportContext(context) || !isProblemReportStage(stage)) {
    return "invalidRequest";
  }
  const ruleSettings = ruleSettingsSchema.safeParse(request.ruleSettings);
  if (!ruleSettings.success) return "invalidRequest";
  if (!contextMatchesKind(context, problem.value.kind)) return "invalidRequest";
  // 入口が先に検証して個別の誤りを返している。ここでは信頼境界として確かめ直すだけ
  const input = validateProblemReportInput(request.reason, request.detail);
  if (!input.ok) return "invalidRequest";
  const { reason, detail } = input.value;
  if (!isProblemReportReasonAllowed(problem.value.kind, stage, reason)) {
    return "invalidRequest";
  }

  const [recent] = await db
    .select({ count: count() })
    .from(problemReports)
    .where(
      and(
        eq(problemReports.reporterId, reporterId),
        gt(problemReports.createdAt, sql`now() - interval '24 hours'`),
      ),
    );
  if ((recent?.count ?? 0) >= PROBLEM_REPORT_DAILY_LIMIT) return "dailyLimit";

  const problemId = await ensurePracticeProblem(problem.value, source);
  const snapshot = buildProblemReportSnapshot(problem.value, ruleSettings.data);

  const outcome = await writeAsAccount(reporterId, async (tx) => {
    const [otherOpen] = await tx
      .select({ id: problemReports.id })
      .from(problemReports)
      .where(
        and(
          eq(problemReports.problemId, problemId),
          eq(problemReports.status, ProblemReportStatus.Open),
        ),
      )
      .limit(1);
    const [inserted] = await tx
      .insert(problemReports)
      .values({
        problemId,
        reporterId,
        reason,
        detail,
        context,
        stage,
        snapshot,
        source,
      })
      .onConflictDoNothing()
      .returning({ id: problemReports.id });
    return { inserted, hadOtherOpen: otherOpen !== undefined };
  });
  if (!outcome.written) return "accountClosing";
  // 重ねての報告（自分の未対応がある）は行が入らない。他の人の未対応がある問題は
  // 管理画面の一覧に既に出ているので知らせ直さない
  const { inserted, hadOtherOpen } = outcome.value;
  if (inserted !== undefined && !hadOtherOpen) {
    await notifyOperatorOfProblemReport({
      reportId: inserted.id,
      reason,
      detail,
      context,
    });
  }
  return "done";
}
