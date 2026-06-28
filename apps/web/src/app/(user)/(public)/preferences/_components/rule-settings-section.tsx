"use client";

import { useTranslations } from "next-intl";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/**
 * ルール設定セクション
 *
 * 端末ローカルに保存される麻雀ルールの差分設定を切り替える。
 * 現状は連風牌（場風＝自風）の雀頭符の扱いのみ。
 */
export function RuleSettingsSection() {
  const t = useTranslations("settings");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const setRenfonpaiAs4Fu = useRuleSettingsStore((s) => s.setRenfonpaiAs4Fu);

  return (
    <div className="overflow-hidden rounded-lg border border-surface-200 bg-white">
      <div className="group flex items-center justify-between px-5 py-4">
        <span className="pr-4">
          <span className="block text-sm font-medium text-surface-900">
            {t("renfonpaiTitle")}
          </span>
          <span className="mt-0.5 block text-xs text-surface-500">
            {t("renfonpaiDescription")}
          </span>
        </span>
        <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={renfonpaiAs4Fu}
            onChange={(e) => setRenfonpaiAs4Fu(e.target.checked)}
            className="peer sr-only"
            aria-label={t("renfonpaiTitle")}
          />
          <div className="h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-surface-200 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-checked:bg-primary-500" />
          <span
            className={`pointer-events-none absolute left-[2px] top-[2px] block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
              renfonpaiAs4Fu ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </label>
      </div>
    </div>
  );
}
