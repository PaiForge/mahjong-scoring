import {
  calculateScoreForTehai,
  validateTehai14,
  type MentsuHouraStructure,
  type Tehai,
} from "@pai-forge/riichi-mahjong";
import type { AgariContext } from "../problem/shared/agari-context";

/**
 * 手牌から「4面子1雀頭」の分割表示に使える構造を解決する
 * 面子構造解決
 *
 * 同一手牌でも面子分解は一意ではなく（例: 111222333 は暗刻3つとも
 * 順子3つとも割れる）、解釈により符が変わる。独自に分解すると符内訳
 * （convertScoreDetailToFuDetails）と食い違う分割を表示しかねないため、
 * ライブラリが点数計算で採用した {@link MentsuHouraStructure} を
 * そのまま返す。
 *
 * ドラは全ての構造解釈で同数となり構造の選択に影響しないため、
 * 入力に取らない。
 *
 * 面子手でない場合（七対子・国士無双）と、手牌が14枚でない・点数計算が
 * 成立しない場合は undefined を返す。呼び出し側は分割表示自体を諦める。
 */
export function resolveMentsuStructure(
  tehai: Readonly<Tehai>,
  context: AgariContext,
): MentsuHouraStructure | undefined {
  const tehai14 = validateTehai14(tehai);
  if (tehai14.isErr()) return undefined;

  try {
    const { detail } = calculateScoreForTehai(tehai14.value, {
      agariHai: context.agariHai,
      isTsumo: context.isTsumo,
      jikaze: context.jikaze,
      bakaze: context.bakaze,
      doraMarkers: [],
    });
    if (detail?.structure.type !== "Mentsu") return undefined;
    return detail.structure;
  } catch {
    // 役なし等で点数計算が成立しない手牌。分割表示だけを諦める
    return undefined;
  }
}
