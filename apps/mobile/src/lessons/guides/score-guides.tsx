import { useTranslations } from "use-intl";
import {
  CHIITOITSU_SCORE_TABLE,
  PINFU_SCORE_TABLE,
} from "@mahjong-scoring/features/curriculum/fixed-fu-rows";

import {
  ChapterColumn,
  PreferenceSettingsNote,
} from "../components/chapter-column";
import { ChapterLink, richLineBreak } from "../components/chapter-link";
import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideParagraph } from "../components/guide-text";
import { GuideColumn } from "../components/highlight-panel";
import { ExtraFuTable, FixedFuScoreTable } from "../components/score-tables";

/** 七対子での点数計算 — 点数の計算セクション第 1 章（web の `ChiitoitsuScoreGuide`） */
export function ChiitoitsuScoreGuide() {
  const namespace = "chiitoitsuScore.learn";
  const t = useTranslations(namespace);
  return (
    <GuideBody>
      <GuideSection title={t("onePatternTitle")}>
        <GuideParagraph>{t("onePatternBody1")}</GuideParagraph>
        <GuideParagraph>{t("onePatternBody2")}</GuideParagraph>
        <FixedFuScoreTable role="ko" shape={CHIITOITSU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={CHIITOITSU_SCORE_TABLE} />
      </GuideSection>

      {/* コラム: 25符だけが10符刻みから外れている理由 */}
      <ChapterColumn namespace={namespace} />

      <GuideSection title={t("compositeTitle")}>
        <GuideParagraph>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph>{t("compositeBody3")}</GuideParagraph>
      </GuideSection>
    </GuideBody>
  );
}

/** 平和での点数計算 — 点数の計算セクション第 2 章（web の `PinfuScoreGuide`） */
export function PinfuScoreGuide() {
  const namespace = "pinfuScore.learn";
  const t = useTranslations(namespace);
  return (
    <GuideBody>
      <GuideSection title={t("twoPatternsTitle")}>
        <GuideParagraph>{t("twoPatternsBody1")}</GuideParagraph>
        <GuideParagraph>{t("twoPatternsBody2")}</GuideParagraph>
        <FixedFuScoreTable role="ko" shape={PINFU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={PINFU_SCORE_TABLE} />
        <GuideParagraph>{t("twoPatternsBody3")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 切り上げ満貫 — 表の4翻の行だけがルールで変わる */}
      <ChapterColumn namespace={namespace}>
        <PreferenceSettingsNote namespace={namespace} />
      </ChapterColumn>

      <GuideSection title={t("whyTitle")}>
        <GuideParagraph>{t("whyBody1")}</GuideParagraph>
        <GuideParagraph>{t("whyBody2")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("compositeTitle")}>
        <GuideParagraph>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph>{t("compositeBody3")}</GuideParagraph>
      </GuideSection>
    </GuideBody>
  );
}

/**
 * 平和以外の門前面子手の点数計算 — 点数の計算セクション第 3 章
 * （web の `MenzenMentsuScoreGuide`）
 */
export function MenzenMentsuScoreGuide() {
  const t = useTranslations("menzenMentsuScore.learn");
  return (
    <GuideBody>
      <GuideSection title={t("startTitle")}>
        <GuideParagraph>{t("startBody1")}</GuideParagraph>
        <GuideParagraph>{t("startBody2")}</GuideParagraph>
        <GuideParagraph>{t("startBody3")}</GuideParagraph>
        <GuideParagraph>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("roundTitle")}>
        <GuideParagraph>
          {t.rich("roundBody1", {
            mentsuLink: () => <ChapterLink slug="mentsu-fu" />,
            jantouLink: () => <ChapterLink slug="jantou-fu" />,
            machiLink: () => <ChapterLink slug="machi-fu" />,
          })}
        </GuideParagraph>
        <GuideParagraph>{t("roundBody2")}</GuideParagraph>
        <ExtraFuTable handShape="menzen" />
        <GuideParagraph>{t("roundBody3")}</GuideParagraph>
        <GuideParagraph>{t("roundBody4")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 40符へ上がる境目 */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: richLineBreak })}
        </GuideParagraph>
        <GuideParagraph>
          {t.rich("columnBody2", { br: richLineBreak })}
        </GuideParagraph>
      </GuideColumn>
    </GuideBody>
  );
}

/** 鳴いた手の点数計算 — 点数の計算セクション第 4 章（web の `FuroScoreGuide`） */
export function FuroScoreGuide() {
  const t = useTranslations("furoScore.learn");
  return (
    <GuideBody>
      <GuideSection title={t("startTitle")}>
        <GuideParagraph>{t("startBody1")}</GuideParagraph>
        <GuideParagraph>{t("startBody2")}</GuideParagraph>
        <GuideParagraph>{t("startBody3")}</GuideParagraph>
        <GuideParagraph>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("roundTitle")}>
        <GuideParagraph>{t("roundBody1")}</GuideParagraph>
        <GuideParagraph>{t("roundBody2")}</GuideParagraph>
        <ExtraFuTable handShape="furo" />
        <GuideParagraph>{t("roundBody3")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 表の一番上の行（積み上げ0符のロン）の読み方 */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: richLineBreak })}
        </GuideParagraph>
        <GuideParagraph>
          {t.rich("columnBody2", { br: richLineBreak })}
        </GuideParagraph>
      </GuideColumn>
    </GuideBody>
  );
}
