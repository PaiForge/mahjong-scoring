import { getTranslations } from "next-intl/server";

import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";

import {
  buildTsumoComparison,
  type TsumoPaymentEntry,
} from "../_lib/tsumo-payment-rows";

interface TsumoPaymentComparisonProps {
  readonly fu: number;
  readonly han: number;
}

interface PaymentPanelProps {
  readonly title: string;
  readonly note: string;
  readonly entries: readonly TsumoPaymentEntry[];
  readonly fromKoLabel: string;
  readonly fromOyaLabel: string;
}

/**
 * 1つの場面の支払い3口
 *
 * 表示だけの面なので太枠のみで、影は持たない（影は押せることの記号）。
 */
function PaymentPanel({
  title,
  note,
  entries,
  fromKoLabel,
  fromOyaLabel,
}: PaymentPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border-3 border-ink bg-white p-4">
      <h4 className="text-sm font-bold text-surface-900">{title}</h4>
      <ul className="space-y-1">
        {entries.map((entry, index) => (
          <li
            key={index}
            className={`flex items-baseline justify-between rounded-md px-3 py-2 ${
              entry.shared ? TABLE_HIGHLIGHT_CELL_CLASS : ""
            }`}
          >
            <span className="text-sm text-surface-600">
              {entry.payer === "oya" ? fromOyaLabel : fromKoLabel}
            </span>
            <span
              className={
                entry.shared
                  ? "font-bold text-primary-700"
                  : "font-semibold text-surface-700"
              }
            >
              {entry.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-surface-500">{note}</p>
    </div>
  );
}

/**
 * 子の和了と親の和了で、場に出る支払いを並べて見せる
 * ツモ支払いの対比
 *
 * 点数表は和了者から見た数字しか書かないため、「1000/2000」と「2000オール」が
 * 同じ 2000 を含むことは、2つの欄を突き合わせて初めて見える。突き合わせを表で
 * やると偶然そう並んでいるようにしか読めないので、支払いを場面ごとに3口へ
 * 展開して、同じ額が同じ理由（親がからむ支払い＝基本符の2つ分）で出ている
 * ことを示す。
 *
 * 色を敷くのは両方の場面に現れる額。色だけに頼らないよう、各パネルの脚注と
 * 図の下の一文が同じことを言葉でも述べる。
 */
export async function TsumoPaymentComparison({
  fu,
  han,
}: TsumoPaymentComparisonProps) {
  const [t, tTable] = await Promise.all([
    getTranslations("tsumoPayments.learn"),
    getTranslations("learnCurriculum.scoreTable"),
  ]);
  const comparison = buildTsumoComparison(fu, han);
  const labels = {
    fromKoLabel: tTable("fromKo"),
    fromOyaLabel: tTable("fromOya"),
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {t("comparisonCaption", {
          fu,
          han,
          unit: comparison.unitAmount,
        })}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <PaymentPanel
          title={t("koWinTitle")}
          note={t("koWinNote")}
          entries={comparison.koWin}
          {...labels}
        />
        <PaymentPanel
          title={t("oyaWinTitle")}
          note={t("oyaWinNote")}
          entries={comparison.oyaWin}
          {...labels}
        />
      </div>
    </div>
  );
}
