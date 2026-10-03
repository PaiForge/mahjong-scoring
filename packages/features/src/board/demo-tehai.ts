import { HaiKind, validateTehai14 } from "@mahjong-scoring/core";
import type { AgariContext, HaiKindId, Tehai14 } from "@mahjong-scoring/core";

/**
 * 遊び方デモ用の手牌を組み立てる
 * デモ手牌構築
 *
 * `Tehai14` はブランド型で、正規の入口は `validateTehai14` だけ。デモの牌姿は
 * コード内の固定値なので検証は必ず通るが、型を通すためだけの
 * `as unknown as Tehai14` を各デモに書かせないよう、逃げ道をここに閉じ込める。
 *
 * 牌姿を書き間違えたときに黙って描画が消えないよう、検証に失敗したら投げる
 * （固定値なので開発中に必ず気付ける）。
 */
export function buildDemoTehai(closed: readonly HaiKindId[]): Tehai14 {
  const result = validateTehai14({ closed: [...closed], exposed: [] });
  if (result.isErr()) {
    throw new Error("デモ用の手牌が 14 枚の手牌として不正です");
  }
  return result.value;
}

/**
 * 符の練習で使う共通のデモ牌姿
 * 符デモ手牌
 *
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)。
 * 手牌符（要素ごとの符）と合計符（内訳の合算）で同じ手牌を見せる。
 */
export const DEMO_FU_TEHAI = buildDemoTehai([
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.PinZu7,
  HaiKind.Chun,
  HaiKind.Chun,
  HaiKind.Chun,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.Nan,
  HaiKind.Nan,
]);

/** {@link DEMO_FU_TEHAI} の和了状況（東場・南家・七筒ツモ） */
export const DEMO_FU_CONTEXT: AgariContext = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.PinZu7,
  isTsumo: true,
};
