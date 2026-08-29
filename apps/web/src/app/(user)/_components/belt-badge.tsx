import { beltClass, beltForegroundClass } from "@/lib/ranks/belt-colors";
import type { RankSlug } from "@/lib/ranks/registry";

import { BeltIcon } from "./icons/belt-icon";

interface BeltBadgeProps {
  /** 表示する段級位。未取得（無級）なら undefined */
  readonly slug: RankSlug | undefined;
  /** 円の大きさ（既定: md） */
  readonly size?: "md" | "lg";
}

const CIRCLE_SIZE_CLASS = { md: "size-12", lg: "size-16" } as const;
const ICON_SIZE_CLASS = { md: "size-6", lg: "size-8" } as const;

/**
 * 段級位の帯バッジ
 * 帯バッジ
 *
 * 帯色で塗った円に帯アイコンを白抜きで載せる。段級位そのものを 1 つの
 * 図として見せる場（道場の「現在の段級位」・結果ページの昇級バナー）で使う。
 *
 * 帯色をアイコンの線だけに乗せると、線画は面積が小さく色がほとんど見えない
 * （参考プロジェクトが同じ問題を踏んでいる）。円の塗りを帯色にして紋章を
 * 白で抜くことで、級の色が主役になる。無級は淡いグレーの円 + グレーの紋章で、
 * 「まだ色が付いていない」ことが読み取れる。
 *
 * このアプリの太枠（`border-3 border-ink`）はここでは付けない。枠の ink は
 * 緑で、帯色の円を縁取ると緑の輪が帯の一部に見え、5級（オレンジ）が
 * 「緑帯」に読めてしまう。色そのものが情報である以上、輪郭より色の純度を
 * 優先する。
 *
 * 段級位名は添えない。名前をどう見せるか（見出し・ピル・文中）は場ごとに
 * 違うため、呼び出し側が持つ。
 */
export function BeltBadge({ slug, size = "md" }: BeltBadgeProps) {
  return (
    <span
      aria-hidden="true"
      data-belt-slug={slug ?? "unranked"}
      className={`inline-flex items-center justify-center rounded-full ${CIRCLE_SIZE_CLASS[size]} ${beltClass(slug)}`}
    >
      <BeltIcon
        className={`${ICON_SIZE_CLASS[size]} ${beltForegroundClass(slug)}`}
      />
    </span>
  );
}
