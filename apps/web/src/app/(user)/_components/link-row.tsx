import type { ReactNode } from "react";
import Link from "next/link";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 行リンクのリスト枠
 * 行リンクリスト
 *
 * 枠も影も持たない。区切りは各行の破線だけ。
 */
export function LinkRowList({ children }: { readonly children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>;
}

/** 行の外枠（破線の区切り）。実物とスケルトンで共有する */
const ROW_ITEM_CLASSES =
  "border-b border-dashed border-border/40 last:border-b-0";

/**
 * 行の中身の箱。実物とスケルトンで共有する。
 *
 * 負のマージンで hover の面を行の左右いっぱいに広げつつ、
 * リスト自体の左端は隣のセクションと揃えたままにする。
 */
const ROW_INNER_CLASSES = "-mx-2 flex gap-3 rounded-lg px-2 py-3";

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
 * このアプリの太枠 + ハードシャドウ + 押し込みは「押して始める面」の記号で、
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
      </Link>
    </li>
  );
}

interface LinkRowSkeletonProps {
  /** 行頭に絵文字・アイコンを持つリストか（`LinkRow` の `leading` に対応） */
  readonly leading?: boolean;
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
 * 高さは行頭要素（`text-base` の絵文字 = 24px）が決めるため、行頭を持つ
 * リストでは 24px の矩形を置き、タイトル・行末（行ボックス 20px）と
 * 中央揃えで並べる。これで実物と同じ 1 行 48px になる。
 */
export function LinkRowSkeleton({
  leading = false,
  titleWidthClassName = "w-40",
  trailingWidthClassName,
}: LinkRowSkeletonProps) {
  return (
    <li className={ROW_ITEM_CLASSES}>
      <div className={`items-center ${ROW_INNER_CLASSES}`}>
        {leading && <SkeletonBar radius="md" className="size-6 shrink-0" />}
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
