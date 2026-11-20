import { getTranslations } from "next-intl/server";

import type { ShownScore } from "@/lib/problem-reports/snapshot";

import { adminChipClasses } from "../../_lib/chip-classes";
import { InfoRow } from "../../users/[id]/_components/detail-section";
import {
  SHOWN_SCORE_FIELDS,
  type AnswerComparison,
  type ComparableAnswer,
  type ShownScoreField,
} from "../_lib/answer-comparison";
import { TileList } from "./tile-list";

/** 支払いを 1 行の文字列にする */
async function PaymentText({
  payment,
}: {
  readonly payment: ShownScore["payment"];
}) {
  const t = await getTranslations("admin.problemReports.answers.payment");
  switch (payment.type) {
    case "ron":
      return t("ron", { amount: payment.amount });
    case "oyaTsumo":
      return t("oyaTsumo", { amount: payment.amount });
    case "koTsumo":
      // amount は [子の支払い, 親の支払い]
      return t("koTsumo", { ko: payment.amount[0], oya: payment.amount[1] });
  }
}

/** 項目 1 つの値 */
async function FieldValue({
  field,
  score,
}: {
  readonly field: ShownScoreField;
  readonly score: ShownScore;
}) {
  const t = await getTranslations("admin.problemReports.answers");
  switch (field) {
    case "payment":
      return <PaymentText payment={score.payment} />;
    case "yaku":
      return (
        <ul>
          {score.yaku.map((yaku, i) => (
            <li key={i}>{t("yakuItem", { name: yaku.name, han: yaku.han })}</li>
          ))}
        </ul>
      );
    default:
      return String(score[field]);
  }
}

/** 1 つの和了の正解。食い違う項目に印を付ける */
async function ScoreRows({
  score,
  differing,
}: {
  readonly score: ShownScore | null;
  readonly differing: readonly ShownScoreField[];
}) {
  const t = await getTranslations("admin.problemReports.answers");
  if (score === null) {
    return (
      <p className="text-sm">
        {t("noYaku")}
        {differing.length > 0 && (
          <span className={`ml-2 ${adminChipClasses("danger")}`}>
            {t("mismatch")}
          </span>
        )}
      </p>
    );
  }
  return (
    <dl>
      {SHOWN_SCORE_FIELDS.map((field) => (
        <InfoRow key={field} label={t(`fields.${field}`)}>
          <span className="inline-flex flex-wrap items-start gap-2">
            <FieldValue field={field} score={score} />
            {differing.includes(field) && (
              <span className={adminChipClasses("danger")}>
                {t("mismatch")}
              </span>
            )}
          </span>
        </InfoRow>
      ))}
    </dl>
  );
}

/**
 * 正解 1 つ（報告時 / 現在）を、もう片方と食い違う項目に印を付けて出す
 * 正解の表示
 *
 * 組み立てられなかった正解（`rebuildError`）は理由を出す。聴牌形は待ちごとに
 * ツモとロンを並べ、片方にしか無い待ちはその旨を添える。
 *
 * @param side - この正解が報告時（`reported`）か現在（`current`）か。片方にしか
 *   無い待ちの印の向きを決める
 */
export async function ShownAnswerView({
  answer,
  comparison,
  side,
}: {
  readonly answer: ComparableAnswer;
  readonly comparison: AnswerComparison;
  readonly side: "reported" | "current";
}) {
  const t = await getTranslations("admin.problemReports.answers");
  if ("rebuildError" in answer) {
    return (
      <p className="text-sm text-red-700">
        {t("rebuildError", { error: answer.rebuildError })}
      </p>
    );
  }
  if (answer.kind === "agari-score") {
    return (
      <ScoreRows
        score={answer.score}
        differing={comparison.kind === "agari-score" ? comparison.score : []}
      />
    );
  }
  const waitComparisons =
    comparison.kind === "tenpai-score" ? comparison.waits : [];
  return (
    <ul className="space-y-4">
      {answer.waits.map((wait) => {
        const diff = waitComparisons.find((w) => w.agariHai === wait.agariHai);
        const onlyHere =
          diff !== undefined &&
          diff.presence ===
            (side === "reported" ? "reportedOnly" : "currentOnly");
        return (
          <li key={wait.agariHai} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TileList hais={[wait.agariHai]} />
              {onlyHere && (
                <span className={adminChipClasses("danger")}>
                  {side === "reported"
                    ? t("waitOnlyReported")
                    : t("waitOnlyCurrent")}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-surface-500">
                  {t("tsumo")}
                </p>
                <ScoreRows score={wait.tsumo} differing={diff?.tsumo ?? []} />
              </div>
              <div>
                <p className="text-xs font-bold text-surface-500">{t("ron")}</p>
                <ScoreRows score={wait.ron} differing={diff?.ron ?? []} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
