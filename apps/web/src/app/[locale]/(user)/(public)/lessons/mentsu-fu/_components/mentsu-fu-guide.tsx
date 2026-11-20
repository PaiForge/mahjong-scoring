import { MENTSU_FU_EXAMPLES } from "@mahjong-scoring/features/lessons/fu-guide-examples";
import { MENTSU_FU_SUMMARY_ROWS } from "@mahjong-scoring/features/lessons/fu-summary-rows";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { MentsuSet } from "@/app/[locale]/(user)/_components/mentsu-set";

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
              tiles: <MentsuSet mentsu={MENTSU_FU_EXAMPLES.shuntsu.mentsu} />,
              label: t("shuntsuLabel"),
              fu: MENTSU_FU_EXAMPLES.shuntsu.fu,
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
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuOpenSimple.mentsu}
                />
              ),
              label: t("koutsuOpenSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuOpenSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuClosedSimple.mentsu}
                />
              ),
              label: t("koutsuClosedSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuClosedSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuOpenYaochu.mentsu}
                />
              ),
              label: t("koutsuOpenYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuOpenYaochu.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuClosedYaochu.mentsu}
                />
              ),
              label: t("koutsuClosedYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuClosedYaochu.fu,
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
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuOpenSimple.mentsu}
                />
              ),
              label: t("kantsuOpenSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuOpenSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuClosedSimple.mentsu}
                />
              ),
              label: t("kantsuClosedSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuClosedSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuOpenYaochu.mentsu}
                />
              ),
              label: t("kantsuOpenYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuOpenYaochu.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuClosedYaochu.mentsu}
                />
              ),
              label: t("kantsuClosedYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuClosedYaochu.fu,
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
        rows={MENTSU_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </div>
  );
}
