"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense, useMemo, type ReactNode } from "react";

import { LocaleNavLink } from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  CURRICULUM_SECTIONS,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  rankBySlug,
  type RankDefinition,
} from "@mahjong-scoring/features/ranks/registry";
import { RANK_PARAM } from "@mahjong-scoring/features/routes";

import type { ChapterRowData } from "./chapter-row";
import { CurriculumProgressBarView } from "./curriculum-progress-bar-view";
import { CurriculumTocView } from "./curriculum-toc-view";
import {
  deriveLessonProgress,
  LessonProgressProvider,
  LessonProgressScope,
  useLessonProgress,
} from "./lesson-progress-provider";

interface LessonsIndexProps {
  /** 全章の行（セクション順・order 順。サーバーで張る先と文言を解決済み） */
  readonly rows: readonly ChapterRowData[];
  /**
   * 全体の目次でセクションの後ろに挟む広告の行（サーバーで描いた要素）。
   * 位置は `adIndexAfterGroup` でサーバーが決める
   */
  readonly adsAfterSection: Readonly<
    Partial<Record<CurriculumSection, ReactNode>>
  >;
  /** 級で絞った目次の「すべてのレッスンを見る」の張る先（この言語の `/lessons`） */
  readonly allLessonsTarget: NavTarget;
}

/**
 * レッスンの目次の本体（全体 / 級で絞った目次）
 * レッスン目次
 *
 * `/lessons` は静的生成で、閲覧者に依る部分（完了の印・進捗・「次はここから」・
 * `?rank=` の絞り込み）をここでクライアントから付ける。
 *
 * - `?rank=` は `useSearchParams` で読み、`Suspense` で包む。fallback（= 静的
 *   HTML）は全体の目次。Suspense の外で読むと静的ページ全体がクライアント描画に
 *   落ちる。`rank` が `rankBySlug` で引けて前提レッスンを持つときだけ絞り、
 *   未知の級・前提レッスンを持たない級は全体を出す
 * - 絞った目次はその級の前提レッスンだけを並べ、進捗バーと「次はここから」も
 *   その級の中で数える（ダッシュボード・道場の「学ぶ 3 / 5」から来た人が見る数と
 *   食い違わないように）。`rankFilterTitle` の見出しと「すべてのレッスンを見る」を
 *   置き、広告は置かない（セクションが 1〜2 個の短い一覧で、切れ目に挟むと
 *   広告が主役になる）。絞り込みのチップは持たない — 級ごとの一覧は道場が持ち、
 *   ここでは「この級のぶんだけ見る → 全体へ戻る」の往復だけを用意する
 * - パンくずは絞った目次でも全体と同じ 1 段（ページがサーバーで描く）。絞り込みは
 *   クライアントで決まるので、サーバーのパンくずを組み替えられない
 * - 完了は {@link LessonProgressProvider} が 1 回だけ取り（絞り込みの外に置き、
 *   全体と級の目次を行き来しても取り直さない）、範囲ごとの
 *   {@link LessonProgressScope} が数え直す。次と分母は **その言語で出している
 *   レッスンだけ**（`navTarget.crossLocale` でない `lesson`）から数える。静的
 *   HTML（ゲスト）の次は、その言語で出している最初のレッスン
 */
export function LessonsIndex(props: LessonsIndexProps) {
  return (
    <LessonProgressProvider>
      <Suspense fallback={<FullLessonsIndex {...props} />}>
        <LessonsIndexByRank {...props} />
      </Suspense>
    </LessonProgressProvider>
  );
}

/** `?rank=` を読んで全体 / 級で絞った目次を選ぶ（`useSearchParams` を読むのはここだけ） */
function LessonsIndexByRank(props: LessonsIndexProps) {
  const rank = resolveRankFilter(useSearchParams().get(RANK_PARAM));
  if (rank === undefined) return <FullLessonsIndex {...props} />;
  return <RankLessonsIndex {...props} rank={rank} />;
}

/**
 * `?rank=` から絞り込む級を引く。未知の級・前提レッスンを持たない級は絞らない
 *
 * @param value - `rank` の値（無ければ null）
 */
export function resolveRankFilter(
  value: string | null,
): RankDefinition | undefined {
  if (value === null) return undefined;
  const rank = rankBySlug(value);
  if (rank === undefined || rank.learnChapterSlugs.length === 0) {
    return undefined;
  }
  return rank;
}

/**
 * 進み具合を数える範囲のレッスン（その言語で出しているもの、order 順）
 *
 * コラムは完了を持たず、言語をまたぐ行（その言語で出していない章）は
 * 「次」にも分母にも入れない。
 *
 * @param rows - 範囲の行
 */
export function publishedLessonSlugs(
  rows: readonly ChapterRowData[],
): string[] {
  return rows
    .filter((row) => row.kind === "lesson" && !row.navTarget.crossLocale)
    .sort((a, b) => a.order - b.order)
    .map((row) => row.slug);
}

/** 静的 HTML（ゲスト）の進み具合: 完了なし、次は範囲の最初のレッスン */
const NOTHING_COMPLETED: ReadonlySet<string> = new Set();

/** 範囲の進み具合（取得済みなら本人の、無ければゲストの状態） */
function useScopedProgress(lessonSlugs: readonly string[]) {
  const guest = useMemo(
    () => deriveLessonProgress(NOTHING_COMPLETED, lessonSlugs),
    [lessonSlugs],
  );
  return useLessonProgress() ?? guest;
}

function FullLessonsIndex({ rows, adsAfterSection }: LessonsIndexProps) {
  const lessonSlugs = useMemo(() => publishedLessonSlugs(rows), [rows]);
  return (
    <LessonProgressScope lessonSlugs={lessonSlugs}>
      <FullLessonsIndexBody
        rows={rows}
        adsAfterSection={adsAfterSection}
        lessonSlugs={lessonSlugs}
      />
    </LessonProgressScope>
  );
}

function FullLessonsIndexBody({
  rows,
  adsAfterSection,
  lessonSlugs,
}: Pick<LessonsIndexProps, "rows" | "adsAfterSection"> & {
  readonly lessonSlugs: readonly string[];
}) {
  const t = useTranslations("learnCurriculum.index");
  const progress = useScopedProgress(lessonSlugs);
  const guestNext = lessonSlugs[0];
  const allCompleted = progress.nextSlug === undefined;

  return (
    <div className="space-y-8">
      <CurriculumProgressBarView
        completedCount={0}
        totalCount={lessonSlugs.length}
        allCompleted={guestNext === undefined}
      />

      {CURRICULUM_SECTIONS.map((section) => {
        const sectionRows = rows.filter((row) => row.section === section);
        if (sectionRows.length === 0) return undefined;
        const ad = adsAfterSection[section];
        return (
          <Fragment key={section}>
            <CurriculumTocView
              section={section}
              rows={sectionRows}
              completedSlugs={[]}
              nextSlug={guestNext}
              anchored
              headingLevel={2}
            />
            {/* 広告はセクションの切れ目に 1 行ずつ。セクションの中（章の並び）には
                入れない — レッスンの順序は学習の順序で、間に挟まると順路が途切れる */}
            {ad}
          </Fragment>
        );
      })}

      {allCompleted && (
        <p className="text-center text-sm text-surface-600">
          {t("allCompletedMessage")}
        </p>
      )}
    </div>
  );
}

function RankLessonsIndex({
  rows,
  allLessonsTarget,
  rank,
}: LessonsIndexProps & { readonly rank: RankDefinition }) {
  const t = useTranslations("learnCurriculum.index");
  const tRanks = useTranslations("ranks");
  const rankRows = useMemo(() => {
    const rankSlugs: ReadonlySet<string> = new Set(rank.learnChapterSlugs);
    return rows.filter((row) => rankSlugs.has(row.slug));
  }, [rows, rank]);
  const lessonSlugs = useMemo(() => publishedLessonSlugs(rankRows), [rankRows]);
  const guestNext = lessonSlugs[0];
  // 例: ranks.names.kyu-4
  const title = t("rankFilterTitle", { rank: tRanks(`names.${rank.slug}`) });

  return (
    <LessonProgressScope lessonSlugs={lessonSlugs}>
      <section className="space-y-6">
        <SectionTitle>{title}</SectionTitle>
        <CurriculumProgressBarView
          completedCount={0}
          totalCount={lessonSlugs.length}
          allCompleted={guestNext === undefined}
        />
        <div className="space-y-6">
          {CURRICULUM_SECTIONS.map((section) => {
            const sectionRows = rankRows.filter(
              (row) => row.section === section,
            );
            if (sectionRows.length === 0) return undefined;
            return (
              <CurriculumTocView
                key={section}
                section={section}
                rows={sectionRows}
                completedSlugs={[]}
                nextSlug={guestNext}
                anchored={false}
                headingLevel={3}
              />
            );
          })}
        </div>
        <div className="text-center">
          <LocaleNavLink
            navTarget={allLessonsTarget}
            linkKind="plain"
            className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
          >
            {t("allLessonsLink")}
          </LocaleNavLink>
        </div>
      </section>
    </LessonProgressScope>
  );
}
