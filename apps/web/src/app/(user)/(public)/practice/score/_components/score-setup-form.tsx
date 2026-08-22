"use client";

import { useState, useCallback } from "react";
import { SettingCard } from "../../_components/setting-card";
import { SettingCardSkeleton } from "../../_components/setting-card-skeleton";
import { toggleInArray } from "../../_lib/toggle-in-array";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ScoreRange } from "@mahjong-scoring/core";
import { useScoreSettingsStore } from "../_hooks/use-score-settings-store";
import { useScorePracticeStore } from "../_hooks/use-score-practice-store";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { SettingToggle } from "./setting-toggle";
import { SmallCheckbox } from "./small-checkbox";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { Button } from "@/app/(user)/_components/button";

/**
 * 点数計算練習の設定画面
 * 練習設定画面
 */
export function ScoreSetupForm() {
  const t = useTranslations("score");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const mounted = useIsClient();
  const [showSimplifyInfo, setShowSimplifyInfo] = useState(false);
  const {
    requireYaku,
    setRequireYaku,
    simplifyMangan,
    setSimplifyMangan,
    requireFuForMangan,
    setRequireFuForMangan,
    targetScoreRanges,
    setTargetScoreRanges,
    autoNext,
    setAutoNext,
    includeParent,
    setIncludeParent,
    includeChild,
    setIncludeChild,
  } = useScoreSettingsStore();

  const handleStart = () => {
    const params = new URLSearchParams();
    if (requireYaku) {
      params.set("mode", "with_yaku");
    }
    if (simplifyMangan) {
      params.set("simple", "1");
    }
    if (requireFuForMangan) {
      params.set("fu_mangan", "1");
    }
    if (autoNext) {
      params.set("auto_next", "1");
    }
    if (targetScoreRanges.length > 0 && targetScoreRanges.length < 2) {
      if (targetScoreRanges.includes("nonMangan"))
        params.append("ranges", "non");
      if (targetScoreRanges.includes("manganPlus"))
        params.append("ranges", "plus");
    }
    if (includeParent) params.append("roles", "oya");
    if (includeChild) params.append("roles", "ko");

    useScorePracticeStore.getState().setQuestion(undefined);

    const queryString = params.toString();
    router.push(
      queryString
        ? `/practice/score/play?${queryString}`
        : "/practice/score/play",
    );
  };

  const handleToggleRange = useCallback(
    (range: ScoreRange) => {
      const current = useScoreSettingsStore.getState().targetScoreRanges;
      setTargetScoreRanges(toggleInArray(current, range));
    },
    [setTargetScoreRanges],
  );

  const handleToggleNonMangan = useCallback(() => {
    handleToggleRange("nonMangan");
  }, [handleToggleRange]);

  const handleToggleManganPlus = useCallback(() => {
    handleToggleRange("manganPlus");
  }, [handleToggleRange]);

  const isDisabled =
    targetScoreRanges.length === 0 || (!includeParent && !includeChild);

  if (!mounted) {
    // 本体と同じ構造（設定カード＝トグル4行、2カラムのチェックボックスカード、
    // フル幅ボタン）でスケルトンを描画し、実 UI 表示時の CLS を防ぐ。
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Settings card: トグル4行 */}
        <div className="overflow-hidden rounded-xl border-3 border-ink bg-white">
          <div className="flex flex-col">
            {["requireYaku", "simplifyMangan", "requireFu", "autoNext"].map(
              (key, i) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < 3 ? "border-b-2 border-dashed border-border/40" : ""}`}
                >
                  <SkeletonBar className="h-4 w-32" tone={100} />
                  <SkeletonBar radius="full" className="h-6 w-11" tone={100} />
                </div>
              ),
            )}
          </div>
        </div>

        {/* Grid: 出題モード / 点数範囲 の2カード（ヘッダー＋チェックボックス2行） */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {["questionMode", "targetScore"].map((key) => (
            <SettingCardSkeleton key={key} />
          ))}
        </div>

        {/* Full-width start button（Button size="lg" の実寸 = 枠込み 50px） */}
        <div>
          <SkeletonBar
            radius="lg"
            className="h-[50px] w-full border-3 border-ink"
          />
        </div>
      </div>
    );
  }

  return (
    // 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
    // レスポンシブ値に揃える。SectionTitle との間隔も親（page.tsx）の space-y が担う。
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="overflow-hidden rounded-xl border-3 border-ink bg-white">
        <div className="flex flex-col">
          <SettingToggle
            checked={requireYaku}
            onChange={setRequireYaku}
            label={t("setup.requireYaku")}
          />
          <SettingToggle
            checked={simplifyMangan}
            onChange={setSimplifyMangan}
            label={t("setup.simplifyMangan")}
            onInfoClick={() => setShowSimplifyInfo(true)}
            infoAriaLabel={tCommon("showDetailInfo")}
          />
          <SettingToggle
            checked={requireFuForMangan}
            onChange={setRequireFuForMangan}
            label={t("setup.requireFu")}
          />
          <SettingToggle
            checked={autoNext}
            onChange={setAutoNext}
            title={t("setup.autoNext")}
            label={t("setup.autoNext")}
            isLast={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Question mode */}
        <SettingCard title={t("setup.questionMode")}>
          <SmallCheckbox
            checked={includeParent}
            onChange={setIncludeParent}
            label={t("setup.oya")}
          />
          <SmallCheckbox
            checked={includeChild}
            onChange={setIncludeChild}
            label={t("setup.ko")}
          />
        </SettingCard>

        {/* Target score ranges */}
        <SettingCard title={t("setup.targetScore")}>
          <SmallCheckbox
            checked={targetScoreRanges.includes("nonMangan")}
            onChange={handleToggleNonMangan}
            label={t("setup.nonMangan")}
          />
          <SmallCheckbox
            checked={targetScoreRanges.includes("manganPlus")}
            onChange={handleToggleManganPlus}
            label={t("setup.manganPlus")}
          />
        </SettingCard>
      </div>

      {/* Start button */}
      <div>
        <Button
          onClick={handleStart}
          disabled={isDisabled}
          size="lg"
          fullWidth
          className="gap-2"
        >
          <PlayIcon className="size-4" />
          {t("setup.start")}
        </Button>
      </div>

      <InfoModal
        isOpen={showSimplifyInfo}
        onClose={() => setShowSimplifyInfo(false)}
        title={t("setup.simplifyMangan")}
        closeLabel={tCommon("close")}
      >
        {t("setup.simplifyManganInfo")}
      </InfoModal>
    </div>
  );
}
