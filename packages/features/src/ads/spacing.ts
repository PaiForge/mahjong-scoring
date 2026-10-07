/**
 * 一覧のまとまり（セクション・分野・五十音の行）の後に置く広告の番号。
 * 置かないまとまりは undefined
 * 広告の間隔
 *
 * 広告どうしの間隔を 1, 2, 3 まとまりと広げていく（0 始まりで 0, 2, 5, 9 番目の
 * まとまりの後）。一覧の頭は広告を近くに置いて目に入れ、読み進めるほど間を
 * 空けて一覧の並びを途切れさせないため。行の広告を複数出す一覧（web・アプリの教本の目次・
 * ランキング・用語集・役一覧）が共有する。
 *
 * k 番目（0 始まり）の広告は、それまでの間隔 1 + 2 + … + k の和だけ
 * 1 本目から後ろに下がる。つまり k + k(k + 1)/2 = k(k + 3)/2 番目の
 * まとまりの後に置く。
 *
 * 何本まで出すかはスロットの枠数（web の `placementsForSlot`）が決める。番号が
 * 掲載中の広告の数を超えたまとまりには何も置かない。
 *
 * @param groupIndex 画面に出るまとまりの番号（0 始まり。空で描かない
 *   まとまりは数えない）
 * @returns 何本目の広告を置くか（0 始まり）
 */
export function adIndexAfterGroup(groupIndex: number): number | undefined {
  for (let k = 0; ; k++) {
    const position = (k * (k + 3)) / 2;
    if (position === groupIndex) return k;
    if (position > groupIndex) return undefined;
  }
}
