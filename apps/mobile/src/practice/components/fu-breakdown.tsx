import { useTranslations } from "use-intl";
import type { FuDetail } from "@mahjong-scoring/core";

import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

/**
 * 符の内訳（web の `FuBreakdown`）
 *
 * 符の理由ごとの表と合計。切り上げで答えと合計が違うときは注記を添える。
 * 辞書は `<namespace>.breakdownTitle` / `fuSuffix` / `breakdownTotal` / `roundUp`。
 */
export function FuBreakdown({
  details,
  answer,
  translationNamespace,
}: {
  readonly details: readonly FuDetail[];
  readonly answer: number;
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  const rawTotal = details.reduce((sum, detail) => sum + detail.fu, 0);
  return (
    <CollapsibleDetail title={t("breakdownTitle")}>
      <DetailTable
        rows={details.map((detail) => ({
          label: detail.reason,
          value: t("fuSuffix", { value: detail.fu }),
        }))}
        total={{
          label: t("breakdownTotal"),
          value: t("fuSuffix", { value: rawTotal }),
        }}
        note={
          rawTotal === answer
            ? undefined
            : `${t("fuSuffix", { value: rawTotal })} → ${t("fuSuffix", { value: answer })}（${t("roundUp")}）`
        }
      />
    </CollapsibleDetail>
  );
}
