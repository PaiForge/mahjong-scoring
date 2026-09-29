/**
 * 同じタイトルの広告のまとまり — 1 冊の本の、スロットごとの行
 * タイトル別広告
 *
 * 同じ本は、成果をスロットごとに分けるためにスロットの数だけ別の行になる
 * （`AD_SLOTS` の TSDoc 参照）が、行き先の商品ページは同じ。リンクの差し替えや
 * 掲載の開始・停止を行ごとに繰り返すと、1 か所の貼り忘れで 1 画面だけ古い
 * リンクが残る。まとめて扱えるよう、行をタイトルで束ねる。
 *
 * 束ねる鍵は既定ロケール（ja）のタイトル。`ad_creatives` は商品の識別子を
 * 持たず、ja のタイトルはどの広告も必ず持つ唯一の文言（DB の CHECK）。
 * 別の商品が同じタイトルだと 1 つに束ねられてしまうため、一括更新の画面は
 * 適用前にまとまりが含むスロットをすべて見せる。
 *
 * ASIN で指す行（Amazon の本）はリンクを持たず、トラッキング ID と組み立てる
 * ため、一括で書き換えるリンクは無い（`asins` に数えるだけ）。URL を持つ行の
 * リンクが揃っていなければ、画面は「リンクが揃っていない」ことを示す
 * （`hrefs` が 2 つ以上）。
 */
export interface CreativeTitleGroup {
  readonly title: string;
  readonly creativeIds: readonly string[];
  /** まとまりの行があるスロット（最初に現れた順、重複なし） */
  readonly slots: readonly string[];
  readonly activeCount: number;
  /** URL を持つ行のリンク（重複なし）。1 つなら揃っている */
  readonly hrefs: readonly string[];
  /** URL を持つ行の数 */
  readonly hrefCount: number;
  /** ASIN で指す行の ASIN（重複なし） */
  readonly asins: readonly string[];
}

interface GroupableCreative {
  readonly id: string;
  readonly slot: string;
  readonly href: string | null;
  readonly asin: string | null;
  readonly isActive: boolean;
  /** 既定ロケールのタイトル。空なら束ねない */
  readonly title: string;
}

/**
 * 広告をタイトルで束ねる（タイトル順）
 * タイトル別集約
 */
export function groupCreativesByTitle(
  creatives: readonly GroupableCreative[],
): CreativeTitleGroup[] {
  const groups = new Map<
    string,
    {
      title: string;
      creativeIds: string[];
      slots: string[];
      activeCount: number;
      hrefs: string[];
      hrefCount: number;
      asins: string[];
    }
  >();
  for (const creative of creatives) {
    // タイトルの無い行は保存時の検証が許さない。束ねる鍵が無いので飛ばし、
    // 個別の編集画面で直してもらう
    if (creative.title === "") continue;
    const group = groups.get(creative.title) ?? {
      title: creative.title,
      creativeIds: [],
      slots: [],
      activeCount: 0,
      hrefs: [],
      hrefCount: 0,
      asins: [],
    };
    group.creativeIds.push(creative.id);
    if (!group.slots.includes(creative.slot)) group.slots.push(creative.slot);
    if (creative.isActive) group.activeCount += 1;
    if (creative.href !== null) {
      group.hrefCount += 1;
      if (!group.hrefs.includes(creative.href)) group.hrefs.push(creative.href);
    }
    if (creative.asin !== null && !group.asins.includes(creative.asin)) {
      group.asins.push(creative.asin);
    }
    groups.set(creative.title, group);
  }
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title));
}
