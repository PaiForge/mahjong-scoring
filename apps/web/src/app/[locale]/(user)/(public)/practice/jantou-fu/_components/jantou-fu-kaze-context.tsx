"use client";

import { useTranslations } from "next-intl";
import { kazeNameKey } from "@mahjong-scoring/core";
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
 *
 * 風の名前は辞書の `common.kazeNames.<key>`（キーは core の `kazeNameKey`）から
 * 引く。core の `getKazeName` は日本語固定で、英語のページに漢字が残るため
 * 使わない。日本語の辞書の値は `getKazeName` と同じ「東」「南」「西」「北」なので
 * 日本語の表示は変わらない。結果一覧の見出し（`kazeContextLabel`）も同じ辞書を引く。
 */
export function JantouFuKazeContext({
  bakaze,
  jikaze,
}: JantouFuKazeContextProps) {
  const t = useTranslations("jantouFu");
  const tKaze = useTranslations("common.kazeNames");

  return (
    <div className="flex justify-center gap-6 text-sm">
      <div className="space-y-1 text-center">
        <span className="text-surface-400">{t("bakaze")}</span>
        <p className="text-lg font-bold text-surface-900">
          {/* 例: common.kazeNames.ton */}
          {tKaze(kazeNameKey(bakaze))}
        </p>
      </div>
      <div className="space-y-1 text-center">
        <span className="text-surface-400">{t("jikaze")}</span>
        <p className="text-lg font-bold text-surface-900">
          {tKaze(kazeNameKey(jikaze))}
        </p>
      </div>
    </div>
  );
}
