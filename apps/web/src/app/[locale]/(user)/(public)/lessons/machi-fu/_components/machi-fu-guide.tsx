import { MACHI_FU_EXAMPLES } from "@mahjong-scoring/features/lessons/fu-guide-examples";
import { MACHI_FU_SUMMARY_ROWS } from "@mahjong-scoring/features/lessons/fu-summary-rows";
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
                  tiles={MACHI_FU_EXAMPLES.kanchan.tiles}
                  agariHai={MACHI_FU_EXAMPLES.kanchan.agariHai}
                />
              ),
              label: t("kanchanLabel"),
              fu: MACHI_FU_EXAMPLES.kanchan.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.penchan.tiles}
                  agariHai={MACHI_FU_EXAMPLES.penchan.agariHai}
                />
              ),
              label: t("penchanLabel"),
              fu: MACHI_FU_EXAMPLES.penchan.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.tanki.tiles}
                  agariHai={MACHI_FU_EXAMPLES.tanki.agariHai}
                />
              ),
              label: t("tankiLabel"),
              fu: MACHI_FU_EXAMPLES.tanki.fu,
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
                  tiles={MACHI_FU_EXAMPLES.ryanmen.tiles}
                  agariHai={MACHI_FU_EXAMPLES.ryanmen.agariHai}
                />
              ),
              label: t("ryanmenLabel"),
              fu: MACHI_FU_EXAMPLES.ryanmen.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.shanpon.tiles}
                  agariHai={MACHI_FU_EXAMPLES.shanpon.agariHai}
                />
              ),
              label: t("shanponLabel"),
              fu: MACHI_FU_EXAMPLES.shanpon.fu,
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
        rows={MACHI_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </div>
  );
}
