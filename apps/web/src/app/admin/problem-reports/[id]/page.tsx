import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ProblemReportStatus } from "@/lib/problem-reports/status";

import { formatAdminDateTime } from "../../_lib/format-date";
import {
  DetailSection,
  InfoRow,
} from "../../users/[id]/_components/detail-section";
import { CloseProblemReportForm } from "../_components/close-problem-report-form";
import { ProblemBoard } from "../_components/problem-board";
import { ProblemReportStatusChip } from "../_components/problem-report-status-chip";
import { ShownAnswerView } from "../_components/shown-answer-view";
import { answersDiffer, compareShownAnswers } from "../_lib/answer-comparison";
import { rebuildCurrentAnswer } from "../_lib/current-answer";
import { isKnownContext, isKnownReason, isKnownStage } from "../_lib/labels";
import { fetchProblemReportDetail } from "../_lib/queries";

/**
 * 問題の報告の詳細（管理画面）
 *
 * @description
 * 1 件の報告について、理由・詳細・報告者・出した画面・段階・報告者のルール設定と
 * 受付時のデプロイ、盤面（牌の画像と保存した JSON）、本日の問題として出した日、
 * 同じ問題への他の報告を並べる。中心は「報告時の正解」（受付時に組み立てて残した
 * snapshot）と「現在の正解」（同じ盤面・同じルール設定を今の採点で組み立て直した
 * もの）の 2 つで、食い違う項目に印を付ける。直したかどうかは、この 2 つを
 * 見比べれば分かる（採点を直した後なら現在の正解が変わっている）。どちらかが
 * 組み立てられなかったときは、その理由を出す。
 *
 * 未対応なら「修正済み」「問題なし」で閉じられる（メモは任意）。閉じると、同じ
 * 問題への未対応の報告もまとめて同じ状態・同じメモで閉じる — 誤りは問題にあり、
 * 同じ問題への報告を 1 件ずつ閉じさせない（`closeProblemReportAction`）。
 *
 * 詳細はプレーンテキストで出す（利用者の自由入力で、HTML として解釈しない）。
 * @flow 一覧 → 詳細 → 報告時の正解と現在の正解を見比べる → メモを書いて「修正済み」/「問題なし」→ 閉じた状態で描き直される
 */
export default async function AdminProblemReportDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  // 形の違う ID は DB に問い合わせる前に落とす（uuid 型の比較が例外になる）
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [t, tReasons, detail] = await Promise.all([
    getTranslations("admin.problemReports"),
    getTranslations("problemReport.reasons"),
    fetchProblemReportDetail(id),
  ]);
  if (!detail) notFound();
  const { report, problem, otherReports, dailyProblemDays, profileMap } =
    detail;
  const { snapshot } = report;
  const currentAnswer = rebuildCurrentAnswer(problem, snapshot.ruleSettings);
  const comparison = compareShownAnswers(snapshot.answer, currentAnswer);
  const username = (userId: string | null) =>
    userId === null
      ? t("report.deletedUser")
      : (profileMap.get(userId)?.username ?? userId);
  const reasonLabel = (reason: string) =>
    isKnownReason(reason) ? tReasons(reason) : reason;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/problem-reports"
        className={`text-sm ${TEXT_LINK_CLASSES}`}
      >
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <AdminPageTitle>{t("detailTitle")}</AdminPageTitle>
        <ProblemReportStatusChip status={report.status} />
      </div>

      {report.status === ProblemReportStatus.Open && (
        <DetailSection title={t("close.title")}>
          <CloseProblemReportForm reportId={report.id} />
        </DetailSection>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title={t("report.title")}>
          <dl>
            <InfoRow label={t("report.reason")}>
              {reasonLabel(report.reason)}
            </InfoRow>
            <InfoRow label={t("report.detail")}>
              <span className="whitespace-pre-wrap">
                {report.detail ?? t("report.none")}
              </span>
            </InfoRow>
            <InfoRow label={t("report.reporter")}>
              {username(report.reporterId)}
            </InfoRow>
            <InfoRow label={t("report.context")}>
              {/* 辞書キーの例: admin.problemReports.contexts.tenpai-score */}
              {isKnownContext(report.context)
                ? t(`contexts.${report.context}`)
                : report.context}
            </InfoRow>
            <InfoRow label={t("report.stage")}>
              {/* 辞書キーの例: admin.problemReports.stages.machiRevealed */}
              {isKnownStage(report.stage)
                ? t(`stages.${report.stage}`)
                : report.stage}
            </InfoRow>
            <InfoRow label={t("report.source")}>{report.source}</InfoRow>
            <InfoRow label={t("report.createdAt")}>
              {formatAdminDateTime(report.createdAt)}
            </InfoRow>
            {report.resolvedAt && (
              <>
                <InfoRow label={t("report.resolvedBy")}>
                  {username(report.resolvedBy)}
                </InfoRow>
                <InfoRow label={t("report.resolvedAt")}>
                  {formatAdminDateTime(report.resolvedAt)}
                </InfoRow>
                <InfoRow label={t("report.resolutionNote")}>
                  <span className="whitespace-pre-wrap">
                    {report.resolutionNote ?? t("report.none")}
                  </span>
                </InfoRow>
              </>
            )}
          </dl>
        </DetailSection>

        <DetailSection title={t("rules.title")}>
          <dl>
            {Object.entries(snapshot.ruleSettings).map(([key, value]) => (
              <InfoRow key={key} label={key}>
                {value ? t("rules.on") : t("rules.off")}
              </InfoRow>
            ))}
            <InfoRow label={t("rules.revision")}>
              <span className="font-mono text-xs">
                {snapshot.revision ?? t("rules.revisionUnknown")}
              </span>
            </InfoRow>
          </dl>
        </DetailSection>

        <DetailSection title={t("board.title")}>
          <ProblemBoard payload={problem.payload} />
          <details className="text-sm">
            <summary className="cursor-pointer text-surface-600">
              {t("board.json")}
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface-50 p-3 font-mono text-xs">
              {JSON.stringify(
                {
                  id: problem.id,
                  kind: problem.kind,
                  schemaVersion: problem.schemaVersion,
                  payload: problem.payload,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </DetailSection>

        <DetailSection title={t("dailyProblem.title")}>
          {dailyProblemDays.length === 0 ? (
            <p className="text-sm text-surface-500">{t("dailyProblem.none")}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                {t("dailyProblem.days", { days: dailyProblemDays.join(", ") })}
              </p>
              <Link
                href="/admin/practice-problems"
                className={TEXT_LINK_CLASSES}
              >
                {t("dailyProblem.open")}
              </Link>
            </div>
          )}
        </DetailSection>
      </div>

      <p
        role="status"
        className={
          answersDiffer(comparison)
            ? "text-sm font-bold text-red-700"
            : "text-sm text-surface-600"
        }
      >
        {answersDiffer(comparison) ? t("answers.differs") : t("answers.same")}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title={t("answers.reportedTitle")}>
          <p className="text-xs text-surface-500">
            {t("answers.reportedNote")}
          </p>
          <ShownAnswerView
            answer={snapshot.answer}
            comparison={comparison}
            side="reported"
          />
        </DetailSection>

        <DetailSection title={t("answers.currentTitle")}>
          <p className="text-xs text-surface-500">{t("answers.currentNote")}</p>
          <ShownAnswerView
            answer={currentAnswer}
            comparison={comparison}
            side="current"
          />
        </DetailSection>
      </div>

      <DetailSection title={t("others.title")}>
        {otherReports.length === 0 ? (
          <p className="text-sm text-surface-500">{t("others.empty")}</p>
        ) : (
          <ul className="divide-y divide-surface-100">
            {otherReports.map((other) => (
              <li
                key={other.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <Link
                  href={`/admin/problem-reports/${other.id}`}
                  className={TEXT_LINK_CLASSES}
                >
                  {formatAdminDateTime(other.createdAt)} —{" "}
                  {reasonLabel(other.reason)} — {username(other.reporterId)}
                </Link>
                <ProblemReportStatusChip status={other.status} />
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
