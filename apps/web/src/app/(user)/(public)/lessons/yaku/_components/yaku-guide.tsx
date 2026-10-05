import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { YakuHanTable } from "../../_components/yaku-han-table";

export async function YakuGuide() {
  const t = await getTranslations("yaku.learn");

  return (
    <div className="space-y-10">
      {/* 役と翻数（前章までの流れと接続） */}
      <GuideSection title={t("whatIsYakuTitle")}>
        <GuideParagraph>{t("whatIsYakuBody1")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody2")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("whatIsYakuBody4")}</GuideParagraph>
      </GuideSection>

      {/* 門前と鳴き（食い下がり） */}
      <GuideSection title={t("menzenNakiTitle")}>
        <GuideParagraph>{t("menzenNakiBody1")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody2")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody3")}</GuideParagraph>
      </GuideSection>

      {/* 翻数別の役まとめ（各役名が早見表の該当カードへのリンク）＋ 早見表全体へのリンク */}
      <GuideSection title={t("summaryTitle")}>
        <GuideParagraph>{t("summaryBody")}</GuideParagraph>
        <YakuHanTable />

        <Link
          href="/reference/yaku"
          className={`block text-center text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("referenceLink")}
        </Link>
      </GuideSection>
    </div>
  );
}
