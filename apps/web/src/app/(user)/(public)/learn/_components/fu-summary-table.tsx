import { SectionTitle } from "@/app/_components/section-title";

interface FuSummaryRow {
  /** 翻訳済みの種類ラベル */
  readonly label: string;
  /** 符数（0 のときは控えめなスタイルで表示） */
  readonly fu: number;
}

interface FuSummaryTableProps {
  /** 翻訳済みのセクション見出し */
  readonly title: string;
  /** 翻訳済みの「種類」列ヘッダ */
  readonly colType: string;
  /** 翻訳済みの「符」列ヘッダ */
  readonly colFu: string;
  /** 符数を表示文字列に変換する（例: t("fuUnit", { value })） */
  readonly formatFu: (value: number) => string;
  /** 表示する行（符の昇順・降順は呼び出し側の指定順） */
  readonly rows: readonly FuSummaryRow[];
}

/**
 * 符の早見表（種類×符の2列テーブル）
 * 符早見表
 *
 * jantou-fu / machi-fu / mentsu-fu の教本で共有する。符が 0 の行は控えめ、
 * 0 より大きい行はプライマリ色で強調する。
 */
export function FuSummaryTable({
  title,
  colType,
  colFu,
  formatFu,
  rows,
}: FuSummaryTableProps) {
  return (
    <section className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      <div className="overflow-hidden rounded-xl border border-surface-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50">
              <th className="px-4 py-3 text-left font-medium text-surface-600">
                {colType}
              </th>
              <th className="px-4 py-3 text-right font-medium text-surface-600">
                {colFu}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {rows.map((row, index) => {
              const hasFu = row.fu > 0;
              return (
                <tr key={index} className="bg-white">
                  <td
                    className={`px-4 py-3 ${hasFu ? "text-surface-900" : "text-surface-500"}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${hasFu ? "font-semibold text-primary-600" : "text-surface-400"}`}
                  >
                    {formatFu(row.fu)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
