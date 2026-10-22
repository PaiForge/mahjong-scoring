"use client";

import { useMemo } from "react";
import { useTranslations } from "use-intl";
import type { Role, WinType } from "@mahjong-scoring/core";
import type { ScoreTableViewMode } from "./score-grid";

/** 切り替えの選択肢 1 つ（値と辞書から引いた文言） */
export interface ScoreTableOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * 点数早見表の切り替え（親子・ロンツモ・表示モード）の選択肢
 * 点数早見表の切り替え選択肢
 */
export interface ScoreTableOptions {
  readonly roleOptions: readonly ScoreTableOption<Role>[];
  readonly winTypeOptions: readonly ScoreTableOption<WinType>[];
  readonly viewModeOptions: readonly ScoreTableOption<ScoreTableViewMode>[];
}

/**
 * 点数早見表の切り替えの選択肢を辞書（`scoreTable`）から組む
 * 点数早見表の切り替え選択肢フック
 *
 * web とアプリの `ScoreTable` が同じ並び・同じ文言で切り替えを出す。
 */
export function useScoreTableOptions(): ScoreTableOptions {
  const t = useTranslations("scoreTable");
  return useMemo(
    () => ({
      roleOptions: [
        { value: "ko", label: t("ko") },
        { value: "oya", label: t("oya") },
      ],
      winTypeOptions: [
        { value: "ron", label: t("ron") },
        { value: "tsumo", label: t("tsumo") },
      ],
      viewModeOptions: [
        { value: "normal", label: t("fuHan") },
        { value: "high_score", label: `${t("mangan")}+` },
      ],
    }),
    [t],
  );
}
