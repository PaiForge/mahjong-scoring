import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAuthState, mockFetchChallengeAttempts } = vi.hoisted(() => ({
  mockGetAuthState: vi.fn(),
  mockFetchChallengeAttempts: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getAuthState: mockGetAuthState }));
vi.mock("../_lib/queries", () => ({
  fetchChallengeAttempts: mockFetchChallengeAttempts,
}));

import { getChallengeAttempts } from "./get-challenge-attempts";

const BOARD = { menuType: "jantou_fu", variant: "default" } as const;
const RANGE = [
  new Date("2026-11-16T00:00:00Z"),
  new Date("2026-11-23T00:00:00Z"),
  new Date("2026-11-09T00:00:00Z"),
  new Date("2026-11-16T00:00:00Z"),
] as const;
const EMPTY = { ok: true, value: { current: [], previous: [] } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockGetAuthState.mockResolvedValue({
    kind: "signedIn",
    user: { id: "user-1" },
  });
  mockFetchChallengeAttempts.mockResolvedValue({ current: [], previous: [] });
});

describe("getChallengeAttempts", () => {
  it("本人の記録を、渡された土俵と期間で引く", async () => {
    const attempts = { current: [{ id: "a1" }], previous: [] };
    mockFetchChallengeAttempts.mockResolvedValue(attempts);

    expect(await getChallengeAttempts(BOARD, ...RANGE)).toEqual({
      ok: true,
      value: attempts,
    });
    expect(mockFetchChallengeAttempts).toHaveBeenCalledWith(
      "user-1",
      BOARD,
      ...RANGE,
    );
  });

  it("未ログインは空（事実として記録が無い）", async () => {
    mockGetAuthState.mockResolvedValue({ kind: "signedOut" });

    expect(await getChallengeAttempts(BOARD, ...RANGE)).toEqual(EMPTY);
    expect(mockFetchChallengeAttempts).not.toHaveBeenCalled();
  });

  it("マイレコードが扱わない土俵（昇級試験）は引かずに空", async () => {
    expect(
      await getChallengeAttempts(
        { menuType: "mangan_exam", variant: "default" } as never,
        ...RANGE,
      ),
    ).toEqual(EMPTY);
    expect(mockFetchChallengeAttempts).not.toHaveBeenCalled();
  });

  // 空を返すと「この期間の記録が無い」と読まれ、記録が消えたように見える
  it("DB に届かなければ、空ではなく失敗を返す", async () => {
    mockFetchChallengeAttempts.mockRejectedValue(new Error("down"));

    expect(await getChallengeAttempts(BOARD, ...RANGE)).toEqual({ ok: false });
  });

  it("ログイン済みか確かめられなかったときも、空ではなく失敗を返す", async () => {
    mockGetAuthState.mockResolvedValue({ kind: "unknown" });

    expect(await getChallengeAttempts(BOARD, ...RANGE)).toEqual({ ok: false });
    expect(mockFetchChallengeAttempts).not.toHaveBeenCalled();
  });
});
