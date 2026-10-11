import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * 結果表の「あなたの回答」の未回答セル
 * 未回答セル
 *
 * 開示（「わからない」）の各行と、翻・符・点数の形を取らない回答
 * （聴牌形の点数計算の「役なし」）の翻数以外の行に置く。
 */
export function ResultUnansweredCell() {
  const t = useTranslations("agariScore");
  return (
    <td className="py-2 pr-4 text-right align-top text-surface-400">
      {t("result.unanswered")}
    </td>
  );
}

interface ResultTableFrameProps {
  /** 項目（役・翻数・符・点数）ごとの `<tbody>` */
  readonly children: ReactNode;
  /**
   * 表の下、同じ面の中に続けるもの（翻数・符の内訳の入口）。表と内訳を
   * 1 つの面にまとめ、内訳が答え合わせとは別の資料に見えないようにする
   */
  readonly footer?: ReactNode;
  /**
   * 既に白い枠を持つ面の中に置くか（聴牌形の点数計算のタブパネル）。
   * 真なら表自身の枠と内側の余白を外す（白い枠の入れ子にしない）
   */
  readonly embedded?: boolean;
}

/**
 * 正解の列（3 列目）のセルに敷く薄い帯
 *
 * 見出しから点数まで、正解の値を縦に目で追わせる。色は中性の灰で、緑には
 * しない — 回答側の正誤の「正解」の緑と役割が重なる。縦の罫線も引かない。
 * 帯の端に値が貼り付かないよう左右に余白を取り、上下の端だけ丸める。
 * 列の `<col>` に背景を付けると角を丸められないため、セル側に当てる。
 */
const CORRECT_COLUMN_CLASSES = [
  "[&_th:nth-child(3)]:bg-surface-50",
  "[&_td:nth-child(3)]:bg-surface-50",
  "[&_th:nth-child(3)]:px-3",
  "[&_td:nth-child(3)]:px-3",
  "[&_th:nth-child(3)]:rounded-t-md",
  "[&>tbody:last-of-type_td:nth-child(3)]:rounded-b-md",
].join(" ");

/**
 * 答え合わせの表の外枠
 * 結果表の枠
 *
 * 「あなたの回答」と「正解」を並べる表の箱・見出し行・列幅。点数計算の
 * 結果表（`ResultDisplay`）と、点数の出題を持たない役なしのマスの表
 * （聴牌形の点数計算）で同じ枠を使い、タブを切り替えても表の形が変わらない
 * ようにする。行は呼び出し側が項目ごとの `<tbody>` で渡す。
 *
 * 面は白地に淡い枠（地に置かれた他のカードと同じ）で、正解の列にだけ
 * 薄い帯を通す（{@link CORRECT_COLUMN_CLASSES}）。以前は面全体が淡い灰で、
 * 開いた内訳だけが白い枠の箱になり、枠が入れ子に見えた。白地の面の中で
 * 内訳を淡い灰に沈めると、「比較表」と「その説明」が枠を足さずに分かれる。
 *
 * 回答全体の正誤を名乗る見出し・バナーは置かない。「あなたの回答」と
 * 「正解」を並べた時点で合っていたかは読めば分かり、行ごとの ✓/✗ と
 * 下部の正解/不正解カウンタが既に判定を持っている。全幅の色帯や
 * 見出し行を足すと、いちばん読ませたいこの表より判定が強く出る。
 *
 * 値の 2 列は右端で揃える（項目名は左）。下の内訳も DetailTable が値を
 * 右端に置くので、正解の「2翻」と内訳の「合計 2翻」が同じ縦位置に並ぶ。
 * 左寄せだと正解は列の中ほど、内訳の合計は右端と、同じ数字が別の縦位置に出る。
 *
 * 罫線は項目（役・翻数・符・点数）の境目にだけ引く。項目ごとに
 * `<tbody>` を分け、tbody 同士の境目を実線にする。縦の罫線は引かない —
 * アプリの表（DataTable / DetailTable）はどれも縦線を持たず、回答と正解は
 * 色（正誤の色 / 太字）で既に分かれている。内訳は表の中に挟まず、
 * `footer` として表の下に置く（理由は `BreakdownPanel`）。
 *
 * 列の見出し（あなたの回答 / 正解）は表の中でいちばん濃くする（`surface-900`）。
 * 直下に並ぶ正解の値（`surface-800` の太字）より淡いと、見出しが値に負けて
 * 項目として読めない（濃さの順は {@link import("../../_components/detail-table").DetailTable}
 * と同じく 見出し > 値 > 名前）。大きさは本文と同じ `text-sm` のまま。
 *
 * 列幅は table-fixed + colgroup で決め打ちする。比べさせたい 2 列
 * （あなたの回答 / 正解）を同じ幅にするため。中身なりに決まる
 * auto レイアウトでは、正解の列だけが役の一覧や「点数表を確認」の
 * 導線を持つぶん広くなり（desktop 実測で 196px 対 462px）、同じ
 * 種類の値なのに正解のほうが大きい枠を与えられた見た目になる。
 * さらに幅が問題ごとに変わる（mobile 実測で 100/222 の問題と
 * 151/148 の問題）ため、「次の問題へ」で表が入れ替わるたびに回答の
 * 値が横に動き、同じ場所を続けて見ていられない。項目名の列だけ
 * 固定幅を与え、残りを 2 列で等分する（table-fixed は幅を指定して
 * いない列に残りを均等に配る）。
 */
export function ResultTableFrame({
  children,
  footer,
  embedded = false,
}: ResultTableFrameProps) {
  const t = useTranslations("agariScore");
  return (
    <div
      className={
        embedded ? "bg-white" : "rounded-panel border border-panel bg-white p-4"
      }
    >
      <table
        className={`w-full table-fixed text-sm [&>tbody+tbody]:border-t [&>tbody+tbody]:border-surface-200 ${CORRECT_COLUMN_CLASSES}`}
      >
        <colgroup>
          {/* 項目名（役・翻数・符・点数）+ pr-4 が収まる最小限 */}
          <col className="w-16" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-surface-300">
            <th className="pb-3 pr-4 pt-2 text-left font-bold text-surface-900" />
            {/* 見出しは折り返さない。役のチップが列幅を取ると
                「あなたの回答」が 2 行に割れて表の頭が崩れる */}
            <th className="whitespace-nowrap pb-3 pr-4 pt-2 text-right font-bold text-surface-900">
              {t("result.headers.answer")}
            </th>
            <th className="whitespace-nowrap pb-3 pt-2 text-right font-bold text-surface-900">
              {t("result.headers.correct")}
            </th>
          </tr>
        </thead>
        {children}
      </table>
      {footer !== undefined && (
        <div className="mt-3 border-t border-surface-200">{footer}</div>
      )}
    </div>
  );
}
