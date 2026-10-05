import { getTranslations } from "next-intl/server";

import { GuideColumn } from "../../_components/guide-column";
import { ExtraFuTable } from "../../_components/extra-fu-table";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";

/**
 * 鳴いた手の点数計算 — 点数の計算セクション第4章
 */
export async function FuroScoreGuide() {
  const t = await getTranslations("furoScore.learn");

  return (
    <div className="space-y-10">
      {/* 門前との差は門前加符の有無だけ、という一点に畳む */}
      <GuideSection title={t("startTitle")}>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      {/* 門前と同じ規則。ロンの出発点だけが20符に下がる */}
      <GuideSection title={t("roundTitle")}>
        <GuideParagraph preLine>{t("roundBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <ExtraFuTable handShape="furo" />

        <GuideParagraph preLine>{t("roundBody3")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 表の一番上の行（積み上げ0符のロン）の読み方 */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: () => <br /> })}
        </GuideParagraph>
        <GuideParagraph>
          {t.rich("columnBody2", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>
    </div>
  );
}
