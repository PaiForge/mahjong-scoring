import {
  YAKU_HAN_ENTRIES,
  calculateKoScore,
  calculateOyaScore,
  type Fu,
  type Role,
  type RoleScore,
} from "@mahjong-scoring/core";

/**
 * 門前の役の組み合わせの翻数を数える
 * 門前の翻数
 *
 * 翻数は core の `YAKU_HAN_ENTRIES`（教本の翻数表・役翻数練習と同じ一覧）の
 * 門前の翻数を足す。役名が一覧に無いのは定義の誤り。
 *
 * @param yaku 役名
 */
export function sumMenzenHan(yaku: readonly string[]): number {
  return yaku.reduce((total, name) => {
    const entry = YAKU_HAN_ENTRIES.find((candidate) => candidate.name === name);
    if (entry === undefined) {
      throw new Error(`YAKU_HAN_ENTRIES に ${name} がない`);
    }
    return total + entry.menzenHan;
  }, 0);
}

/**
 * 立場・翻数・符から点数（ロン・ツモの支払い）を引く
 * 立場別点数
 *
 * 教本の点数表と同じ core の計算。
 */
export function scoreOf(role: Role, han: number, fu: Fu): RoleScore {
  return role === "oya"
    ? calculateOyaScore(han, fu)
    : calculateKoScore(han, fu);
}
