import { useCallback, useState } from "react";

/** 再接続の案内の文言と、押されたときの処理 */
export interface ReconnectPrompt {
  readonly message: "connectionLost" | "resumeConnectionLost";
  readonly onPress: () => void;
}

/**
 * 通信の失敗が続いたときに盤面の上へ重ねる再接続の案内
 * 再接続の案内
 *
 * `waitForReconnect` は案内を出し、利用者が押すまで解決しない Promise を返す。
 * 送り直し（回答・再開）はこれを待ってから続ける。
 */
export function useReconnectPrompt(): {
  readonly reconnect: ReconnectPrompt | undefined;
  readonly waitForReconnect: (
    message: ReconnectPrompt["message"],
  ) => Promise<void>;
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
  return { reconnect, waitForReconnect };
}
