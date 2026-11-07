import { getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { CatalogPracticeCard } from "@/app/[locale]/(user)/(public)/practice/_components/catalog-practice-card";
import {
  AgariScorePracticeBanner,
  TenpaiScorePracticeBanner,
} from "@/app/[locale]/(user)/(public)/practice/_components/practical-practice-banners";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { currentLocale } from "@/i18n/current-locale";

/**
 * 1 問だけ試すページの下に置く、LP へ戻るリンクと練習の入口
 * 練習で試す導線
 *
 * 体験ページ（/try/agari-score）と早見表の連動サンプル（/reference/demo）で共有する。
 * どちらも LP から開く 1 問きりのページで、試したあとの行き先を持たない。
 *
 * 練習は、答え合わせで正解の点数を押すと点数表・翻数の内訳の役名を押すと
 * 役一覧が開く（体験・連動サンプルと同じ答え合わせの部品を使う）ものに限る。
 * 無料の点数即答・満貫以上の点数計算を先に置き、回数制限（Pro で無制限）の
 * 掛かる和了形・聴牌形の点数計算（練習一覧の「実戦練習」と同じカード）を
 * 後に並べる。残り回数はクライアントで引くので、置いたページを動的にしない。
 *
 * LP へ戻るリンクは今の言語の LP へ張る（`resolveNavTargetFor`。英語なら `/en`）。
 * 言語は `currentLocale()` で自分で取る — 置いたページの `prepareRouteLocale` が
 * 先に走る前提で、headers を読まないので静的生成を保つ。練習のカードとバナーは
 * 自分で言語を取る共有の部品で、行き先の公開状態もそちらが見る。
 */
export async function TryPracticeLinks() {
  const [t, tNav, locale] = await Promise.all([
    getTranslations("practice.tryLinks"),
    getTranslations("nav"),
    currentLocale(),
  ]);
  const home = resolveNavTargetFor("/", locale);

  return (
    <>
      <div className="mt-10 text-center">
        <LocaleNavLink
          navTarget={home}
          linkKind="plain"
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          {t("backToHome")}
          {home.crossLocale && (
            <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
          )}
        </LocaleNavLink>
      </div>
      <section className="mt-10 space-y-4">
        <SectionTitle>{t("title")}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <CatalogPracticeCard slug="score-calculation" />
          <CatalogPracticeCard slug="mangan-score-calculation" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AgariScorePracticeBanner />
          <TenpaiScorePracticeBanner />
        </div>
      </section>
    </>
  );
}
