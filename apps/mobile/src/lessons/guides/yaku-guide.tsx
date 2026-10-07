import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { REFERENCE_YAKU_PATH } from "@mahjong-scoring/features/routes";

import { TextLink } from "../../components/text-link";

import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideParagraph } from "../components/guide-text";
import { YakuHanTable } from "../components/score-tables";

/**
 * 役と翻数 — 役セクション（web の `YakuGuide`）
 *
 * 翻数別の役まとめ（各役名が役一覧のその役へのリンク）の下に、役一覧全体への
 * リンクを置く（web と同じ）。
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
        <TextLink onPress={() => router.push(REFERENCE_YAKU_PATH)}>
          {t("referenceLink")}
        </TextLink>
      </GuideSection>
    </GuideBody>
  );
}
