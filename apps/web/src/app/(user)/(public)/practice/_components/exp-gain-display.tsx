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
 * 未ログイン・保存失敗時はそもそも props が渡されず、呼び出し元で分岐する。
 */
export async function ExpGainDisplay({ expInfo }: ExpGainDisplayProps) {
  const t = await getTranslations("exp");
  const { earnedExp, level, levelUp, progressPercent } = expInfo;

  return (
    <div className="mt-4 w-full max-w-xs rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
      {/* Earned EXP */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-surface-500">{t("label")}</span>
        <span className="text-lg font-bold text-primary-600">
          {t("earned", { amount: earnedExp })}
        </span>
      </div>

      {/* Level and progress */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-surface-900">
            {t("level", { level })}
          </span>
          <span className="text-xs text-surface-500">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-100">
          <div
            className="h-2 rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Level up notification */}
      {levelUp && (
        <div className="mt-3 text-center">
          <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
            {t("levelUp")}
          </span>
        </div>
      )}
    </div>
  );
}
