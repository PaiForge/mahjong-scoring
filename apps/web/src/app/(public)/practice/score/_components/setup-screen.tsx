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
    </div>
  );
}

interface SettingToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly title?: string;
  readonly isLast?: boolean;
}

function SettingToggle({ checked, onChange, label, title, isLast = false }: SettingToggleProps) {
  return (
    <label className={`group flex cursor-pointer items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-50 ${isLast ? "" : "border-b border-surface-100"}`}>
      <span className="select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
        {title || label}
      </span>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-surface-200 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-checked:bg-primary-500" />
        <span
          className={`pointer-events-none absolute left-[2px] top-[2px] block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </div>
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
    <label className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-all hover:bg-surface-50">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-5 cursor-pointer appearance-none rounded border-2 border-surface-300 bg-white transition-all checked:border-primary-500 checked:bg-primary-500 hover:border-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        />
        <svg
          className="pointer-events-none absolute size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
        {label}
      </span>
    </label>
  );
}
