import { getTranslations } from "next-intl/server";
import { type Role } from "@mahjong-scoring/core";

import { HanRowsTable } from "../../_components/han-rows-table";

import { buildHanDoublingRows } from "../_lib/fu-doubling-rows";

interface HanDoublingTableProps {
  /** 対象の符。4翻でも満貫に届かない符を渡すこと（30符など） */
  readonly fu: number;
  readonly role: Role;
  /** 表の上に出す見出し（「子のロン（30符）」等） */
  readonly caption: string;
}

/**
 * 翻を1つずつ上げたときの点数を、切り上げ前の値と並べた表
 * 倍々の表
 *
 * 表に載る点数（1000 → 2000 → 3900 → 7700）だけを見ると2倍からずれて
 * 見えるため、切り上げる前の値（960 → 1920 → 3840 → 7680）を隣に置く。
 * 「倍々になっていないように見えるのは100点単位に切り上げているからで、
 * 規則そのものは崩れていない」という一点だけを伝えるための表なので、
 * ツモ（子から / 親から の2口）は載せない。
 */
export async function HanDoublingTable({
  fu,
  role,
  caption,
}: HanDoublingTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildHanDoublingRows(fu, role);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </h3>
      <HanRowsTable
        rows={rows}
        columns={[
          {
            header: t("colBeforeCeil"),
            render: (row) => row.beforeCeil,
            className: "text-surface-500",
          },
          {
            header: t("colScore"),
            render: (row) => row.ron,
            className: "font-semibold text-primary-600",
          },
        ]}
      />
    </div>
  );
}
