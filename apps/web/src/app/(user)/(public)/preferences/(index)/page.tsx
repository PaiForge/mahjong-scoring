/**
 * 設定（環境設定）
 *
 * @description 端末ローカルの設定とアカウントに紐づく設定を 1 ページに集約する。
 * 節は次の 4 つで、この順に並べる。
 * - 麻雀ルール — 採用するルールの差分（連風牌の符・切り上げ満貫・役満の扱い等）
 * - 練習 — 問題を解く画面での進め方・答え方・盤面の見せ方（自動で次へ・点数と子ツモの
 *   入力方式・Pro の盤面の 2 行・役の並び順へのリンク）。効くのは練習（チャレンジ・
 *   トレーニング・点数計算の演習）と昇級試験・模試の画面だけで、レッスンの本文や点数表には
 *   効かない。昇級試験も含めて「練習」と呼ぶのは、用語の上で試験はチャレンジの一種で、
 *   模試はトレーニングと同じ仕組みだから
 * - 表示 — アプリ全体の見え方（ドラ・用語リンク・符と翻の順）。盤面・レッスン・点数表の
 *   どこでも効くもの
 * - プライバシー — アカウントに紐づく設定（ランキング非表示・ブロックしたユーザー）
 *
 * アプリ（`apps/mobile` の設定画面）も同じ 4 節を同じ順で並べる。分類を変えるときは
 * 両方を一緒に変える。この TSDoc が分類と以下の判断の正本で、アプリ側はここを指す。
 *
 * 節は画面上の分類で、保存先のストアの分け方とは一致させない（表示設定ストアの項目は
 * 「練習」と「表示」に跨る）。ストアを節に合わせて分け直すと保存形式が変わり、
 * 保存済みの設定を移し替える必要が出るため。
 *
 * 2026-10 までは「表示」の節に見え方・答え方（入力方式）・盤面の難度（Pro）・
 * 別ページへのリンク（役の並び順）の 4 種類が 8 行で同居し、「トレーニング」の節は
 * 1 行だけだった。探しにくさの原因は量ではなく分類だったので、ページを分けずに節の
 * 所属だけを組み直した。入力方式や Pro の行を「表示」へ戻さないこと。
 *
 * 1 ページに保つ理由（タブ・分類ごとのページ・折りたたみを採らない理由）:
 * - 量が少ない。2026-10 時点で 4 節・web 18 行（iOS 17、Android 15）で、OS の設定
 *   アプリが節見出しで 1 画面に並べる規模
 * - どの項目も一度決めたら触らない。タブの既定で開くべき群が無い。変えることの多い
 *   点数の入力方式と自動で次へは、練習の盤面・設定画面にもその場の切り替えがある
 * - 各行のアンカー（`PREFERENCE_ANCHORS`）にはレッスン・練習の盤面・用語の
 *   モーダル・点数表・ランキング・アプリなど多くの場所からリンクしている。タブにすると
 *   着地のたびにタブの選択まで面倒を見る仕組みが web（`AnchorScroll`）とアプリ
 *   （`PreferenceAnchorProvider`）の両方に要る
 * - タブの部品が無い。`ToggleGroup` は 2〜3 択用で、4 節の日本語のラベルはスマホ幅
 *   （375px）に収まらない。分類ごとのページへ分ける索引の形は、全項目に 1 タップ増え、
 *   会員限定ゲートもページの数だけ要る
 * - 折りたたみは、アンカーの着地先の行とスイッチを隠す
 *
 * 見直す目安: 1 節が 8 行を超える、全体が 25 行を超える、Pro の項目が独自の節に
 * なる規模になったとき。その時はタブではなく分類ごとのページ（`preferencesHref` が
 * `/preferences/<分類>#<id>` を返す形）に分け、リンク元はアンカー経由のまま保つ。
 *
 * 和了形・聴牌形の演習の出題設定は各練習の設定画面、アカウント・プロフィール・
 * Pro プランはマイページにあり、ここには置かない。
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
