import type { Translate } from "../i18n/translate";
import type { FuDetail } from "@mahjong-scoring/core";

/**
 * 符の内訳の翻訳関数
 *
 * `breakdownTotal` / `roundedUp` / `fuSuffix`（`value` の補間）を持つ名前空間（例: "totalFu"）を引く。
 */
type FuBreakdownTranslator = Translate;

/** 符の内訳の表の 1 行（理由と、単位まで付けた符） */
export interface FuBreakdownRow {
  readonly label: string;
  readonly value: string;
}

/** 符の内訳の表に並べる文字列 */
export interface FuBreakdown {
  /** 理由ごとの行。出題の順のまま */
  readonly rows: readonly FuBreakdownRow[];
  /** 切り上げ前の合計の行 */
  readonly total: FuBreakdownRow;
  /**
   * 合計と正解が違うとき（切り上げ）だけの、切り上げ後の符の行。例: 「切り上げ後」「40符」
   *
   * 表の結論として合計の下に強調して出す（内訳の合計 32符 と答えの 40符 の
   * どちらが正解かを一目で読ませるため）
   */
  readonly rounded: FuBreakdownRow | undefined;
}

/**
 * 符の内訳の表に並べる文字列を組み立てる
 * 符内訳表示
 *
 * 副底から待ち符までの各構成要素とその合計を並べ、内訳の合計と正解が一致
 * しないとき（例: 32符 → 40符）に 10 符単位へ切り上げた後の符を添える。
 * 開閉や表の描画は web・モバイルの `FuBreakdown` が持つ。
 *
 * 理由の行の文言は `formatReason` で決める。省略時は core の日本語の文言
 * （`detail.reason`）をそのまま出す（モバイルは日本語固定なのでこのまま）。
 * 言語ごとに描く側は `fuReasonLabel`（`challenge.fuBreakdown` の辞書で引く）を渡す。
 *
 * @param details - 切り上げ前の符の内訳
 * @param answer - 切り上げ後の符（正解）
 * @param t - 符の内訳の名前空間の翻訳関数
 * @param formatReason - 理由の行の文言（省略時は `detail.reason`）
 */
export function buildFuBreakdown(
  details: readonly FuDetail[],
  answer: number,
  t: FuBreakdownTranslator,
  formatReason: (detail: FuDetail) => string = (detail) => detail.reason,
): FuBreakdown {
  const rawTotal = details.reduce((sum, detail) => sum + detail.fu, 0);
  const formatFu = (value: number) => t("fuSuffix", { value });

  const isRounded = rawTotal !== answer;

  return {
    rows: details.map((detail) => ({
      label: formatReason(detail),
      value: formatFu(detail.fu),
    })),
    total: { label: t("breakdownTotal"), value: formatFu(rawTotal) },
    rounded: isRounded
      ? { label: t("roundedUp"), value: formatFu(answer) }
      : undefined,
  };
}
