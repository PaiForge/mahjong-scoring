"use client";

import { useTranslations } from "next-intl";
import { getKazeName } from "@mahjong-scoring/core";
import type { Kazehai } from "@mahjong-scoring/core";

interface JantouFuKazeContextProps {
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
}

/**
 * 雀頭符の出題条件表示（場風・自風）
 * 雀頭符場風自風表示
 *
 * 出題盤面（JantouFuBoard）と遊び方デモ（JantouFuHowToPlay）で共有する。
 */
export function JantouFuKazeContext({
  bakaze,
  jikaze,
}: JantouFuKazeContextProps) {
  const t = useTranslations("jantouFu");

  return (
    <div className="flex justify-center gap-6 text-sm">
      <div className="space-y-1 text-center">
        <span className="text-surface-400">{t("bakaze")}</span>
        <p className="text-lg font-bold text-surface-900">
          {getKazeName(bakaze)}
        </p>
      </div>
      <div className="space-y-1 text-center">
        <span className="text-surface-400">{t("jikaze")}</span>
        <p className="text-lg font-bold text-surface-900">
          {getKazeName(jikaze)}
        </p>
      </div>
    </div>
  );
}
