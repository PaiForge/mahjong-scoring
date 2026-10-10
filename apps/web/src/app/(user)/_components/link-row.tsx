import type { ReactNode } from "react";
import Link from "next/link";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ChevronRightIcon } from "./icons/chevron-right-icon";

/**
 * 行リンクのリスト枠
 * 行リンクリスト
 *
 * 既定はお知らせ一覧・ランキング一覧と同じ細枠の面（`rounded-panel border
 * border-panel`）に行を並べ、行の間を淡い実線で区切る。影は持たない — 影は
 * 「押して始める面」の記号で、読みに行くだけの行には付けない。
 *
 * 既に枠を持つ面の内側（道場の級のカード・レッスンの目標パネル）に置くときは
 * `inset` を渡す。枠を重ねると入れ子の箱が増えるため、枠を持たず区切り線だけで
 * 並べ、行の文字の左端をカードの本文とそろえる。周りが枠を持たない並び
 * （レッスンの目次）に広告の行を差し込むときも同じで、1 行だけ枠を描くと
 * そこだけ独立したカードに見える。
 *
 * 行の余白は枠の有無で変わるが、行の側（`ROW_ITEM_CLASSES` /
 * `ROW_INNER_CLASSES`）は 1 組のまま、リストの `data-framed` を見て切り替える
 * （`group-data-[framed]/rows:`）。行はサーバーコンポーネントで、親から props を
 * 配らずに済ませるため。
 */
export function LinkRowList({
  children,
  inset = false,
}: {
  readonly children: ReactNode;
  /** 枠を持つ面の内側や、枠の無い並びに混ぜるとき true（枠を描かない） */
  readonly inset?: boolean;
}) {
  return inset ? (
    <ul className="group/rows flex flex-col">{children}</ul>
  ) : (
    <ul
      data-framed=""
      className="group/rows flex flex-col overflow-hidden rounded-panel border border-panel bg-card"
    >
      {children}
    </ul>
  );
}

/** 行の外枠（淡い実線の区切り）。実物・スケルトン・広告の行（`NativeAdRow`）で共有する */
export const ROW_ITEM_CLASSES =
  "border-b border-surface-200 last:border-b-0 group-data-[framed]/rows:border-surface-100";

/**
 * 行の中身の箱。実物・スケルトン・広告の行（`NativeAdRow`）で共有する。
 *
 * 枠の無いリストでは、負のマージンで hover の面を行の左右いっぱいに広げつつ、
 * リスト自体の左端は隣の本文と揃えたままにする。枠の中では枠の内側いっぱいを
 * hover の面にし、お知らせ一覧の行と同じ左右の余白を取る。
 */
export const ROW_INNER_CLASSES =
  "-mx-2 flex gap-3 rounded-lg px-2 py-3 group-data-[framed]/rows:mx-0 group-data-[framed]/rows:rounded-none group-data-[framed]/rows:px-4 sm:group-data-[framed]/rows:px-5";

interface LinkRowProps {
  readonly href: string;
  /**
   * 行頭に置く小さな要素（アイコン・日付など）。
   * 同種のものだけが並ぶリストでは省く（全行が同じ絵文字になり情報を運ばないため）。
   */
  readonly leading?: ReactNode;
  readonly title: string;
  /** タイトルの下に置く補足。1 行に収まらない説明はここへ */
  readonly description?: string;
  /** 行末に置く要素（順位・バッジなど） */
  readonly trailing?: ReactNode;
}

/**
 * 読む・見るためのリンク 1 行
 * 行リンク
 *
 * @remarks
 * このアプリのボタン（緑の塗り・帯色の面）は「押して始める面」の記号で、
 * 練習・試験・登録のような始まりを持つ行き先が着る。ページを読みに行くだけ /
 * 一覧を見に行くだけのリンクが同じ装いをすると、画面の重み付けが重要度と
 * 一致しなくなる。そういう行き先はこの行リンクで示す。
 *
 * 行全体が押せる面だが、タイトルには常時下線を引く（`ROW_LINK_TITLE_CLASSES`）。
 * 日付や説明と並ぶ行の中では、下線が無いとただの文字に見えてリンクだと
 * 分からない。hover の色変化だけではタッチ端末で一切見えない。
 */
export function LinkRow({
  href,
  leading,
  title,
  description,
  trailing,
}: LinkRowProps) {
  return (
    <li className={ROW_ITEM_CLASSES}>
      <Link
        href={href}
        className={`group items-start transition-colors hover:bg-surface-50 ${ROW_INNER_CLASSES} ${FOCUS_RING_CLASSES}`}
      >
        {/* 行頭・行末の要素はタイトル 1 行目の行ボックス（text-sm = 20px）に
            中央揃えする。絵文字やアイコンは文字サイズで高さが変わるため、
            上端揃えのままだとタイトルとの視覚的な高さがずれる。 */}
        {leading !== undefined && (
          <span className="flex min-h-5 shrink-0 items-center">{leading}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-bold ${ROW_LINK_TITLE_CLASSES}`}>
            {title}
          </span>
          {description !== undefined && (
            <span className="mt-0.5 block text-xs text-surface-400">
              {description}
            </span>
          )}
        </span>
        {trailing !== undefined && (
          <span className="flex min-h-5 shrink-0 items-center">{trailing}</span>
        )}
        {/* 行全体が押せることを右端の矢印でも示す（お知らせ一覧の行と同じ） */}
        <span
          aria-hidden="true"
          className="flex min-h-5 shrink-0 items-center text-surface-400 group-hover:text-foreground"
        >
          <ChevronRightIcon />
        </span>
      </Link>
    </li>
  );
}

interface LinkRowSkeletonProps {
  /** タイトルのプレースホルダ幅（Tailwind の `w-*` クラス） */
  readonly titleWidthClassName?: string;
  /** 行末のプレースホルダ幅。行末要素を持たないリストでは省く */
  readonly trailingWidthClassName?: string;
}

/**
 * `LinkRow` の読み込み中プレースホルダ
 * 行リンクスケルトン
 *
 * 枠と余白（`ROW_ITEM_CLASSES` / `ROW_INNER_CLASSES`）を実物と共有するため、
 * 片方だけ余白を触っても行の高さがずれない。
 *
 * 矩形の高さはタイトルの行ボックス（`text-sm` = 20px）に合わせる。実物の
 * 行頭・行末も同じ行ボックスに中央揃えされるため、これで 1 行の高さが一致する。
 * 行頭に絵文字を持つリスト（`text-base` = 24px）はここでは扱わない。
 */
export function LinkRowSkeleton({
  titleWidthClassName = "w-40",
  trailingWidthClassName,
}: LinkRowSkeletonProps) {
  return (
    <li className={ROW_ITEM_CLASSES}>
      <div className={`items-center ${ROW_INNER_CLASSES}`}>
        <span className="min-w-0 flex-1">
          <SkeletonBar className={`h-5 ${titleWidthClassName}`} tone={100} />
        </span>
        {trailingWidthClassName !== undefined && (
          <SkeletonBar
            className={`h-5 shrink-0 ${trailingWidthClassName}`}
            tone={100}
          />
        )}
      </div>
    </li>
  );
}
