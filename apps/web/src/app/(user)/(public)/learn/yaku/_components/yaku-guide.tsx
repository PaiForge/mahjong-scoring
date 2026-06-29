import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";
import { GuideParagraph } from "../../_components/guide-paragraph";

export async function YakuGuide() {
  const t = await getTranslations("yaku.learn");

  return (
    <div className="space-y-10">
      {/* 役は翻数のもと（前章までの流れと接続） */}
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

      {/* 翻数別の役まとめ（早見表とは別の切り口のテキスト一覧） */}
      <section className="space-y-4">
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <div className="overflow-hidden rounded-xl border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="px-4 py-3 text-left font-medium text-surface-600">
                  {t("colHan")}
                </th>
                <th className="px-4 py-3 text-left font-medium text-surface-600">
                  {t("colYakuList")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">
                  {t("row1han")}
                </td>
                <td className="px-4 py-3 text-surface-700">
                  {t("row1hanYaku")}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">
                  {t("row2han")}
                </td>
                <td className="px-4 py-3 text-surface-700">
                  {t("row2hanYaku")}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">
                  {t("row3han")}
                </td>
                <td className="px-4 py-3 text-surface-700">
                  {t("row3hanYaku")}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">
                  {t("row6han")}
                </td>
                <td className="px-4 py-3 text-surface-700">
                  {t("row6hanYaku")}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">
                  {t("rowYakuman")}
                </td>
                <td className="px-4 py-3 text-surface-700">
                  {t("rowYakumanYaku")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 全役の手牌例は早見表へ委譲（重複回避＋相互リンク） */}
      <section className="space-y-4">
        <SectionTitle>{t("referenceTitle")}</SectionTitle>
        <GuideParagraph>{t("referenceBody")}</GuideParagraph>
        <Link
          href="/reference/yaku"
          className="group flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-5 transition-colors hover:border-primary-300"
        >
          <span className="flex-1 font-medium text-surface-900 transition-colors group-hover:text-primary-700">
            {t("referenceLink")}
          </span>
          <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
        </Link>
      </section>

      {/* 練習への導線（practiceHrefs カードはレイアウト側が描画） */}
      <section className="space-y-4">
        <SectionTitle>{t("nextStepTitle")}</SectionTitle>
        <GuideParagraph>{t("nextStepBody")}</GuideParagraph>
      </section>
    </div>
  );
}
