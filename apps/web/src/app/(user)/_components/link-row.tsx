import type { ReactNode } from "react";
import Link from "next/link";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";

/**
 * 行リンクのリスト枠
 * 行リンクリスト
 *
 * 枠も影も持たない。区切りは各行の破線だけ。
 */
export function LinkRowList({ children }: { readonly children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>;
}

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
    <li className="border-b border-dashed border-border/40 last:border-b-0">
      {/* 負のマージンで hover の面を行の左右いっぱいに広げつつ、
          リスト自体の左端は隣のセクションと揃えたままにする。 */}
      <Link
        href={href}
        className={`group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-50 ${FOCUS_RING_CLASSES}`}
      >
        {leading !== undefined && <span className="shrink-0">{leading}</span>}
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
        {trailing !== undefined && <span className="shrink-0">{trailing}</span>}
      </Link>
    </li>
  );
}
