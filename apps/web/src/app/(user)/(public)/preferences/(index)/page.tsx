/**
 * 設定（環境設定）
 *
 * @description 端末ローカルの設定とアカウントに紐づく設定を 1 ページに集約する。
 * 節は次の 4 つで、この順に並べる。
 * - 麻雀ルール — 採用するルールの差分（連風牌の符・切り上げ満貫・役満の扱い等）
 * - 練習 — 練習の進め方・答え方・盤面の見せ方（自動で次へ・点数と子ツモの入力方式・
 *   Pro の盤面の 2 行・役の並び順へのリンク）。練習の中でしか意味を持たないもの
 * - 表示 — アプリ全体の見え方（ドラ・用語リンク・符と翻の順）。盤面・レッスン・点数表の
 *   どこでも効くもの
 * - プライバシー — アカウントに紐づく設定（ランキング非表示・ブロックしたユーザー）
 *
 * 節は画面上の分類で、保存先のストアの分け方とは一致させない（表示設定ストアの項目は
 * 「練習」と「表示」に跨る）。
 *
 * 1 ページに保つ理由: 20 行に満たない行を 4 節に分けた規模で、節見出しを並べれば
 * 1 画面で探せる。どの項目も変更する頻度が低く、タブにしても既定で開くべき群が無い。
 * さらに各行のアンカー（`PREFERENCE_ANCHORS`）にはレッスン・練習の盤面・用語の
 * モーダル・点数表・ランキング・アプリなど多くの場所からリンクしており、タブにすると
 * リンクがタブの選択や URL の変更まで面倒を見る必要が出る。折りたたみはアンカーの
 * 着地先とトグルを隠すので採らない。
 *
 * 見直す目安: 1 節が 8 行を超える、全体が 25 行を超える、Pro の項目が独自の節に
 * なる規模になったとき。その時はタブではなく分類ごとのページ（`preferencesHref` が
 * `/preferences/<分類>#<id>` を返す形）に分け、リンク元はアンカー経由のまま保つ。
 * @flow ヘッダーのメニュー / アカウントメニュー → 設定
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { AnchorScroll } from "../_components/anchor-scroll";
import { BlockedUsersSection } from "../_components/blocked-users-section";
import { DisplaySettingsSection } from "../_components/display-settings-section";
import { MembersOnlyGate } from "../_components/members-only-gate";
import { PracticeSettingsSection } from "../_components/practice-settings-section";
import { PrivacySettingsSection } from "../_components/privacy-settings-section";
import { RuleSettingsSection } from "../_components/rule-settings-section";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("settings", "pageTitle");
}

export default async function PreferencesPage() {
  const t = await getTranslations("settings");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <AnchorScroll />
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <MembersOnlyGate>
          <div className="space-y-8">
            <section className="space-y-4">
              <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
              <RuleSettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("practiceSectionTitle")}</SectionTitle>
              <PracticeSettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("displaySectionTitle")}</SectionTitle>
              <DisplaySettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("privacySectionTitle")}</SectionTitle>
              <PrivacySettingsSection />
              <BlockedUsersSection />
            </section>
          </div>
        </MembersOnlyGate>
      </div>
    </ContentContainer>
  );
}
