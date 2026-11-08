/**
 * 牌の名前の辞書キー（`common.tileNames.<キー>`）の再 export
 *
 * 対応表は web とアプリで共有するため `@mahjong-scoring/features/tiles/tile-name-key`
 * に置き、ここは web の既存の import（`./_lib/tile-alt`）を保つための入口だけにする。
 * 表をここに書き戻さない（web とアプリで 2 つの表が食い違う）。
 */
export {
  tileNameKey,
  type TileNameKey,
} from "@mahjong-scoring/features/tiles/tile-name-key";
