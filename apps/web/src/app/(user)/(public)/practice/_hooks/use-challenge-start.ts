"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { useRuleSettingsStore } from "../../../../_hooks/use-rule-settings-store";
import { readVariantFromLocation } from "../_lib/variant-param";

// Server Actions は呼ぶ時に解決し、ローカルの練習盤面はサーバー実装を評価しない。
const actions = () => import("../../../../../lib/challenge/actions");

/** サーバーが始めた挑戦（ID と今の問題） */
export interface StartedChallenge {
  readonly id: string;
  readonly question: ChallengeQuestion;
  readonly sequence: number;
}

/**
 * 開始の結果
 * 開始状態
 *
 * - `loading`: サーバーに開始を頼んでいる
 * - `ready`: 始まった。出題と採点はサーバー
 * - `anonymous`: 未ログイン。端末で採点する（記録しない）
 * - `error`: 通信や採点で失敗した。やり直せる
 */
export type ChallengeStartMode = "loading" | "ready" | "anonymous" | "error";

/**
 * サーバーに挑戦の開始を頼み、その結果を持つ
 * 挑戦の開始
 *
 * 出題条件は URL のバリアント（`readVariantFromLocation`）と端末のルール設定。
 * `restart` で同じ条件でもう一度頼む（通信に失敗したときのやり直し）。
 */
export function useChallengeStart(slug: PracticeMenuSlug): {
  readonly mode: ChallengeStartMode;
  readonly setMode: (mode: ChallengeStartMode) => void;
  readonly state: StartedChallenge | undefined;
  readonly setState: (
    update: (
      previous: StartedChallenge | undefined,
    ) => StartedChallenge | undefined,
  ) => void;
  /** 何度目の開始か。やり直すたびに増え、盤面を作り直す key に使う */
  readonly generation: number;
  /** 開始からやり直す */
  readonly restart: () => void;
} {
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<StartedChallenge | undefined>(undefined);
  const [mode, setMode] = useState<ChallengeStartMode>("loading");

  useEffect(() => {
    let active = true;
    const { menuType } = practiceMenuBySlug(slug);
    const { renfonpaiAs4Fu } = useRuleSettingsStore.getState();
    void actions()
      .then((api) =>
        api.beginChallenge(menuType, readVariantFromLocation(slug), {
          renfonpaiAs4Fu,
        }),
      )
      .then((result) => {
        if (!active) return;
        if ("attempt" in result && result.attempt) {
          setState(result.attempt);
          setMode("ready");
        } else setMode(result.error === "unauthorized" ? "anonymous" : "error");
      })
      .catch(() => {
        if (active) setMode("error");
      });
    return () => {
      active = false;
    };
  }, [slug, generation]);

  const restart = useCallback(() => {
    setMode("loading");
    setGeneration((value) => value + 1);
  }, []);

  return { mode, setMode, state, setState, generation, restart };
}
