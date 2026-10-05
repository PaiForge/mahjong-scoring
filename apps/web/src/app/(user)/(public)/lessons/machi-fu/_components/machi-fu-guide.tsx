import { HaiKind } from "@mahjong-scoring/core";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { MachiTiles } from "./machi-tiles";

export async function MachiFuGuide() {
  // 待ちは手の内と和了牌を並べるため、牌の列だけ他章の「牌」から見出しを差し替える。
  const { t, tableColumns } = await loadExampleTableColumns("machiFu.learn", {
    colTilesKey: "colMachi",
  });

  return (
    <div className="space-y-10">
      {/* What is machi fu */}
      <GuideSection title={t("whatIsMachi")}>
        <GuideParagraph>{t("whatIsMachiBody")}</GuideParagraph>
      </GuideSection>

      {/* 2 fu waits */}
      <GuideSection title={t("twoFuTitle")}>
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
      </GuideSection>

      {/* 0 fu waits */}
      <GuideSection title={t("zeroFuTitle")}>
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
      </GuideSection>

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
