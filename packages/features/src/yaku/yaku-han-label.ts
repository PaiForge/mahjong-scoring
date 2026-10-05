import { YAKUMAN_HAN } from "@mahjong-scoring/core";

/**
 * {@link yakuHanLabel} が引く翻訳
 *
 * `yakuman`（役満）と `hanUnit`（{count}翻）を持つ名前空間なら何でも渡せる。
 * 役一覧（`yaku.learn`）と役早見表（`reference.yaku`）が該当する。
 */
type HanLabelTranslator = (
  key: "yakuman" | "hanUnit",
  values?: { readonly count: number },
) => string;

/**
 * 役の翻数を見出しの文言にする
 * 役翻数ラベル
 *
 * 役満は「13翻」ではなく「役満」と呼ぶ。翻数として数えることはできても、
 * 役の一覧で 13 という数字を見出しに出しても読み手には何の区分か伝わらない。
 * 役一覧と役早見表のどちらもこの言い換えをするので、対応はここで 1 つに決める。
 *
 * @param han - 門前の翻数
 * @param t - `yakuman` / `hanUnit` を持つ名前空間の翻訳関数
 */
export function yakuHanLabel(han: number, t: HanLabelTranslator): string {
  return han === YAKUMAN_HAN ? t("yakuman") : t("hanUnit", { count: han });
}
