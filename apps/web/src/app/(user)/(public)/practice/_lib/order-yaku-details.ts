import type { YakuDetail } from "@mahjong-scoring/core";

/**
 * 役ではない加算。役の後ろに、この配列の順で置く
 *
 * ドラは役ではないので、どこに並べ替えても最後に数える。手牌を見て役を
 * 拾い、最後にドラを足す——という数え方の順に読める並びにする。
 */
const NON_YAKU_NAMES: readonly string[] = ["ドラ", "裏ドラ"];

/** 役の並び順の一覧に無い役名を、位置決めのために読み替える表 */
const POSITION_ALIASES: Readonly<Record<string, string>> = {
  // 並び順の一覧（役選択の選択肢）は立直に一本化していて、ダブル立直を持たない
  ダブル立直: "立直",
};

/**
 * 役牌の内訳名（風牌の役牌）
 *
 * 内訳は成立した理由で名前が付く（場風・自風・その両方）が、並び順の一覧は
 * 牌で並んでいる（役牌 東 など）。どの牌だったかは内訳からは分からないため、
 * 役牌のかたまりの先頭に寄せる。
 */
const YAKUHAI_ALIASES: ReadonlySet<string> = new Set([
  "場風牌",
  "自風牌",
  "連風牌",
]);

/** 並び順の一覧における役牌の接頭辞（例: "役牌 白"） */
const YAKUHAI_PREFIX = "役牌 ";

/**
 * 役の内訳をユーザーが設定した役の並び順に整える
 * 役内訳並べ替え
 *
 * 内訳はライブラリが役を判定した順（手牌の解釈に依存する）で返るため、
 * 同じ立直でも問題ごとに現れる位置が変わる。結果を続けて読むときに
 * 目が迷うので、役選択練習の選択肢と同じ並び——既定は実戦での出現率順、
 * ユーザーが並び替えていればその並び——に載せ替える。
 *
 * 並び順の一覧に無い名前（ドラ・裏ドラ・風牌の役牌・ダブル立直）は、
 * 一覧の中の対応する位置に寄せる（{@link POSITION_ALIASES} /
 * {@link YAKUHAI_ALIASES}）。どこにも寄せられない名前は役の最後・ドラの
 * 手前に、元の順のまま置く。
 *
 * @param details - 出題が持つ役の内訳
 * @param yakuOrder - 表示に使う役の並び（`useYakuOrder` の戻り値）
 */
export function orderYakuDetails(
  details: readonly YakuDetail[],
  yakuOrder: readonly string[],
): readonly YakuDetail[] {
  /** 役牌のかたまりの先頭。役牌が並びに無ければ末尾扱いにする */
  const yakuhaiRank = (() => {
    const index = yakuOrder.findIndex((name) =>
      name.startsWith(YAKUHAI_PREFIX),
    );
    return index === -1 ? yakuOrder.length : index;
  })();

  const rankOf = (name: string): number => {
    const nonYakuIndex = NON_YAKU_NAMES.indexOf(name);
    if (nonYakuIndex !== -1) return yakuOrder.length + 1 + nonYakuIndex;

    const index = yakuOrder.indexOf(POSITION_ALIASES[name] ?? name);
    if (index !== -1) return index;
    if (YAKUHAI_ALIASES.has(name)) return yakuhaiRank;

    return yakuOrder.length;
  };

  // 同じ順位のもの（役牌のかたまり等）は元の順のまま残す（sort は安定）
  return [...details].sort((a, b) => rankOf(a.name) - rankOf(b.name));
}
