import { HaiKind } from "@mahjong-scoring/core";
import {
  exampleAnkan,
  exampleAnkou,
  exampleMinkan,
  exampleMinkou,
  exampleShuntsu,
} from "@mahjong-scoring/features/board/example-mentsu";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { MentsuSet } from "@/app/(user)/_components/mentsu-set";

export async function MentsuFuGuide() {
  const { t, tableColumns } = await loadExampleTableColumns("mentsuFu.learn");

  return (
    <div className="space-y-10">
      {/* What is mentsu fu */}
      <GuideSection title={t("whatIsMentsuFu")}>
        <GuideParagraph>{t("whatIsMentsuFuBody")}</GuideParagraph>
      </GuideSection>

      {/* Shuntsu: 0 fu */}
      <GuideSection title={t("shuntsuTitle")}>
        <GuideParagraph>{t("shuntsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("shuntsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleShuntsu([
                    HaiKind.ManZu2,
                    HaiKind.ManZu3,
                    HaiKind.ManZu4,
                  ])}
                />
              ),
              label: t("shuntsuLabel"),
              fu: 0,
            },
          ]}
        />
      </GuideSection>

      {/* Koutsu: 2-8 fu */}
      <GuideSection title={t("koutsuTitle")}>
        <GuideParagraph>{t("koutsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("koutsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <MentsuSet mentsu={exampleMinkou(HaiKind.ManZu5)} />,
              label: t("koutsuOpenSimpleLabel"),
              fu: 2,
            },
            {
              tiles: <MentsuSet mentsu={exampleAnkou(HaiKind.PinZu3)} />,
              label: t("koutsuClosedSimpleLabel"),
              fu: 4,
            },
            {
              tiles: <MentsuSet mentsu={exampleMinkou(HaiKind.Haku)} />,
              label: t("koutsuOpenYaochuLabel"),
              fu: 4,
            },
            {
              tiles: <MentsuSet mentsu={exampleAnkou(HaiKind.ManZu1)} />,
              label: t("koutsuClosedYaochuLabel"),
              fu: 8,
            },
          ]}
        />
      </GuideSection>

      {/* Kantsu: 8-32 fu */}
      <GuideSection title={t("kantsuTitle")}>
        <GuideParagraph preLine>{t("kantsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("kantsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: <MentsuSet mentsu={exampleMinkan(HaiKind.SouZu5)} />,
              label: t("kantsuOpenSimpleLabel"),
              fu: 8,
            },
            {
              tiles: <MentsuSet mentsu={exampleAnkan(HaiKind.PinZu7)} />,
              label: t("kantsuClosedSimpleLabel"),
              fu: 16,
            },
            {
              tiles: <MentsuSet mentsu={exampleMinkan(HaiKind.Chun)} />,
              label: t("kantsuOpenYaochuLabel"),
              fu: 16,
            },
            {
              tiles: <MentsuSet mentsu={exampleAnkan(HaiKind.PinZu9)} />,
              label: t("kantsuClosedYaochuLabel"),
              fu: 32,
            },
          ]}
        />
      </GuideSection>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={tableColumns.formatFu}
        rows={[
          { label: t("rowShuntsu"), fu: 0 },
          { label: t("rowOpenSimpleKoutsu"), fu: 2 },
          { label: t("rowClosedSimpleKoutsuOrOpenYaochuKoutsu"), fu: 4 },
          { label: t("rowClosedYaochuKoutsuOrOpenSimpleKantsu"), fu: 8 },
          { label: t("rowClosedSimpleKantsuOrOpenYaochuKantsu"), fu: 16 },
          { label: t("rowClosedYaochuKantsu"), fu: 32 },
        ]}
      />
    </div>
  );
}
