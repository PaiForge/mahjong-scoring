"use client";

import type { ReactNode } from "react";
import { ScoreSetupForm } from "../../agari-score/_components/score-setup-form";
import { TENPAI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";
import { useTenpaiScoreSettingsStore } from "../_hooks/use-tenpai-score-settings-store";
import { useTenpaiScoreStore } from "../_hooks/use-tenpai-score-store";

/**
 * 聴牌形の点数計算の設定画面
 * 聴牌形練習設定画面
 *
 * 和了形の点数計算の設定画面（{@link ScoreSetupForm}）を、この練習の保存先と
 * 遷移先で使う。役の絞り込みは持たない — 待ちごとに役が変わる出題で
 * 「どの待ちに掛けるか」を定められないため。設定ストアはクライアントの
 * オブジェクトなので、サーバーコンポーネントの page から直接は渡せず、
 * この層で結び付ける。
 */
export function TenpaiScoreSetupForm({
  children,
}: {
  readonly children?: ReactNode;
}) {
  return (
    <ScoreSetupForm
      settingsStore={useTenpaiScoreSettingsStore}
      playPath={`${TENPAI_SCORE_PRACTICE_HREF}/play`}
      onStart={() => useTenpaiScoreStore.getState().setQuestion(undefined)}
      showYakuFilter={false}
    >
      {children}
    </ScoreSetupForm>
  );
}
