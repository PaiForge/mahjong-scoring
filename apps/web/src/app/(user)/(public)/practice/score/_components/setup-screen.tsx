"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useDrillStore } from "@/stores/use-drill-store";
import { InfoModal } from "@/app/_components/info-modal";
import { useIsClient } from "../../_hooks/use-is-client";
import { SettingToggle } from "./setting-toggle";
import { SmallCheckbox } from "./small-checkbox";

/**
 * 点数計算練習の設定画面
 * 練習設定画面
 */
export function SetupScreen() {
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
  } = useSettingsStore();

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

    useDrillStore.getState().setQuestion(undefined);

    const queryString = params.toString();
    router.push(
      queryString ? `/practice/score/play?${queryString}` : "/practice/score/play",
    );
  };

  const handleToggleRange = (range: "non_mangan" | "mangan_plus") => {
    if (targetScoreRanges.includes(range)) {
      setTargetScoreRanges(targetScoreRanges.filter((r) => r !== range));
    } else {
      setTargetScoreRanges([...targetScoreRanges, range]);
    }
  };

  const isDisabled = targetScoreRanges.length === 0 || (!includeParent && !includeChild);

  if (!mounted) {
    return (
      <div className="mt-8 space-y-6 text-center">
        <div className="h-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-100" />
        <div className="mx-auto h-12 w-32 animate-pulse rounded-lg bg-surface-100" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
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
        <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
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
        <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
          <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
            <h3 className="text-center text-sm font-bold text-surface-700">
              {t("setup.targetScore")}
            </h3>
          </div>
          <div className="flex flex-col gap-3 p-3">
            <SmallCheckbox
              checked={targetScoreRanges.includes("non_mangan")}
              onChange={() => handleToggleRange("non_mangan")}
              label={t("setup.nonMangan")}
            />
            <SmallCheckbox
              checked={targetScoreRanges.includes("mangan_plus")}
              onChange={() => handleToggleRange("mangan_plus")}
              label={t("setup.manganPlus")}
            />
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={isDisabled}
          className={`inline-block rounded-lg px-12 py-3 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            isDisabled
              ? "cursor-not-allowed bg-surface-200 text-surface-400"
              : "bg-primary-500 text-white hover:bg-primary-600 active:scale-95"
          }`}
        >
          {t("setup.start")}
        </button>
      </div>

      <InfoModal
        open={showSimplifyInfo}
        onClose={() => setShowSimplifyInfo(false)}
        title={t("setup.simplifyMangan")}
        closeLabel={tCommon("close")}
      >
        {t("setup.simplifyManganInfo")}
      </InfoModal>
    </div>
  );
}

