"use client";

import { useTranslations } from "next-intl";

import { useAdsAction } from "../_hooks/use-ads-action";
import { moveAdCreative } from "../_actions/move-ad-creative";
import { setAdCreativeActive } from "../_actions/set-ad-creative-active";

interface Props {
  readonly creativeId: string;
  readonly isActive: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
}

const BUTTON_CLASSES =
  "text-sm font-medium text-surface-600 transition-colors hover:text-surface-900 disabled:opacity-40";

/**
 * 広告一覧の行の操作（掲載の切り替え・並べ替え）
 * 広告行操作
 */
export function CreativeRowActions({
  creativeId,
  isActive,
  isFirst,
  isLast,
}: Props) {
  const t = useTranslations("admin.ads");
  const { isPending, run } = useAdsAction();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => setAdCreativeActive(creativeId, !isActive))}
        className={BUTTON_CLASSES}
      >
        {isActive ? t("deactivate") : t("activate")}
      </button>
      <button
        type="button"
        disabled={isPending || isFirst}
        onClick={() => run(() => moveAdCreative(creativeId, "up"))}
        className={BUTTON_CLASSES}
      >
        {t("moveUp")}
      </button>
      <button
        type="button"
        disabled={isPending || isLast}
        onClick={() => run(() => moveAdCreative(creativeId, "down"))}
        className={BUTTON_CLASSES}
      >
        {t("moveDown")}
      </button>
    </div>
  );
}
