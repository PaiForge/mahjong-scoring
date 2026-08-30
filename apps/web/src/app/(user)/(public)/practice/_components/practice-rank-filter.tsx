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
  PRACTICE_RANK_PARAM,
  practiceListHref,
} from "../_lib/practice-catalog";
import { PracticeCategorySection } from "./practice-category-section";

/** 絞り込みの選択肢 1 つ。`rank` を持たないものが「すべて」 */
interface RankFilterOption {
  readonly rank?: RankSlug;
  readonly label: string;
}

/** 絞り込みの対象になるカード 1 枚 */
interface FilterableCard {
  readonly key: string;
  /** カードが属する段級位。持たない練習は級で絞ると隠れる */
  readonly rank?: RankSlug;
  /** サーバーで描画済みのカード */
  readonly card: ReactNode;
}

/** カテゴリセクション 1 つ分 */
export interface PracticeFilterSection {
  readonly key: string;
  readonly title: string;
  readonly cards: readonly FilterableCard[];
}

interface PracticeRankFilterProps {
  readonly sections: readonly PracticeFilterSection[];
  readonly options: readonly RankFilterOption[];
  /** 選択肢群のアクセシブル名（「段級位で絞り込む」） */
  readonly filterLabel: string;
}

interface FilteredSectionsProps extends PracticeRankFilterProps {
  /** 選択中の段級位。undefined なら絞り込みなし */
  readonly selected: RankSlug | undefined;
}

function FilteredSections({
  sections,
  options,
  filterLabel,
  selected,
}: FilteredSectionsProps) {
  // 級で絞ると空になるカテゴリは見出しごと落とす。カードが 1 枚も無い
  // 「翻数」の見出しだけが残ると、絞り込みが壊れたように見える
  const visible = sections
    .map((section) => ({
      ...section,
      cards: section.cards.filter(
        (item) => selected === undefined || item.rank === selected,
      ),
    }))
    .filter((section) => section.cards.length > 0);

  return (
    <div className="space-y-10">
      <div className="flex">
        <div
          role="group"
          aria-label={filterLabel}
          className={TOGGLE_GROUP_CONTAINER_CLASSES}
        >
          {options.map((option) => {
            const isActive = option.rank === selected;
            return (
              <Link
                key={option.rank ?? "all"}
                href={practiceListHref(option.rank)}
                // 同じページ内の切り替えなので、押すたびに先頭へ戻さない
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={toggleItemClasses(isActive)}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      {visible.map((section) => (
        <PracticeCategorySection key={section.key} title={section.title}>
          {section.cards.map((item) => (
            <Fragment key={item.key}>{item.card}</Fragment>
          ))}
        </PracticeCategorySection>
      ))}
    </div>
  );
}

function FilterFromQuery(props: PracticeRankFilterProps) {
  const searchParams = useSearchParams();
  const raw = searchParams.get(PRACTICE_RANK_PARAM);
  // 知らない級が URL に入っていたら絞り込み無しとして扱う（404 にはしない —
  // 級が増減したときに共有された古いリンクが壊れるより、全件を見せる方がよい）
  const selected = raw !== null && isRankSlug(raw) ? raw : undefined;

  return <FilteredSections {...props} selected={selected} />;
}

/**
 * 練習一覧の段級位フィルタ
 * 段級位絞り込み
 *
 * 選択中の級は URL のクエリ（`?rank=kyu-4`）が持つ。昇級試験のページから
 * 「この試験の練習」として級で絞った一覧へ送るため、状態はコンポーネントの
 * 中ではなく URL 側にある。
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
export function PracticeRankFilter(props: PracticeRankFilterProps) {
  return (
    <Suspense fallback={<FilteredSections {...props} selected={undefined} />}>
      <FilterFromQuery {...props} />
    </Suspense>
  );
}
