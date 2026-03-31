import { useEffect, useState } from "react";

/**
 * クライアントサイドレンダリング判定フック
 *
 * SSR/CSR のハイドレーション不一致を防ぐために使用する。
 * マウント後に `true` を返す。
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}
