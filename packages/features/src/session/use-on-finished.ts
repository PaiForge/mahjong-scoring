"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import type { FinalResult } from "./use-timed-session";

/**
 * チャレンジが終わった瞬間に 1 回だけ処理を走らせる
 * 終了時処理
 *
 * 終了スナップショット（`finalResult`）が確定したら、そのときの最新の
 * `onFinished` を 1 回だけ呼ぶ。結果の保存・結果画面への遷移を二重に
 * 走らせないため。コールバックは描画ごとに作り直されてよく、呼ぶ瞬間の
 * 値（経過時間など）を読む。
 */
export function useOnFinished(
  finalResult: FinalResult | undefined,
  onFinished: (finalResult: FinalResult) => void,
): void {
  const onSessionFinished = useEffectEvent(onFinished);
  const firedRef = useRef(false);
  useEffect(() => {
    if (finalResult === undefined || firedRef.current) return;
    firedRef.current = true;
    onSessionFinished(finalResult);
  }, [finalResult]);
}
