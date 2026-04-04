"use client";

import { useTranslations } from "next-intl";

interface DetailItem {
  readonly name: string;
  readonly value: number;
}

interface DetailsAccordionProps {
  readonly items: readonly DetailItem[];
  readonly total: number;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly suffix: string;
  readonly roundedTotal?: number;
  readonly roundUpLabel?: string;
}

/**
 * 詳細アコーディオン
 * 符詳細・役詳細の展開表示
 */
export function DetailsAccordion({
  items,
  total,
  isOpen,
  onToggle,
  suffix,
  roundedTotal,
  roundUpLabel,
}: DetailsAccordionProps) {
  const t = useTranslations("score");

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="ml-2 text-xs font-normal text-primary-600 hover:text-primary-800 focus:outline-none"
      >
        {isOpen ? "\u25B2" : "\u25BC"}
      </button>
      {isOpen && (
        <tr>
          <td colSpan={3} className="py-2">
            <div className="rounded bg-white px-2 py-0 text-xs text-surface-600">
              <div>
                {items.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-surface-100 py-1.5 last:border-0"
                  >
                    <span>{detail.name}</span>
                    <span>
                      {detail.value}
                      {suffix}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-0 flex justify-between border-t border-surface-200 pb-1.5 pt-1.5 font-bold">
                <span>{t("result.details.total")}</span>
                <span>
                  {total}
                  {suffix}
                </span>
              </div>
              {roundedTotal !== undefined && total !== roundedTotal && (
                <div className="mt-1 text-right text-[10px] text-surface-400">
                  {total}
                  {suffix} → {roundedTotal}
                  {suffix} ({roundUpLabel})
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export type { DetailItem, DetailsAccordionProps };
