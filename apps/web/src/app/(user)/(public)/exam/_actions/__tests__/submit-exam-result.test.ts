import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetOptionalVerifiedUser, mockGradeExamRun, mockGetUserRankSlugs } =
  vi.hoisted(() => ({
    mockGetOptionalVerifiedUser: vi.fn(),
    mockGradeExamRun: vi.fn(),
    mockGetUserRankSlugs: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  getOptionalVerifiedUser: mockGetOptionalVerifiedUser,
}));

vi.mock("../../../../../../lib/db/rank-evaluation", () => ({
  gradeExamRun: mockGradeExamRun,
}));

vi.mock("../../../../../../lib/db/rank-queries", () => ({
  getUserRankSlugs: mockGetUserRankSlugs,
}));

import { submitExamResult } from "../submit-exam-result";

describe("submitExamResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOptionalVerifiedUser.mockResolvedValue({ id: "user-123" });
    mockGradeExamRun.mockResolvedValue([]);
    mockGetUserRankSlugs.mockResolvedValue([]);
  });

  it("未ログインは skipped: 'anonymous' を返し採点しない", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

    const result = await submitExamResult("mangan_exam", 10);

    expect(result).toEqual({ success: true, skipped: "anonymous" });
    expect(mockGradeExamRun).not.toHaveBeenCalled();
  });

  it("試験でない練習は invalid_menu_type", async () => {
    const result = await submitExamResult("jantou_fu", 10);

    expect(result).toEqual({ success: false, error: "invalid_menu_type" });
    expect(mockGradeExamRun).not.toHaveBeenCalled();
  });

  it("受験資格のない試験は exam_locked で採点しない", async () => {
    // 無級のユーザーが2級の試験（pinfu_exam）の結果を送ってきた場合
    const result = await submitExamResult("pinfu_exam", 99);

    expect(result).toEqual({ success: false, error: "exam_locked" });
    expect(mockGradeExamRun).not.toHaveBeenCalled();
  });

  it("次に取る級の試験は採点し、付与された段級位を返す", async () => {
    mockGradeExamRun.mockResolvedValue(["kyu-5"]);

    const result = await submitExamResult("mangan_exam", 10.4);

    expect(result).toEqual({ success: true, grantedRanks: ["kyu-5"] });
    expect(mockGradeExamRun).toHaveBeenCalledWith("user-123", {
      menuType: "mangan_exam",
      score: 10,
    });
  });

  it("達成済みの級の試験は再挑戦として採点する（付与は空）", async () => {
    mockGetUserRankSlugs.mockResolvedValue(["kyu-5"]);

    const result = await submitExamResult("mangan_exam", 10);

    expect(result).toEqual({ success: true, grantedRanks: [] });
    expect(mockGradeExamRun).toHaveBeenCalled();
  });

  it("採点が失敗したら unexpected_error", async () => {
    mockGradeExamRun.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await submitExamResult("mangan_exam", 10);

    expect(result).toEqual({ success: false, error: "unexpected_error" });
  });
});
