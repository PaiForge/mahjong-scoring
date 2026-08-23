import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { YakuHanTable } from "./yaku-han-table";

export async function YakuGuide() {
  const t = await getTranslations("yaku.learn");

  return (
    <div className="space-y-10">
      {/* 役と翻数（前章までの流れと接続） */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsYakuTitle")}</SectionTitle>
        <GuideParagraph>{t("whatIsYakuBody1")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody2")}</GuideParagraph>
        <GuideParagraph>{t("whatIsYakuBody3")}</GuideParagraph>
      </section>

      {/* 門前と鳴き（食い下がり） */}
      <section className="space-y-4">
        <SectionTitle>{t("menzenNakiTitle")}</SectionTitle>
        <GuideParagraph>{t("menzenNakiBody1")}</GuideParagraph>
        <GuideParagraph>{t("menzenNakiBody2")}</GuideParagraph>
      </section>

      {/* 翻数別の役まとめ（各役名が早見表の該当カードへのリンク）＋ 早見表全体へのリンク */}
      <section className="space-y-4">
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <YakuHanTable />

        <Link
          href="/reference/yaku"
          className={`block text-center text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("referenceLink")}
        </Link>
      </section>
    </div>
  );
}
