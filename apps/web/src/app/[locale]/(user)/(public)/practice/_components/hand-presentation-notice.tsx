"use client";

import { useTranslations } from "next-intl";
import { useHandPresentationNotice } from "@mahjong-scoring/features/board/use-hand-presentation";

/**
 * 手牌の見せ方を確かめられずに既定の向きで始めた案内
 * 手牌表示案内
 *
 * 練習のシェルが見出しの直下（盤面の外）に置く。案内が無ければ何も描かない。
 * 読み流す補足で、確認のボタンや練習のやり直しは持たない。タイマーと回答の
 * 邪魔をしないよう、ライブリージョンで読み上げを割り込ませない。
 */
export function HandPresentationNotice() {
  const t = useTranslations("common");
  const show = useHandPresentationNotice();
  if (!show) return undefined;
  return (
    <p className="mb-4 text-center text-xs text-surface-500">
      {t("handPresentationFallbackNotice")}
    </p>
  );
}
