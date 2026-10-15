import { getTranslations } from "next-intl/server";
import { KUIPINFU_EXAMPLE } from "@mahjong-scoring/features/curriculum/kuipinfu-example";

import { ExampleCard } from "@/app/(user)/_components/example-card";
import { TehaiHand } from "../../../_components/tehai-hand";

import { GuideColumn } from "../../_components/guide-column";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";
import { TenpaneTable } from "../../_components/tenpane-table";

/**
 * 鳴いた手の点数計算 — 点数の計算セクション第4章
 */
export async function FuroScoreGuide() {
  const t = await getTranslations("furoScore.learn");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-10">
      {/* 門前との差は門前加符の有無だけ、という一点に畳む */}
      <GuideSection title={t("startTitle")}>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      {/* 門前と同じ数え方。ロンの出発点だけが20符に下がる */}
      <GuideSection title={t("roundTitle")}>
        <GuideParagraph preLine>{t("roundBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <GuideSubsectionTitle>{t("ronTitle")}</GuideSubsectionTitle>
        <TenpaneTable handShape="furo" winType="ron" />
        <GuideParagraph preLine>{t("ronNote")}</GuideParagraph>

        <GuideSubsectionTitle>{t("tsumoTitle")}</GuideSubsectionTitle>
        <TenpaneTable handShape="furo" winType="tsumo" />
        <GuideParagraph preLine>{t("tsumoNote")}</GuideParagraph>

        <GuideParagraph preLine>{t("roundBody3")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 規則の例外（積み上げ0符のロン = 食い平和形） */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: () => <br /> })}
        </GuideParagraph>
        {/* 「この形」を実際の手牌で見せる。並びは出題盤面と同じ */}
        <ExampleCard>
          <TehaiHand
            {...KUIPINFU_EXAMPLE}
            agariLabel={tCommon("ron")}
            agariLabelTone="light"
          />
          <GuideNote>{t("columnExample")}</GuideNote>
        </ExampleCard>
      </GuideColumn>
    </div>
  );
}
