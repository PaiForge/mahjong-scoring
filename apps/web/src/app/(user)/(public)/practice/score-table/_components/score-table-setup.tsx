"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { InfinityIcon } from "@/app/_components/icons/infinity-icon";
import { useIsClient } from "../../_hooks/use-is-client";
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

  const toggleRange = (range: "nonMangan" | "manganPlus") => {
    const current = useScoreTableSettingsStore.getState().targetScoreRanges;
    setTargetScoreRanges(
      current.includes(range)
        ? current.filter((r) => r !== range)
        : [...current, range],
    );
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
          <div
            key={key}
            className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white"
          >
            <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
              <div className="mx-auto h-4 w-20 animate-pulse rounded bg-surface-200" />
            </div>
            <div className="flex flex-col gap-3 p-3">
              {["row1", "row2"].map((row) => (
                <div key={row} className="flex items-center gap-3 px-2 py-1.5">
                  <div className="size-5 animate-pulse rounded bg-surface-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
                </div>
              ))}
            </div>
          </div>
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

      <div className="flex flex-col gap-5">
        <div className="flex w-full flex-col items-center gap-1.5">
          {isDisabled ? (
            <span
              aria-disabled="true"
              className="block w-full cursor-not-allowed rounded-lg bg-surface-200 px-6 py-3 text-center text-sm font-bold text-surface-400"
            >
              {tc("startButton")}
            </span>
          ) : (
            <PrimaryLinkButton
              href={`/practice/score-table/play${suffix}`}
              className="w-full py-3"
            >
              {tc("startButton")}
            </PrimaryLinkButton>
          )}
          <p className="text-xs text-surface-400">{tp("modeChallengeHint")}</p>
        </div>

        <div className="flex w-full items-center gap-3 text-xs text-surface-400">
          <span className="h-px flex-1 bg-surface-200" />
          <span>{tp("orDivider")}</span>
          <span className="h-px flex-1 bg-surface-200" />
        </div>

        <div className="flex w-full flex-col items-center gap-1.5">
          {isDisabled ? (
            <span
              aria-disabled="true"
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-surface-200 py-3 text-sm font-semibold text-surface-400"
            >
              <InfinityIcon className="size-4" />
              {tt("startButton")}
            </span>
          ) : (
            <Link
              href={`/practice/score-table/training${suffix}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              <InfinityIcon className="size-4" />
              {tt("startButton")}
            </Link>
          )}
          <p className="text-xs text-surface-400">{tp("modeTrainingHint")}</p>
        </div>
      </div>
    </div>
  );
}

interface SettingCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function SettingCard({ title, children }: SettingCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white">
      <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
        <h3 className="text-center text-sm font-bold text-surface-700">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-3 p-3">{children}</div>
    </div>
  );
}
