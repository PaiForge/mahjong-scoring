import {
  sortTehai,
  validateTehai14,
  type CompletedMentsu,
  type HaiKindId,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";

/**
 * テスト用の和了形の手牌を組む
 * テスト用手牌
 *
 * 固定値から組むので検証は失敗しない前提で、通らなければ投げる（テストの
 * 書き間違いを黙って通さない）。出題と同じく理牌して返す — 牌を面子ごとに
 * 書いても、盤面に載る順になる。副露は省略できる。
 *
 * テスト専用。`*.test.ts` からだけ読む。
 */
export function tehaiOf(input: {
  readonly closed: readonly HaiKindId[];
  readonly exposed?: readonly CompletedMentsu[];
}): Tehai14 {
  const result = validateTehai14({
    closed: [...input.closed],
    exposed: [...(input.exposed ?? [])],
  });
  if (result.isErr()) throw new Error("テスト用の手牌が不正");
  return sortTehai(result.value);
}
