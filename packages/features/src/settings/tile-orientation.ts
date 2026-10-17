/**
 * 手牌の向き
 * 牌の向き設定
 *
 * 練習の盤面で手牌の各牌を、すべて正規の向きで出すか、実卓のように上下逆さの
 * 牌を混ぜて出すか。出題・正解判定・採点には関わらない見え方の設定。
 *
 * - `upright` — すべて正規の向き（既定。従来の表示）
 * - `random` — 牌ごとに上下をランダムにする（Pro の `practice_tools` 特典）
 */
export type TileOrientationMode = "upright" | "random";

/** 従来の表示を既定にする */
export const DEFAULT_TILE_ORIENTATION: TileOrientationMode = "upright";

/**
 * 永続値を手牌の向きに正規化する
 * 牌の向き正規化
 *
 * 保存値は端末のストレージから来るため、欠損・未知の値・型違いがありうる。
 * どれも既定（`upright`）に倒す。
 *
 * @param value 永続化されていた値
 */
export function normalizeTileOrientation(value: unknown): TileOrientationMode {
  return value === "random" ? "random" : DEFAULT_TILE_ORIENTATION;
}
