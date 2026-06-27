import { getTranslations } from "next-intl/server";
import { HIGH_SCORES } from "@mahjong-scoring/core";

interface ManganScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: "ko" | "oya";
}

/** 種類ごとの翻数レンジ表示（満貫は4翻も含むため "5" 単独にしない） */
const HAN_DISPLAY: Record<string, string> = {
  mangan: "4 〜 5",
  haneman: "6 〜 7",
  baiman: "8 〜 10",
  sanbaiman: "11 〜 12",
  yakuman: "13 〜",
};

/** nameKey から manganScoreTable 名前空間の備考キーを導出する */
function noteKeyOf(nameKey: string): string {
  return `note${nameKey.charAt(0).toUpperCase()}${nameKey.slice(1)}`;
}

/**
 * 満貫以上の点数早見表（種類×翻数×点数×備考）
 * 満貫以上早見表
 *
 * 満貫以上は翻数だけで点数が決まるため符の列は持たない。点数は core の
 * {@link HIGH_SCORES}（ロン）から導出し、子・親で共有する。
 */
export async function ManganScoreTable({ role }: ManganScoreTableProps) {
  const t = await getTranslations("manganScoreTable");
  const tScore = await getTranslations("scoreTable");

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50">
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("colType")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("colHan")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("colScore")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("colNote")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {HIGH_SCORES.map((row) => {
            const score = role === "ko" ? row.ronKo : row.ronOya;
            return (
              <tr key={row.nameKey} className="bg-white">
                <td className="px-4 py-3 font-medium text-surface-900">
                  {tScore(row.nameKey)}
                </td>
                <td className="px-4 py-3 text-right text-surface-600">
                  {HAN_DISPLAY[row.nameKey]}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">
                  {score.toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-3 text-surface-500">
                  {t(noteKeyOf(row.nameKey))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
