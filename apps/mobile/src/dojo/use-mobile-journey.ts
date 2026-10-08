import { useMemo } from "react";
import {
  buildJourney,
  type Journey,
} from "@mahjong-scoring/features/journey/journey";

import { useAccountProgress } from "../records/use-account-progress";

/**
 * モバイルの黒帯への道
 * モバイル行程
 *
 * web の道場と同じ `buildJourney` を、モバイルが持つ材料
 * （`useAccountProgress`）で呼ぶ。ログイン中はサーバーの記録（段級位を含む）に
 * 端末の未送信分・ゲストの「チャレンジを終えた練習」を合わせたもの、ゲストは
 * 端末の記録だけ（段級位は無い）。
 */
export function useMobileJourney(): Journey {
  const { input } = useAccountProgress();
  return useMemo(() => buildJourney(input), [input]);
}
