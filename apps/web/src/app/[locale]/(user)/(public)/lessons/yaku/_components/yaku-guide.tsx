import { currentLocale } from "@/i18n/current-locale";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { GuideFigure } from "../../_components/guide-figure";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { YakuNakiComparisonTable } from "../../_components/yaku-naki-comparison-table";
import { REFERENCE_YAKU_PATH } from "@mahjong-scoring/features/routes";

export async function YakuGuide() {
  const [t, tNav, locale] = await Promise.all([
    getTranslations("yaku.learn"),
    getTranslations("nav.language"),
    currentLocale(),
  ]);
  const referenceTarget = resolveNavTargetFor(REFERENCE_YAKU_PATH, locale);

  return (
    <div className="space-y-10">
      {/* 役と翻数 */}
      <GuideSection title={t("whatIsYakuTitle")}>
        <GuideParagraph>{t("whatIsYakuBody1")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("whatIsYakuBody3")}</GuideParagraph>
      </GuideSection>

      {/* 門前と鳴き（食い下がり） */}
      <GuideSection title={t("menzenNakiTitle")}>
        <GuideParagraph preLine>{t("menzenNakiBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("menzenNakiBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("menzenNakiBody3")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody4")}</GuideParagraph>
      </GuideSection>

      {/* 本文で挙げた役の門前と鳴きの翻数（各役名が早見表の該当カードへのリンク）＋ 残りの役は早見表へ */}
      <GuideSection title={t("summaryTitle")}>
        <GuideParagraph>{t("summaryBody")}</GuideParagraph>
        <GuideFigure caption={t("summaryNote")}>
          <YakuNakiComparisonTable />
        </GuideFigure>

        <LocaleNavLink
          navTarget={referenceTarget}
          linkKind="plain"
          className={`block text-center text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("referenceLink")}
          {referenceTarget.crossLocale && (
            <JapaneseOnlyMark label={tNav("japaneseOnly")} />
          )}
        </LocaleNavLink>
      </GuideSection>
    </div>
  );
}
