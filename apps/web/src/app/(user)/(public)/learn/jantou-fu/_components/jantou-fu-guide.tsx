import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ExampleTable } from "../../_components/example-table";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { TileSet } from "../../_components/tile-set";

export async function JantouFuGuide() {
  const [t, tTable] = await Promise.all([
    getTranslations("jantouFu.learn"),
    getTranslations("learnCurriculum.exampleTable"),
  ]);

  const formatFu = (value: number) => t("fuUnit", { value });
  const tableColumns = {
    colTiles: tTable("colTiles"),
    colKind: tTable("colKind"),
    colFu: tTable("colFu"),
    formatFu,
  };

  return (
    <div className="space-y-10">
      {/* What is jantou */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsJantou")}</SectionTitle>
        <GuideParagraph>
          {t.rich("whatIsJantouBody", { br: () => <br /> })}
        </GuideParagraph>
      </section>

      {/* Yakuhai jantou */}
      <section className="space-y-4">
        <SectionTitle>{t("yakuhaiTitle")}</SectionTitle>
        <GuideParagraph>
          {t.rich("yakuhaiBody", { br: () => <br /> })}
        </GuideParagraph>

        <ExampleTable
          title={t("sangenExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={[HaiKind.Haku, HaiKind.Haku]} />,
              label: t("labelHaku"),
              fu: 2,
            },
            {
              tiles: <TileSet tiles={[HaiKind.Hatsu, HaiKind.Hatsu]} />,
              label: t("labelHatsu"),
              fu: 2,
            },
            {
              tiles: <TileSet tiles={[HaiKind.Chun, HaiKind.Chun]} />,
              label: t("labelChun"),
              fu: 2,
            },
          ]}
        />

        <ExampleTable
          title={t("kazeExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={[HaiKind.Ton, HaiKind.Ton]} />,
              label: t("labelBakaze"),
              fu: 2,
            },
            {
              tiles: <TileSet tiles={[HaiKind.Nan, HaiKind.Nan]} />,
              label: t("labelJikaze"),
              fu: 2,
            },
          ]}
        />
      </section>

      {/* No fu */}
      <section className="space-y-4">
        <SectionTitle>{t("noFuTitle")}</SectionTitle>
        <GuideParagraph>{t("noFuBody")}</GuideParagraph>

        <ExampleTable
          title={t("noFuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={[HaiKind.ManZu1, HaiKind.ManZu1]} />,
              label: t("labelSuuhaiManzu"),
              fu: 0,
            },
            {
              tiles: <TileSet tiles={[HaiKind.PinZu5, HaiKind.PinZu5]} />,
              label: t("labelSuuhaiPinzu"),
              fu: 0,
            },
            {
              tiles: <TileSet tiles={[HaiKind.Sha, HaiKind.Sha]} />,
              label: t("labelOtakaze"),
              fu: 0,
            },
          ]}
        />
      </section>

      {/* Column: renfonpai */}
      <aside className="rounded-xl border-3 border-amber-500 bg-amber-50/60 p-5">
        <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
          {t("columnLabel")}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-surface-900">
          {t("columnTitle")}
        </h3>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </aside>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={formatFu}
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
