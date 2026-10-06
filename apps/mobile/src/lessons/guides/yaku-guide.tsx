import { useTranslations } from "use-intl";

import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideParagraph } from "../components/guide-text";
import { YakuHanTable } from "../components/score-tables";

/**
 * 役と翻数 — 役セクション（web の `YakuGuide`）
 *
 * web は表の下に役一覧（`/reference/yaku`）へのリンクを置くが、モバイルには
 * 役一覧がまだ無いので出さない。
 */
export function YakuGuide() {
  const t = useTranslations("yaku.learn");
  return (
    <GuideBody>
      <GuideSection title={t("whatIsYakuTitle")}>
        <GuideParagraph>{t("whatIsYakuBody1")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody2")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody3")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody4")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("menzenNakiTitle")}>
        <GuideParagraph>{t("menzenNakiBody1")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody2")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody3")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("summaryTitle")}>
        <GuideParagraph>{t("summaryBody")}</GuideParagraph>
        <YakuHanTable />
      </GuideSection>
    </GuideBody>
  );
}
