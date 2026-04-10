import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSaveOnFinish } from "./use-save-on-finish";
import type { FinishCallbackArgs } from "./use-finish-redirect";

vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

async function importMockedAction() {
  const mod = await import("../_actions/save-practice-result");
  return mod.savePracticeResult as ReturnType<typeof vi.fn>;
}

function makeArgs(overrides: Partial<FinishCallbackArgs> = {}): FinishCallbackArgs {
  return {
    correctCount: 5,
    incorrectCount: 2,
    totalCount: 7,
    elapsedMs: 30000,
    ...overrides,
  };
}

describe("useSaveOnFinish", () => {
  let mockedSave: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockedSave = await importMockedAction();
    mockedSave.mockReset();
    mockedSave.mockResolvedValue({ success: true, challengeResultId: "cr-1" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("menuType が savePracticeResult に正しく渡される", async () => {
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    await result.current(makeArgs());

    expect(mockedSave).toHaveBeenCalledWith("jantou_fu", "default", {
      score: 5,
      incorrectAnswers: 2,
      timeTaken: 30,
    });
  });

  it("totalCount === 0 の場合 savePracticeResult が呼ばれない", async () => {
    const { result } = renderHook(() => useSaveOnFinish("machi_fu"));
    await result.current(makeArgs({ totalCount: 0 }));

    expect(mockedSave).not.toHaveBeenCalled();
  });

  it("認証済みユーザーの成功時に { grant: challengeResultId } を返す", async () => {
    mockedSave.mockResolvedValue({ success: true, challengeResultId: "cr-xyz" });
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    const ret = await result.current(makeArgs());

    expect(mockedSave).toHaveBeenCalled();
    expect(ret).toEqual({ grant: "cr-xyz" });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("匿名ユーザー（skipped='anonymous'）はサイレント no-op、console.error を出さない", async () => {
    mockedSave.mockResolvedValue({ success: true, skipped: "anonymous" });
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    const ret = await result.current(makeArgs());

    // Server Action は呼ぶ（サーバー側が単一の認証ソース）
    expect(mockedSave).toHaveBeenCalledTimes(1);
    // ただし grant は返さない → URL に grant=… が付かない → EXP カードは表示されない
    expect(ret).toBeUndefined();
    // ログノイズなし
    expect(console.error).not.toHaveBeenCalled();
  });

  it("action が success:false を返すと undefined を返し console.error にログする", async () => {
    mockedSave.mockResolvedValue({ success: false, error: "unexpected_error" });
    const { result } = renderHook(() => useSaveOnFinish("tehai_fu"));
    const ret = await result.current(makeArgs());

    expect(ret).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] tehai_fu:",
      "unexpected_error",
    );
  });

  it("action が reject した場合もクラッシュせず console.error にログする", async () => {
    const networkError = new Error("network error");
    mockedSave.mockRejectedValue(networkError);
    const { result } = renderHook(() => useSaveOnFinish("yaku"));

    await expect(result.current(makeArgs())).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] yaku:",
      networkError,
    );
  });
});
