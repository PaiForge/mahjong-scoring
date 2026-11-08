import type { FuDetail, FuReasonSpec } from "@mahjong-scoring/core";

/**
 * `challenge.fuBreakdown` 名前空間の翻訳関数（`useTranslations` / `getTranslations` の戻り値のうち、ここで使う形）
 */
export type FuReasonTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * 符の理由の文言を辞書から組む入力
 *
 * `spec` を省略可能にしているのは、構造を足す前に保存された内訳
 * （sessionStorage・DB に残る `reason` と `fu` だけの行）も読むため。
 */
export type FuReasonLabelInput = Pick<FuDetail, "reason"> & {
  readonly spec?: FuReasonSpec;
};

/** `select` に渡す真偽値（ICU の `select` は文字列で分岐する） */
function yesNo(value: boolean): "yes" | "no" {
  return value ? "yes" : "no";
}

/**
 * 符の理由の文言
 * 符理由表示
 *
 * core の内訳（`FuDetail`）は日本語の文言（`reason`）と、言語に依らない構造
 * （`spec`）の両方を持つ。英語のページに漢字を残さないため、描く側はこれを通して
 * 辞書の `challenge.fuBreakdown.reasons.*` から文言を組む。日本語の辞書の値は
 * core の `formatFuReasonJa` と同じ文字列になるよう書いてあり、
 * `fu-reason-label.test.ts` が一致を固定する（日本語の表示は変わらない）。
 *
 * `spec` を持たない行（構造を足す前に保存された内訳）は、`reason` をそのまま返す。
 *
 * 例: reasons.mentsu（`{ yaochu, open, kantsu }` は yes / no）・reasons.jantou
 * （`{ reasons }` は reasons.jantouReasons.<key> を reasons.jantouReasonSeparator で
 * 結んだもの）・reasons.machi（`{ machi }` は tanki / kanchan / penchan / other）
 *
 * @param detail - 符の内訳の 1 行
 * @param t - `challenge.fuBreakdown` 名前空間の翻訳関数
 */
export function fuReasonLabel(
  detail: FuReasonLabelInput,
  t: FuReasonTranslator,
): string {
  const { spec } = detail;
  if (spec === undefined) return detail.reason;

  switch (spec.kind) {
    case "futei":
    case "chiitoitsu":
    case "pinfuTsumo":
    case "tsumo":
    case "menzenRon":
    case "kuiPinfu":
      // 例: reasons.futei / reasons.kuiPinfu（完成形のキーで grep したときにここへ着地させるための例）
      return t(`reasons.${spec.kind}`);
    case "mentsu":
      return t("reasons.mentsu", {
        yaochu: yesNo(spec.yaochu),
        open: yesNo(spec.open),
        kantsu: yesNo(spec.kantsu),
      });
    case "jantou": {
      const reasons = spec.reasons
        // 例: reasons.jantouReasons.bakaze（完成形のキーで grep したときにここへ着地させるための例）
        .map((key) => t(`reasons.jantouReasons.${key}`))
        .join(t("reasons.jantouReasonSeparator"));
      return t("reasons.jantou", { reasons });
    }
    case "machi":
      return t("reasons.machi", { machi: spec.machi });
  }
}
