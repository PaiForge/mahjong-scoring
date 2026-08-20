"use client";

import { useEffect, useRef } from "react";
import type { ScoreRange } from "@mahjong-scoring/core";
import { SettingCard } from "../../_components/setting-card";
import { SettingCardSkeleton } from "../../_components/setting-card-skeleton";
import { toggleInArray } from "../../_lib/toggle-in-array";
import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";
import { PracticeStartCta } from "../../_components/practice-start-cta";
import { useTranslations } from "next-intl";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { PRACTICE_SCROLL_HASH } from "../../_lib/scroll-anchor";
import { SmallCheckbox } from "../../score/_components/small-checkbox";
import { useScoreTableSettingsStore } from "../_hooks/use-score-table-settings-store";
import {
  selectionToQueryString,
  type ScoreTableSelection,
} from "../_lib/options";

interface ScoreTableSetupProps {
  /** URL から復元した出題条件（ガイドからの遷移時のプリセット） */
  readonly initialSelection: ScoreTableSelection;
  /** URL に出題条件の指定があったか（あれば初期値としてストアへ反映する） */
  readonly applyInitial: boolean;
}

/**
 * 点数表早引きの出題設定フォーム
 * 点数表出題設定
 *
 * 親子・ツモロン・点数帯（満貫未満/満貫以上）を選び、チャレンジ／トレーニングを
 * 選択内容のクエリ付きで開始する。ガイドからの遷移時は URL の指定を初期値にする。
 */
export function ScoreTableSetup({
  initialSelection,
  applyInitial,
}: ScoreTableSetupProps) {
  const t = useTranslations("scoreTableChallenge.setup");
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");
  const mounted = useIsClient();

  const {
    includeOya,
    setIncludeOya,
    includeKo,
    setIncludeKo,
    includeTsumo,
    setIncludeTsumo,
    includeRon,
    setIncludeRon,
    targetScoreRanges,
    setTargetScoreRanges,
  } = useScoreTableSettingsStore();

  // ガイド等から URL で条件指定された場合、初回マウント時に一度だけストアへ反映する。
  const appliedRef = useRef(false);
  useEffect(() => {
    if (!applyInitial || appliedRef.current) return;
    appliedRef.current = true;
    const store = useScoreTableSettingsStore.getState();
    store.setIncludeOya(initialSelection.includeOya);
    store.setIncludeKo(initialSelection.includeKo);
    store.setIncludeTsumo(initialSelection.includeTsumo);
    store.setIncludeRon(initialSelection.includeRon);
    const ranges: ("nonMangan" | "manganPlus")[] = [];
    if (initialSelection.includeNonMangan) ranges.push("nonMangan");
    if (initialSelection.includeManganPlus) ranges.push("manganPlus");
    store.setTargetScoreRanges(ranges);
  }, [applyInitial, initialSelection]);

  const includeNonMangan = targetScoreRanges.includes("nonMangan");
  const includeManganPlus = targetScoreRanges.includes("manganPlus");

  const toggleRange = (range: ScoreRange) => {
    const current = useScoreTableSettingsStore.getState().targetScoreRanges;
    setTargetScoreRanges(toggleInArray(current, range));
  };

  const selection: ScoreTableSelection = {
    includeOya,
    includeKo,
    includeTsumo,
    includeRon,
    includeNonMangan,
    includeManganPlus,
  };
  const query = selectionToQueryString(selection);
  const suffix = `${query ? `?${query}` : ""}${PRACTICE_SCROLL_HASH}`;

  const isDisabled =
    (!includeOya && !includeKo) ||
    (!includeTsumo && !includeRon) ||
    (!includeNonMangan && !includeManganPlus);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["mode", "win", "score"].map((key) => (
          <SettingCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 出題モード（親子） */}
        <SettingCard title={t("questionMode")}>
          <SmallCheckbox
            checked={includeOya}
            onChange={setIncludeOya}
            label={t("oya")}
          />
          <SmallCheckbox
            checked={includeKo}
            onChange={setIncludeKo}
            label={t("ko")}
          />
        </SettingCard>

        {/* 和了方法（ツモ/ロン） */}
        <SettingCard title={t("winType")}>
          <SmallCheckbox
            checked={includeTsumo}
            onChange={setIncludeTsumo}
            label={t("tsumo")}
          />
          <SmallCheckbox
            checked={includeRon}
            onChange={setIncludeRon}
            label={t("ron")}
          />
        </SettingCard>

        {/* 出題する点数 */}
        <SettingCard title={t("targetScore")}>
          <SmallCheckbox
            checked={includeNonMangan}
            onChange={() => toggleRange("nonMangan")}
            label={t("nonMangan")}
          />
          <SmallCheckbox
            checked={includeManganPlus}
            onChange={() => toggleRange("manganPlus")}
            label={t("manganPlus")}
          />
        </SettingCard>
      </div>

      {isDisabled && (
        <p className="text-center text-xs text-red-600">{t("emptyWarning")}</p>
      )}

      <PracticeStartCta
        playHref={`/practice/score-table/play${suffix}`}
        trainingHref={`/practice/score-table/training${suffix}`}
        disabled={isDisabled}
        labels={{
          challenge: tc("startButton"),
          challengeHint: tp("modeChallengeHint", {
            timeLimit: CHALLENGE_TIME_LIMIT,
            mistakeLimit: MISTAKE_LIMIT,
          }),
          training: tt("startButton"),
          trainingHint: tp("modeTrainingHint"),
          orDivider: tp("orDivider"),
        }}
      />
    </div>
  );
}
