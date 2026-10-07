import { useTranslations } from "use-intl";
import { HaiKind } from "@mahjong-scoring/core";

import { Divider } from "../../components/divider";
import { ChapterLink, richLineBreak } from "../components/chapter-link";
import { ExampleCard, TehaiFuExample } from "../components/example-card";
import {
  GuideBody,
  GuideSection,
  GuideStack,
} from "../components/guide-section";
import {
  GuideNote,
  GuideOrderedList,
  GuideParagraph,
  GuideSubsectionTitle,
} from "../components/guide-text";
import { GuideColumn } from "../components/highlight-panel";
import { FuChecklistTable } from "../components/score-tables";

/** 手牌の符計算 — 符セクション第 4 章（web の `TehaiFuGuide`） */
export function TehaiFuGuide() {
  const t = useTranslations("tehaiFu.learn");

  return (
    <GuideBody>
      {/* 符が付く場所の棚卸し。順番は読者の好みなので手順にはしない */}
      <GuideSection title={t("checklistTitle")}>
        <GuideParagraph>{t("checklistLead")}</GuideParagraph>
        <FuChecklistTable />
        <GuideNote>{t("checklistAgariNote")}</GuideNote>
        <GuideParagraph>{t("checklistOrderBody")}</GuideParagraph>
        <GuideParagraph>{t("checklistRoundBody")}</GuideParagraph>
        <GuideParagraph>
          {t.rich("checklistChapterRefBody", {
            mentsuLink: () => <ChapterLink slug="mentsu-fu" />,
            jantouLink: () => <ChapterLink slug="jantou-fu" />,
            machiLink: () => <ChapterLink slug="machi-fu" />,
          })}
        </GuideParagraph>

        {/* コラム: 積み上げずに符が決まる2つ（七対子25符・平和ツモ20符） */}
        <GuideColumn
          label={t("checklistColumnLabel")}
          title={t("checklistColumnTitle")}
        >
          <GuideParagraph>
            {t.rich("checklistColumnBody", {
              br: richLineBreak,
              chiitoitsuLink: () => <ChapterLink slug="chiitoitsu-score" />,
              pinfuLink: () => <ChapterLink slug="pinfu-score" />,
            })}
          </GuideParagraph>
        </GuideColumn>
      </GuideSection>

      {/* 数え方を覚えたうえで、なお合計を外す3つの場所 */}
      <GuideSection title={t("commonMistakesTitle")}>
        <GuideParagraph>{t("commonMistakesLead")}</GuideParagraph>
        <GuideOrderedList
          items={[t("tsumoFuTitle"), t("ronKoutsuTitle"), t("kazeTitle")]}
        />

        <GuideStack gap={32}>
          <GuideStack gap={16}>
            <GuideSubsectionTitle number={1}>
              {t("tsumoFuTitle")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("tsumoFuBody1")}</GuideParagraph>
            <GuideParagraph>{t("tsumoFuBody2")}</GuideParagraph>
            <ExampleCard>
              <TehaiFuExample
                tiles={[HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4]}
                rotatedIndex={0}
                agariHai={HaiKind.SouZu6}
                label={t("tsumoExample")}
                annotation={t("tsumoExampleAnnotation")}
              />
            </ExampleCard>
          </GuideStack>

          <GuideStack gap={16}>
            <GuideSubsectionTitle number={2}>
              {t("ronKoutsuTitle")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("ronKoutsuBody1")}</GuideParagraph>
            <GuideParagraph>{t("ronKoutsuBody2")}</GuideParagraph>
            <ExampleCard gap={16}>
              <TehaiFuExample
                tiles={[
                  HaiKind.SouZu3,
                  HaiKind.SouZu3,
                  HaiKind.Haku,
                  HaiKind.Haku,
                ]}
                agariHai={HaiKind.SouZu3}
                label={t("ronKoutsuExampleRon")}
                annotation={t("ronKoutsuExampleRonAnnotation")}
                annotationTone="caution"
              />
              <Divider />
              <TehaiFuExample
                tiles={[
                  HaiKind.SouZu3,
                  HaiKind.SouZu3,
                  HaiKind.Haku,
                  HaiKind.Haku,
                ]}
                agariHai={HaiKind.SouZu3}
                label={t("ronKoutsuExampleTsumo")}
                annotation={t("ronKoutsuExampleTsumoAnnotation")}
              />
            </ExampleCard>
          </GuideStack>

          <GuideStack gap={16}>
            <GuideSubsectionTitle number={3}>
              {t("kazeTitle")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("kazeBody1")}</GuideParagraph>
            <ExampleCard>
              <TehaiFuExample
                tiles={[HaiKind.Ton, HaiKind.Ton]}
                label={t("kazeExampleBakaze")}
                annotation={t("kazeExampleBakazeAnnotation")}
              />
              <TehaiFuExample
                tiles={[HaiKind.Nan, HaiKind.Nan]}
                label={t("kazeExampleJikaze")}
                annotation={t("kazeExampleJikazeAnnotation")}
              />
              <TehaiFuExample
                tiles={[HaiKind.Sha, HaiKind.Sha]}
                label={t("kazeExampleOtakaze")}
                annotation={t("kazeExampleOtakazeAnnotation")}
                annotationTone="caution"
              />
            </ExampleCard>
            <GuideParagraph>{t("kazeBody2")}</GuideParagraph>
          </GuideStack>
        </GuideStack>
      </GuideSection>
    </GuideBody>
  );
}
