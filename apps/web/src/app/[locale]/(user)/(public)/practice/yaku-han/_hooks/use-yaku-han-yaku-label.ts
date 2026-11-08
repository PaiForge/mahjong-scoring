"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";

/**
 * 役翻数練習の役名の表示名を返すフック
 * 役翻数役名表示
 *
 * 出題の役名（core の `YAKU_HAN_ENTRIES.name`。sessionStorage の結果にもこの
 * 日本語で残る）を、辞書の `yakuNames.<key>` で描く。core の日本語をそのまま
 * 描くと英語のページに漢字が残る。
 *
 * 他の練習の役名（役の選択・点数計算）が引く `agariScore.yaku` ではなく
 * `yakuNames` を引くのは、日本語の表示を変えないため。`agariScore.yaku` の日本語は
 * 「断幺九」「混全帯幺九」「純全帯幺九」で、core の「断么九」等と字が違う。
 * この練習はこれまで core の役名をそのまま出していた。`yakuNames` の日本語は
 * core の役名と一致する（`yaku-names.test.ts` が守る）。英語の値は 2 つの辞書で
 * 同じ（連風牌の注記を除く。この練習には出ない）なので、英語の見え方は他の練習と揃う。
 *
 * 出題盤面・遊び方デモ・結果の一覧が同じ表示名を出すよう、変換はここ 1 か所に置く。
 */
export function useYakuHanYakuLabel(): (yakuName: string) => string {
  const tYakuNames = useTranslations("yakuNames");
  return useCallback(
    // 例: yakuNames.sanshoku_doujun（完成形のキーで grep したときにここへ着地させるための例）
    (yakuName: string) => yakuLabel(yakuName, tYakuNames),
    [tYakuNames],
  );
}
