import { useIsClient } from "./use-is-client";

/**
 * ハイドレーション完了までは既定値を返す
 * ハイドレーション安全読み取り
 *
 * 端末ローカルに永続化した設定（zustand の `persist`）を読むフックの共通の土台。
 * 永続値は localStorage からストア生成時に同期的に載るため、そのまま描画すると
 * SSR 済みの HTML（＝常に既定値）と初回クライアントレンダーがずれ、React が
 * ハイドレーション不一致を報告する。ハイドレーションが終わるまで既定値を返し、
 * 終わってから永続値へ切り替えることでこのずれを避ける。
 *
 * 設定を読むフックを追加するときは、この判定を書き写さずここを通すこと。
 *
 * @param value - ハイドレーション後に返す値（永続値）
 * @param fallback - サーバーおよびハイドレーション完了前に返す既定値
 */
export function useHydrated<T>(value: T, fallback: T): T {
  const isClient = useIsClient();
  return isClient ? value : fallback;
}
