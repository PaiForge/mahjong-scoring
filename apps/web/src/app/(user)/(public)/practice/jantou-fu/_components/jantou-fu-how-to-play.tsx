"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { CheckIcon } from "@/app/_components/icons/check-icon";

/** デモ用の固定例: 東場・南家。正解は中（三元牌 → 2符） */
const DEMO_CHOICES: readonly { hai: HaiKindId; isCorrect: boolean }[] = [
  { hai: HaiKind.PinZu5, isCorrect: false },
  { hai: HaiKind.Chun, isCorrect: true },
  { hai: HaiKind.Sha, isCorrect: false },
  { hai: HaiKind.SouZu3, isCorrect: false },
];

/**
 * 雀頭符練習の「問題方式」ビジュアルデモ
 * 雀頭符 遊び方デモ
 *
 * 実際の出題盤面（場風・自風の提示と4択）を静的に再現し、
 * 正解の牌をハイライトしてプレイ方法を端的に示す。
 */
export function JantouFuHowToPlay() {
  const t = useTranslations("jantouFu");

  return (
    <div className="space-y-5">
      {/* Context */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="mt-1 text-lg font-bold text-surface-900">東</p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="mt-1 text-lg font-bold text-surface-900">南</p>
        </div>
      </div>

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectCorrectHead")}
      </p>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {DEMO_CHOICES.map((choice, i) => (
          <div
            key={i}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 ${
              choice.isCorrect
                ? "border-green-500 bg-green-50"
                : "border-surface-200 bg-white opacity-60"
            }`}
          >
            {choice.isCorrect && (
              <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-green-500">
                <CheckIcon className="size-3 text-white" />
              </span>
            )}
            <div className="scale-125">
              <Hai hai={choice.hai} />
            </div>
            {choice.isCorrect && (
              <span className="text-xs font-bold text-green-600">
                {t("fu", { value: 2 })}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Answer note */}
      <p className="text-center text-xs leading-relaxed text-surface-500">
        {t("howToPlay.answerNote")}
      </p>
    </div>
  );
}
