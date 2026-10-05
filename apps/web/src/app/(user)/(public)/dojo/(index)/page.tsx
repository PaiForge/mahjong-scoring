/**
 * 道場
 *
 * @description
 * 段級位制のホーム。現在の段級位、次の目標の級、5級から初段（黒帯）までの
 * 全行程「点数計算・黒帯への道」を 1 ページで示す。級ごとに「学ぶ（レッスン）→
 * 練習する → 認定される（試験）」の進み具合を出し、次の目標の級だけ中身を
 * 開いて上に置く。ホーム（ダッシュボード）が「今すること 1 つ」を答えるのに
 * 対し、ここは「全体のどこにいて、この先に何があるか」に答える。
 *
 * 未認証でも閲覧でき、その場合は無級として表示される（段級位制は「この
 * アプリで何ができるようになるか」の提示でもあるため公開ページにしている）。
 * 級の詳細（合格基準・前提章・試験への導線）は `/dojo/ranks/[slug]` が持ち、
 * 各級の名前からそこへ送る。
 *
 * @design 行程の計算は features の `buildJourney`
 * ダッシュボードの「次にやること」と同じ計算を読む。ホームと道場で「次」の指す先が
 * 食い違わないようにするため、この画面で独自に順序を決めない。
 *
 * @design 現在の段級位は 1 行、次の目標を上に
 * 以前は現在の段級位を大きな帯バッジの中央寄せのカードで出し、次の目標の
 * 級は黒帯への道の中で開いていた。現在の段級位は「帯の色と級名」しか持たない
 * のに画面の上部を大きく取り、取得済みの級が多い人ほど開いたカードが下へ
 * 押された。現在の段級位は消さずにラベル付きの 1 行に縮め、その下に次の目標の
 * 級を開いて置く。黒帯への道は全級を閉じたカードで並べる全体の地図にする
 * （次の目標の級もそこでは閉じて pill で示し、中身を 2 回出さない）。
 *
 * @flow
 * 1. 現在の段級位を確認する（未取得・未認証は無級）
 * 2. 次の目標の級から、レッスン / 練習 / 試験へ進む
 *    （見方は見出しの横の「?」のツアーで説明する）
 * 3. 合格すると結果ページの昇級バナーと本ページ・マイページの表示が更新される
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/lesson-progress";
import { fetchAttemptedPractices } from "@/app/(user)/(public)/dashboard/_lib/attempted-practices";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { beltBorderClass } from "@/lib/ranks/belt-colors";
import { buildJourney } from "@mahjong-scoring/features/journey/journey";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import { DojoSpotlightTour } from "../_components/dojo-spotlight-tour";
import { RankJourneyCard } from "../_components/rank-journey-card";
import { DOJO_TOUR_ID } from "../_lib/tour-ids";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("dojo", { path: "/dojo" });
}

export default async function DojoPage() {
  const [t, tRanks, user] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getOptionalUser(),
  ]);
  const [rankSlugs, completedLessonSlugs, attemptedPractices] =
    await Promise.all([
      user ? getUserRankSlugs(user.id) : [],
      fetchCompletedLessonSlugs(),
      fetchAttemptedPractices(),
    ]);

  const current = highestRank(rankSlugs);
  const journey = buildJourney({
    completedLessonSlugs,
    attemptedPractices,
    achievedRankSlugs: rankSlugs,
  });

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle action={<DojoSpotlightTour />}>{t("title")}</PageTitle>

      <div className="space-y-8">
        {/* 現在の段級位は節にせず 1 行で示す。ラベルは見た目こそ小さな文字
            だが h2 にして、見出しジャンプで「次の目標」と同じ段に並ぶようにする
            （SectionTitle の pill を使わないのは、1 行の枠の中に pill の見出しを
            入れると枠より見出しが目立つため）。
            枠は帯色。昇級試験カード（ExamCtaCard）と同じ理由で、級を掲げた
            カードに既定の ink（緑）を回すと緑がその級の色に見えてしまう
            — 5級の帯（オレンジ）を緑で囲むと帯が緑に染まって読める。
            無級のときは帯色そのものが淡いグレーなので枠もグレーになり、
            「まだ色が付いていない」という円の意味とカードが揃う。 */}
        <div
          data-tour-id={DOJO_TOUR_ID.currentRank}
          data-belt-slug={current?.slug ?? "unranked"}
          className={`flex items-center gap-3 rounded-xl border-3 bg-white px-4 py-3 ${beltBorderClass(current?.slug)}`}
        >
          <BeltBadge slug={current?.slug} />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-surface-500">
              {t("currentRankTitle")}
            </h2>
            <p className="text-base font-bold text-surface-900">
              {current ? tRanks(`names.${current.slug}`) : t("unranked")}
            </p>
            {!user && (
              <p className="mt-1 text-xs text-surface-500">
                {t("signInNote")}{" "}
                <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
                  {t("signInLink")}
                </Link>
              </p>
            )}
          </div>
        </div>

        {journey.current !== undefined && (
          <section className="space-y-4">
            <SectionTitle>{t("nextRankTitle")}</SectionTitle>
            <RankJourneyCard journey={journey.current} expanded />
          </section>
        )}

        <section className="space-y-4">
          <SectionTitle>{t("journeyTitle")}</SectionTitle>
          <ol className="space-y-4">
            {journey.ranks.map((rankJourney) => (
              <li key={rankJourney.rank.slug}>
                <RankJourneyCard journey={rankJourney} expanded={false} />
              </li>
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
