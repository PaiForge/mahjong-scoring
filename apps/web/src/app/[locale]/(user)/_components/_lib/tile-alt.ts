import { HaiKind, type HaiKindId } from "@mahjong-scoring/core";

/**
 * 牌の名前の辞書キー（`common.tileNames.<キー>`）
 * 牌名キー
 *
 * 数牌は「色の頭文字 + 数」（`m1` = 一萬・`p5` = 五筒・`s9` = 九索）、字牌は読み
 * （`ton` = 東 … `chun` = 中）。MPSZ 表記の牌の書き方に寄せ、辞書のキーから牌が読めるようにする。
 */
export type TileNameKey =
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "m5"
  | "m6"
  | "m7"
  | "m8"
  | "m9"
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "p5"
  | "p6"
  | "p7"
  | "p8"
  | "p9"
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "s6"
  | "s7"
  | "s8"
  | "s9"
  | "ton"
  | "nan"
  | "sha"
  | "pei"
  | "haku"
  | "hatsu"
  | "chun";

/**
 * 牌種 ID → 辞書キーの表。`satisfies Record<HaiKindId, …>` で 34 種の網羅を型が保証する
 * （牌種が増減したらここが型エラーになる）。
 */
const TILE_NAME_KEYS = {
  [HaiKind.ManZu1]: "m1",
  [HaiKind.ManZu2]: "m2",
  [HaiKind.ManZu3]: "m3",
  [HaiKind.ManZu4]: "m4",
  [HaiKind.ManZu5]: "m5",
  [HaiKind.ManZu6]: "m6",
  [HaiKind.ManZu7]: "m7",
  [HaiKind.ManZu8]: "m8",
  [HaiKind.ManZu9]: "m9",
  [HaiKind.PinZu1]: "p1",
  [HaiKind.PinZu2]: "p2",
  [HaiKind.PinZu3]: "p3",
  [HaiKind.PinZu4]: "p4",
  [HaiKind.PinZu5]: "p5",
  [HaiKind.PinZu6]: "p6",
  [HaiKind.PinZu7]: "p7",
  [HaiKind.PinZu8]: "p8",
  [HaiKind.PinZu9]: "p9",
  [HaiKind.SouZu1]: "s1",
  [HaiKind.SouZu2]: "s2",
  [HaiKind.SouZu3]: "s3",
  [HaiKind.SouZu4]: "s4",
  [HaiKind.SouZu5]: "s5",
  [HaiKind.SouZu6]: "s6",
  [HaiKind.SouZu7]: "s7",
  [HaiKind.SouZu8]: "s8",
  [HaiKind.SouZu9]: "s9",
  [HaiKind.Ton]: "ton",
  [HaiKind.Nan]: "nan",
  [HaiKind.Sha]: "sha",
  [HaiKind.Pei]: "pei",
  [HaiKind.Haku]: "haku",
  [HaiKind.Hatsu]: "hatsu",
  [HaiKind.Chun]: "chun",
} as const satisfies Record<HaiKindId, TileNameKey>;

/**
 * 牌種 ID を牌の名前の辞書キーに写す
 * 牌名キー変換
 *
 * 牌画像（`@pai-forge/mahjong-react-ui` の `Hai`）の `alt` を英語のページで英語の牌名に
 * するために使う（`LocaleHai`）。ライブラリの `alt` の既定は日本語の `getHaiName`
 * （一萬・東 …）だけで言語の口が無いので、web 側で辞書（`common.tileNames`）を引く。
 * 日本語の辞書の値は `getHaiName` と同じ文字列にしてあり（テストが 34 種すべてで固定）、
 * 日本語のページの `alt` はこの表を経由しても変わらない。
 *
 * @param hai - 牌種 ID（0〜33）
 * @returns `common.tileNames` のキー（例: `m1`・`ton`）
 */
export function tileNameKey(hai: HaiKindId): TileNameKey {
  return TILE_NAME_KEYS[hai];
}
