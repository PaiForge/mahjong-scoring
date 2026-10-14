/**
 * 符の計算の体験
 *
 * @description はじめ方ガイド（/getting-started）の「簡単な問題を解く」の遷移先。
 * 登録なし・設定なしで、レッスン「面子の符」の確認問題を 1 問解く。
 * cookie を読まない静的ページ。
 *
 * 面子符の練習（/practice/mentsu-fu/play）へ直接送らないのは、開いた瞬間に
 * カウントダウンが始まり、何をする画面かを知る前にチャレンジが始まるため。
 * 確認問題は時計もライフも無く、間違えても解説が出るので、点数計算をまだ
 * 知らない人の最初の 1 問に向く。
 *
 * @flow 面子を見て符を選ぶ（「ヒントを見る」で手がかり）→ 正誤と解説 →
 * レッスン（/lessons/mentsu-fu）・面子符の練習の説明ページ・練習一覧へ
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { CatalogPracticeCard } from "@/app/(user)/(public)/practice/_components/catalog-practice-card";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { MentsuFuTryBoard } from "./_components/mentsu-fu-try-board";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("tryMentsuFu", { path: "/try/mentsu-fu" });
}

export default async function TryMentsuFuPage() {
  const t = await getTranslations("tryMentsuFu");

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>
      <MentsuFuTryBoard
        afterAnswer={
          <div className="mt-8 space-y-10">
            <LinkButton href={chapterHref("mentsu-fu")} size="lg" fullWidth>
              {t("learnCta")}
            </LinkButton>
            <section className={`flex flex-col ${SUB_LINK_GAP}`}>
              <div className="space-y-4">
                <SectionTitle>{t("practiceTitle")}</SectionTitle>
                <CatalogPracticeCard slug="mentsu-fu" />
              </div>
              <div className="text-center">
                <Link
                  href="/practice"
                  className={`text-sm ${TEXT_LINK_CLASSES}`}
                >
                  {t("browsePractices")}
                </Link>
              </div>
            </section>
          </div>
        }
      />
    </ContentContainer>
  );
}
