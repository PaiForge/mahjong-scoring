"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { HelpIconButton } from "@/app/(user)/_components/help-icon-button";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import {
  DELTA_TONE_CLASSES,
  formatSignedDelta,
  signedDeltaTone,
} from "@/lib/challenge/signed-delta";

interface ComparisonData {
  /**
   * 前期間との差。統計値と同じ単位（正解数なら「問」）の実数で、比較できる
   * 前期間の値が無ければ undefined（増減行を出さない）。百分率ではない理由は
   * `@/lib/challenge/signed-delta` 参照。
   */
  readonly change: number | undefined;
  /** 「先週比」などの比較対象ラベル */
  readonly label: string;
  /** 表示する小数桁数。`value` 自身の書式に合わせる（既定 0） */
  readonly fractionDigits?: number;
}

interface StatsCardProps {
  readonly label: string;
  readonly value: string;
  /**
   * 統計値の定義の補足。ラベルの右の「?」を押すと開く。
   *
   * 指定すると `label` を見出しにしたモーダルで出すため、
   * 値が何を数えたものかを 1〜2 文で書く。
   */
  readonly info?: string;
  readonly comparison?: ComparisonData;
}

/**
 * KPI表示カード。ベストスコアや平均スコアなどの統計値を表示する。
 * 統計カード
 */
export function StatsCard({ label, value, info, comparison }: StatsCardProps) {
  const tCommon = useTranslations("common");
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const renderComparison = () => {
    if (!comparison || comparison.change === undefined) return null;

    const { change, label: compLabel, fractionDigits = 0 } = comparison;

    return (
      <p
        className={`text-xs mt-1 ${DELTA_TONE_CLASSES[signedDeltaTone(change, fractionDigits)]}`}
      >
        {compLabel} {formatSignedDelta(change, fractionDigits)}
      </p>
    );
  };

  return (
    <div className="bg-surface-50 border-3 border-ink rounded-lg p-4 min-w-0">
      {/* ラベルと「?」は inline-flex で並べる。「?」を text-xs の行の中に
          流し込むと、1.25em の丸が行ボックスを 1px 押し広げて補足のある
          カードだけラベル行が高くなる */}
      <p className="mb-1 flex items-center gap-1 text-xs text-surface-500">
        {label}
        {info !== undefined && (
          <HelpIconButton
            onClick={() => setIsInfoOpen(true)}
            label={tCommon("showDetailInfo")}
          />
        )}
      </p>
      <p className="text-2xl font-bold text-surface-900">{value}</p>
      {renderComparison()}

      {info !== undefined && (
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          title={label}
          closeLabel={tCommon("close")}
        >
          {info}
        </InfoModal>
      )}
    </div>
  );
}
