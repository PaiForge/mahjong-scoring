// @vitest-environment node
/**
 * 問題の保存（アプリ向け）のテスト
 *
 * 入口の順序（停止スイッチ → IP の枠 → Bearer の検証・BAN → アカウントの枠 →
 * 本文 → 検証 → 保存）を、認証サーバー・プロフィール・DB だけ差し替えて、
 * 実物の `authorizeMobileRequest` と枠・検証で確かめる。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

const {
  mockGetUser,
  mockCreateClient,
  mockGetProfileCore,
  mockHasDeletionRequest,
  mockGetClientIp,
  mockInsert,
} = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    mockGetUser: getUser,
    mockCreateClient: vi.fn(() => ({ auth: { getUser } })),
    mockGetProfileCore: vi.fn(),
    mockHasDeletionRequest: vi.fn(),
    mockGetClientIp: vi.fn(),
    mockInsert: vi.fn(),
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
  isAuthRetryableFetchError: () => false,
}));
vi.mock("../supabase/env", () => ({
  getSupabasePublicEnv: () => ({
    url: "https://supabase.test",
    publishableKey: "publishable",
  }),
}));
vi.mock("../client-ip", () => ({ getClientIp: mockGetClientIp }));
vi.mock("./app-usage", () => ({ recordAppUsage: vi.fn() }));
vi.mock("../db/queries", () => ({
  getProfileCoreByUserId: mockGetProfileCore,
  hasAccountDeletionRequest: mockHasDeletionRequest,
}));
vi.mock("../db", async () => ({
  ...(await import("../db/schema")),
  db: { insert: mockInsert },
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { _resetStore, IP_RATE_LIMITS } from "../rate-limit-ip";
import {
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "../practice-problems/test-requests";

import { handleArchivePracticeProblem } from "./practice-problems";

const ENDPOINT = "https://example.test/api/mobile/v1/practice-problems";
const LIMIT = IP_RATE_LIMITS.archivePracticeProblem.maxRequests;

let chain: QueryChainMock;

function archiveRequest(
  body: unknown = meldedAgariRequest(),
  headers: Record<string, string> = {},
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { authorization: "Bearer token-1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** トークンが有効なユーザーにする（ユーザー名の有無を選べる） */
function signedInAs(userId: string, username: string | undefined = "alice") {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, app_metadata: {} } },
  });
  mockGetProfileCore.mockResolvedValue(
    username === undefined
      ? undefined
      : { username, bannedAt: null, deletedAt: null },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetStore();
  chain = createQueryChain([]);
  mockInsert.mockReturnValue(chain);
  mockGetClientIp.mockResolvedValue("203.0.113.1");
  mockHasDeletionRequest.mockResolvedValue(false);
  signedInAs("user-1");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("handleArchivePracticeProblem", () => {
  it.each(["ios", "android"])(
    "保存できたら本文なしの 204 を返し、由来を X-App-Platform の値（%s）で保存する",
    async (platform) => {
      const response = await handleArchivePracticeProblem(
        archiveRequest(meldedAgariRequest(), { "X-App-Platform": platform }),
      );

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(chain.values).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "agari-score", source: platform }),
      );
    },
  );

  it("ユーザー名を決める前（プロフィール未作成）でも保存する", async () => {
    signedInAs("user-2", undefined);

    const response = await handleArchivePracticeProblem(
      archiveRequest(riichiTenpaiRequest()),
    );

    expect(response.status).toBe(204);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("停止スイッチが入っていれば、認証も保存もせず 204", async () => {
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "1");

    const response = await handleArchivePracticeProblem(archiveRequest());

    expect(response.status).toBe(204);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it.each([
    ["形の違う本文", { kind: "agari-score" }],
    ["未知の版", { ...meldedAgariRequest(), schemaVersion: 2 }],
    ["JSON でない本文", "{not json"],
    [
      "上限（4096 バイト）を超える本文",
      { ...meldedAgariRequest(), padding: "x".repeat(4096) },
    ],
  ])("%s は 400 invalidRequest で、保存しない", async (_name, body) => {
    const response = await handleArchivePracticeProblem(archiveRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("トークンが無ければ 401", async () => {
    const response = await handleArchivePracticeProblem(
      new Request(ENDPOINT, {
        method: "POST",
        body: JSON.stringify(meldedAgariRequest()),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("BAN 中は 403", async () => {
    mockGetProfileCore.mockResolvedValue({
      username: "alice",
      bannedAt: new Date(),
      deletedAt: null,
    });

    const response = await handleArchivePracticeProblem(archiveRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "banned" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("同じ IP の枠を使い切ると、アカウントが違っても認証の前に 429", async () => {
    for (let index = 0; index < LIMIT; index++) {
      signedInAs(`user-${index}`);
      expect(
        (await handleArchivePracticeProblem(archiveRequest())).status,
      ).toBe(204);
    }
    signedInAs("user-next");

    const response = await handleArchivePracticeProblem(archiveRequest());

    expect(response.status).toBe(429);
    expect(mockGetUser).toHaveBeenCalledTimes(LIMIT);
  });

  it("同じアカウントの枠を使い切ると、回線（IP）を変えても 429", async () => {
    for (let index = 0; index < LIMIT; index++) {
      mockGetClientIp.mockResolvedValue(`198.51.100.${index}`);
      expect(
        (await handleArchivePracticeProblem(archiveRequest())).status,
      ).toBe(204);
    }
    mockGetClientIp.mockResolvedValue("192.0.2.1");

    const response = await handleArchivePracticeProblem(archiveRequest());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
    expect(mockInsert).toHaveBeenCalledTimes(LIMIT);
  });

  it("DB の失敗は 500 serverError", async () => {
    chain.onConflictDoNothing.mockRejectedValue(new Error("down"));

    const response = await handleArchivePracticeProblem(archiveRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
