import { HaiKind } from "@mahjong-scoring/core";
import { PREFERENCE_ANCHORS } from "@/app/(user)/(public)/preferences/_lib/anchors";
import { ChapterColumn } from "../../_components/chapter-column";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { TileSet } from "@/app/(user)/_components/tile-set";

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
      </GuideSection>

      {/* No fu */}
      <GuideSection title={t("noFuTitle")}>
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
