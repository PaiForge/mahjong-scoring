import type { FuDetail } from "@mahjong-scoring/core";

/**
 * 符の内訳の翻訳関数
 *
 * `breakdownTitle` / `breakdownTotal` / `roundUp` / `fuSuffix`（`value` の補間）を
 * 持つ名前空間（例: "totalFu"）を引く。
 */
type FuBreakdownTranslator = (
  key: string,
  values?: Record<string, number>,
) => string;

/** 符の内訳の表の 1 行（理由と、単位まで付けた符） */
export interface FuBreakdownRow {
  readonly label: string;
  readonly value: string;
}

/** 符の内訳の表に並べる文字列 */
export interface FuBreakdown {
  /** 開閉の見出し */
  readonly title: string;
  /** 理由ごとの行。出題の順のまま */
  readonly rows: readonly FuBreakdownRow[];
  /** 切り上げ前の合計の行 */
  readonly total: FuBreakdownRow;
  /** 合計と正解が違うとき（切り上げ）だけの補足。例: 「32符 → 40符（切り上げ）」 */
  readonly note: string | undefined;
}

/**
 * 符の内訳の表に並べる文字列を組み立てる
 * 符内訳表示
 *
 * 副底から待ち符までの各構成要素とその合計を並べ、内訳の合計と正解が一致
 * しないとき（例: 32符 → 40符）に 10 符単位への切り上げの補足を添える。
 * 開閉や表の描画は web・モバイルの `FuBreakdown` が持つ。
 *
 * @param details - 切り上げ前の符の内訳
 * @param answer - 切り上げ後の符（正解）
 * @param t - 符の内訳の名前空間の翻訳関数
 */
export function buildFuBreakdown(
  details: readonly FuDetail[],
  answer: number,
  t: FuBreakdownTranslator,
): FuBreakdown {
  const rawTotal = details.reduce((sum, detail) => sum + detail.fu, 0);
  const formatFu = (value: number) => t("fuSuffix", { value });

  return {
    title: t("breakdownTitle"),
    rows: details.map((detail) => ({
      label: detail.reason,
      value: formatFu(detail.fu),
    })),
    total: { label: t("breakdownTotal"), value: formatFu(rawTotal) },
    note:
      rawTotal === answer
        ? undefined
        : `${formatFu(rawTotal)} → ${formatFu(answer)}（${t("roundUp")}）`,
  };
}
