import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";

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

      {/* 翻数別の役まとめ（テキスト一覧）＋ 手牌例の早見表へのリンク */}
      <section className="space-y-4">
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <DataTable
          header={
            <>
              <DataTableHeaderCell align="left">
                <span className="whitespace-nowrap">{t("colHan")}</span>
              </DataTableHeaderCell>
              <DataTableHeaderCell align="left">
                {t("colYakuList")}
              </DataTableHeaderCell>
            </>
          }
        >
          <tr className="bg-white">
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-600">
              {t("row1han")}
            </td>
            <td className="px-4 py-3 text-surface-700">{t("row1hanYaku")}</td>
          </tr>
          <tr className="bg-white">
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-600">
              {t("row2han")}
            </td>
            <td className="px-4 py-3 text-surface-700">{t("row2hanYaku")}</td>
          </tr>
          <tr className="bg-white">
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-600">
              {t("row3han")}
            </td>
            <td className="px-4 py-3 text-surface-700">{t("row3hanYaku")}</td>
          </tr>
          <tr className="bg-white">
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-600">
              {t("row6han")}
            </td>
            <td className="px-4 py-3 text-surface-700">{t("row6hanYaku")}</td>
          </tr>
          <tr className="bg-white">
            <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-600">
              {t("rowYakuman")}
            </td>
            <td className="px-4 py-3 text-surface-700">
              {t("rowYakumanYaku")}
            </td>
          </tr>
        </DataTable>

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
