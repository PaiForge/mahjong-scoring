/**
 * 役一覧（早見表）内の各役へのアンカー。
 *
 * 教本（`/learn/yaku`）の翻数別まとめから特定の役へ直接リンクするために使う。
 * 役は今後増減するため、リンク側で `/reference/yaku#...` を直接書かず
 * ここの関数を経由させ、id とリンク先がずれないようにする。
 */

/** 役カードの id（例: `yaku-混一色`）。役名は日本語のまま使う。 */
export function yakuAnchorId(yakuName: string): string {
  return `yaku-${yakuName}`;
}

/** 役一覧の特定の役への href（例: `/reference/yaku#yaku-%E6%B7%B7%E4%B8%80%E8%89%B2`）。 */
export function referenceYakuHref(yakuName: string): string {
  return `/reference/yaku#${encodeURIComponent(yakuAnchorId(yakuName))}`;
}
