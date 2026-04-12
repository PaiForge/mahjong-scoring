import { getTranslations } from "next-intl/server";
import type { ExpInfo } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/_components/section-title";

interface ExpGainDisplayProps {
  readonly expInfo: ExpInfo;
}

/**
 * 結果画面に獲得 EXP・レベル・進捗バーを表示する
 * 経験値獲得表示
 *
 * サーバーコンポーネント。`ExpInfo` を props で受け取り、描画のみを行う。
 * 他のセクションと統一感を持たせるため、角丸カードではなく
 * `SectionTitle` 配下のフラットなレイアウトで構成する。
 */
export async function ExpGainDisplay({ expInfo }: ExpGainDisplayProps) {
  const t = await getTranslations("exp");
  const { earnedExp, level, levelUp, progressPercent } = expInfo;

  return (
    <section className="mt-10 min-h-[180px] space-y-3">
      <SectionTitle>{t("label")}</SectionTitle>

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
        <div>
          <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
            {t("levelUp")}
          </span>
        </div>
      )}
    </section>
  );
}
