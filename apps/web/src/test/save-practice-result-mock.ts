import { vi } from "vitest";

/**
 * `savePracticeResult`（Server Action）のテスト用スタブ
 * 成績保存アクションモック
 *
 * チャレンジの盤面ファクトリはこの Server Action を参照するため、
 * クライアント側だけを描くテストでもモジュールを解決できないと落ちる。
 * トレーニングのテストのように保存自体を使わない場合も、import を通すために
 * これを噛ませる:
 *
 * ```ts
 * vi.mock(
 *   "../_actions/save-practice-result",
 *   async () => await import("@/test/save-practice-result-mock"),
 * );
 * ```
 *
 * 保存が呼ばれたことを確かめるテストは、このスパイをそのまま import する。
 *
 * このモジュールはテスト専用。
 */
export const savePracticeResult = vi.fn();
