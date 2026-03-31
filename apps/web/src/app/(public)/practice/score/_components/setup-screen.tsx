"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useDrillStore } from "@/stores/use-drill-store";

/**
 * 点数計算ドリルの設定画面
 * ドリル設定画面
 */
export function SetupScreen() {
  const t = useTranslations("score");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="h-12 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-100" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Settings */}
      <div className="space-y-3">
        <SettingCheckbox
          checked={requireYaku}
          onChange={setRequireYaku}
          label={t("setup.requireYaku")}
        />
        <SettingCheckbox
          checked={simplifyMangan}
          onChange={setSimplifyMangan}
          label={t("setup.simplifyMangan")}
        />
        <SettingCheckbox
          checked={requireFuForMangan}
          onChange={setRequireFuForMangan}
          label={t("setup.requireFu")}
        />
        <SettingCheckbox
          checked={autoNext}
          onChange={setAutoNext}
          label={t("setup.autoNext")}
        />
      </div>

      {/* Question mode */}
      <div className="border-t border-surface-100 pt-4">
        <div className="mb-3 text-center text-sm font-bold text-surface-500">
          {t("setup.questionMode")}
        </div>
        <div className="flex justify-center gap-6">
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
      <div className="border-t border-surface-100 pt-4">
        <div className="mb-3 text-center text-sm font-bold text-surface-500">
          {t("setup.targetScore")}
        </div>
        <div className="flex justify-center gap-6">
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

      {/* Start button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={isDisabled}
          className={`inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold shadow-sm transition-colors ${
            isDisabled
              ? "cursor-not-allowed bg-surface-300 text-surface-500"
              : "bg-primary-500 text-white hover:bg-primary-600"
          }`}
        >
          <span>{t("setup.start")}</span>
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface SettingCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}

function SettingCheckbox({ checked, onChange, label }: SettingCheckboxProps) {
  return (
    <label className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-transparent bg-surface-50 px-5 py-3 transition-all hover:border-surface-200 hover:bg-surface-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
      />
      <span className="select-none font-semibold text-surface-700 group-hover:text-surface-900">
        {label}
      </span>
    </label>
  );
}

interface SmallCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}

function SmallCheckbox({ checked, onChange, label }: SmallCheckboxProps) {
  return (
    <label className="group inline-flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-surface-50 px-3 py-2 transition-all hover:border-surface-200 hover:bg-surface-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
      />
      <span className="select-none text-sm font-semibold text-surface-700">
        {label}
      </span>
    </label>
  );
}
