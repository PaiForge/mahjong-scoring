import { AD_PLATFORMS, type AdPlatform } from "@/lib/ads/registry";

/**
 * 同じタイトルの広告のまとまりのうち、片方のプラットフォーム（web / アプリ）の行
 * タイトル別広告（プラットフォーム別）
 *
 * ASIN で指す行（Amazon の本）はリンクを持たず、トラッキング ID と組み立てる
 * ため、一括で書き換えるリンクは無い（`asins` に数えるだけ）。URL を持つ行の
 * リンクが揃っていなければ、画面は「リンクが揃っていない」ことを示す
 * （`hrefs` が 2 つ以上）。
 */
export interface CreativeTitleGroupSide {
  readonly platform: AdPlatform;
  /** 行の数 */
  readonly total: number;
  /** 行があるスロット（最初に現れた順、重複なし） */
  readonly slots: readonly string[];
  readonly activeCount: number;
  /** URL を持つ行のリンク（重複なし）。1 つなら揃っている */
  readonly hrefs: readonly string[];
  /** URL を持つ行の数 */
  readonly hrefCount: number;
  /** ASIN で指す行の ASIN（重複なし） */
  readonly asins: readonly string[];
}

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
 * @design まとまりの中を web とアプリに分ける
 * 掲載 / 停止は両方まとめて行うことが多いので、まとまり全体にも操作を置く。
 * リンクはトラッキング ID がプラットフォームごとに違う（成果を分けるため）
 * ので、プラットフォームごと（`sides`）にしか貼らない — まとめて貼ると、
 * web の ID のリンクがアプリの行にも入る。
 */
export interface CreativeTitleGroup {
  readonly title: string;
  /** 行の数（両方のプラットフォームの合計） */
  readonly total: number;
  readonly activeCount: number;
  /** 行のあるプラットフォームだけ。`AD_PLATFORMS` の順 */
  readonly sides: readonly CreativeTitleGroupSide[];
}

interface GroupableCreative {
  readonly id: string;
  readonly slot: string;
  readonly platform: AdPlatform;
  readonly href: string | null;
  readonly asin: string | null;
  readonly isActive: boolean;
  /** 既定ロケールのタイトル。空なら束ねない */
  readonly title: string;
}

interface MutableSide {
  total: number;
  slots: string[];
  activeCount: number;
  hrefs: string[];
  hrefCount: number;
  asins: string[];
}

function emptySide(): MutableSide {
  return {
    total: 0,
    slots: [],
    activeCount: 0,
    hrefs: [],
    hrefCount: 0,
    asins: [],
  };
}

/**
 * 広告をタイトルで束ねる（タイトル順）
 * タイトル別集約
 */
export function groupCreativesByTitle(
  creatives: readonly GroupableCreative[],
): CreativeTitleGroup[] {
  const groups = new Map<string, Map<AdPlatform, MutableSide>>();
  for (const creative of creatives) {
    // タイトルの無い行は保存時の検証が許さない。束ねる鍵が無いので飛ばし、
    // 個別の編集画面で直してもらう
    if (creative.title === "") continue;
    const sides =
      groups.get(creative.title) ?? new Map<AdPlatform, MutableSide>();
    const side = sides.get(creative.platform) ?? emptySide();
    side.total += 1;
    if (!side.slots.includes(creative.slot)) side.slots.push(creative.slot);
    if (creative.isActive) side.activeCount += 1;
    if (creative.href !== null) {
      side.hrefCount += 1;
      if (!side.hrefs.includes(creative.href)) side.hrefs.push(creative.href);
    }
    if (creative.asin !== null && !side.asins.includes(creative.asin)) {
      side.asins.push(creative.asin);
    }
    sides.set(creative.platform, side);
    groups.set(creative.title, sides);
  }

  return [...groups.entries()]
    .map(([title, sides]) => {
      const ordered = AD_PLATFORMS.flatMap((platform) => {
        const side = sides.get(platform);
        return side === undefined ? [] : [{ platform, ...side }];
      });
      return {
        title,
        total: ordered.reduce((sum, side) => sum + side.total, 0),
        activeCount: ordered.reduce((sum, side) => sum + side.activeCount, 0),
        sides: ordered,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
