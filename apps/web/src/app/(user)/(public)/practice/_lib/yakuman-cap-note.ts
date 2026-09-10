import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";

/** `challenge.yakuBreakdown` の翻訳関数（`han` の件数補間を含む） */
type YakuBreakdownTranslator = (
  key: string,
  values?: Record<string, number>,
) => string;

/**
 * 翻数の内訳の合計が支払いに反映されない分の注記を組み立てる
 * 役満止まり注記
 *
 * 役満手に役牌・リーチの翻が乗った手や、合算しない設定の複合役満では、
 * 内訳の合計（例: 26翻）が支払い（役満1つ分）を超える。内訳をそのまま
 * 信じて点数を引くと合わないため、「26翻 → 役満」の形で打ち止め先を示す。
 * 翻数の内訳（{@link import("../_components/yaku-breakdown").YakuBreakdown}）
 * の `note` に渡す。結果ページの問題別詳細と模試の答え合わせの両方から使い、
 * 同じ手に別の注記が付かないようにする。
 *
 * 打ち止め先は役満単位（`yakumanMultiplier`）から導く。単位を保存する前の
 * 旧データでは判定できないため注記を出さない。
 *
 * @param yakuDetails - 役の内訳（ドラ・裏ドラを含む）。旧データでは無い
 * @param yakumanMultiplier - 支払いが役満何個分か（0 = 役満役なし）。旧データでは無い
 * @param t - `challenge.yakuBreakdown` の翻訳関数
 */
export function buildYakumanCapNote(
  yakuDetails: readonly YakuDetail[] | undefined,
  yakumanMultiplier: number | undefined,
  t: YakuBreakdownTranslator,
): string | undefined {
  if (yakumanMultiplier === undefined || yakuDetails === undefined) {
    return undefined;
  }
  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);

  // 支払いに対応する翻数（役満13翻 × 単位。数え役満は役満1つ分）
  const capHan = YAKUMAN_HAN * Math.max(yakumanMultiplier, 1);
  if (rawTotal <= capHan || rawTotal < YAKUMAN_HAN) return undefined;

  const capLabel = yakumanMultiplier >= 2 ? t("doubleYakuman") : t("yakuman");
  const note = `${t("han", { count: rawTotal })} → ${capLabel}`;
  return yakumanMultiplier >= 2 ? note : `${note}（${t("cappedNote")}）`;
}
