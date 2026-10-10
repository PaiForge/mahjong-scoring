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
 * @design 現在の段級位は小さく、次の目標を上に
 * 以前は現在の段級位を大きな帯バッジの中央寄せのカードで出し、次の目標の
 * 級は黒帯への道の中で開いていた。現在の段級位は「帯の色と級名」しか持たない
 * のに画面の上部を大きく取り、取得済みの級が多い人ほど開いたカードが下へ
 * 押された。現在の段級位は消さずに縮め（次項の区切りバー）、その下に次の目標の
 * 級を開いて置く。黒帯への道は全級を閉じたカードで並べる全体の地図にする
 * （次の目標の級もそこでは閉じて pill で示し、中身を 2 回出さない）。
 *
 * @design 現在の段級位は帯色の区切りバーで
 * 1 行のカード（帯バッジ + 級名）は帯の色と級名しか持たないのに枠付きの
 * カードとして場所を取っていた。レッスン一覧の学習進捗バーにならい、
 * 5級〜初段を 1 級 1 区切りで並べ、取得済みを帯色で塗るバーに置き換えた。
 * 帯色と級名はそのまま残り、「黒帯までのどこにいるか」が加わる。％のバーに
 * しないのは、段級位が 6 段階しかなく割合では意味が読めないため。
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

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/lesson-progress";
import { fetchAttemptedPractices } from "@/app/(user)/(public)/dashboard/_lib/attempted-practices";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { buildJourney } from "@mahjong-scoring/features/journey/journey";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import { DojoSpotlightTour } from "../_components/dojo-spotlight-tour";
import { RankJourneyCard } from "../_components/rank-journey-card";
import { RankProgressBar } from "../_components/rank-progress-bar";
import { DOJO_TOUR_ID } from "../_lib/tour-ids";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("dojo", { path: "/dojo" });
}

export default async function DojoPage() {
  const [t, user] = await Promise.all([
    getTranslations("dojo"),
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
        {/* 現在の段級位は節にせず、5級〜初段の区切り付きのバーで示す
            （見出し・帯色の扱いは RankProgressBar を参照）。未ログインの
            ログイン導線はバーの下に添える。 */}
        <div className="space-y-2">
          <RankProgressBar
            currentSlug={current?.slug}
            dataTourId={DOJO_TOUR_ID.currentRank}
          />
          {!user && (
            <p className="text-xs text-surface-500">
              {t("signInNote")}{" "}
              <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
                {t("signInLink")}
              </Link>
            </p>
          )}
        </div>

        {current?.slug === "dan-1" && (
          <section className="space-y-3 rounded-panel border border-panel bg-primary-50 p-5">
            <SectionTitle>{t("practicalTitle")}</SectionTitle>
            <p className="text-sm leading-relaxed text-surface-700">
              {t("practicalDescription")}
            </p>
            <Link href="/practice?mode=practical" className={TEXT_LINK_CLASSES}>
              {t("practicalCta")} →
            </Link>
          </section>
        )}

        {journey.current !== undefined && (
          // 見出しの pill は置かない。カードの中に「次の目標」の状態 pill が
          // あり、すぐ上の区切りバーでも次の級が淡い帯色で示されているため、
          // 見出しを重ねると同じことを 3 度言う。節の名前は読み上げ用に残す
          <section aria-label={t("nextRankTitle")}>
            <RankJourneyCard journey={journey.current} expanded />
          </section>
        )}

        <section className="space-y-4">
          {/* ツアーは見出しの行だけを照らす（節全体だと全級のカードまで
              照らしてしまう）。包みを w-fit で縮めると、見出しの横線
              （flex-1）が最小幅まで潰れるので幅は行いっぱいのままにする */}
          <div data-tour-id={DOJO_TOUR_ID.journeyTitle}>
            <SectionTitle>{t("journeyTitle")}</SectionTitle>
          </div>
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
