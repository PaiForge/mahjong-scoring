import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import {
  buildOyaRonRows,
  countOyaRonCells,
  type OyaRonRow,
} from "@mahjong-scoring/features/curriculum/oya-ron-rows";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

import { ChapterLink } from "../../_components/chapter-link";
import { ChapterColumn } from "../../_components/chapter-column";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { KiriageManganSwitch } from "../../_components/kiriage-mangan-switch";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { OyaRonScoreTable } from "./oya-ron-score-table";

/** 切り上げ満貫の採否ごとの表と、そこから数えたマス数 */
interface RuleVariant {
  /** 辞書の select に渡す値 */
  readonly kiriage: "on" | "off";
  readonly rows: readonly OyaRonRow[];
  /** 満貫未満の点数が載るマス */
  readonly scored: number;
  /** そのうちずれるマス */
  readonly deviating: number;
}

function ruleVariant(kiriageMangan: boolean): RuleVariant {
  const rows = buildOyaRonRows({ kiriageMangan });
  return {
    kiriage: kiriageMangan ? "on" : "off",
    rows,
    ...countOyaRonCells(rows),
  };
}

const STANDARD = ruleVariant(false);
const KIRIAGE = ruleVariant(true);

/** 切り上げ満貫の設定で変わる部分を、両方のルールで描いて設定に合う方を出す */
function byRule(render: (variant: RuleVariant) => ReactNode) {
  return <KiriageManganSwitch off={render(STANDARD)} on={render(KIRIAGE)} />;
}

/**
 * 親ロンでの効率的な点数の覚え方 — 点数記憶術セクション第4章
 *
 * 表・まとめのマス数・コラムは利用者のルール設定（切り上げ満貫）に合わせる。
 * 切り上げ満貫を採るかは場によって分かれ（Mリーグは採り、天鳳・雀魂の段位戦は
 * 採らない）、どちらかを標準として固定すると、もう一方で打つ人に覚えなくて
 * よいマスを覚えさせるか、覚えるべきマスを落とさせる。コラムは設定と逆の
 * ルールでの違いを説明する。
 */
export async function OyaRonScoresGuide() {
  const t = await getTranslations("oyaRonScores.learn");

  return (
    <div className="space-y-10">
      {/* 規則の確認。満貫以上で規則が崩れないことは満貫の章が済ませている */}
      <GuideSection title={t("ruleTitle")}>
        <GuideParagraph preLine>{t("ruleBody1")}</GuideParagraph>
        <GuideParagraph preLine>
          {t.rich("ruleBody2", {
            link: () => <ChapterLink slug="mangan-oya-ron" />,
          })}
        </GuideParagraph>
      </GuideSection>

      {/* 満貫未満では切り上げのせいで規則が表に出ないマスがある */}
      <GuideSection title={t("gapTitle")}>
        <GuideParagraph preLine>{t("gapBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("gapBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("gapBody3")}</GuideParagraph>
        <GuideNote>
          {t.rich("ceilNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>
      </GuideSection>

      {/* 本題。ずれるマスを表の上で示し、それだけを覚える対象にする */}
      <GuideSection title={t("memorizeTitle")}>
        <GuideParagraph preLine>{t("memorizeBody1")}</GuideParagraph>

        {byRule(({ kiriage, rows }) => (
          <OyaRonScoreTable
            caption={t("tableCaption", { kiriage })}
            rows={rows}
          />
        ))}
        <div>
          <GuideNote>{t("legendNote")}</GuideNote>
          <GuideNote>{t("legendParenNote")}</GuideNote>
        </div>
      </GuideSection>

      {/* 表から読み取れる特徴を、覚える手がかりとして箇条書きで残す */}
      <GuideSection title={t("summaryTitle")}>
        <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-surface-700">
          <li>
            {byRule(({ kiriage, scored, deviating }) => (
              <>
                {t("summaryCount", { kiriage, scored, deviating })}
                <ul className="mt-1 list-[circle] pl-6">
                  <li>{t("summaryCountRest", { rest: scored - deviating })}</li>
                </ul>
              </>
            ))}
          </li>
          <li>{t("summaryCleanRows")}</li>
          <li>
            {t("summaryDirection")}
            <ul className="mt-1 list-[circle] pl-6">
              <li>{t("summaryDirectionExample")}</li>
            </ul>
          </li>
        </ul>
      </GuideSection>

      {/* コラム: 設定と逆のルールでは、30符4翻・60符3翻の2マスの扱いが変わる */}
      {byRule(({ kiriage }) => (
        <ChapterColumn t={t} values={{ kiriage }}>
          <PreferenceSettingsNote
            t={t}
            anchor={PREFERENCE_ANCHORS.kiriageMangan}
          />
        </ChapterColumn>
      ))}
    </div>
  );
}
