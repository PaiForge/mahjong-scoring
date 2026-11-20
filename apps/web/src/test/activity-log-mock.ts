import { vi } from "vitest";

/**
 * `@/lib/activity-log` のテスト用スタブ
 * 活動記録モック
 *
 * 活動記録は DB への書き込みなので、テストでは差し替えて「記録を求めたか」だけを
 * 見る:
 *
 * ```ts
 * vi.mock("@/lib/activity-log", async () => await import("@/test/activity-log-mock"));
 * ```
 *
 * 呼び出しを確かめるテストは、モック済みのモジュールから `logActivityEvent`
 * を import して見る。ファイル内で共有するため、`beforeEach` で
 * `vi.clearAllMocks()` するか、これ自身を `mockClear()` すること。
 * このモジュールはテスト専用。
 */

export const logActivityEvent = vi.fn();
