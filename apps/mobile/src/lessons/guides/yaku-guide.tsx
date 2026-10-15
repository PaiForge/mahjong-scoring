import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { REFERENCE_YAKU_PATH } from "@mahjong-scoring/features/routes";

import { TextLink } from "../../components/text-link";

import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideNote, GuideParagraph } from "../components/guide-text";
import { YakuNakiComparisonTable } from "../components/score-tables";

/**
 * 役と翻数 — 役セクション（web の `YakuGuide`）
 *
 * 本文で挙げた役の門前と鳴きの翻数の比較表（各役名が役一覧のその役への
 * リンク）の下に、残りの役を見る役一覧全体へのリンクを置く（web と同じ）。
 */
export function YakuGuide() {
  const t = useTranslations("yaku.learn");
  const router = useRouter();
  return (
    <GuideBody>
      <GuideSection title={t("whatIsYakuTitle")}>
        <GuideParagraph>{t("whatIsYakuBody1")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody2")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody3")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("menzenNakiTitle")}>
        <GuideParagraph>{t("menzenNakiBody1")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody2")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody3")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody4")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("summaryTitle")}>
        <GuideParagraph>{t("summaryBody")}</GuideParagraph>
        <YakuNakiComparisonTable />
        <GuideNote>{t("summaryNote")}</GuideNote>
        <TextLink onPress={() => router.push(REFERENCE_YAKU_PATH)}>
          {t("referenceLink")}
        </TextLink>
      </GuideSection>
    </GuideBody>
  );
}
