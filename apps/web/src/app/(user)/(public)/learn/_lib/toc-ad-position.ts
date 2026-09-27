/**
 * 目次のセクションの後に置く広告の番号。置かないセクションは undefined
 * 目次広告の位置
 *
 * 広告どうしの間隔を 1, 2, 3 セクションと広げていく（0 始まりで 0, 2, 5 番目の
 * セクションの後）。目次の頭は広告を近くに置いて目に入れ、読み進めるほど
 * 間を空けて章の並びを途切れさせないため。
 *
 * k 番目（0 始まり）の広告は、それまでの間隔 1 + 2 + … + k の和だけ
 * 1 本目から後ろに下がる。つまり k + k(k + 1)/2 = k(k + 3)/2 番目の
 * セクションの後に置く。
 *
 * @param sectionIndex セクションの番号（0 始まり）
 * @returns 何本目の広告を置くか（0 始まり）
 */
export function tocAdIndexAfterSection(
  sectionIndex: number,
): number | undefined {
  for (let k = 0; ; k++) {
    const position = (k * (k + 3)) / 2;
    if (position === sectionIndex) return k;
    if (position > sectionIndex) return undefined;
  }
}
