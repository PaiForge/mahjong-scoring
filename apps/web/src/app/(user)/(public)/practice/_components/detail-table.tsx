import type { ReactNode } from "react";

/** 値の色。正誤を示す行だけが指定する */
type DetailTone = "correct" | "incorrect";

/** 名前と値の1行 */
export interface DetailTableRow {
  /** 行の見出し（役名・符の理由・「正解」など） */
  readonly label: string;
  /** 表示する値。単位まで含めた文字列か、牌・チップ・リンクを含む要素 */
  readonly value: ReactNode;
  /** 値の色（既定は本文色） */
  readonly tone?: DetailTone;
}

const TONE_CLASSES: Readonly<Record<DetailTone, string>> = {
  correct: "text-primary-600",
  incorrect: "text-destructive",
};

interface DetailTableProps {
  /** カードの見出し（「答え合わせ」「翻数の内訳」など） */
  readonly title: string;
  readonly rows: readonly DetailTableRow[];
  /** 実線で締める最終行（内訳の合計）。持たない表もある */
  readonly total?: Omit<DetailTableRow, "tone">;
  /** 合計の後に効く丸め（切り上げ・役満止まり）の補足 */
  readonly note?: ReactNode;
}

/**
 * 結果詳細の名前と値の表
 * 詳細表
 *
 * 問題別フィードバック（アコーディオンの中）に置く白カード。答え合わせも
 * 符・翻の内訳も「名前と値が並ぶ」同じ形なので、体裁をここに集約して
 * 1つの詳細の中で見た目が割れないようにする。
 *
 * 参照表の {@link DataTable} は使わない。あちらは 1 ページを占める表
 * （点数表・教本の早見表）のための体裁で、色付きの見出し帯を持つ。ここは
 * カードの中の小さな表なので、列見出しを置かず（2列しかなく、名前と値は
 * 見れば分かる）、行区切りの破線と合計の実線だけで読ませる。
 *
 * 値は右端で揃える（符・翻・点数は桁が揃う方が読みやすい）。役のチップの
 * ように自分で flex を張る値は、セルいっぱいに広がってそのまま左から並ぶ。
 */
export function DetailTable({ title, rows, total, note }: DetailTableProps) {
  return (
    <div className="rounded-xl border-3 border-ink bg-white p-4 text-sm">
      <p className="mb-2 font-bold text-surface-900">{title}</p>

      <table className="w-full">
        <tbody className="divide-y-2 divide-dashed divide-surface-200">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-4 text-left align-top whitespace-nowrap text-surface-600">
                {row.label}
              </td>
              <td
                className={`py-1.5 text-right align-top ${
                  row.tone ? TONE_CLASSES[row.tone] : "text-surface-800"
                }`}
              >
                {row.value}
              </td>
            </tr>
          ))}
          {total !== undefined && (
            // 合計の実線は tr ではなくセルに置く。tbody の divide-dashed は
            // セレクタの詳細度が高く、tr 側に border-solid を書いても破線に負ける
            <tr>
              <td className="border-t-2 border-solid border-ink pt-1.5 pr-4 text-left font-bold whitespace-nowrap text-surface-900">
                {total.label}
              </td>
              <td className="border-t-2 border-solid border-ink pt-1.5 text-right font-bold text-surface-900">
                {total.value}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {note !== undefined && (
        <p className="mt-1 text-right text-xs text-surface-500">{note}</p>
      )}
    </div>
  );
}
