/**
 * 道場
 *
 * @description
 * 段級位制のホーム。現在の段級位と、5級から初段（黒帯）までの全行程
 * 「点数計算・黒帯への道」を 1 ページで示す。級ごとに「学ぶ（章 / レッスン）→
 * 練習する → 認定される（試験）」の進み具合を出し、いま取り組む級（次の目標）
 * だけ中身を開く。ホーム（ダッシュボード）が「今すること 1 つ」を答えるのに
 * 対し、ここは「全体のどこにいて、この先に何があるか」に答える。
 *
 * 未認証でも閲覧でき、その場合は無級として表示される（段級位制は「この
 * アプリで何ができるようになるか」の提示でもあるため公開ページにしている）。
 * 級の詳細（合格基準・前提章・試験への導線）は `/dojo/ranks/[slug]` が持ち、
 * 各級の名前からそこへ送る。
 *
 * @design 行程の計算は features の `buildJourney`
 * ダッシュボードの「次の一歩」と同じ計算を読む。ホームと道場で「次」の指す先が
 * 食い違わないようにするため、この画面で独自に順序を決めない。
 *
 * @flow
 * 1. 現在の段級位を確認する（未取得・未認証は無級）
 * 2. 行程で次の目標の級を開き、レッスン / 前提章 / 練習 / 試験へ進む
 * 3. 合格すると結果ページの昇級バナーと本ページ・マイページの表示が更新される
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/progress";
import { fetchAttemptedPracticeSlugs } from "@/app/(user)/(public)/dashboard/_lib/attempted-practices";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { beltBorderClass } from "@/lib/ranks/belt-colors";
import { buildJourney } from "@mahjong-scoring/features/journey/journey";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import { RankJourneyCard } from "../_components/rank-journey-card";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("dojo", { path: "/dojo" });
}

export default async function DojoPage() {
  const [t, tRanks, user] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getOptionalUser(),
  ]);
  const [rankSlugs, readSlugs, completedLessonSlugs, attemptedSlugs] =
    await Promise.all([
      user ? getUserRankSlugs(user.id) : [],
      fetchReadChapterSlugs(),
      fetchCompletedLessonSlugs(),
      fetchAttemptedPracticeSlugs(),
    ]);

  const current = highestRank(rankSlugs);
  const journey = buildJourney({
    readSlugs,
    completedLessonSlugs,
    attemptedSlugs,
    achievedRankSlugs: rankSlugs,
  });
  const nextRankSlug = journey.current?.rank.slug;

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>

        <section className="space-y-4">
          <SectionTitle>{t("currentRankTitle")}</SectionTitle>
          {/* 枠は帯色。昇級試験カード（ExamCtaCard）と同じ理由で、級を掲げた
              カードに既定の ink（緑）を回すと緑がその級の色に見えてしまう
              — 5級の帯（オレンジ）を緑で囲むと帯が緑に染まって読める。
              無級のときは帯色そのものが淡いグレーなので枠もグレーになり、
              「まだ色が付いていない」という円の意味とカードが揃う。 */}
          <div
            data-belt-slug={current?.slug ?? "unranked"}
            className={`rounded-xl border-3 bg-white p-5 text-center ${beltBorderClass(current?.slug)}`}
          >
            <BeltBadge slug={current?.slug} size="lg" />
            <p className="mt-3 text-lg font-bold text-surface-900">
              {current ? tRanks(`names.${current.slug}`) : t("unranked")}
            </p>
            {!user && (
              <p className="mt-2 text-sm text-surface-500">
                {t("signInNote")}{" "}
                <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
                  {t("signInLink")}
                </Link>
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("journeyTitle")}</SectionTitle>
          <p className="text-sm leading-relaxed text-surface-500">
            {t("journeyLead")}
          </p>
          <ol className="space-y-4">
            {journey.ranks.map((rankJourney) => (
              <RankJourneyCard
                key={rankJourney.rank.slug}
                journey={rankJourney}
                expanded={rankJourney.status === "next"}
                requiredRankSlug={nextRankSlug}
              />
            ))}
          </ol>
        </section>

        {journey.current === undefined && (
          <section className="space-y-4">
            <SectionTitle>{t("comingSoonTitle")}</SectionTitle>
            <p className="text-sm leading-relaxed text-surface-700">
              {t("comingSoon")}
            </p>
          </section>
        )}
      </div>
    </ContentContainer>
  );
}
