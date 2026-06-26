import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { ExampleCard } from "../../_components/example-card";
import { FuSummaryTable } from "../../_components/fu-summary-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { MentsuExample } from "./mentsu-example";

export async function MentsuFuGuide() {
  const t = await getTranslations("mentsuFu.learn");

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
        <ExampleCard>
          <MentsuExample
            tiles={[HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]}
            fu={0}
            label={t("shuntsuLabel")}
          />
        </ExampleCard>
      </section>

      {/* Koutsu: 2-8 fu */}
      <section className="space-y-4">
        <SectionTitle>{t("koutsuTitle")}</SectionTitle>
        <GuideParagraph>{t("koutsuBody")}</GuideParagraph>
        <ExampleCard>
          <MentsuExample
            tiles={[HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5]}
            fu={2}
            label={t("koutsuOpenSimpleLabel")}
            isOpen
          />
          <MentsuExample
            tiles={[HaiKind.PinZu3, HaiKind.PinZu3, HaiKind.PinZu3]}
            fu={4}
            label={t("koutsuClosedSimpleLabel")}
          />
          <MentsuExample
            tiles={[HaiKind.Haku, HaiKind.Haku, HaiKind.Haku]}
            fu={4}
            label={t("koutsuOpenYaochuLabel")}
            isOpen
          />
          <MentsuExample
            tiles={[HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1]}
            fu={8}
            label={t("koutsuClosedYaochuLabel")}
          />
        </ExampleCard>
      </section>

      {/* Kantsu: 8-32 fu */}
      <section className="space-y-4">
        <SectionTitle>{t("kantsuTitle")}</SectionTitle>
        <GuideParagraph>{t("kantsuBody")}</GuideParagraph>
        <ExampleCard>
          <MentsuExample
            tiles={[
              HaiKind.SouZu5,
              HaiKind.SouZu5,
              HaiKind.SouZu5,
              HaiKind.SouZu5,
            ]}
            fu={8}
            label={t("kantsuOpenSimpleLabel")}
            isOpen
          />
          <MentsuExample
            tiles={[
              HaiKind.PinZu7,
              HaiKind.PinZu7,
              HaiKind.PinZu7,
              HaiKind.PinZu7,
            ]}
            fu={16}
            label={t("kantsuClosedSimpleLabel")}
            isKantsu
          />
          <MentsuExample
            tiles={[HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun]}
            fu={16}
            label={t("kantsuOpenYaochuLabel")}
            isOpen
          />
          <MentsuExample
            tiles={[
              HaiKind.PinZu9,
              HaiKind.PinZu9,
              HaiKind.PinZu9,
              HaiKind.PinZu9,
            ]}
            fu={32}
            label={t("kantsuClosedYaochuLabel")}
            isKantsu
          />
        </ExampleCard>
      </section>

      {/* Summary table */}
      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={(value) => t("fuUnit", { value })}
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
