import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { DoneMark } from "@/app/(user)/_components/done-mark";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LockClosedIcon } from "@/app/(user)/_components/icons/lock-closed-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { ChapterTocList } from "@/app/(user)/(public)/learn/_components/chapter-toc-list";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { beltBorderClass, beltButtonVarsClass } from "@/lib/ranks/belt-colors";
import type { RankJourney } from "@mahjong-scoring/features/journey/journey";
import { lessonBySlug } from "@mahjong-scoring/features/lessons/registry";
import { practiceTitleKey } from "@mahjong-scoring/features/practice/catalog";
import {
  lessonHref,
  practiceHref,
  rankHref,
} from "@mahjong-scoring/features/routes";

import { RankStatusBadge } from "../ranks/_components/rank-status-badge";
import { practiceVariantLabel } from "../../_lib/practice-variant-label";
import { DOJO_TOUR_ID } from "../_lib/tour-ids";
import { RankStageProgress } from "./rank-stage-progress";

interface RankJourneyCardProps {
  readonly journey: RankJourney;
  /** いま取り組む級（次の目標）なら中身（学ぶ・練習する・認定される）を開く */
  readonly expanded: boolean;
}

/**
 * 黒帯への道の 1 級分
 * 級の行程カード
 *
 * Server Component。帯バッジ・級名・取得状態・できるようになること・
 * 「学ぶ / 練習する / 試験」の進み具合を 1 枚に載せる。いま取り組む級
 * （次の目標）だけは中身を開き、学ぶ段（レッスンのある章はレッスンの行、
 * 無い章は目次）・章から送る練習の行・試験への帯色のボタンを並べる。他の級は閉じたまま、級名から詳細ページへ送る。
 *
 * 未取得の上位級には「下の級から順に取得すると受験できます」を添える。
 * 「先に 5級を」のように次の目標の級だけを名指ししないのは、無級の人には
 * 初段にも 5級の名前が付いて 5級を取れば初段を受けられるように読め、飛び番で
 * 級を持つ人には挟まった未取得の級が見えなくなるため。受験資格は常に
 * 「level 昇順で最初の未取得の級」だけ（`evaluateExamEligibility`）なので、
 * 順序の規則そのものを書く。閉じるのは受験だけで、級名から詳細へ行けば
 * 教本の章は先に読める（教材を隠さない）。
 *
 * 枠は帯色（道場の「現在の段級位」カード・昇級試験カードと同じ理由 — 級を
 * 掲げたカードに既定の緑の枠を回すと、緑がその級の色に見える）。カード全体を
 * リンクにはしない。開いた中身にいくつも押せる面があり、外側まで押せると
 * どこを押しても飛ぶ面になる。
 */
export async function RankJourneyCard({
  journey,
  expanded,
}: RankJourneyCardProps) {
  const [t, tRanks, tAll] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getTranslations(),
  ]);
  const { rank, status, chapters, practices, exam } = journey;
  // 学ぶ段は章ごとに 1 行。レッスンのある章はレッスンの行だけを出し、
  // 目次にはレッスンの無い章（読んで学ぶ章）だけを残す。両方に出すと同じ章が
  // 2 度並び、どちらを済ませれば進むのかが読み取れない
  const lessons = chapters.flatMap((item) =>
    item.lessonSlug === undefined
      ? []
      : [{ ...item, lessonSlug: item.lessonSlug }],
  );
  const readingChapters = chapters.filter(
    (item) => item.lessonSlug === undefined,
  );
  const learnedSlugs = new Set(
    readingChapters.filter((item) => item.done).map((item) => item.chapterSlug),
  );

  return (
    <li>
      <article
        data-belt-slug={rank.slug}
        data-rank-status={status}
        className={`rounded-xl border-3 bg-white p-4 sm:p-5 ${beltBorderClass(rank.slug)}`}
      >
        <div
          className="flex items-center gap-3"
          data-tour-id={expanded ? DOJO_TOUR_ID.nextRankHeader : undefined}
        >
          <BeltBadge slug={rank.slug} />
          <h3 className="min-w-0 flex-1 text-lg font-bold">
            <Link href={rankHref(rank.slug)} className={TEXT_LINK_CLASSES}>
              {tRanks(`names.${rank.slug}`)}
            </Link>
          </h3>
          <RankStatusBadge status={status} />
        </div>

        <dl className="mt-3 flex gap-2 text-sm text-surface-700">
          <dt className="shrink-0 font-bold">{t("canDoLabel")}:</dt>
          <dd>{tRanks(`criteria.${rank.slug}`)}</dd>
        </dl>

        <RankStageProgress
          journey={journey}
          tRanks={tRanks}
          className="mt-2"
          dataTourId={expanded ? DOJO_TOUR_ID.nextRankStages : undefined}
        />

        {status === "unachieved" && (
          <p
            className="mt-2 flex items-center gap-1 text-xs text-surface-500"
            data-tour-id={DOJO_TOUR_ID.lockedNote}
          >
            <LockClosedIcon className="size-3.5" />
            {t("lockedNote")}
          </p>
        )}

        {expanded && (
          <div className="mt-5 space-y-6 border-t-2 border-dashed border-border/40 pt-5">
            {chapters.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-surface-900">
                  {tRanks("stages.learn")}
                </h4>
                <p className="text-xs text-surface-500">{t("chaptersLead")}</p>
                {lessons.length > 0 && (
                  <LinkRowList>
                    {lessons.map((item) => {
                      const lesson = lessonBySlug(item.lessonSlug);
                      const title = lesson
                        ? tAll(`lessons.${lesson.messageKey}.title`)
                        : item.lessonSlug;
                      return (
                        <LinkRow
                          key={item.lessonSlug}
                          href={lessonHref(item.lessonSlug)}
                          title={t("lessonRow", { title })}
                          description={t("lessonRowDescription")}
                          trailing={
                            item.done ? (
                              <DoneMark label={t("lessonDone")} />
                            ) : undefined
                          }
                        />
                      );
                    })}
                  </LinkRowList>
                )}
                {readingChapters.length > 0 && (
                  <ChapterTocList
                    slugs={readingChapters.map((item) => item.chapterSlug)}
                    readSlugs={learnedSlugs}
                  />
                )}
              </section>
            )}

            {practices.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-surface-900">
                  {tRanks("stages.practice")}
                </h4>
                <p className="text-xs text-surface-500">{t("practicesLead")}</p>
                <LinkRowList>
                  {practices.map((item) => {
                    const title = tAll(
                      `practice.${practiceTitleKey(item.slug)}`,
                    );
                    const variantLabel = practiceVariantLabel(
                      tAll,
                      item.slug,
                      item.variant,
                    );
                    return (
                      <LinkRow
                        key={`${item.slug}:${item.variant ?? ""}`}
                        href={practiceHref(item.slug, item.variant)}
                        title={
                          variantLabel ? `${title}（${variantLabel}）` : title
                        }
                        trailing={
                          item.done ? (
                            <DoneMark label={t("practiceDone")} />
                          ) : undefined
                        }
                      />
                    );
                  })}
                </LinkRowList>
              </section>
            )}

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-surface-900">
                {tRanks("stages.exam")}
              </h4>
              <p className="text-xs text-surface-500">
                {chapters.length > 0
                  ? t("examLead")
                  : t("rankDetail.examLeadWithoutChapters")}
              </p>
              {/* 帯色のボタン。右シェブロンなのは、遷移先が試験の説明ページで
                  押した瞬間に試験が始まるわけではないため（昇級試験カードと同じ） */}
              <LinkButton
                href={practiceHref(exam.slug)}
                variant="belt"
                size="lg"
                fullWidth
                className={beltButtonVarsClass(rank.slug)}
                trailingIcon={<ChevronRightIcon className="size-4" />}
              >
                {t("viewExam")}
              </LinkButton>
            </section>
          </div>
        )}
      </article>
    </li>
  );
}
