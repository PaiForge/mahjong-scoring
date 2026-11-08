import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 風牌の日本語名マップ
 * 風牌名称マップ
 */
const KAZE_NAMES: Readonly<Record<Kazehai, string>> = {
  [HaiKind.Ton]: "東",
  [HaiKind.Nan]: "南",
  [HaiKind.Sha]: "西",
  [HaiKind.Pei]: "北",
};

/**
 * 風牌の英語キー名マップ（YAKU_NAME_MAP参照用）
 * 風牌キー名マップ
 */
const KAZE_KEYS: Readonly<Record<Kazehai, string>> = {
  [HaiKind.Ton]: "Ton",
  [HaiKind.Nan]: "Nan",
  [HaiKind.Sha]: "Sha",
  [HaiKind.Pei]: "Pei",
};

/**
 * 風の名前の辞書キー（`common.kazeNames.<key>`）
 * 風名キー
 */
export type KazeNameKey = "ton" | "nan" | "sha" | "pei";

/** 風牌から {@link KazeNameKey} への対応 */
const KAZE_NAME_KEYS: Readonly<Record<Kazehai, KazeNameKey>> = {
  [HaiKind.Ton]: "ton",
  [HaiKind.Nan]: "nan",
  [HaiKind.Sha]: "sha",
  [HaiKind.Pei]: "pei",
};

/**
 * 風牌の日本語名を取得
 * 風牌名称（Kazehai → 日本語）
 *
 * 日本語固定の読み手（モバイル・レッスンの確認問題）のために残す。言語ごとに
 * 描く側は {@link kazeNameKey} で辞書（`common.kazeNames.<key>`）を引く。
 */
export function getKazeName(kaze: Kazehai): string {
  return KAZE_NAMES[kaze] ?? "";
}

/**
 * 風牌から風の名前の辞書キーを引く
 * 風名キー取得
 *
 * 辞書の `common.kazeNames.<key>` の日本語の値は {@link getKazeName} と同じ文字列
 * （東・南・西・北）。features の `kaze-context-label.test.ts` が一致を固定する。
 *
 * @param kaze - 風牌
 */
export function kazeNameKey(kaze: Kazehai): KazeNameKey {
  return KAZE_NAME_KEYS[kaze];
}

/**
 * 自風が東（親）かどうかを判定する
 * 親判定
 */
export function isOya(jikaze: Kazehai): boolean {
  return jikaze === HaiKind.Ton;
}

/**
 * 風牌の英語キー名を取得する（YAKU_NAME_MAP参照用）
 * 風牌キー名取得
 */
export function getKeyForKazehai(kaze: Kazehai): string {
  return KAZE_KEYS[kaze] ?? "";
}
