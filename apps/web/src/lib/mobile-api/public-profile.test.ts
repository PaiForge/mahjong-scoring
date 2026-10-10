import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorizeOptional, mockProfile, mockIsBlocking } = vi.hoisted(
  () => ({
    mockAuthorizeOptional: vi.fn(),
    mockProfile: vi.fn(),
    mockIsBlocking: vi.fn(),
  }),
);

vi.mock("./auth", () => ({
  authorizeOptionalMobileRequest: mockAuthorizeOptional,
}));
vi.mock("../db/queries", () => ({
  getPublicProfileByUsername: mockProfile,
}));
vi.mock("../blocks/blocks", () => ({ isBlocking: mockIsBlocking }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleReadPublicProfile } from "./public-profile";

const request = () =>
  new Request("https://example.test/api/mobile/v1/users/bob");

const signedInAs = (id: string) => ({
  ok: true,
  viewer: { user: { id }, profile: { username: id } },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorizeOptional.mockResolvedValue({ ok: true, viewer: undefined });
  mockIsBlocking.mockResolvedValue(false);
  mockProfile.mockResolvedValue({
    id: "bob-id",
    username: "bob",
    displayName: "ボブ",
    avatarUrl: null,
    bio: "よろしく",
    xUsername: "bobx",
    instagramUsername: null,
    youtubeHandle: null,
  });
});

describe("handleReadPublicProfile", () => {
  it("ゲストには guest として中身を返し、内部の ID と未設定の項目を出さない", async () => {
    const body = await (await handleReadPublicProfile(request(), "bob")).json();

    expect(body).toEqual({
      username: "bob",
      relation: "guest",
      displayName: "ボブ",
      bio: "よろしく",
      xUsername: "bobx",
    });
  });

  it("本人は self、他の人は member", async () => {
    mockAuthorizeOptional.mockResolvedValue(signedInAs("bob-id"));
    expect(
      (await (await handleReadPublicProfile(request(), "bob")).json()).relation,
    ).toBe("self");

    mockAuthorizeOptional.mockResolvedValue(signedInAs("alice-id"));
    expect(
      (await (await handleReadPublicProfile(request(), "bob")).json()).relation,
    ).toBe("member");
  });

  it("ブロック中は中身を除いて blocking だけを返す", async () => {
    mockAuthorizeOptional.mockResolvedValue(signedInAs("alice-id"));
    mockIsBlocking.mockResolvedValue(true);

    const body = await (await handleReadPublicProfile(request(), "bob")).json();

    expect(mockIsBlocking).toHaveBeenCalledWith("alice-id", "bob-id");
    expect(body).toEqual({ username: "bob", relation: "blocking" });
  });

  it("いない人（退会・BAN を含む）は 404", async () => {
    mockProfile.mockResolvedValue(undefined);

    const response = await handleReadPublicProfile(request(), "ghost");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "notFound" });
  });
});
