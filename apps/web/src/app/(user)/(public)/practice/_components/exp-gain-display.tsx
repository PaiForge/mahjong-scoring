import { getTranslations } from "next-intl/server";
import type { ExpInfo } from "@mahjong-scoring/core";

interface ExpGainDisplayProps {
  readonly expInfo: ExpInfo;
}

/**
 * 結果画面に獲得 EXP・レベル・進捗バーを表示する
 * 経験値獲得表示
 *
 * サーバーコンポーネント。`ExpInfo` を props で受け取り、描画のみを行う。
 * `RecordSection`（記録セクション）の中で行として描画される前提のため、
 * セクション外殻や見出しは持たない。角丸カードにしないのは他のセクションと
 * 統一感を持たせるための決定（フラットなレイアウト）。
 */
export async function ExpGainDisplay({ expInfo }: ExpGainDisplayProps) {
  const t = await getTranslations("exp");
  const { earnedExp, level, levelUp, progressPercent } = expInfo;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-surface-900">
          {t("level", { level })}
        </span>
        <span className="text-lg font-bold text-primary-600">
          {t("earned", { amount: earnedExp })}
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-end">
          <span className="text-xs text-surface-500">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-100">
          <div
            className="h-2 rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {levelUp && (
        <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
          {t("levelUp")}
        </span>
      )}
    </div>
  );
}
