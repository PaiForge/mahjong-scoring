import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

/**
 * 数牌・字牌の MPSZ 記法から牌IDの配列へ変換するためのルックアップ
 * 字牌(z): 1=東 2=南 3=西 4=北 5=白 6=發 7=中
 */
const SUIT_TILES: Readonly<Record<string, readonly HaiKindId[]>> = {
  m: [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.ManZu8,
    HaiKind.ManZu9,
  ],
  p: [
    HaiKind.PinZu1,
    HaiKind.PinZu2,
    HaiKind.PinZu3,
    HaiKind.PinZu4,
    HaiKind.PinZu5,
    HaiKind.PinZu6,
    HaiKind.PinZu7,
    HaiKind.PinZu8,
    HaiKind.PinZu9,
  ],
  s: [
    HaiKind.SouZu1,
    HaiKind.SouZu2,
    HaiKind.SouZu3,
    HaiKind.SouZu4,
    HaiKind.SouZu5,
    HaiKind.SouZu6,
    HaiKind.SouZu7,
    HaiKind.SouZu8,
    HaiKind.SouZu9,
  ],
  z: [
    HaiKind.Ton,
    HaiKind.Nan,
    HaiKind.Sha,
    HaiKind.Pei,
    HaiKind.Haku,
    HaiKind.Hatsu,
    HaiKind.Chun,
  ],
};

/**
 * MPSZ 記法の文字列を牌IDの配列に変換する
 * 牌記法パース
 *
 * 例: "234m234p234s678m55z" → 三色同順 + 678m + 白対子
 *
 * 数字を読み進め、花色文字（m/p/s/z）が現れた時点で
 * それまでの数字をその花色の牌として確定する。
 *
 * @throws 不正な花色文字・数字（z は 1〜7、数牌は 1〜9）の場合
 */
export function parseTiles(notation: string): readonly HaiKindId[] {
  const tiles: HaiKindId[] = [];
  let digits = "";

  for (const char of notation) {
    if (char >= "0" && char <= "9") {
      digits += char;
      continue;
    }

    const suit = SUIT_TILES[char];
    if (suit === undefined) {
      throw new Error(`Invalid suit character in notation: "${char}"`);
    }
    if (digits.length === 0) {
      throw new Error(
        `Suit "${char}" has no preceding digits in: "${notation}"`,
      );
    }

    for (const digit of digits) {
      const index = Number(digit) - 1;
      const tile = suit[index];
      if (tile === undefined) {
        throw new Error(`Invalid tile ${digit}${char} in: "${notation}"`);
      }
      tiles.push(tile);
    }
    digits = "";
  }

  if (digits.length > 0) {
    throw new Error(`Trailing digits without suit in: "${notation}"`);
  }

  return tiles;
}
