import type { ReactNode } from "react";

/** 内訳の1行（構成要素とその値） */
export interface BreakdownRow {
  /** 構成要素の名前（役名・符の理由） */
  readonly label: string;
  /** 表示する値（"1翻" / "8符" のように単位まで含めた文字列） */
  readonly value: string;
}

interface BreakdownTableProps {
  /** 表の上に置く見出し（「翻数の内訳」など） */
  readonly title: string;
  readonly rows: readonly BreakdownRow[];
  /** 合計行の見出し */
  readonly totalLabel: string;
  /** 合計行の値（単位まで含めた文字列） */
  readonly totalValue: string;
  /** 合計の後に効く丸め（切り上げ・役満止まり）の補足。無ければ省く */
  readonly note?: ReactNode;
}

/**
 * 積み上げの内訳表
 * 内訳表
 *
 * 符・翻の「何がいくつ積み上がって合計になったか」を、結果詳細の中で
 * 見せるための表。行区切りは破線、合計は実線で締め、値は右端で桁を揃える。
 *
 * 参照表の {@link DataTable} は使わない。あちらは 1 ページを占める表
 * （点数表・教本の早見表）のための体裁で、太枠と色付きの見出し帯を持つ。
 * 内訳が置かれるのは結果詳細のアコーディオンの中——既に枠を持つカードの
 * 内側——なので、そこで枠と帯を立てると入れ子が増え、地の白から浮いた
 * 別の資料に見える。区切りは外側のカードの太枠が持ち、この表は行だけを
 * 並べる。列見出しも置かない（2列しかなく、名前と値は見れば分かる）。
 */
export function BreakdownTable({
  title,
  rows,
  totalLabel,
  totalValue,
  note,
}: BreakdownTableProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-surface-500">{title}</p>

      <table className="w-full text-sm">
        <tbody className="divide-y-2 divide-dashed divide-surface-200">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="py-2 pr-4 text-left whitespace-nowrap text-surface-600">
                {row.label}
              </td>
              <td className="py-2 text-right text-surface-800">{row.value}</td>
            </tr>
          ))}
          {/* 合計の実線は tr ではなくセルに置く。tbody の divide-dashed は
              セレクタの詳細度が高く、tr 側に border-solid を書いても
              破線に負ける */}
          <tr>
            <td className="border-t-2 border-solid border-ink py-2 pr-4 text-left font-bold whitespace-nowrap text-surface-900">
              {totalLabel}
            </td>
            <td className="border-t-2 border-solid border-ink py-2 text-right font-bold text-surface-900">
              {totalValue}
            </td>
          </tr>
        </tbody>
      </table>

      {note !== undefined && (
        <p className="text-right text-xs text-surface-500">{note}</p>
      )}
    </div>
  );
}
