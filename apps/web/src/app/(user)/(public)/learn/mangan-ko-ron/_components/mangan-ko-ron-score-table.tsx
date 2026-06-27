import { getTranslations } from "next-intl/server";

interface ManganRow {
  /** scoreTable 名前空間の名称キー（満貫・跳満…） */
  readonly nameKey: string;
  /** 翻数の表示（例: "4 〜 5"） */
  readonly han: string;
  /** 子ロンの点数 */
  readonly score: number;
  /** manganKoRon.learn 名前空間の備考キー */
  readonly noteKey: string;
}

const ROWS: readonly ManganRow[] = [
  { nameKey: "mangan", han: "4 〜 5", score: 8000, noteKey: "noteMangan" },
  { nameKey: "haneman", han: "6 〜 7", score: 12000, noteKey: "noteHaneman" },
  { nameKey: "baiman", han: "8 〜 10", score: 16000, noteKey: "noteBaiman" },
  {
    nameKey: "sanbaiman",
    han: "11 〜 12",
    score: 24000,
    noteKey: "noteSanbaiman",
  },
  { nameKey: "yakuman", han: "13 〜", score: 32000, noteKey: "noteYakuman" },
];

/**
 * 子ロン（満貫以上）の点数早見表
 * 子ロン満貫早見表
 *
 * 種類×翻×点数×備考の4列テーブル。点数は翻数だけで決まるため符の列は持たない。
 */
export async function ManganKoRonScoreTable() {
  const t = await getTranslations("manganKoRon.learn");
  const tScore = await getTranslations("scoreTable");

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50">
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("tableColType")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("tableColHan")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("tableColScore")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("tableColNote")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {ROWS.map((row) => (
            <tr key={row.nameKey} className="bg-white">
              <td className="px-4 py-3 font-medium text-surface-900">
                {tScore(row.nameKey)}
              </td>
              <td className="px-4 py-3 text-right text-surface-600">
                {row.han}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-primary-600">
                {row.score.toLocaleString("ja-JP")}
              </td>
              <td className="px-4 py-3 text-surface-500">{t(row.noteKey)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
