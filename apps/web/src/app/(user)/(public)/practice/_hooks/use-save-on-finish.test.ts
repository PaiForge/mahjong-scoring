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
    mockedSave.mockResolvedValue({ success: true });
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

  it("成功時に console.error が呼ばれない", async () => {
    mockedSave.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useSaveOnFinish("mentsu_fu"));
    await result.current(makeArgs());

    expect(console.error).not.toHaveBeenCalled();
  });

  it("失敗時に console.error が呼ばれる", async () => {
    mockedSave.mockResolvedValue({ success: false, error: "auth_failed" });
    const { result } = renderHook(() => useSaveOnFinish("tehai_fu"));
    await result.current(makeArgs());

    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] tehai_fu:",
      "auth_failed",
    );
  });

  it("savePracticeResult が reject した場合もクラッシュしない", async () => {
    const networkError = new Error("network error");
    mockedSave.mockRejectedValue(networkError);
    const { result } = renderHook(() => useSaveOnFinish("yaku"));

    // reject しても例外が伝播しない
    await expect(result.current(makeArgs())).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] yaku:",
      networkError,
    );
  });
});
