import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@/test/intl-render";
import { useAuth as mockUseAuth } from "@/test/auth-context-mock";
import { setPathname } from "@/test/navigation-mock";
import { eligibleAgariPayload } from "@/lib/daily-problem/test-payloads";
import { ARCHIVE_SCHEMA_VERSION } from "@mahjong-scoring/core";

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("@/app/[locale]/(user)/_actions/problem-reports", () => ({
  reportProblemAction: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn() } }));

const { ProblemReportButton } = await import("./problem-report-button");

const BUTTON_LABEL = "問題の誤りを報告";

function show() {
  return render(
    <ProblemReportButton
      problem={() => ({
        kind: "agari-score",
        schemaVersion: ARCHIVE_SCHEMA_VERSION,
        payload: eligibleAgariPayload(),
      })}
      context="agari-score"
      stage="answering"
    />,
  );
}

describe("ProblemReportButton", () => {
  beforeEach(() => {
    setPathname("/practice/agari-score/play");
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
  });

  afterEach(() => {
    cleanup();
    mockUseAuth.mockReset();
  });

  it("未ログインでは何も描かない（匿名の報告の入口を作らない）", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
    show();
    expect(screen.queryByRole("button", { name: BUTTON_LABEL })).toBeNull();
  });

  it("認証の読み込み中は何も描かない", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: true });
    show();
    expect(screen.queryByRole("button", { name: BUTTON_LABEL })).toBeNull();
  });

  it("ログイン済みなら右下のボタンを出し、押すと報告のダイアログを開く", () => {
    show();
    const button = screen.getByRole("button", { name: BUTTON_LABEL });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(button);

    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("タブバーのある画面ではタブバーの上の高さ（CSS 変数）に置く", () => {
    setPathname("/daily-problem");
    show();
    expect(
      screen.getByRole("button", { name: BUTTON_LABEL }).className,
    ).toContain("bottom-(--floating-action-bottom-offset)");
  });

  it("タブバーを畳む出題中の画面では画面端の余白まで下げる", () => {
    setPathname("/practice/tenpai-score/play");
    show();
    expect(
      screen.getByRole("button", { name: BUTTON_LABEL }).className,
    ).not.toContain("bottom-(--floating-action-bottom-offset)");
  });
});
