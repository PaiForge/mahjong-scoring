import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";

/**
 * このアプリについて — 新第 1 章
 */
export async function AboutThisAppGuide() {
  const t = await getTranslations("aboutThisApp.learn");

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle>{t("introTitle")}</SectionTitle>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("lead1")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("lead2")}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-6 whitespace-pre-line text-sm leading-relaxed text-surface-700">
          <li>{t("reason1Summary")}</li>
          <li>{t("reason2Summary")}</li>
          <li>{t("reason3Summary")}</li>
        </ol>
      </section>

      <section>
        <SectionTitle>{t("reason1Title")}</SectionTitle>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason1Body1")}</p>
        <p className="mt-2 text-sm leading-relaxed text-surface-500">{t("reason1Note")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason1Body2")}</p>
      </section>

      <section>
        <SectionTitle>{t("reason2Title")}</SectionTitle>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason2Body1")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason2Body2")}</p>
      </section>

      <section>
        <SectionTitle>{t("reason3Title")}</SectionTitle>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason3Body1")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("reason3Body2")}</p>
      </section>

      <section>
        <SectionTitle>{t("purposeTitle")}</SectionTitle>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody1")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody2")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody3")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody4")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody5")}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("purposeBody6")}</p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-surface-700">{t("closing")}</p>
      </section>
    </div>
  );
}
