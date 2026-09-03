/**
 * プロフィール更新アクションのキャッシュ失効テスト
 *
 * @description
 * ランキングは 5 分キャッシュされ、その行に表示名を含む。更新したのに一覧だけ
 * 古い名前を出し続ける状態を作らないよう、成功時にタグを捨てることを固定する。
 * 逆に、書き込みが起きなかったとき（バリデーション失敗・DB 失敗）に捨てないことも
 * 押さえる（無関係な purge でランキングのキャッシュを空にしないため）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLogActivityEvent, mockRevalidateTag, mockUpdate } = vi.hoisted(
  () => ({
    mockLogActivityEvent: vi.fn(),
    mockRevalidateTag: vi.fn(),
    mockUpdate: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));

vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));

vi.mock("@/lib/db", async () => ({
  db: { update: mockUpdate },
  profiles: (await import("@/test/schema-mock")).profiles,
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { createQueryChain } from "@/test/drizzle-mock";
import { setupAuthorized } from "@/test/auth-mocks";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";

import { updateProfile } from "../update-profile";

const VALID_INPUT = {
  displayName: "たろう",
  bio: "",
  xUsername: "",
  instagramUsername: "",
  youtubeHandle: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  setupAuthorized();
  mockUpdate.mockReturnValue(createQueryChain(undefined));
});

describe("updateProfile", () => {
  it("更新に成功したらランキングのキャッシュを捨てる", async () => {
    const result = await updateProfile(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      LEADERBOARD_CACHE_TAG,
      "default",
    );
  });

  it("バリデーションに失敗したらキャッシュを捨てない", async () => {
    const result = await updateProfile({
      ...VALID_INPUT,
      displayName: "あ".repeat(1000),
    });

    expect("error" in result).toBe(true);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("DB 更新に失敗したらキャッシュを捨てない", async () => {
    mockUpdate.mockImplementation(() => {
      throw new Error("db down");
    });

    const result = await updateProfile(VALID_INPUT);

    expect(result).toEqual({ error: "updateFailed" });
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
