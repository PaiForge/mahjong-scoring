import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { Divider } from "@/app/(user)/_components/divider";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ExampleCard } from "@/app/(user)/_components/example-card";
import { GuideOrderedList } from "../../_components/guide-ordered-list";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";
import { TehaiFuExample } from "./tehai-fu-example";

export async function TehaiFuGuide() {
  const t = await getTranslations("tehaiFu.learn");

  return (
    <section className="space-y-4">
      <SectionTitle>{t("commonMistakesTitle")}</SectionTitle>
      <GuideParagraph preLine>{t("commonMistakesLead")}</GuideParagraph>
      <GuideOrderedList>
        <li>{t("tsumoFuTitle")}</li>
        <li>{t("ronKoutsuTitle")}</li>
        <li>{t("kazeTitle")}</li>
      </GuideOrderedList>

      <div className="space-y-8 pt-3">
        {/* Tsumo fu omission */}
        <section className="space-y-4">
          <GuideSubsectionTitle number={1}>
            {t("tsumoFuTitle")}
          </GuideSubsectionTitle>
          <GuideParagraph preLine>{t("tsumoFuBody1")}</GuideParagraph>
          <GuideParagraph preLine>{t("tsumoFuBody2")}</GuideParagraph>
          <ExampleCard>
            <TehaiFuExample
              tiles={[HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4]}
              rotatedIndex={0}
              agariHai={HaiKind.SouZu6}
              label={t("tsumoExample")}
              annotation={t("tsumoExampleAnnotation")}
            />
          </ExampleCard>
        </section>

        {/* Ron koutsu miscalculation */}
        <section className="space-y-4">
          <GuideSubsectionTitle number={2}>
            {t("ronKoutsuTitle")}
          </GuideSubsectionTitle>
          <GuideParagraph preLine>{t("ronKoutsuBody1")}</GuideParagraph>
          <GuideParagraph preLine>{t("ronKoutsuBody2")}</GuideParagraph>
          <ExampleCard spacing="space-y-4">
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
        </section>

        {/* Jikaze / Bakaze confusion */}
        <section className="space-y-4">
          <GuideSubsectionTitle number={3}>
            {t("kazeTitle")}
          </GuideSubsectionTitle>
          <GuideParagraph preLine>{t("kazeBody1")}</GuideParagraph>
          <GuideParagraph preLine>{t("kazeBody2")}</GuideParagraph>
          <ExampleCard>
            <TehaiFuExample
              tiles={[HaiKind.Ton, HaiKind.Ton, HaiKind.Ton]}
              label={t("kazeExampleBakaze")}
              annotation={t("kazeExampleBakazeAnnotation")}
            />
            <TehaiFuExample
              tiles={[HaiKind.Nan, HaiKind.Nan, HaiKind.Nan]}
              label={t("kazeExampleJikaze")}
              annotation={t("kazeExampleJikazeAnnotation")}
            />
            <TehaiFuExample
              tiles={[HaiKind.Sha, HaiKind.Sha, HaiKind.Sha]}
              label={t("kazeExampleOtakaze")}
              annotation={t("kazeExampleOtakazeAnnotation")}
              annotationTone="caution"
            />
          </ExampleCard>
        </section>
      </div>
    </section>
  );
}
