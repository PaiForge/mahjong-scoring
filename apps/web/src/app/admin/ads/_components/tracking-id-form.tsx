"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { useAdsAction } from "../_hooks/use-ads-action";
import { setAmazonTrackingId } from "../_actions/set-amazon-tracking-id";

interface Props {
  /** 今の設定。未設定なら undefined */
  readonly trackingId: string | undefined;
  /** ASIN で指す掲載中の広告の数。未設定のときに出ていない数として示す */
  readonly hiddenAsinCount: number;
}

/**
 * Amazon トラッキング ID の設定欄
 * トラッキング ID 設定欄
 *
 * 未設定の間は ASIN の広告が画面に出ない。そのことを数と一緒に目立つ色で
 * 示す — 広告が出ない理由が管理画面から見えないと、設定漏れに気づけない。
 */
export function TrackingIdForm({ trackingId, hiddenAsinCount }: Props) {
  const t = useTranslations("admin.ads.trackingId");
  const [value, setValue] = useState(trackingId ?? "");
  const { isPending, run } = useAdsAction();

  const save = () => {
    run(
      () => setAmazonTrackingId(value),
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
        htmlFor="amazon-tracking-id"
        className="block text-sm font-semibold text-surface-800"
      >
        {t("label")}
      </label>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          id="amazon-tracking-id"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="example-22"
          className="w-64 rounded border border-surface-300 bg-white px-3 py-2 font-mono text-sm text-surface-900 focus:border-primary-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || value.trim() === (trackingId ?? "")}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {t("save")}
        </button>
      </form>
      <p className="text-xs text-surface-500">{t("hint")}</p>
      {trackingId === undefined && hiddenAsinCount > 0 && (
        <p className="text-xs font-semibold text-red-700">
          {t("unset", { count: hiddenAsinCount })}
        </p>
      )}
    </section>
  );
}
