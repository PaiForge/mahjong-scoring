"use client";

import type { ReactNode } from "react";
import { ScoreSetupForm } from "../../score/_components/score-setup-form";
import { MACHI_SCORE_PRACTICE_HREF } from "../../_lib/practice-catalog";
import { useMachiScoreSettingsStore } from "../_hooks/use-machi-score-settings-store";
import { useMachiScoreStore } from "../_hooks/use-machi-score-store";

/**
 * 待ち別点数計算の設定画面
 * 待ち別練習設定画面
 *
 * 総合演習の設定画面（{@link ScoreSetupForm}）を、この練習の保存先と
 * 遷移先で使う。役の絞り込みは持たない — 待ちごとに役が変わる出題で
 * 「どの待ちに掛けるか」を定められないため。設定ストアはクライアントの
 * オブジェクトなので、サーバーコンポーネントの page から直接は渡せず、
 * この層で結び付ける。
 */
export function MachiScoreSetupForm({
  children,
}: {
  readonly children?: ReactNode;
}) {
  return (
    <ScoreSetupForm
      settingsStore={useMachiScoreSettingsStore}
      playPath={`${MACHI_SCORE_PRACTICE_HREF}/play`}
      onStart={() => useMachiScoreStore.getState().setQuestion(undefined)}
      showYakuFilter={false}
    >
      {children}
    </ScoreSetupForm>
  );
}
