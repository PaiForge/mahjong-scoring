"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import type {
  ArchiveKind,
  PracticeProblemArchiveRequest,
  RuleSettings,
} from "@mahjong-scoring/core";
import {
  PROBLEM_REPORT_DETAIL_MAX_LENGTH,
  problemReportReasonsFor,
  validateProblemReportInput,
  type ProblemReportContext,
  type ProblemReportReason,
  type ProblemReportStage,
} from "@mahjong-scoring/features/problem-reports/problem-report";
import {
  reportProblemAction,
  type ReportProblemError,
} from "@/app/[locale]/(user)/_actions/problem-reports";
import { PROFILE_INPUT_CLASS } from "@/app/[locale]/(user)/(protected)/_components/profile-text-field";
import { Button } from "@/app/[locale]/(user)/_components/button";
import {
  SELECTED_TILE_CLASSES,
  UNSELECTED_TILE_CLASSES,
} from "@/app/[locale]/(user)/_components/_lib/selection-classes";
import { ModalShell } from "@/app/_components/modal-shell";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/** 報告を出す画面から、出している問題の種別（理由の絞り込みに使う） */
const ARCHIVE_KIND_BY_CONTEXT: Readonly<
  Record<ProblemReportContext, ArchiveKind>
> = {
  "agari-score": "agari-score",
  "tenpai-score": "tenpai-score",
  "daily-problem": "agari-score",
};

/** 辞書に専用の文言があるエラー。それ以外は `errors.failed` にまとめる */
type ShownError =
  | "rateLimited"
  | "dailyLimit"
  | "unauthorized"
  | "invalidReason"
  | "detailRequired"
  | "detailTooLong"
  | "failed";

/**
 * Server Action の失敗理由を画面に出す文言のキーへ寄せる
 *
 * BAN（`banned`）と `invalidRequest`（画面の操作では起こらない）は、
 * 送り直しを促す汎用の文言に落とす。
 */
function shownErrorOf(code: ReportProblemError): ShownError {
  switch (code) {
    case "rateLimited":
    case "dailyLimit":
    case "unauthorized":
    case "invalidReason":
    case "detailRequired":
    case "detailTooLong":
      return code;
    default:
      return "failed";
  }
}

/**
 * ストアの状態（setter を含む）からルール設定の真偽値だけを取り出す
 *
 * 報告の本文はサーバーが項目ごとに検証するので、関数を混ぜて送らない。
 * `RuleSettings` に項目が増えるとこの組み立てが型検査で落ちて教える。
 */
function pickRuleSettings(state: RuleSettings): RuleSettings {
  return {
    renfonpaiAs4Fu: state.renfonpaiAs4Fu,
    kiriageMangan: state.kiriageMangan,
    suuankouTankiDouble: state.suuankouTankiDouble,
    daisuushiiDouble: state.daisuushiiDouble,
    kokushiJuusanmenDouble: state.kokushiJuusanmenDouble,
    junseiChuurenDouble: state.junseiChuurenDouble,
    fukugouYakuman: state.fukugouYakuman,
  };
}

interface ProblemReportDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** 出している問題の保存要求。送るときに 1 回だけ組み立てる */
  readonly problem: () => PracticeProblemArchiveRequest;
  readonly context: ProblemReportContext;
  readonly stage: ProblemReportStage;
}

/**
 * 出題した問題の誤りを報告するダイアログ
 * 問題報告ダイアログ
 *
 * 開閉は呼び出し側（`ProblemReportButton`）が持つ。組み方は公開プロフィールの
 * 通報ダイアログと同じ（理由のタイル 1 つ・詳細・キャンセル / 送信。入力を持つので
 * × は置かない）。理由は問題の種別と段階で絞った一覧（`problemReportReasonsFor`）で、
 * 「その他」だけ詳細が要る（`validateProblemReportInput`。サーバーも同じ規則で検証する）。
 *
 * 開いている間に段階が進んで、選んでいた理由が一覧から消えたら選択を外す
 * （選んだ状態を別に持たず、今の一覧に残っているときだけ選択とみなす）。
 *
 * 送信ボタンは主操作の緑（`primary`）。利用者の通報（`danger`）と違い、誰かを
 * 咎める操作ではなく運営への協力なので、警告の色にしない。
 *
 * 送るときに端末ローカルのルール設定（`/preferences`）を添える。正解は設定で
 * 割れうるので、運営者が利用者の見た正解を同じ条件で組み立て直すため。
 */
export function ProblemReportDialog({
  isOpen,
  onClose,
  problem,
  context,
  stage,
}: ProblemReportDialogProps) {
  const t = useTranslations("problemReport");
  const titleId = useId();
  const detailId = useId();
  const ruleSettings = useRuleSettingsStore();
  const [chosenReason, setChosenReason] = useState<
    ProblemReportReason | undefined
  >(undefined);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const reasons = problemReportReasonsFor(
    ARCHIVE_KIND_BY_CONTEXT[context],
    stage,
  );
  const reason =
    chosenReason !== undefined && reasons.includes(chosenReason)
      ? chosenReason
      : undefined;

  const close = () => {
    onClose();
    setChosenReason(undefined);
    setDetail("");
    setError(undefined);
  };

  const showError = (code: ShownError) => {
    // errors.rateLimited / errors.dailyLimit / errors.unauthorized /
    // errors.invalidReason / errors.detailRequired / errors.detailTooLong / errors.failed
    setError(t(`errors.${code}`, { max: PROBLEM_REPORT_DETAIL_MAX_LENGTH }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = validateProblemReportInput(reason, detail);
    if (!input.ok) {
      showError(input.error);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      // 通信の失敗（Action が例外で終わる）も送り直しを促す文言に落とす
      const result = await (async () => {
        try {
          return await reportProblemAction({
            problem: problem(),
            context,
            stage,
            ruleSettings: pickRuleSettings(ruleSettings),
            reason: input.value.reason,
            detail,
          });
        } catch {
          return { error: "failed" as const };
        }
      })();
      if ("error" in result) {
        showError(shownErrorOf(result.error));
        return;
      }
      close();
      toast.success(t("doneToast"));
    });
  };

  return (
    <ModalShell isOpen={isOpen} onClose={close} labelledBy={titleId}>
      <form onSubmit={submit} className="space-y-4">
        <h3 id={titleId} className="text-xl font-bold text-surface-900">
          {t("title")}
        </h3>
        <p className="text-sm leading-relaxed text-surface-700">{t("lead")}</p>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-surface-900">
            {t("reasonLabel")}
          </legend>
          {reasons.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-surface-800 ${
                reason === key ? SELECTED_TILE_CLASSES : UNSELECTED_TILE_CLASSES
              }`}
            >
              <input
                type="radio"
                name="problem-report-reason"
                value={key}
                checked={reason === key}
                onChange={() => setChosenReason(key)}
                className="accent-selected"
              />
              {/* reasons.wrong_score / reasons.wrong_yaku / reasons.wrong_fu /
                  reasons.wrong_machi / reasons.invalid_board / reasons.other */}
              {t(`reasons.${key}`)}
            </label>
          ))}
        </fieldset>
        <div>
          <label
            htmlFor={detailId}
            className="mb-1 block text-sm font-medium text-surface-900"
          >
            {reason === "other" ? t("detailLabelRequired") : t("detailLabel")}
          </label>
          <textarea
            id={detailId}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t("detailPlaceholder")}
            maxLength={PROBLEM_REPORT_DETAIL_MAX_LENGTH}
            rows={3}
            className={PROFILE_INPUT_CLASS}
          />
        </div>
        {error !== undefined && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="neutral" type="button" onClick={close}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={reason === undefined || isPending}
          >
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
