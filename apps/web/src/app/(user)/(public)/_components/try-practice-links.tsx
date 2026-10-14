import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { CatalogPracticeCard } from "@/app/(user)/(public)/practice/_components/catalog-practice-card";
import {
  AgariScorePracticeBanner,
  TenpaiScorePracticeBanner,
} from "@/app/(user)/(public)/practice/_components/practical-practice-banners";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

/**
 * 1 問だけ試すページの下に置く、LP へ戻るリンクと練習の入口
 * 練習で試す導線
 *
 * 体験ページ（/try）と早見表の連動サンプル（/reference/demo）で共有する。
 * どちらも LP から開く 1 問きりのページで、試したあとの行き先を持たない。
 *
 * 練習は、答え合わせで正解の点数を押すと点数表・翻数の内訳の役名を押すと
 * 役一覧が開く（体験・連動サンプルと同じ答え合わせの部品を使う）ものに限る。
 * 無料の点数即答・満貫以上の点数計算を先に置き、回数制限（Pro で無制限）の
 * 掛かる和了形・聴牌形の点数計算（練習一覧の「実戦練習」と同じカード）を
 * 後に並べる。残り回数はクライアントで引くので、置いたページを動的にしない。
 */
export async function TryPracticeLinks() {
  const t = await getTranslations("practice.tryLinks");

  return (
    <>
      <div className="mt-10 text-center">
        <Link href="/" className={`text-sm ${TEXT_LINK_CLASSES}`}>
          {t("backToHome")}
        </Link>
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
