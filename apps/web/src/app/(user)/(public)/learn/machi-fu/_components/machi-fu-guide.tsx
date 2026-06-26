import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { MachiExample } from "./machi-example";

export async function MachiFuGuide() {
  const t = await getTranslations("machiFu.learn");

  return (
    <div className="space-y-10">
      {/* What is machi fu */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsMachi")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("whatIsMachiBody")}
        </p>
      </section>

      {/* 2 fu waits */}
      <section className="space-y-4">
        <SectionTitle>{t("twoFuTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("twoFuBody")}
        </p>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-5">
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
      <section className="space-y-4">
        <SectionTitle>{t("zeroFuTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("zeroFuBody")}
        </p>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-5">
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

        <p className="text-xs text-surface-400">{t("nobetanNote")}</p>
      </section>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={(value) => t("fuUnit", { value })}
        rows={[
          { label: t("rowKanchan"), fu: 2 },
          { label: t("rowPenchan"), fu: 2 },
          { label: t("rowTanki"), fu: 2 },
          { label: t("rowRyanmen"), fu: 0 },
          { label: t("rowShanpon"), fu: 0 },
        ]}
      />
    </div>
  );
}
