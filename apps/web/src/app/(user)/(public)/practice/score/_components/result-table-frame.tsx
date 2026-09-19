import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** 結果表の列数（項目名 / あなたの回答 / 正解）。展開行の colSpan に使う */
export const RESULT_TABLE_COLUMN_COUNT = 3;

/**
 * 結果表の「あなたの回答」の未回答セル
 * 未回答セル
 *
 * 開示（「わからない」）の各行と、翻・符・点数の形を取らない回答
 * （待ち別点数計算の「役なし」）の翻数以外の行に置く。
 */
export function ResultUnansweredCell() {
  const t = useTranslations("score");
  return (
    <td className="py-2 pr-4 text-right align-top text-surface-400">
      {t("result.unanswered")}
    </td>
  );
}

interface ResultTableFrameProps {
  /** 項目（役・翻数・符・点数）ごとの `<tbody>` */
  readonly children: ReactNode;
}

/**
 * 答え合わせの表の外枠
 * 結果表の枠
 *
 * 「あなたの回答」と「正解」を並べる表の箱・見出し行・列幅。点数計算の
 * 結果表（`ResultDisplay`）と、点数の出題を持たない役なしのマスの表
 * （待ち別点数計算）で同じ枠を使い、タブを切り替えても表の形が変わらない
 * ようにする。行は呼び出し側が項目ごとの `<tbody>` で渡す。
 *
 * 回答全体の正誤を名乗る見出し・バナーは置かない。「あなたの回答」と
 * 「正解」を並べた時点で合っていたかは読めば分かり、行ごとの ✓/✗ と
 * 下部の正解/不正解カウンタが既に判定を持っている。全幅の色帯や
 * 見出し行を足すと、いちばん読ませたいこの表より判定が強く出る。
 *
 * 値の 2 列は右端で揃える（項目名は左）。内訳の行は全幅で
 * DetailTable が値を右端に置くので、正解の「2翻」の真下に内訳の
 * 「1翻 / 1翻 / 合計 2翻」が並び、縦に足し算が読める。左寄せだと
 * 正解は列の中ほど、内訳の合計は右端と、同じ数字が別の縦位置に出る。
 *
 * 罫線は項目（役・翻数・符・点数）の境目にだけ引く。項目ごとに
 * `<tbody>` を分け、tbody 同士の境目を実線にする。翻数とその内訳の
 * 行は同じ tbody に入るので、開いた内訳がどの行に付く注釈かを線が
 * 言う。行ごとに引くと内訳の行の上下にも線が入り、内訳が独立した
 * 項目に見える。縦の罫線は引かない — 内訳の行は全幅（colSpan）
 * なので開くたびに縦線が途切れて壊れて見えるし、アプリの表
 * （DataTable / DetailTable）はどれも縦線を持たない。回答と正解は
 * 色（正誤の色 / 太字）で既に分かれている。
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
export function ResultTableFrame({ children }: ResultTableFrameProps) {
  const t = useTranslations("score");
  return (
    <div className="rounded-lg bg-surface-50 p-4">
      <table className="w-full table-fixed text-sm [&>tbody+tbody]:border-t-2 [&>tbody+tbody]:border-surface-200">
        <colgroup>
          {/* 項目名（役・翻数・符・点数）+ pr-4 が収まる最小限 */}
          <col className="w-16" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b-3 border-ink">
            <th className="pb-3 pr-4 pt-2 text-left font-bold text-surface-600" />
            {/* 見出しは折り返さない。役のチップが列幅を取ると
                「あなたの回答」が 2 行に割れて表の頭が崩れる */}
            <th className="whitespace-nowrap pb-3 pr-4 pt-2 text-right font-bold text-surface-600">
              {t("result.headers.answer")}
            </th>
            <th className="whitespace-nowrap pb-3 pt-2 text-right font-bold text-surface-600">
              {t("result.headers.correct")}
            </th>
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}
