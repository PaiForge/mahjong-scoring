"use client";

import { Suspense, useEffect, useRef } from "react";
import type { ScoreRange } from "@mahjong-scoring/core";
import { SettingCard } from "../../_components/setting-card";
import { SettingCardSkeleton } from "../../_components/setting-card-skeleton";
import { toggleInArray } from "../../_lib/toggle-in-array";
import { PracticeStartCta } from "../../_components/practice-start-cta";
import { buildPracticeStartCtaLabels } from "../../_lib/practice-start-cta-labels";
import { useTranslations } from "next-intl";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { PRACTICE_SCROLL_HASH } from "../../_lib/scroll-anchor";
import { SmallCheckbox } from "../../score/_components/small-checkbox";
import { useScoreTableQuerySelection } from "../_hooks/use-score-table-query-selection";
import { useScoreTableSettingsStore } from "../_hooks/use-score-table-settings-store";
import {
  selectionToQueryString,
  type ScoreTableSelection,
} from "../_lib/options";

/** ストア hydrate 前・クライアント描画前に確保する 3 カード分の枠 */
function ScoreTableSetupSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {["mode", "win", "score"].map((key) => (
        <SettingCardSkeleton key={key} />
      ))}
    </div>
  );
}

function ScoreTableSetupForm() {
  const t = useTranslations("scoreTableChallenge.setup");
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");
  const mounted = useIsClient();
  const { selection: initialSelection, hasParams: applyInitial } =
    useScoreTableQuerySelection();

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
    return <ScoreTableSetupSkeleton />;
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
        <p className="text-center text-xs text-destructive">
          {t("emptyWarning")}
        </p>
      )}

      <PracticeStartCta
        playHref={`/practice/score-table/play${suffix}`}
        trainingHref={`/practice/score-table/training${suffix}`}
        disabled={isDisabled}
        labels={buildPracticeStartCtaLabels({
          challenge: tc,
          practice: tp,
          training: tt,
        })}
      />
    </div>
  );
}

/**
 * 点数表早引きの出題設定フォーム
 * 点数表出題設定
 *
 * 親子・ツモロン・点数帯（満貫未満/満貫以上）を選び、チャレンジ／トレーニングを
 * 選択内容のクエリ付きで開始する。ガイドからの遷移時は URL の指定を初期値にする。
 * 条件は `useSearchParams()` で読むため静的ルートではクライアント描画になる。
 * 自前の `Suspense` で包み、プリレンダー HTML にはカードと同寸のスケルトンを出す
 * （これが無いと `loading.tsx` の境界まで巻き込んでページ全体がスケルトンになる）。
 */
export function ScoreTableSetup() {
  return (
    <Suspense fallback={<ScoreTableSetupSkeleton />}>
      <ScoreTableSetupForm />
    </Suspense>
  );
}
