import { getTranslations } from "next-intl/server";
import { HIGH_SCORES } from "@mahjong-scoring/core";

/** 種類ごとの翻数レンジ表示（満貫は4翻も含むため "5" 単独にしない） */
const HAN_DISPLAY: Record<string, string> = {
  mangan: "4 〜 5",
  haneman: "6 〜 7",
  baiman: "8 〜 10",
  sanbaiman: "11 〜 12",
  yakuman: "13 〜",
};

/**
 * 親ツモ（満貫以上）の点数早見表（種類×翻数×子1人の支払い×合計）
 * 親ツモ満貫以上早見表
 *
 * 親ツモは子3人が同額を払う「オール」。合計は親のロンと等しく、それを3人で
 * 均等に割っているだけであることを示すため合計列を持つ。点数は core の
 * {@link HIGH_SCORES}（親ツモ）から導出する。
 */
export async function ManganOyaTsumoScoreTable() {
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
              {t("colKoEach")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("colTotal")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {HIGH_SCORES.map((row) => {
            const each = Number.parseInt(row.tsumoOya, 10);
            const total = each * 3;
            return (
              <tr key={row.nameKey} className="bg-white">
                <td className="px-4 py-3 font-medium text-surface-900">
                  {tScore(row.nameKey)}
                </td>
                <td className="px-4 py-3 text-right text-surface-600">
                  {HAN_DISPLAY[row.nameKey]}
                </td>
                <td className="px-4 py-3 text-right text-surface-700">
                  {each.toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">
                  {total.toLocaleString("ja-JP")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
