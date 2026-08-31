import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { MachiTiles } from "./machi-tiles";

export async function MachiFuGuide() {
  // 待ちは手の内と和了牌を並べるため、牌の列だけ他章の「牌」から見出しを差し替える。
  const { t, tableColumns } = await loadExampleTableColumns("machiFu.learn", {
    colTilesKey: "colMachi",
  });

  return (
    <div className="space-y-10">
      {/* What is machi fu */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsMachi")}</SectionTitle>
        <GuideParagraph>{t("whatIsMachiBody")}</GuideParagraph>
      </section>

      {/* 2 fu waits */}
      <section className="space-y-4">
        <SectionTitle>{t("twoFuTitle")}</SectionTitle>
        <GuideParagraph>{t("twoFuBody")}</GuideParagraph>

        <ExampleTable
          title={t("twoFuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.ManZu2, HaiKind.ManZu4]}
                  agariHai={HaiKind.ManZu3}
                />
              ),
              label: t("kanchanLabel"),
              fu: 2,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.PinZu1, HaiKind.PinZu2]}
                  agariHai={HaiKind.PinZu3}
                />
              ),
              label: t("penchanLabel"),
              fu: 2,
            },
            {
              tiles: (
                <MachiTiles tiles={[HaiKind.Haku]} agariHai={HaiKind.Haku} />
              ),
              label: t("tankiLabel"),
              fu: 2,
            },
          ]}
        />
      </section>

      {/* 0 fu waits */}
      <section className="space-y-4">
        <SectionTitle>{t("zeroFuTitle")}</SectionTitle>
        <GuideParagraph>{t("zeroFuBody")}</GuideParagraph>

        <ExampleTable
          title={t("zeroFuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.SouZu6, HaiKind.SouZu7]}
                  agariHai={HaiKind.SouZu5}
                />
              ),
              label: t("ryanmenLabel"),
              fu: 0,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.Ton, HaiKind.Ton, HaiKind.Haku, HaiKind.Haku]}
                  agariHai={HaiKind.Ton}
                />
              ),
              label: t("shanponLabel"),
              fu: 0,
            },
          ]}
        />

        <GuideNote>{t("nobetanNote")}</GuideNote>
      </section>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={tableColumns.formatFu}
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
