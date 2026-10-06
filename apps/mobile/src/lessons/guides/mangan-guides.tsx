import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import { SectionTitle } from "../../components/section-title";
import { ChapterLink } from "../components/chapter-link";
import { HalvingDiagram, OyaAllDiagram } from "../components/derivation-figure";
import {
  GuideBody,
  GuideSection,
  GuideStack,
} from "../components/guide-section";
import { GuideNote, GuideParagraph } from "../components/guide-text";
import {
  ManganKoTsumoScoreTable,
  ManganOyaTsumoScoreTable,
  ManganScoreTable,
} from "../components/mangan-tables";

/**
 * 満貫以上セクションの章レイアウト（web の `ManganGuideLayout`）
 * 満貫ガイドレイアウト
 *
 * 4章（子ロン・親ロン・子ツモ・親ツモ）で共通の構成。本文は bodyTitle /
 * body1 / body2 / body3 の4キーを持つ前提で、章ごとの違いは名前空間と
 * 差し込む点数表、それに続く章固有の節だけ。
 */
function ManganGuideLayout({
  namespace,
  table,
  children,
}: {
  readonly namespace: string;
  readonly table: ReactNode;
  readonly children?: ReactNode;
}) {
  const t = useTranslations(namespace);
  return (
    <GuideBody>
      <GuideStack>
        <SectionTitle>{t("bodyTitle")}</SectionTitle>
        <GuideParagraph>{t("body1")}</GuideParagraph>
        <GuideParagraph>{t("body2")}</GuideParagraph>
        {table}
        <GuideParagraph>{t("body3")}</GuideParagraph>
      </GuideStack>
      {children}
    </GuideBody>
  );
}

/**
 * 図に使う区分。最も基本の満貫（8000 → 4000 → 2000 と端数が出ない）
 */
const DIAGRAM_TIER = "mangan";

const diagramTier = HIGH_SCORES.find((row) => row.nameKey === DIAGRAM_TIER);

/** 子のロン（満貫以上） — 満貫以上セクション第 1 章 */
export function ManganKoRonGuide() {
  return (
    <ManganGuideLayout
      namespace="manganKoRon.learn"
      table={<ManganScoreTable role="ko" />}
    />
  );
}

/**
 * 子のツモ（満貫以上） — 満貫以上セクション第 2 章
 *
 * 共通の節に、ロンを2回半分にする導出の節を足す。
 */
export function ManganKoTsumoGuide() {
  const t = useTranslations("manganKoTsumo.learn");
  return (
    <ManganGuideLayout
      namespace="manganKoTsumo.learn"
      table={<ManganKoTsumoScoreTable />}
    >
      <GuideSection title={t("halvingTitle")}>
        <GuideParagraph>{t("halvingBody1")}</GuideParagraph>
        {diagramTier && (
          <HalvingDiagram
            caption={t("halvingDiagramCaption")}
            ron={diagramTier.ronKo}
            payment={diagramTier.tsumoKo}
          />
        )}
        <GuideParagraph>{t("halvingBody2")}</GuideParagraph>
        <GuideNote>
          {t.rich("halvingNote", {
            link: () => <ChapterLink slug="ron-to-tsumo" />,
          })}
        </GuideNote>
      </GuideSection>
    </ManganGuideLayout>
  );
}

/** 親のロン（満貫以上） — 満貫以上セクション第 3 章 */
export function ManganOyaRonGuide() {
  return (
    <ManganGuideLayout
      namespace="manganOyaRon.learn"
      table={<ManganScoreTable role="oya" />}
    />
  );
}

/**
 * 親のツモ（満貫以上） — 満貫以上セクション第 4 章
 *
 * 共通の節に、親のロンを 3 で割る導出の節を足す。
 */
export function ManganOyaTsumoGuide() {
  const t = useTranslations("manganOyaTsumo.learn");
  return (
    <ManganGuideLayout
      namespace="manganOyaTsumo.learn"
      table={<ManganOyaTsumoScoreTable />}
    >
      <GuideSection title={t("divisionTitle")}>
        <GuideParagraph>{t("divisionBody")}</GuideParagraph>
        {diagramTier && (
          <OyaAllDiagram
            caption={t("divisionDiagramCaption")}
            ron={diagramTier.ronOya}
            payment={diagramTier.tsumoOya}
          />
        )}
      </GuideSection>
    </ManganGuideLayout>
  );
}
