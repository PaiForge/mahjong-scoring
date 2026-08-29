import Link from "next/link";

import { beltClass, beltForegroundClass } from "@/lib/ranks/belt-colors";
import type { RankSlug } from "@/lib/ranks/registry";

import { BeltIcon } from "./icons/belt-icon";

interface BeltPillProps {
  /** 表示する段級位 */
  readonly slug: RankSlug;
  /** 段級位の表示名（`ranks.names.*`） */
  readonly label: string;
  /** 指定するとリンクになる。押した先は段級位の説明が読める場所 */
  readonly href?: string;
  /**
   * リンクにしたときのアクセシブル名。級名だけでは行き先が読めない場所
   * （練習カードの中に「4級」とだけ書かれた pill が置かれている等）で
   * 「4級 昇級試験」のように補う。可視ラベルの級名を含めること。
   */
  readonly ariaLabel?: string;
}

const PILL_CLASSES =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold";

/**
 * 段級位ピル
 *
 * 帯色で塗った pill に帯アイコンと級名を白抜きで載せる。すでにある別の物
 * （プロフィールの名前・練習カード）に段級位を「添える」場で使う。
 *
 * 段級位そのものを 1 つの図として見せる場（道場の「現在の段級位」・結果
 * ページの昇級バナー）は `BeltBadge` の方を使う。あちらは名前を持たない円で、
 * 大きく掲げて主役にするためのもの。こちらは名前まで含めて 1 つのラベルに
 * なり、添えものとして小さく置ける。
 *
 * 帯バッジと同じ理由でこのアプリ既定の太枠（`border-3 border-ink`）を付け
 * ない。枠の ink は緑で、帯色の pill を縁取ると緑の輪が帯の一部に見え、
 * 5級（オレンジ）が「緑帯」に読めてしまう。
 */
export function BeltPill({ slug, label, href, ariaLabel }: BeltPillProps) {
  const className = `${PILL_CLASSES} ${beltClass(slug)} ${beltForegroundClass(slug)}`;

  if (href === undefined) {
    return (
      <span data-belt-slug={slug} className={className}>
        <BeltIcon className="size-3.5" />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      data-belt-slug={slug}
      className={`${className} transition-opacity hover:opacity-85`}
    >
      <BeltIcon className="size-3.5" />
      {label}
    </Link>
  );
}
