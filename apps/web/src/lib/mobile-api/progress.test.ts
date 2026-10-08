import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockJourney, mockRecord } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockJourney: vi.fn(),
  mockRecord: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../journey/progress", () => ({ getJourneyInputOf: mockJourney }));
vi.mock("../lessons/record-completions", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  recordLessonCompletions: mockRecord,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleCompleteLessons, handleReadProgress } from "./progress";

function post(body: unknown): Request {
  return new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: { username: "alice" },
  });
  mockRecord.mockResolvedValue(true);
});

describe("handleReadProgress", () => {
  it("トークンの本人の進み具合を JSON に載る形で返す", async () => {
    mockJourney.mockResolvedValue({
      completedLessonSlugs: new Set(["basics"]),
      attemptedPractices: [{ slug: "jantou-fu", variant: "default" }],
      achievedRankSlugs: ["kyu-5"],
    });

    const response = await handleReadProgress(
      new Request("https://example.test"),
    );

    expect(mockJourney).toHaveBeenCalledWith("user-1");
    expect(await response.json()).toEqual({
      completedLessonSlugs: ["basics"],
      attemptedPractices: [{ slug: "jantou-fu", variant: "default" }],
      achievedRankSlugs: ["kyu-5"],
    });
  });
});

describe("handleCompleteLessons", () => {
  it("カリキュラムにある章だけを記録し、無いものは rejected で返す", async () => {
    const response = await handleCompleteLessons(
      post({ slugs: ["jantou-fu", "nope", "jantou-fu"] }),
    );

    expect(mockRecord).toHaveBeenCalledWith("user-1", ["jantou-fu"]);
    expect(await response.json()).toEqual({
      completed: ["jantou-fu"],
      rejected: ["nope"],
    });
  });

  it("上限を超える件数は 400", async () => {
    const response = await handleCompleteLessons(
      post({ slugs: Array.from({ length: 51 }, (_, i) => `s${i}`) }),
    );

    expect(response.status).toBe(400);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("退会を受け付けた後なら書かずに 403 deleted", async () => {
    mockRecord.mockResolvedValue(false);

    const response = await handleCompleteLessons(
      post({ slugs: ["jantou-fu"] }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });
});
