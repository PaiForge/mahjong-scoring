"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import type { AdPlatform } from "@/lib/ads/registry";

import { useAdsAction } from "../_hooks/use-ads-action";
import { setAmazonTrackingId } from "../_actions/set-amazon-tracking-id";
import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";

interface Props {
  /** どちらのプラットフォームの ID か */
  readonly platform: AdPlatform;
  /** 今の設定。未設定なら undefined */
  readonly trackingId: string | undefined;
  /**
   * そのプラットフォームのスロットにある、ASIN で指す掲載中の広告の数。
   * 未設定のときに出ていない数として示す
   */
  readonly hiddenAsinCount: number;
}

/**
 * Amazon トラッキング ID の設定欄
 * トラッキング ID 設定欄
 *
 * 未設定の間はそのプラットフォームの ASIN の広告が画面に出ない。そのことを
 * 数と一緒に目立つ色で示す — 広告が出ない理由が管理画面から見えないと、
 * 設定漏れに気づけない。もう片方の ID には落とさない
 * （`adNetworkSettings` の TSDoc 参照）。
 */
export function TrackingIdForm({
  platform,
  trackingId,
  hiddenAsinCount,
}: Props) {
  const t = useTranslations("admin.ads.trackingId");
  const [value, setValue] = useState(trackingId ?? "");
  const { isPending, run } = useAdsAction();
  const inputId = `amazon-tracking-id-${platform}`;

  const save = () => {
    run(
      () => setAmazonTrackingId(platform, value),
      () => toast.success(t("saved")),
    );
  };

  return (
    <section
      className={`space-y-2 rounded-lg border p-4 ${
        trackingId === undefined
          ? "border-red-300 bg-red-50"
          : "border-surface-200 bg-white"
      }`}
    >
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-surface-800"
      >
        {t(`label.${platform}`)}
      </label>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="example-22"
          className={`w-64 max-w-full font-mono ${ADMIN_INPUT_CLASSES}`}
        />
        <button
          type="submit"
          disabled={isPending || value.trim() === (trackingId ?? "")}
          className={adminButtonClasses()}
        >
          {t("save")}
        </button>
      </form>
      <p className="text-xs text-surface-500">{t(`hint.${platform}`)}</p>
      {trackingId === undefined && hiddenAsinCount > 0 && (
        <p className="text-xs font-semibold text-red-700">
          {t("unset", { count: hiddenAsinCount })}
        </p>
      )}
    </section>
  );
}
