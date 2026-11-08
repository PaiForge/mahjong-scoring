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
 * レッスン（/lessons/mentsu-fu）・アカウント登録・面子符の練習の説明ページ・
 * 練習一覧・LP へ
 *
 * 答え合わせのあとの導線は `resolveNavTargetFor` で今の言語の href を張る。
 * レッスン・練習一覧・LP は英語でも公開しているので英語のページなら `/en/...`。
 * 登録だけは英語で未公開のため「日本語のみ」の印付きで日本語の登録へ送る。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { SignUpPanel } from "@/app/[locale]/(user)/_components/sign-up-panel";
import { CatalogPracticeCard } from "@/app/[locale]/(user)/(public)/practice/_components/catalog-practice-card";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { chapterHref, PRACTICE_PATH } from "@mahjong-scoring/features/routes";

import { MentsuFuTryBoard } from "./_components/mentsu-fu-try-board";
import { prepareRouteLocale } from "@/i18n/route-locale";

/** 登録ページ（ロケール非依存の href） */
const SIGN_UP_PATH = "/sign-up";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/try/mentsu-fu">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/try/mentsu-fu");
  return createNamespaceMetadata("tryMentsuFu", {
    path: "/try/mentsu-fu",
    locale,
  });
}

export default async function TryMentsuFuPage({
  params,
}: PageProps<"/[locale]/try/mentsu-fu">) {
  const locale = await prepareRouteLocale(params, "/try/mentsu-fu");
  const [t, tNav] = await Promise.all([
    getTranslations("tryMentsuFu"),
    getTranslations("nav"),
  ]);
  const lesson = resolveNavTargetFor(chapterHref("mentsu-fu"), locale);
  const home = resolveNavTargetFor("/", locale);
  const practices = resolveNavTargetFor(PRACTICE_PATH, locale);
  const japaneseOnly = (
    <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
  );

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>
      <MentsuFuTryBoard
        afterAnswer={
          <div className="mt-8 space-y-10">
            <LinkButton navTarget={lesson} size="lg" fullWidth>
              {t("learnCta")}
              {lesson.crossLocale && japaneseOnly}
            </LinkButton>
            <SignUpPanel
              title={t("signUp.title")}
              description={t("signUp.description")}
              cta={t("signUp.cta")}
              navTarget={resolveNavTargetFor(SIGN_UP_PATH, locale)}
            />
            <div className="text-center">
              <LocaleNavLink
                navTarget={home}
                linkKind="plain"
                className={`text-sm ${TEXT_LINK_CLASSES}`}
              >
                {t("backToHome")}
                {home.crossLocale && japaneseOnly}
              </LocaleNavLink>
            </div>
            <section className={`flex flex-col ${SUB_LINK_GAP}`}>
              <div className="space-y-4">
                <SectionTitle>{t("practiceTitle")}</SectionTitle>
                <CatalogPracticeCard slug="mentsu-fu" />
              </div>
              <div className="text-center">
                <LocaleNavLink
                  navTarget={practices}
                  linkKind="plain"
                  className={`text-sm ${TEXT_LINK_CLASSES}`}
                >
                  {t("browsePractices")}
                  {practices.crossLocale && japaneseOnly}
                </LocaleNavLink>
              </div>
            </section>
          </div>
        }
      />
    </ContentContainer>
  );
}
