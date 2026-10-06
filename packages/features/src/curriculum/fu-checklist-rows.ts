/**
 * 符が付く場所（手牌の符の章のチェックリストの行）
 * 符チェックリスト
 *
 * 和了の状況だけで決まる符（副底・門前ロンの加符・ツモ符）を先に置き、
 * 手牌を見て数える符（待ち・雀頭・面子）を後に置く。数える順番そのものは
 * 読者に委ねているので、この並びは覚える順の目安でしかない。
 * 各行は `learnCurriculum` の辞書キーになる。
 */
export const FU_CHECKLIST_ROWS = [
  "futei",
  "menzenRon",
  "tsumo",
  "machi",
  "jantou",
  "mentsu",
] as const;
