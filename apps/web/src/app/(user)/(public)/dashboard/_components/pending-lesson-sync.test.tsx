import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCompleteLessons, mockRefresh, mockToastSuccess } = vi.hoisted(
  () => ({
    mockCompleteLessons: vi.fn(),
    mockRefresh: vi.fn(),
    mockToastSuccess: vi.fn(),
  }),
);

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: mockToastSuccess },
}));
vi.mock("@/app/(user)/(public)/lessons/_actions/complete-lesson", () => ({
  completeLessons: mockCompleteLessons,
}));

const { rememberPendingLessonCompletion, readPendingLessonCompletions } =
  await import("@/app/(user)/(public)/lessons/_lib/pending-completions-storage");
const { PendingLessonSync } = await import("./pending-lesson-sync");

/** 次のマイクロタスクまで待つ（effect の中の非同期を流す） */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("PendingLessonSync", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("預かりが無ければ何も呼ばず、何も描かない", async () => {
    const { container } = render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(mockCompleteLessons).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");
  });

  it("未ログインで終えた預かりを本人の記録にし、預かりを外して次の一歩を組み直す", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockResolvedValue({
      success: true,
      completed: ["mangan-ko-ron"],
      rejected: [],
    });

    const { container } = render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(mockCompleteLessons).toHaveBeenCalledTimes(1);
    expect(mockCompleteLessons).toHaveBeenCalledWith(["mangan-ko-ron"]);
    expect(readPendingLessonCompletions()).toEqual([]);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith("synced");
    expect(container.innerHTML).toBe("");
  });

  it("本人の id が付いた預かりは同期し、別の人の預かりは触らない", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron", "u2");
    const { container } = render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(mockCompleteLessons).not.toHaveBeenCalled();
    expect(readPendingLessonCompletions()).toHaveLength(1);
    expect(container.innerHTML).toBe("");

    cleanup();
    mockCompleteLessons.mockResolvedValue({
      success: true,
      completed: ["mangan-ko-ron"],
      rejected: [],
    });
    render(<PendingLessonSync userId="u2" />);
    await flush();

    expect(mockCompleteLessons).toHaveBeenCalledWith(["mangan-ko-ron"]);
    expect(readPendingLessonCompletions()).toEqual([]);
  });

  it("サーバーが拒否したスラッグも預かりから外し、記録が増えなければ組み直さない", async () => {
    // レジストリに無いスラッグは読み出し時に落ちるので、サーバーの拒否は
    // 読める預かりが古いレジストリで書かれた場合に起きる。ここでは結果だけ模す
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockResolvedValue({
      success: true,
      completed: [],
      rejected: ["mangan-ko-ron"],
    });

    render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(readPendingLessonCompletions()).toEqual([]);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("同期に失敗したら預かりを残して注記を出し、再試行で記録できる", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockRejectedValueOnce(new Error("network"));
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(screen.getByTestId("pending-lesson-failed")).toBeTruthy();
    expect(readPendingLessonCompletions()).toHaveLength(1);
    expect(mockRefresh).not.toHaveBeenCalled();

    mockCompleteLessons.mockResolvedValueOnce({
      success: true,
      completed: ["mangan-ko-ron"],
      rejected: [],
    });
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    await flush();

    expect(mockCompleteLessons).toHaveBeenCalledTimes(2);
    expect(readPendingLessonCompletions()).toEqual([]);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("pending-lesson-failed")).toBeNull();
    errorSpy.mockRestore();
  });

  it("サーバーにセッションが無ければ預かりを残し、失敗として扱う", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockResolvedValue({
      success: true,
      skipped: "anonymous",
    });

    render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(screen.getByTestId("pending-lesson-failed")).toBeTruthy();
    expect(readPendingLessonCompletions()).toHaveLength(1);
  });

  it("BAN で拒まれたら預かりを残し、再試行の注記も出さない", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockResolvedValue({ success: false, error: "banned" });

    const { container } = render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(readPendingLessonCompletions()).toHaveLength(1);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");
  });

  it("同期済みの再訪では預かりが無く、何もしない", async () => {
    rememberPendingLessonCompletion("mangan-ko-ron");
    mockCompleteLessons.mockResolvedValue({
      success: true,
      completed: ["mangan-ko-ron"],
      rejected: [],
    });
    render(<PendingLessonSync userId="u1" />);
    await flush();
    cleanup();

    render(<PendingLessonSync userId="u1" />);
    await flush();

    expect(mockCompleteLessons).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
