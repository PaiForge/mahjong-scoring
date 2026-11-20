import { JANTOU_FU_EXAMPLES } from "@mahjong-scoring/features/lessons/fu-guide-examples";
import { JANTOU_FU_SUMMARY_ROWS } from "@mahjong-scoring/features/lessons/fu-summary-rows";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";
import { ChapterColumn } from "../../_components/chapter-column";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { TileSet } from "@/app/[locale]/(user)/_components/tile-set";

export async function JantouFuGuide() {
  const { t, tableColumns } = await loadExampleTableColumns("jantouFu.learn");

  return (
    <div className="space-y-10">
      {/* What is jantou */}
      <GuideSection title={t("whatIsJantou")}>
        <GuideParagraph preLine>{t("whatIsJantouBody")}</GuideParagraph>
      </GuideSection>

      {/* Yakuhai jantou */}
      <GuideSection title={t("yakuhaiTitle")}>
        <GuideParagraph preLine>{t("yakuhaiBody")}</GuideParagraph>

        <ExampleTable
          title={t("sangenExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.haku.tiles} />,
              label: t("labelHaku"),
              fu: JANTOU_FU_EXAMPLES.haku.fu,
            },
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.hatsu.tiles} />,
              label: t("labelHatsu"),
              fu: JANTOU_FU_EXAMPLES.hatsu.fu,
            },
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.chun.tiles} />,
              label: t("labelChun"),
              fu: JANTOU_FU_EXAMPLES.chun.fu,
            },
          ]}
        />

        <ExampleTable
          title={t("kazeExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.bakaze.tiles} />,
              label: t("labelBakaze"),
              fu: JANTOU_FU_EXAMPLES.bakaze.fu,
            },
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.jikaze.tiles} />,
              label: t("labelJikaze"),
              fu: JANTOU_FU_EXAMPLES.jikaze.fu,
            },
          ]}
        />
      </GuideSection>

      {/* No fu */}
      <GuideSection title={t("noFuTitle")}>
        <GuideParagraph>{t("noFuBody")}</GuideParagraph>

        <ExampleTable
          title={t("noFuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.suuhaiManzu.tiles} />,
              label: t("labelSuuhaiManzu"),
              fu: JANTOU_FU_EXAMPLES.suuhaiManzu.fu,
            },
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.suuhaiPinzu.tiles} />,
              label: t("labelSuuhaiPinzu"),
              fu: JANTOU_FU_EXAMPLES.suuhaiPinzu.fu,
            },
            {
              tiles: <TileSet tiles={JANTOU_FU_EXAMPLES.otakaze.tiles} />,
              label: t("labelOtakaze"),
              fu: JANTOU_FU_EXAMPLES.otakaze.fu,
            },
          ]}
        />
      </GuideSection>

      {/* Column: renfonpai */}
      <ChapterColumn t={t}>
        <PreferenceSettingsNote t={t} anchor={PREFERENCE_ANCHORS.renfonpai} />
      </ChapterColumn>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={tableColumns.formatFu}
        rows={JANTOU_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </div>
  );
}
