/**
 * 道場
 *
 * @description
 * 段級位制のホーム。現在の段級位・次の目標（前提となる教本の章と昇級試験）を
 * 1 ページで示す。未認証でも閲覧でき、その場合は無級として表示される
 * （段級位の一覧は「このアプリで何ができるようになるか」の提示でもあるため
 * 公開ページにしている）。
 *
 * @flow
 * 1. 現在の段級位を確認する（未取得・未認証は無級）
 * 2. 次のランクの前提章を教本で読む（読了チェックが進捗を示す）
 * 3. 昇級試験（`/exam` 配下）を受ける
 * 4. 合格すると結果ページの昇級バナーと本ページ・マイページの表示が更新される
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ChapterTocList } from "@/app/(user)/(public)/learn/_components/chapter-toc-list";
import { CurriculumTocLink } from "@/app/(user)/(public)/learn/_components/curriculum-toc-link";
import { ExamCtaCard } from "@/app/(user)/(public)/learn/_components/exam-cta-card";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { menuTypeToSlug } from "@/lib/db/practice-menu-types";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { highestRank, nextRank } from "@/lib/ranks/registry";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("dojo", { path: "/dojo" });
}

export default async function DojoPage() {
  const [t, tRanks, user] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getOptionalUser(),
  ]);
  const [rankSlugs, readSlugs] = await Promise.all([
    user ? getUserRankSlugs(user.id) : [],
    fetchReadChapterSlugs(),
  ]);

  const current = highestRank(rankSlugs);
  const next = nextRank(rankSlugs);

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>

        <section className="space-y-4">
          <SectionTitle>{t("currentRankTitle")}</SectionTitle>
          <div className="rounded-xl border-3 border-ink bg-white p-5 text-center">
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

        {next ? (
          <>
            <section className="space-y-4">
              <SectionTitle>{t("chaptersTitle")}</SectionTitle>
              <p className="text-sm leading-relaxed text-surface-500">
                {t("chaptersLead")}
              </p>
              <ChapterTocList
                slugs={next.learnChapterSlugs}
                readSlugs={readSlugs}
              />
              <CurriculumTocLink />
            </section>

            {next.requirements.map((requirement) => (
              <ExamCtaCard
                key={requirement.menuType}
                slug={menuTypeToSlug(requirement.menuType)}
                lead={t("examLead")}
              />
            ))}
          </>
        ) : (
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
