import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "@/test/training-view-mocks";

vi.mock("@/app/_lib/viewer-profile", () => ({
  // 特典の取得が終わらない状態（見せ方が決まらない間）を作る
  fetchViewerProfile: vi.fn(() => new Promise(() => undefined)),
}));

const { useAuth } = await import("@/test/auth-context-mock");
const { useDisplaySettingsStore } =
  await import("@/app/_hooks/use-display-settings-store");
const { createTrainingView } = await import("./create-challenge-views");

function Board() {
  return <div>board</div>;
}

beforeEach(() => {
  act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
  useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
});

describe("createTrainingView と手牌の見せ方", () => {
  it("練習のトレーニングは見せ方が決まるまで盤面をマウントしない", () => {
    const TrainingView = createTrainingView({
      slug: "han-count",
      renderBoard: () => <Board />,
    });
    render(<TrainingView />);
    expect(screen.queryByText("board")).toBeNull();
    // 待つ間もシェル（見出し・終了の導線）は出す
    expect(screen.getByText("exitButton")).toBeTruthy();
  });

  it("模試も見せ方が決まるまで盤面をマウントせず、待つ間も模試の見出しを出す", () => {
    const TrainingView = createTrainingView({
      slug: "mangan-exam",
      renderBoard: () => <Board />,
    });
    render(<TrainingView />);
    expect(screen.queryByText("board")).toBeNull();
    // 本物と同じ「（模試）」付きの見出し（intl-mock はキーを返す）
    expect(screen.getByText("pageTitle")).toBeTruthy();
  });

  it("模試も見せ方が決まれば盤面を出す", () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("upright"));
    const TrainingView = createTrainingView({
      slug: "mangan-exam",
      renderBoard: () => <Board />,
    });
    render(<TrainingView />);
    expect(screen.getByText("board")).toBeTruthy();
  });
});
