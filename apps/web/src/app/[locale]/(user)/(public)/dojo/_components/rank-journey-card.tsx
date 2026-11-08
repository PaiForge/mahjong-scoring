import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { DoneMark } from "@/app/[locale]/(user)/_components/done-mark";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { LockClosedIcon } from "@/app/[locale]/(user)/_components/icons/lock-closed-icon";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import {
  LinkRow,
  LinkRowList,
} from "@/app/[locale]/(user)/_components/link-row";
import {
  beltBorderTopClass,
  beltButtonVarsClass,
} from "@/lib/ranks/belt-colors";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import type { RankJourney } from "@mahjong-scoring/features/journey/journey";
import { chapterHref, practiceHref } from "@mahjong-scoring/features/routes";

import { practiceDisplayTitle } from "@mahjong-scoring/features/practice/practice-variant-label";
import { DOJO_TOUR_ID } from "../_lib/tour-ids";
import { dojoNavTarget, type DojoLinkLocale } from "./dojo-link";
import { RankHeading } from "./rank-heading";
import { RankStageProgress } from "./rank-stage-progress";

interface RankJourneyCardProps {
  readonly journey: RankJourney;
  /** 中身（学ぶ・練習する・認定される）を開くか。道場の「次の目標」の節だけが開く */
  readonly expanded: boolean;
  /**
   * 道場のページの言語（`prepareRouteLocale` の戻り値）。カードの中のリンク
   * （級の詳細・レッスン・練習・試験）をこの言語で張る。道場だけが使う部品
   * なので省略させない（渡し忘れると英語の道場から日本語のページへ
   * クライアント遷移し、英語の文書に日本語の本文が載る）
   */
  readonly locale: SupportedLocale;
}

/**
 * 行リンクの張り方（同じ言語なら `next/link`、言語をまたぐなら `hrefLang` と
 * 「日本語のみ」の印を行末に添える）
 */
function rowLinkProps(path: string, linkLocale: DojoLinkLocale) {
  const target = dojoNavTarget(path, linkLocale);
  return {
    href: target.href,
    hrefLang: target.crossLocale ? DEFAULT_LOCALE : undefined,
    mark: target.crossLocale ? (
      <JapaneseOnlyMark label={linkLocale.japaneseOnlyLabel} />
    ) : undefined,
  } as const;
}

/** 行末の要素（「日本語のみ」の印と完了の印。どちらも無ければ undefined） */
function rowTrailing(mark: ReactNode, done: ReactNode): ReactNode {
  if (mark === undefined) return done;
  if (done === undefined) return mark;
  return (
    <span className="flex items-center gap-2">
      {mark}
      {done}
    </span>
  );
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
 *
 * リンクはすべて道場のページの言語で張る（`dojoNavTarget`）。行き先がその言語で
 * 未公開なら、読むだけのリンク（級の詳細・レッスン・練習）は日本語の
 * ページへ「日本語のみ」の印付きで送り、押して始める面の試験のボタンは
 * 出さない（`ExamCtaCard` と同じ。押して始める面を別の言語の画面へ送らない）。
 */
export async function RankJourneyCard({
  journey,
  expanded,
  locale,
}: RankJourneyCardProps) {
  const [t, tRanks, tAll, tNav] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getTranslations(),
    getTranslations("nav"),
  ]);
  const { rank, status, chapters, practices, exam } = journey;
  const linkLocale: DojoLinkLocale = {
    locale,
    japaneseOnlyLabel: tNav("language.japaneseOnly"),
  };
  const examTarget = dojoNavTarget(practiceHref(exam.slug), linkLocale);

  return (
    <article
      data-belt-slug={rank.slug}
      data-rank-status={status}
      className={`rounded-panel border border-t-2 border-panel bg-white p-4 sm:p-5 ${beltBorderTopClass(rank.slug)}`}
    >
      <RankHeading
        rankSlug={rank.slug}
        status={status}
        tRanks={tRanks}
        tDojo={t}
        dataTourId={expanded ? DOJO_TOUR_ID.nextRankHeader : undefined}
        linkLocale={linkLocale}
      />

      <RankStageProgress
        journey={journey}
        tRanks={tRanks}
        isCurrentRank={expanded}
        className="mt-3"
        dataTourId={expanded ? DOJO_TOUR_ID.nextRankStages : undefined}
        linkLocale={linkLocale}
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
        <div className="mt-5 space-y-6 border-t border-panel pt-5">
          {chapters.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-surface-900">
                {tRanks("stages.learn")}
              </h4>
              {/* 学ぶ段はレッスンごとに 1 行。題名と説明は章の辞書から引き
                  （レッスン = 章）、レッスンの目次と同じ文言を出す */}
              <LinkRowList inset>
                {chapters.map((item) => {
                  const chapter = getChapterBySlug(item.chapterSlug);
                  const path = chapter
                    ? `learnCurriculum.${getChapterI18nPath(chapter)}`
                    : undefined;
                  const { href, hrefLang, mark } = rowLinkProps(
                    chapterHref(item.chapterSlug),
                    linkLocale,
                  );
                  return (
                    <LinkRow
                      key={item.chapterSlug}
                      href={href}
                      hrefLang={hrefLang}
                      title={path ? tAll(`${path}.title`) : item.chapterSlug}
                      description={
                        path ? tAll(`${path}.description`) : undefined
                      }
                      trailing={rowTrailing(
                        mark,
                        item.done ? (
                          <DoneMark label={t("lessonDone")} />
                        ) : undefined,
                      )}
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
              <LinkRowList inset>
                {practices.map((item) => {
                  const title = practiceDisplayTitle(
                    tAll,
                    item.slug,
                    item.variant,
                  );
                  const { href, hrefLang, mark } = rowLinkProps(
                    practiceHref(item.slug, item.variant),
                    linkLocale,
                  );
                  return (
                    <LinkRow
                      key={`${item.slug}:${item.variant ?? ""}`}
                      href={href}
                      hrefLang={hrefLang}
                      title={title}
                      trailing={rowTrailing(
                        mark,
                        item.done ? (
                          <DoneMark label={t("practiceDone")} />
                        ) : undefined,
                      )}
                    />
                  );
                })}
              </LinkRowList>
            </section>
          )}

          {!examTarget.crossLocale && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-surface-900">
                {tRanks("stages.exam")}
              </h4>
              {/* 帯色のボタン。右シェブロンなのは、遷移先が試験の説明ページで
                  押した瞬間に試験が始まるわけではないため（昇級試験カードと同じ） */}
              <LinkButton
                href={examTarget.href}
                variant="belt"
                size="lg"
                fullWidth
                className={beltButtonVarsClass(rank.slug)}
                trailingIcon={<ChevronRightIcon className="size-4" />}
              >
                {t("viewExam")}
              </LinkButton>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
