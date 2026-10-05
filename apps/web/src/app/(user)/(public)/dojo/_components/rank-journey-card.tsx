import { getTranslations } from "next-intl/server";

import { DoneMark } from "@/app/(user)/_components/done-mark";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LockClosedIcon } from "@/app/(user)/_components/icons/lock-closed-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { beltBorderClass, beltButtonVarsClass } from "@/lib/ranks/belt-colors";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import type { RankJourney } from "@mahjong-scoring/features/journey/journey";
import { chapterHref, practiceHref } from "@mahjong-scoring/features/routes";

import { practiceDisplayTitle } from "@mahjong-scoring/features/practice/practice-variant-label";
import { DOJO_TOUR_ID } from "../_lib/tour-ids";
import { RankHeading } from "./rank-heading";
import { RankStageProgress } from "./rank-stage-progress";

interface RankJourneyCardProps {
  readonly journey: RankJourney;
  /** 中身（学ぶ・練習する・認定される）を開くか。道場の「次の目標」の節だけが開く */
  readonly expanded: boolean;
}

/**
 * 黒帯への道の 1 級分
 * 級の行程カード
 *
 * Server Component。`<article>` を返し、並べるときは呼び出し側が `<li>` で包む。
 * 級の見出し（帯バッジ・級名と合格基準・取得状態。
 * ダッシュボードの「次にやること」と共有の {@link RankHeading}）と
 * 「学ぶ / 練習する / 試験」の進み具合を 1 枚に載せる。開いたカード
 * （道場の「次の目標」の節）は中身を開き、学ぶ段（レッスンの行）・レッスンから送る
 * 練習の行・試験への帯色のボタンを並べる。黒帯への道に並べるカードは
 * 次の目標の級も含めて閉じたまま、級名から詳細ページへ送る（中身を 2 回
 * 出さない）。
 *
 * 未取得の上位級には「下の級から順に取得すると受験できます」を添える。
 * 「先に 5級を」のように次の目標の級だけを名指ししないのは、無級の人には
 * 初段にも 5級の名前が付いて 5級を取れば初段を受けられるように読め、飛び番で
 * 級を持つ人には挟まった未取得の級が見えなくなるため。受験資格は常に
 * 「level 昇順で最初の未取得の級」だけ（`evaluateExamEligibility`）なので、
 * 順序の規則そのものを書く。閉じるのは受験だけで、級名から詳細へ行けば
 * レッスンは先に進められる（教材を隠さない）。
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

  return (
    <article
      data-belt-slug={rank.slug}
      data-rank-status={status}
      className={`rounded-xl border-3 bg-white p-4 sm:p-5 ${beltBorderClass(rank.slug)}`}
    >
      <RankHeading
        rankSlug={rank.slug}
        status={status}
        tRanks={tRanks}
        tDojo={t}
        dataTourId={expanded ? DOJO_TOUR_ID.nextRankHeader : undefined}
      />

      <RankStageProgress
        journey={journey}
        tRanks={tRanks}
        isCurrentRank={expanded}
        className="mt-3"
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
              {/* 学ぶ段はレッスンごとに 1 行。題名と説明は章の辞書から引き
                  （レッスン = 章）、レッスンの目次と同じ文言を出す */}
              <LinkRowList>
                {chapters.map((item) => {
                  const chapter = getChapterBySlug(item.chapterSlug);
                  const path = chapter
                    ? `learnCurriculum.${getChapterI18nPath(chapter)}`
                    : undefined;
                  return (
                    <LinkRow
                      key={item.chapterSlug}
                      href={chapterHref(item.chapterSlug)}
                      title={path ? tAll(`${path}.title`) : item.chapterSlug}
                      description={
                        path ? tAll(`${path}.description`) : undefined
                      }
                      trailing={
                        item.done ? (
                          <DoneMark label={t("lessonDone")} />
                        ) : undefined
                      }
                    />
                  );
                })}
              </LinkRowList>
            </section>
          )}

          {practices.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-surface-900">
                {tRanks("stages.practice")}
              </h4>
              <LinkRowList>
                {practices.map((item) => {
                  const title = practiceDisplayTitle(
                    tAll,
                    item.slug,
                    item.variant,
                  );
                  return (
                    <LinkRow
                      key={`${item.slug}:${item.variant ?? ""}`}
                      href={practiceHref(item.slug, item.variant)}
                      title={title}
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
  );
}
