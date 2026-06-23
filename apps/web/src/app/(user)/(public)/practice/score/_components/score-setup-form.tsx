"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useScoreSettingsStore } from "../_hooks/use-score-settings-store";
import { useScorePracticeStore } from "../_hooks/use-score-practice-store";
import { InfoModal } from "@/app/_components/info-modal";
import { useIsClient } from "../../_hooks/use-is-client";
import { SettingToggle } from "./setting-toggle";
import { SmallCheckbox } from "./small-checkbox";

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
      if (targetScoreRanges.includes("non_mangan")) params.append("ranges", "non");
      if (targetScoreRanges.includes("mangan_plus")) params.append("ranges", "plus");
    }
    if (includeParent) params.append("roles", "oya");
    if (includeChild) params.append("roles", "ko");

    useScorePracticeStore.getState().setQuestion(undefined);

    const queryString = params.toString();
    router.push(
      queryString ? `/practice/score/play?${queryString}` : "/practice/score/play",
    );
  };

  const handleToggleRange = useCallback((range: "non_mangan" | "mangan_plus") => {
    const current = useScoreSettingsStore.getState().targetScoreRanges;
    setTargetScoreRanges(
      current.includes(range) ? current.filter((r) => r !== range) : [...current, range],
    );
  }, [setTargetScoreRanges]);

  const handleToggleNonMangan = useCallback(() => {
    handleToggleRange("non_mangan");
  }, [handleToggleRange]);

  const handleToggleManganPlus = useCallback(() => {
    handleToggleRange("mangan_plus");
  }, [handleToggleRange]);

  const isDisabled = targetScoreRanges.length === 0 || (!includeParent && !includeChild);

  if (!mounted) {
    // 本体と同じ構造（設定カード＝トグル4行、2カラムのチェックボックスカード、
    // フル幅ボタン）でスケルトンを描画し、実 UI 表示時の CLS を防ぐ。
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Settings card: トグル4行 */}
        <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="flex flex-col">
            {["requireYaku", "simplifyMangan", "requireFu", "autoNext"].map(
              (key, i) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < 3 ? "border-b border-surface-100" : ""}`}
                >
                  <div className="h-4 w-32 animate-pulse rounded bg-surface-100" />
                  <div className="h-6 w-11 animate-pulse rounded-full bg-surface-100" />
                </div>
              ),
            )}
          </div>
        </div>

        {/* Grid: 出題モード / 点数範囲 の2カード（ヘッダー＋チェックボックス2行） */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {["questionMode", "targetScore"].map((key) => (
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

        {/* Full-width start button */}
        <div>
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-200" />
        </div>
      </div>
    );
  }

  return (
    // 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
    // レスポンシブ値に揃えることで、最終要素であるボタンの上下余白が均等になる。
    <div className="mt-8 space-y-4 sm:space-y-6 md:space-y-8">
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
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
        <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
            <h3 className="text-center text-sm font-bold text-surface-700">
              {t("setup.questionMode")}
            </h3>
          </div>
          <div className="flex flex-col gap-3 p-3">
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
          </div>
        </div>

        {/* Target score ranges */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
            <h3 className="text-center text-sm font-bold text-surface-700">
              {t("setup.targetScore")}
            </h3>
          </div>
          <div className="flex flex-col gap-3 p-3">
            <SmallCheckbox
              checked={targetScoreRanges.includes("non_mangan")}
              onChange={handleToggleNonMangan}
              label={t("setup.nonMangan")}
            />
            <SmallCheckbox
              checked={targetScoreRanges.includes("mangan_plus")}
              onChange={handleToggleManganPlus}
              label={t("setup.manganPlus")}
            />
          </div>
        </div>
      </div>

      {/* Start button */}
      <div>
        <button
          type="button"
          onClick={handleStart}
          disabled={isDisabled}
          className={`block w-full rounded-lg px-6 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            isDisabled
              ? "cursor-not-allowed bg-surface-200 text-surface-400"
              : "bg-primary-500 text-white hover:bg-primary-600 active:scale-95"
          }`}
        >
          {t("setup.start")}
        </button>
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

