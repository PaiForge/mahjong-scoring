import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { TileExample } from "./tile-example";

export async function JantouFuGuide() {
  const t = await getTranslations("jantouFu.learn");

  return (
    <div className="space-y-8">
      {/* What is jantou */}
      <section>
        <SectionTitle>
          {t("whatIsJantou")}
        </SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("whatIsJantouBody")}
        </p>
      </section>

      {/* Yakuhai jantou */}
      <section>
        <SectionTitle>
          {t("yakuhaiTitle")}
        </SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("yakuhaiBody")}
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("sangenExamples")}
          </h3>
          <TileExample tiles={[HaiKind.Haku, HaiKind.Haku]} fu={2} label={t("labelHaku")} />
          <TileExample tiles={[HaiKind.Hatsu, HaiKind.Hatsu]} fu={2} label={t("labelHatsu")} />
          <TileExample tiles={[HaiKind.Chun, HaiKind.Chun]} fu={2} label={t("labelChun")} />
        </div>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("kazeExamples")}
          </h3>
          <TileExample tiles={[HaiKind.Ton, HaiKind.Ton]} fu={2} label={t("labelBakaze")} />
          <TileExample tiles={[HaiKind.Nan, HaiKind.Nan]} fu={2} label={t("labelJikaze")} />
        </div>
      </section>

      {/* Renfonpai */}
      <section>
        <SectionTitle>
          {t("renfonpaiTitle")}
        </SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("renfonpaiBody")}
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("renfonpaiExamples")}
          </h3>
          <TileExample tiles={[HaiKind.Ton, HaiKind.Ton]} fu={4} label={t("labelRenfonTon")} />
          <TileExample tiles={[HaiKind.Nan, HaiKind.Nan]} fu={4} label={t("labelRenfonNan")} />
        </div>
      </section>

      {/* No fu */}
      <section>
        <SectionTitle>
          {t("noFuTitle")}
        </SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("noFuBody")}
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("noFuExamples")}
          </h3>
          <TileExample tiles={[HaiKind.ManZu1, HaiKind.ManZu1]} fu={0} label={t("labelSuuhaiManzu")} />
          <TileExample tiles={[HaiKind.PinZu5, HaiKind.PinZu5]} fu={0} label={t("labelSuuhaiPinzu")} />
          <TileExample tiles={[HaiKind.Sha, HaiKind.Sha]} fu={0} label={t("labelOtakaze")} />
        </div>
      </section>

      {/* Summary table */}
      <section>
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <div className="mt-4 overflow-hidden rounded-xl border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="px-4 py-3 text-left font-medium text-surface-600">{t("colType")}</th>
                <th className="px-4 py-3 text-right font-medium text-surface-600">{t("colFu")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowSangen")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowBakaze")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowJikaze")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowRenfonpai")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 4 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-500">{t("rowOther")}</td>
                <td className="px-4 py-3 text-right text-surface-400">{t("fuUnit", { value: 0 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
