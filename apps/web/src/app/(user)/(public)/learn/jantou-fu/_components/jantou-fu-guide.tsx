import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { TileExample } from "./tile-example";

export async function JantouFuGuide() {
  const t = await getTranslations("jantouFu.learn");

  return (
    <div className="space-y-10">
      {/* What is jantou */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsJantou")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t.rich("whatIsJantouBody", { br: () => <br /> })}
        </p>
      </section>

      {/* Yakuhai jantou */}
      <section className="space-y-4">
        <SectionTitle>{t("yakuhaiTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t.rich("yakuhaiBody", { br: () => <br /> })}
        </p>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("sangenExamples")}
          </h3>
          <TileExample
            tiles={[HaiKind.Haku, HaiKind.Haku]}
            fu={2}
            label={t("labelHaku")}
          />
          <TileExample
            tiles={[HaiKind.Hatsu, HaiKind.Hatsu]}
            fu={2}
            label={t("labelHatsu")}
          />
          <TileExample
            tiles={[HaiKind.Chun, HaiKind.Chun]}
            fu={2}
            label={t("labelChun")}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("kazeExamples")}
          </h3>
          <TileExample
            tiles={[HaiKind.Ton, HaiKind.Ton]}
            fu={2}
            label={t("labelBakaze")}
          />
          <TileExample
            tiles={[HaiKind.Nan, HaiKind.Nan]}
            fu={2}
            label={t("labelJikaze")}
          />
        </div>
      </section>

      {/* No fu */}
      <section className="space-y-4">
        <SectionTitle>{t("noFuTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("noFuBody")}
        </p>

        <div className="space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {t("noFuExamples")}
          </h3>
          <TileExample
            tiles={[HaiKind.ManZu1, HaiKind.ManZu1]}
            fu={0}
            label={t("labelSuuhaiManzu")}
          />
          <TileExample
            tiles={[HaiKind.PinZu5, HaiKind.PinZu5]}
            fu={0}
            label={t("labelSuuhaiPinzu")}
          />
          <TileExample
            tiles={[HaiKind.Sha, HaiKind.Sha]}
            fu={0}
            label={t("labelOtakaze")}
          />
        </div>
      </section>

      {/* Column: renfonpai */}
      <aside className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
          {t("columnLabel")}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-surface-900">
          {t("columnTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-surface-700">
          {t.rich("columnBody", { br: () => <br /> })}
        </p>
      </aside>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={(value) => t("fuUnit", { value })}
        rows={[
          { label: t("rowSangen"), fu: 2 },
          { label: t("rowBakaze"), fu: 2 },
          { label: t("rowJikaze"), fu: 2 },
          { label: t("rowOther"), fu: 0 },
        ]}
      />
    </div>
  );
}
