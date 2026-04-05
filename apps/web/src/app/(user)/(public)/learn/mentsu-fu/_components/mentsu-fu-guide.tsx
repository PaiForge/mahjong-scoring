import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";
import { MentsuExample } from "./mentsu-example";

export async function MentsuFuGuide() {
  const t = await getTranslations("mentsuFu.learn");

  return (
    <div className="space-y-10">
      {/* What is mentsu fu */}
      <section>
        <SectionTitle>{t("whatIsMentsuFu")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("whatIsMentsuFuBody")}
        </p>
      </section>

      {/* Shuntsu: 0 fu */}
      <section>
        <SectionTitle>{t("shuntsuTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("shuntsuBody")}
        </p>
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <MentsuExample
            tiles={[HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]}
            fu={0}
            label={t("shuntsuLabel")}
          />
        </div>
      </section>

      {/* Koutsu: 2-8 fu */}
      <section>
        <SectionTitle>{t("koutsuTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("koutsuBody")}
        </p>
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
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
        </div>
      </section>

      {/* Kantsu: 8-32 fu */}
      <section>
        <SectionTitle>{t("kantsuTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("kantsuBody")}
        </p>
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 bg-white p-5">
          <MentsuExample
            tiles={[HaiKind.SouZu5, HaiKind.SouZu5, HaiKind.SouZu5, HaiKind.SouZu5]}
            fu={8}
            label={t("kantsuOpenSimpleLabel")}
            isOpen
          />
          <MentsuExample
            tiles={[HaiKind.PinZu7, HaiKind.PinZu7, HaiKind.PinZu7, HaiKind.PinZu7]}
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
            tiles={[HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9]}
            fu={32}
            label={t("kantsuClosedYaochuLabel")}
            isKantsu
          />
        </div>
      </section>

      {/* Summary table */}
      <section>
        <SectionTitle>{t("summaryTitle")}</SectionTitle>
        <div className="mt-4 overflow-hidden rounded-xl border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="px-4 py-3 text-left font-medium text-surface-600">{t("colType")}</th>
                <th className="px-4 py-3 text-right font-medium text-surface-600">{t("colFu")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-500">{t("rowShuntsu")}</td>
                <td className="px-4 py-3 text-right text-surface-400">{t("fuUnit", { value: 0 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowOpenSimpleKoutsu")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 2 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowClosedSimpleKoutsuOrOpenYaochuKoutsu")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 4 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowClosedYaochuKoutsuOrOpenSimpleKantsu")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 8 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowClosedSimpleKantsuOrOpenYaochuKantsu")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 16 })}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-surface-900">{t("rowClosedYaochuKantsu")}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary-600">{t("fuUnit", { value: 32 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
