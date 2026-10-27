import { useCallback, useState } from "react";

/**
 * 再接続の案内の文言（`challenge.recording` 名前空間の辞書キー）と、押されたときの処理
 * 再接続の案内
 */
export interface ReconnectPrompt {
  readonly message: "connectionLost" | "resumeConnectionLost";
  readonly onPress: () => void;
}

/**
 * 通信の失敗が続いたときに盤面の上へ重ねる再接続の案内
 * 再接続の案内
 *
 * `waitForReconnect` は案内を出し、利用者が押すまで解決しない Promise を返す。
 * 送り直し（回答・再開・時間切れの開示）はこれを待ってから続ける。アプリの
 * 記録付きチャレンジ（`recorded-challenge.tsx`）と web の
 * `useVerifiedChallenge` が同じものを使い、案内の描き方だけが
 * プラットフォームごとに違う。
 */
export function useReconnectPrompt(): {
  readonly reconnect: ReconnectPrompt | undefined;
  readonly waitForReconnect: (
    message: ReconnectPrompt["message"],
  ) => Promise<void>;
  /**
   * 案内を消す（押したことにはしない）。待っていた送り直しは解決しないまま
   * 捨てられるので、チャレンジを作り直すとき（web の開始からのやり直し）に呼ぶ
   */
  readonly dismissReconnect: () => void;
} {
  const [reconnect, setReconnect] = useState<ReconnectPrompt | undefined>(
    undefined,
  );
  const waitForReconnect = useCallback(
    (message: ReconnectPrompt["message"]) =>
      new Promise<void>((resolve) => {
        setReconnect({
          message,
          onPress: () => {
            setReconnect(undefined);
            resolve();
          },
        });
      }),
    [],
  );
  const dismissReconnect = useCallback(() => setReconnect(undefined), []);
  return { reconnect, waitForReconnect, dismissReconnect };
}
