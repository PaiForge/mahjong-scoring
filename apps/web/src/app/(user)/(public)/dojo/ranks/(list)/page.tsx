/**
 * 段級位一覧
 *
 * @description
 * 道場の全段級位（5級〜初段）を序列順に並べ、級ごとの合格基準と、閲覧者に
 * とっての取得状態（取得済み / 次の目標 / 未取得）を示す。道場（`/dojo`）が
 * 「今どこで、次に何をするか」に答えるのに対し、こちらは「この先どんな級が
 * あるのか」に答える。未認証でも閲覧でき、その場合は無級として表示される。
 *
 * 取得状態はサーバーで描く（cookie を読む動的ルート）。静的に生成して
 * クライアントで重ねると、ログイン済みの人にも一瞬だけ無級の状態が出る。
 *
 * @flow
 * 1. 級ごとのカードで合格基準と取得状態を確認する
 * 2. 級名から詳細ページ（前提となる教本の章・試験への導線）へ進む
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { resolveRankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

import { RankCard } from "../_components/rank-card";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("dojo", {
    title: "ranksList.title",
    description: "ranksList.description",
    // seo-coverage.test.ts がソースの文字列で canonical を突き合わせるため、
    // 定数（RANKS_PATH）ではなくリテラルで書く
    path: "/dojo/ranks",
  });
}

export default async function RanksPage() {
  const [t, user] = await Promise.all([
    getTranslations("dojo"),
    getOptionalUser(),
  ]);
  const achievedSlugs = user ? await getUserRankSlugs(user.id) : [];

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("title"), href: "/dojo" },
        { label: t("ranksList.title") },
      ]}
    >
      <PageTitle>{t("ranksList.title")}</PageTitle>

      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-surface-500">
            {t("ranksList.lead")}
          </p>
          {!user && (
            <p className="text-sm leading-relaxed text-surface-500">
              {t("signInNote")}{" "}
              <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
                {t("signInLink")}
              </Link>
            </p>
          )}
        </div>

        <ol className="space-y-4">
          {RANK_REGISTRY.map((rank) => (
            <li key={rank.slug}>
              <RankCard
                slug={rank.slug}
                status={resolveRankStatus(rank.slug, achievedSlugs)}
              />
            </li>
          ))}
        </ol>
      </div>
    </ContentContainer>
  );
}
