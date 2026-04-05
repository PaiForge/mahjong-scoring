import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { MachiExample } from "./machi-example";

export async function MachiFuGuide() {
  const t = await getTranslations("machiFu.learn");

  return (
    <div className="space-y-10">
      {/* What is machi fu */}
      <section>
        <SectionTitle>{t("whatIsMachi")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("whatIsMachiBody")}
        </p>
      </section>

      {/* 2 fu waits */}
      <section>
        <SectionTitle>{t("twoFuTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("twoFuBody")}
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <MachiExample
            tiles={[HaiKind.ManZu2, HaiKind.ManZu4]}
            agariHai={HaiKind.ManZu3}
            fu={2}
            label={t("kanchanLabel")}
          />
          <MachiExample
            tiles={[HaiKind.PinZu1, HaiKind.PinZu2]}
            agariHai={HaiKind.PinZu3}
            fu={2}
            label={t("penchanLabel")}
          />
          <MachiExample
            tiles={[HaiKind.Haku]}
            agariHai={HaiKind.Haku}
            fu={2}
            label={t("tankiLabel")}
          />
        </div>
      </section>

      {/* 0 fu waits */}
      <section>
        <SectionTitle>{t("zeroFuTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("zeroFuBody")}
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <MachiExample
            tiles={[HaiKind.SouZu6, HaiKind.SouZu7]}
            agariHai={HaiKind.SouZu5}
            fu={0}
            label={t("ryanmenLabel")}
          />
          <MachiExample
            tiles={[HaiKind.Ton, HaiKind.Ton, HaiKind.Haku, HaiKind.Haku]}
            agariHai={HaiKind.Ton}
            fu={0}
            label={t("shanponLabel")}
          />
        </div>

        <p className="mt-3 text-xs text-surface-400">
          {t("nobetanNote")}
        </p>
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
                <td className="px-4 py-3 text-surface-900">{t("rowKanchan")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowPenchan")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowTanki")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-500">{t("rowRyanmen")}</td>
                <td className="px-4 py-3 text-right text-surface-400">{t("fuUnit", { value: 0 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-500">{t("rowShanpon")}</td>
                <td className="px-4 py-3 text-right text-surface-400">{t("fuUnit", { value: 0 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
