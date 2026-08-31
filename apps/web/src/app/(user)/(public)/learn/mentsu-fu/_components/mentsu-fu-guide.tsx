import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ExampleTable } from "../../_components/example-table";
import { loadExampleTableColumns } from "../../_lib/example-table-columns";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { TileSet } from "@/app/(user)/_components/tile-set";

/** 暗槓は両端の牌を裏向きに描画する */
const CLOSED_KANTSU_FACE_DOWN = [0, 3];

export async function MentsuFuGuide() {
  const { t, tableColumns } = await loadExampleTableColumns("mentsuFu.learn");

  return (
    <div className="space-y-10">
      {/* What is mentsu fu */}
      <section className="space-y-4">
        <SectionTitle>{t("whatIsMentsuFu")}</SectionTitle>
        <GuideParagraph>{t("whatIsMentsuFuBody")}</GuideParagraph>
      </section>

      {/* Shuntsu: 0 fu */}
      <section className="space-y-4">
        <SectionTitle>{t("shuntsuTitle")}</SectionTitle>
        <GuideParagraph>{t("shuntsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("shuntsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <TileSet
                  tiles={[HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]}
                />
              ),
              label: t("shuntsuLabel"),
              fu: 0,
            },
          ]}
        />
      </section>

      {/* Koutsu: 2-8 fu */}
      <section className="space-y-4">
        <SectionTitle>{t("koutsuTitle")}</SectionTitle>
        <GuideParagraph>{t("koutsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("koutsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <TileSet
                  tiles={[HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5]}
                />
              ),
              label: t("koutsuOpenSimpleLabel"),
              fu: 2,
            },
            {
              tiles: (
                <TileSet
                  tiles={[HaiKind.PinZu3, HaiKind.PinZu3, HaiKind.PinZu3]}
                />
              ),
              label: t("koutsuClosedSimpleLabel"),
              fu: 4,
            },
            {
              tiles: (
                <TileSet tiles={[HaiKind.Haku, HaiKind.Haku, HaiKind.Haku]} />
              ),
              label: t("koutsuOpenYaochuLabel"),
              fu: 4,
            },
            {
              tiles: (
                <TileSet
                  tiles={[HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1]}
                />
              ),
              label: t("koutsuClosedYaochuLabel"),
              fu: 8,
            },
          ]}
        />
      </section>

      {/* Kantsu: 8-32 fu */}
      <section className="space-y-4">
        <SectionTitle>{t("kantsuTitle")}</SectionTitle>
        <GuideParagraph>{t("kantsuBody")}</GuideParagraph>

        <ExampleTable
          title={t("kantsuExamples")}
          {...tableColumns}
          rows={[
            {
              tiles: (
                <TileSet
                  tiles={[
                    HaiKind.SouZu5,
                    HaiKind.SouZu5,
                    HaiKind.SouZu5,
                    HaiKind.SouZu5,
                  ]}
                />
              ),
              label: t("kantsuOpenSimpleLabel"),
              fu: 8,
            },
            {
              tiles: (
                <TileSet
                  tiles={[
                    HaiKind.PinZu7,
                    HaiKind.PinZu7,
                    HaiKind.PinZu7,
                    HaiKind.PinZu7,
                  ]}
                  faceDownIndexes={CLOSED_KANTSU_FACE_DOWN}
                />
              ),
              label: t("kantsuClosedSimpleLabel"),
              fu: 16,
            },
            {
              tiles: (
                <TileSet
                  tiles={[
                    HaiKind.Chun,
                    HaiKind.Chun,
                    HaiKind.Chun,
                    HaiKind.Chun,
                  ]}
                />
              ),
              label: t("kantsuOpenYaochuLabel"),
              fu: 16,
            },
            {
              tiles: (
                <TileSet
                  tiles={[
                    HaiKind.PinZu9,
                    HaiKind.PinZu9,
                    HaiKind.PinZu9,
                    HaiKind.PinZu9,
                  ]}
                  faceDownIndexes={CLOSED_KANTSU_FACE_DOWN}
                />
              ),
              label: t("kantsuClosedYaochuLabel"),
              fu: 32,
            },
          ]}
        />
      </section>

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
