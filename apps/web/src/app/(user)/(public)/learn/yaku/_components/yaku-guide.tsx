import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";

export async function YakuGuide() {
  const t = await getTranslations("yaku.learn");

  return (
    <div className="space-y-10">
      {/* What are yaku */}
      <section>
        <SectionTitle>{t("whatIsYaku")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("whatIsYakuBody")}
        </p>
      </section>

      {/* 1翻役 */}
      <section>
        <SectionTitle>{t("ichihanTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("ichihanBody")}
        </p>
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-5">
          <ul className="space-y-2 text-sm text-surface-700">
            <li><span className="font-semibold">{t("yakuRiichi")}</span> — {t("yakuRiichiDesc")}</li>
            <li><span className="font-semibold">{t("yakuMenzenTsumo")}</span> — {t("yakuMenzenTsumoDesc")}</li>
            <li><span className="font-semibold">{t("yakuTanyao")}</span> — {t("yakuTanyaoDesc")}</li>
            <li><span className="font-semibold">{t("yakuPinfu")}</span> — {t("yakuPinfuDesc")}</li>
            <li><span className="font-semibold">{t("yakuIipeikou")}</span> — {t("yakuIipeikouDesc")}</li>
            <li><span className="font-semibold">{t("yakuYakuhai")}</span> — {t("yakuYakuhaiDesc")}</li>
          </ul>
        </div>
      </section>

      {/* 2翻役 */}
      <section>
        <SectionTitle>{t("nihanTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("nihanBody")}
        </p>
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-5">
          <ul className="space-y-2 text-sm text-surface-700">
            <li><span className="font-semibold">{t("yakuSanshoku")}</span> — {t("yakuSanshokuDesc")}</li>
            <li><span className="font-semibold">{t("yakuIkkitsuukan")}</span> — {t("yakuIkkitsuukanDesc")}</li>
            <li><span className="font-semibold">{t("yakuHonchan")}</span> — {t("yakuHonchanDesc")}</li>
            <li><span className="font-semibold">{t("yakuChiitoitsu")}</span> — {t("yakuChiitoitsuDesc")}</li>
            <li><span className="font-semibold">{t("yakuToitoi")}</span> — {t("yakuToitoiDesc")}</li>
            <li><span className="font-semibold">{t("yakuSanankou")}</span> — {t("yakuSanankouDesc")}</li>
            <li><span className="font-semibold">{t("yakuSanshokuDoukou")}</span> — {t("yakuSanshokuDoukouDesc")}</li>
            <li><span className="font-semibold">{t("yakuSankantsu")}</span> — {t("yakuSankantsuDesc")}</li>
            <li><span className="font-semibold">{t("yakuShousangen")}</span> — {t("yakuShousangenDesc")}</li>
            <li><span className="font-semibold">{t("yakuHonroutou")}</span> — {t("yakuHonroutouDesc")}</li>
          </ul>
        </div>
      </section>

      {/* 3翻役 */}
      <section>
        <SectionTitle>{t("sanhanTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("sanhanBody")}
        </p>
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-5">
          <ul className="space-y-2 text-sm text-surface-700">
            <li><span className="font-semibold">{t("yakuHonitsu")}</span> — {t("yakuHonitsuDesc")}</li>
            <li><span className="font-semibold">{t("yakuJunchan")}</span> — {t("yakuJunchanDesc")}</li>
            <li><span className="font-semibold">{t("yakuRyanpeikou")}</span> — {t("yakuRyanpeikouDesc")}</li>
          </ul>
        </div>
      </section>

      {/* 6翻役 */}
      <section>
        <SectionTitle>{t("rokuhanTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("rokuhanBody")}
        </p>
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-5">
          <ul className="space-y-2 text-sm text-surface-700">
            <li><span className="font-semibold">{t("yakuChinitsu")}</span> — {t("yakuChinitsuDesc")}</li>
          </ul>
        </div>
      </section>

      {/* 役満 */}
      <section>
        <SectionTitle>{t("yakumanTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("yakumanBody")}
        </p>
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-5">
          <ul className="space-y-2 text-sm text-surface-700">
            <li><span className="font-semibold">{t("yakuKokushi")}</span> — {t("yakuKokushiDesc")}</li>
            <li><span className="font-semibold">{t("yakuSuuankou")}</span> — {t("yakuSuuankouDesc")}</li>
            <li><span className="font-semibold">{t("yakuDaisangen")}</span> — {t("yakuDaisangenDesc")}</li>
            <li><span className="font-semibold">{t("yakuShousuushii")}</span> — {t("yakuShousuushiiDesc")}</li>
            <li><span className="font-semibold">{t("yakuDaisuushii")}</span> — {t("yakuDaisuushiiDesc")}</li>
            <li><span className="font-semibold">{t("yakuTsuuiisou")}</span> — {t("yakuTsuuiisouDesc")}</li>
            <li><span className="font-semibold">{t("yakuChinroutou")}</span> — {t("yakuChinroutouDesc")}</li>
            <li><span className="font-semibold">{t("yakuRyuuiisou")}</span> — {t("yakuRyuuiisouDesc")}</li>
            <li><span className="font-semibold">{t("yakuChuuren")}</span> — {t("yakuChuurenDesc")}</li>
            <li><span className="font-semibold">{t("yakuSuukantsu")}</span> — {t("yakuSuukantsuDesc")}</li>
          </ul>
        </div>
      </section>

      {/* Summary table */}
      <section>
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <div className="mt-4 overflow-hidden rounded-xl border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="px-4 py-3 text-left font-medium text-surface-600">{t("colHan")}</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600">{t("colYakuList")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">{t("row1han")}</td>
                <td className="px-4 py-3 text-surface-700">{t("row1hanYaku")}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">{t("row2han")}</td>
                <td className="px-4 py-3 text-surface-700">{t("row2hanYaku")}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">{t("row3han")}</td>
                <td className="px-4 py-3 text-surface-700">{t("row3hanYaku")}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">{t("row6han")}</td>
                <td className="px-4 py-3 text-surface-700">{t("row6hanYaku")}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold text-primary-600">{t("rowYakuman")}</td>
                <td className="px-4 py-3 text-surface-700">{t("rowYakumanYaku")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
