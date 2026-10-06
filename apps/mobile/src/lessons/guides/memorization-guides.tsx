import { useTranslations } from "use-intl";
import { FU_PAIRS } from "@mahjong-scoring/features/curriculum/fu-doubling-rows";

import { ChapterColumn } from "../components/chapter-column";
import { ChapterLink } from "../components/chapter-link";
import { Formula } from "../components/formula";
import { GuideBody, GuideSection } from "../components/guide-section";
import {
  GuideBulletList,
  GuideNote,
  GuideOrderedList,
  GuideParagraph,
} from "../components/guide-text";
import {
  FuPairScoreTable,
  HanDoublingTable,
  RonHalvingDiagram,
  RonHalvingTable,
  TsumoCarryoverDiagram,
  TsumoSplitTable,
} from "../components/memorization-tables";

/** 25符と50符の組。七対子とその倍の符で、この章の入口になる例 */
const CHIITOITSU_PAIR = { low: 25, high: 50 } as const;

/** 30符と60符の組。門前の面子手で最も多く出会う符 */
const MENZEN_PAIR = { low: 30, high: 60 } as const;

/** 20符と40符の組。平和ツモの副底20符とその倍 */
const PINFU_TSUMO_PAIR = { low: 20, high: 40 } as const;

/**
 * 符が倍になるのは1翻上がるのと同じ — 点数記憶術セクション第 1 章
 * （web の `FuDoublingGuide`）
 *
 * web は公式を KaTeX で組む。モバイルは {@link Formula} で同じ式を組む。
 */
export function FuDoublingGuide() {
  const namespace = "fuDoubling.learn";
  const t = useTranslations(namespace);
  const tFormula = useTranslations("learnCurriculum.formula");
  const fu = tFormula("fu");
  const han = tFormula("han");

  return (
    <GuideBody>
      {/* 翻が1つ上がると倍。切り上げのせいで表では2倍に見えないことまで含める */}
      <GuideSection title={t("hanTitle")}>
        <GuideParagraph>{t("hanBody1")}</GuideParagraph>
        <Formula lines={[[`${fu} × 2`, { sup: `(${han} + 2)` }, " × 4"]]} />
        <GuideNote>
          {t.rich("sourceNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>
        <GuideParagraph>{t("hanBody2")}</GuideParagraph>
        <HanDoublingTable fu={30} role="ko" caption={t("hanTableCaption")} />
        <GuideParagraph>{t("hanBody3")}</GuideParagraph>
      </GuideSection>

      {/* 本題。符を2倍にすることと指数を1つ増やすことが同じ積になる */}
      <GuideSection title={t("fuTitle")}>
        <GuideParagraph>{t("fuBody1")}</GuideParagraph>
        <Formula
          lines={[
            [`(2 × ${fu}) × 2`, { sup: `(${han} + 2)` }],
            [`= ${fu} × 2`, { sup: `(${han} + 1 + 2)` }],
          ]}
        />
        <GuideParagraph>{t("fuBody2")}</GuideParagraph>
        <FuPairScoreTable
          pair={CHIITOITSU_PAIR}
          role="ko"
          winType="ron"
          caption={t("tableCaptionKoRon")}
        />
        <GuideNote>{t("linkedCellNote")}</GuideNote>
        <GuideParagraph>{t("fuBody3")}</GuideParagraph>
        <FuPairScoreTable
          pair={MENZEN_PAIR}
          role="ko"
          winType="ron"
          caption={t("tableCaptionKoRon")}
        />
        <GuideParagraph>{t("fuBody4")}</GuideParagraph>
        <FuPairScoreTable
          pair={PINFU_TSUMO_PAIR}
          role="ko"
          winType="tsumo"
          caption={t("tableCaptionKoTsumo")}
        />
        <GuideNote>{t("tsumoNote")}</GuideNote>
        <GuideParagraph>{t("fuBody5")}</GuideParagraph>
        {/* 組は FU_PAIRS から描く。符の並びが変われば一覧も一緒に動く */}
        <GuideBulletList
          items={FU_PAIRS.map((pair) =>
            t("pairItem", { low: pair.low, high: pair.high }),
          )}
        />
      </GuideSection>

      {/* 規則が使える範囲の上限 */}
      <GuideSection title={t("manganTitle")}>
        <GuideParagraph>{t("manganBody1")}</GuideParagraph>
        <GuideParagraph>{t("manganBody2")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 七対子の「50符1翻」はこの規則の実例そのもの */}
      <ChapterColumn namespace={namespace} />
    </GuideBody>
  );
}

/**
 * 例に使う符。4翻でも満貫に届かず、1翻と4翻で切り上げが効く
 */
const RON_EXAMPLE_FU = 30;

/** 図に使う翻数。30符4翻は2回とも端数が出る */
const RON_EXAMPLE_HAN = 4;

/** 2つ目の例。1回目の切り上げで足された値を出発点に2回目を割る形 */
const RON_SECOND_EXAMPLE = { fu: 70, han: 1 } as const;

/**
 * ツモは子のロンを半分ずつにすれば出る — 点数記憶術セクション第 2 章
 * （web の `RonToTsumoGuide`）
 */
export function RonToTsumoGuide() {
  const namespace = "ronToTsumo.learn";
  const t = useTranslations(namespace);
  const tDiagram = useTranslations("learnCurriculum.halvingDiagram");

  return (
    <GuideBody>
      {/* ツモの2段表記の導入と、ロンとの比 */}
      <GuideSection title={t("divideTitle")}>
        <GuideParagraph>{t("divideBody1")}</GuideParagraph>
        <GuideParagraph>{t("divideBody2")}</GuideParagraph>
        <Formula
          lines={[
            [
              `${tDiagram("ronLabel")} : ${tDiagram("oyaLabel")} : ${tDiagram("koLabel")}`,
            ],
            ["= 4 : 2 : 1"],
          ]}
        />
        <GuideNote>
          {t.rich("basePointsNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>
        <GuideParagraph>{t("divideBody3")}</GuideParagraph>
        <GuideParagraph>{t("divideBody4")}</GuideParagraph>
      </GuideSection>

      {/* 本題。手順をそのまま図にする */}
      <GuideSection title={t("stepsTitle")}>
        <GuideParagraph>{t("stepsBody1")}</GuideParagraph>
        <GuideOrderedList items={[t("stepsItem1"), t("stepsItem2")]} />
        <RonHalvingDiagram fu={RON_EXAMPLE_FU} han={RON_EXAMPLE_HAN} />
        <GuideParagraph>{t("stepsBody2")}</GuideParagraph>
        <GuideParagraph>{t("stepsBody3")}</GuideParagraph>
        <RonHalvingTable fu={RON_EXAMPLE_FU} caption={t("tableCaption")} />
        <GuideParagraph>{t("stepsBody4")}</GuideParagraph>
        <RonHalvingDiagram
          fu={RON_SECOND_EXAMPLE.fu}
          han={RON_SECOND_EXAMPLE.han}
        />
        <GuideNote>{t("fuNote")}</GuideNote>
      </GuideSection>

      {/* 規則が成り立つ理由。割ると端数が縮み、掛けると広がる */}
      <GuideSection title={t("whyTitle")}>
        <GuideParagraph>{t("whyBody1")}</GuideParagraph>
        <GuideParagraph>{t("whyBody2")}</GuideParagraph>
        <GuideParagraph>{t("whyBody3")}</GuideParagraph>
      </GuideSection>

      <ChapterColumn namespace={namespace} />
    </GuideBody>
  );
}

/** 例に使う符。4翻でも満貫に届かず、切り上げで2倍が崩れる行も含む */
const TSUMO_EXAMPLE_FU = 30;

/** 図に使う翻数。30符3翻はどちらも切り上げの端数を含まない */
const TSUMO_EXAMPLE_HAN = 3;

/** 2つ目の例。40符2翻は切り上げで1つ分と2つ分の関係が崩れる手 */
const TSUMO_SECOND_EXAMPLE = { fu: 40, han: 2 } as const;

/**
 * 親ツモの列は覚えなくていい — 点数記憶術セクション第 3 章
 * （web の `TsumoPaymentsGuide`）
 */
export function TsumoPaymentsGuide() {
  const namespace = "tsumoPayments.learn";
  const t = useTranslations(namespace);

  return (
    <GuideBody>
      {/* 前章から受け取る値の確認。切り上げで崩れることまで書く */}
      <GuideSection title={t("splitTitle")}>
        <GuideParagraph>
          {t.rich("splitBody1", {
            link: () => <ChapterLink slug="ron-to-tsumo" />,
          })}
        </GuideParagraph>
        <GuideParagraph>{t("splitBody2")}</GuideParagraph>
        <TsumoSplitTable
          fu={TSUMO_EXAMPLE_FU}
          caption={t("splitTableCaption")}
        />
        <GuideNote>
          {t.rich("ceilNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>
        <GuideParagraph>{t("splitBody3")}</GuideParagraph>
        <GuideParagraph>{t("splitBody4")}</GuideParagraph>
      </GuideSection>

      {/* 本題。結論をそのまま図にする */}
      <GuideSection title={t("roleTitle")}>
        <GuideParagraph>{t("roleBody1")}</GuideParagraph>
        <TsumoCarryoverDiagram fu={TSUMO_EXAMPLE_FU} han={TSUMO_EXAMPLE_HAN} />
        <GuideParagraph>{t("roleBody2")}</GuideParagraph>
        <GuideParagraph>{t("roleBody3")}</GuideParagraph>
        <TsumoCarryoverDiagram
          fu={TSUMO_SECOND_EXAMPLE.fu}
          han={TSUMO_SECOND_EXAMPLE.han}
        />
        <GuideParagraph>{t("roleBody4")}</GuideParagraph>
      </GuideSection>

      <ChapterColumn namespace={namespace} />
    </GuideBody>
  );
}
