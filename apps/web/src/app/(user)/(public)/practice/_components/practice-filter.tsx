"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense, type ReactNode } from "react";

import {
  TOGGLE_GROUP_CONTAINER_CLASSES,
  toggleItemClasses,
} from "@/app/(user)/_components/_lib/toggle-group-classes";
import { isRankSlug, type RankSlug } from "@/lib/ranks/registry";

import {
  isPracticeCategory,
  isSamePracticeFilter,
  matchesPracticeFilter,
  PRACTICE_CATEGORY_PARAM,
  PRACTICE_RANK_PARAM,
  practiceListHref,
  type PracticeCategory,
  type PracticeListFilter,
} from "../_lib/practice-catalog";

/** 絞り込みの選択肢 1 つ。`filter` を持たないものが「すべて」 */
interface PracticeFilterOption {
  readonly filter?: PracticeListFilter;
  readonly label: string;
}

/** 絞り込みの対象になるカード 1 枚 */
export interface PracticeFilterItem {
  readonly key: string;
  /** カードが属する段級位。持たない練習は級で絞ると隠れる */
  readonly rank?: RankSlug;
  readonly category: PracticeCategory;
  /** サーバーで描画済みのカード */
  readonly card: ReactNode;
}

interface PracticeFilterProps {
  readonly items: readonly PracticeFilterItem[];
  /**
   * 選択肢の並び。群ごとに分けて渡すと、群の間に区切りが入る
   * （「すべて | 5級 4級 | 符 翻数 点数」）。選べるのは全体で常に 1 つ。
   */
  readonly optionGroups: readonly (readonly PracticeFilterOption[])[];
  /** 選択肢群のアクセシブル名（「練習を絞り込む」） */
  readonly filterLabel: string;
  /** 一覧全体の見出し。視覚的には出さず、見出しの階層のためだけに置く */
  readonly listHeading: string;
}

interface FilteredListProps extends PracticeFilterProps {
  /** 選択中の絞り込み。undefined なら絞り込みなし */
  readonly selected: PracticeListFilter | undefined;
}

function FilteredList({
  items,
  optionGroups,
  filterLabel,
  listHeading,
  selected,
}: FilteredListProps) {
  const visible = items.filter((item) => matchesPracticeFilter(selected, item));

  return (
    <div className="space-y-6">
      {/* 見出しは読み上げにだけ残す。分野の見出しを絞り込みに置き換えた結果、
          一覧に見える h2 は無くなったが、h1（練習）から直接カードの h3 へ
          飛ばさないための階層としてここに 1 つ置く */}
      <h2 className="sr-only">{listHeading}</h2>

      <div className="flex">
        <div
          role="group"
          aria-label={filterLabel}
          className={TOGGLE_GROUP_CONTAINER_CLASSES}
        >
          {optionGroups.map((group, groupIndex) => (
            <Fragment key={group[0]?.label ?? groupIndex}>
              {groupIndex > 0 && (
                // 級と分野は別の軸。1 本のトグルに混ぜているので、
                // どこまでが同じ軸かを区切りで示す
                <span
                  aria-hidden="true"
                  className="mx-1 w-px self-stretch bg-primary-200"
                />
              )}
              {group.map((option) => {
                const isActive = isSamePracticeFilter(option.filter, selected);
                return (
                  <Link
                    key={option.label}
                    href={practiceListHref(option.filter)}
                    // 同じページ内の切り替えなので、押すたびに先頭へ戻さない
                    scroll={false}
                    aria-current={isActive ? "true" : undefined}
                    className={toggleItemClasses(isActive)}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <Fragment key={item.key}>{item.card}</Fragment>
        ))}
      </div>
    </div>
  );
}

function FilterFromQuery(props: PracticeFilterProps) {
  const searchParams = useSearchParams();
  const rank = searchParams.get(PRACTICE_RANK_PARAM);
  const category = searchParams.get(PRACTICE_CATEGORY_PARAM);

  // 知らない値が URL に入っていたら絞り込み無しとして扱う（404 にはしない —
  // 級や分野が増減したときに共有された古いリンクが壊れるより、全件を見せる
  // 方がよい）。両方指定されたときは級を優先する — 選べるのは 1 つだけで、
  // 掛け合わせは 0 件になる組み合わせを生むため
  const selected: PracticeListFilter | undefined =
    rank !== null && isRankSlug(rank)
      ? { kind: "rank", value: rank }
      : category !== null && isPracticeCategory(category)
        ? { kind: "category", value: category }
        : undefined;

  return <FilteredList {...props} selected={selected} />;
}

/**
 * 練習一覧の絞り込み
 * 練習の絞り込み
 *
 * 段級位（5級 / 4級）と分野（符 / 翻数 / 点数）を 1 本のトグルに混ぜ、
 * 選べるのは常に 1 つだけにしている。2 軸の掛け合わせにしない理由は
 * `PracticeListFilter` の TSDoc を参照。
 *
 * 選択中の条件は URL のクエリ（`?rank=kyu-4` / `?category=han`）が持つ。
 * 昇級試験のページから「この試験の練習」として級を指定して開くため、
 * 状態はコンポーネントの中ではなく URL 側にある。
 *
 * 条件を `useSearchParams()` で読むのは、サーバーで `searchParams` を読むと
 * ルートが動的になり初回表示が `loading.tsx` のスケルトンを経由するため
 * （点数表早引きの出題設定と同じ理由）。静的ルートでは `useSearchParams()` を
 * 使うサブツリーがクライアント描画になるので自前の `Suspense` で包む。
 *
 * fallback は絞り込み前の全件そのもの。カードはサーバーで描画済みのものを
 * 受け取っており、絞り込みは表示するかどうかの判断だけなので、プリレンダー
 * された HTML には全カードが載る（スケルトンを挟むと、練習一覧という
 * 索引されるべきページの中身が初回の HTML から消える）。
 */
export function PracticeFilter(props: PracticeFilterProps) {
  return (
    <Suspense fallback={<FilteredList {...props} selected={undefined} />}>
      <FilterFromQuery {...props} />
    </Suspense>
  );
}
