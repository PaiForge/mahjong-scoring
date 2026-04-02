import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { TehaiFuExample } from "./tehai-fu-example";

export async function TehaiFuGuide() {
  const t = await getTranslations("tehaiFu.learn");

  return (
    <div className="space-y-8">
      {/* Tsumo fu omission */}
      <section>
        <SectionTitle>{t("tsumoFuTitle")}</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("tsumoFuBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("tsumoFuBody2")}
        </p>
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <TehaiFuExample
            tiles={[HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4]}
            rotatedIndex={0}
            agariHai={HaiKind.SouZu6}
            label={t("tsumoExample")}
            annotation={t("tsumoExampleAnnotation")}
          />
        </div>
      </section>

      {/* Ron koutsu miscalculation */}
      <section>
        <SectionTitle>{t("ronKoutsuTitle")}</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("ronKoutsuBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("ronKoutsuBody2")}
        </p>
        <div className="mt-4 space-y-4 rounded-xl border border-surface-200 bg-white p-5">
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
        </div>
      </section>

      {/* Jikaze / Bakaze confusion */}
      <section>
        <SectionTitle>{t("kazeTitle")}</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("kazeBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">
          {t("kazeBody2")}
        </p>
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
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
        </div>
      </section>
    </div>
  );
}
