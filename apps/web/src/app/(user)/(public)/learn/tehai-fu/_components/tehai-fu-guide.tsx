import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { ExampleCard } from "../../_components/example-card";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { TehaiFuExample } from "./tehai-fu-example";

export async function TehaiFuGuide() {
  const t = await getTranslations("tehaiFu.learn");

  return (
    <div className="space-y-10">
      {/* Tsumo fu omission */}
      <section className="space-y-4">
        <SectionTitle>{t("tsumoFuTitle")}</SectionTitle>
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
      </section>

      {/* Ron koutsu miscalculation */}
      <section className="space-y-4">
        <SectionTitle>{t("ronKoutsuTitle")}</SectionTitle>
        <GuideParagraph>{t("ronKoutsuBody1")}</GuideParagraph>
        <GuideParagraph>{t("ronKoutsuBody2")}</GuideParagraph>
        <ExampleCard spacing="space-y-4">
          <TehaiFuExample
            tiles={[HaiKind.SouZu3, HaiKind.SouZu3, HaiKind.Haku, HaiKind.Haku]}
            agariHai={HaiKind.SouZu3}
            label={t("ronKoutsuExampleRon")}
            annotation={t("ronKoutsuExampleRonAnnotation")}
            annotationColor="amber"
          />
          <hr className="border-surface-100" />
          <TehaiFuExample
            tiles={[HaiKind.SouZu3, HaiKind.SouZu3, HaiKind.Haku, HaiKind.Haku]}
            agariHai={HaiKind.SouZu3}
            label={t("ronKoutsuExampleTsumo")}
            annotation={t("ronKoutsuExampleTsumoAnnotation")}
          />
        </ExampleCard>
      </section>

      {/* Jikaze / Bakaze confusion */}
      <section className="space-y-4">
        <SectionTitle>{t("kazeTitle")}</SectionTitle>
        <GuideParagraph>{t("kazeBody1")}</GuideParagraph>
        <GuideParagraph>{t("kazeBody2")}</GuideParagraph>
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
            annotationColor="amber"
          />
        </ExampleCard>
      </section>
    </div>
  );
}
