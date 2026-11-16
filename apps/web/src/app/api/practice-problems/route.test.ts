/**
 * @vitest-environment node
 */
/**
 * 問題の保存（web 向け）のルートハンドラのテスト
 *
 * 入口の順序（停止スイッチ → Origin → IP の枠 → 認証・BAN → アカウントの枠 →
 * 本文 → 検証 → 保存）を、認証と DB だけ差し替えて実物の枠・検証で確かめる。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

const { mockAuthenticate, mockGetClientIp, mockInsert } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ authenticateAndCheckBan: mockAuthenticate }));
vi.mock("@/lib/client-ip", () => ({ getClientIp: mockGetClientIp }));
vi.mock("@/lib/db", async () => ({
  ...(await import("@/lib/db/schema")),
  db: { insert: mockInsert },
}));
vi.mock("@/lib/log-error", async () => await import("@/test/log-error-mock"));

import { _resetStore, IP_RATE_LIMITS } from "@/lib/rate-limit-ip";
import {
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "@/lib/practice-problems/test-requests";

import { POST } from "./route";

const ENDPOINT = "https://example.test/api/practice-problems";
const LIMIT = IP_RATE_LIMITS.archivePracticeProblem.maxRequests;

let chain: QueryChainMock;

/** 同一オリジンからの POST */
function archiveRequest(
  body: unknown = meldedAgariRequest(),
  origin = "https://example.test",
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { origin, host: "example.test" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function signedInAs(userId: string) {
  mockAuthenticate.mockResolvedValue({ user: { id: userId } });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetStore();
  chain = createQueryChain([]);
  mockInsert.mockReturnValue(chain);
  mockGetClientIp.mockResolvedValue("203.0.113.1");
  signedInAs("user-1");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/practice-problems", () => {
  it("保存できたら本文なしの 204 を返し、由来を web として保存する", async () => {
    const response = await POST(archiveRequest());

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "agari-score", source: "web" }),
    );
  });

  it("ユーザー名を決める前のユーザーも保存できる（プロフィールを見ない）", async () => {
    signedInAs("user-without-profile");

    const response = await POST(archiveRequest(riichiTenpaiRequest()));

    expect(response.status).toBe(204);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("停止スイッチが入っていれば、認証も保存もせず 204", async () => {
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "1");

    const response = await POST(archiveRequest());

    expect(response.status).toBe(204);
    expect(mockAuthenticate).not.toHaveBeenCalled();
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
  ])("%s は 400 で、保存しない", async (_name, body) => {
    const response = await POST(archiveRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("未ログインは 401 にせず、保存しないまま 204（匿名の出題のたびにブラウザへ通信エラーを残さない）", async () => {
    mockAuthenticate.mockResolvedValue({ error: "unauthorized" });

    const response = await POST(archiveRequest());

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("BAN 中は 403", async () => {
    mockAuthenticate.mockResolvedValue({ error: "banned" });

    const response = await POST(archiveRequest());

    expect(response.status).toBe(403);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("他のサイトからの要求（Origin 不正）は認証の前に 403", async () => {
    const response = await POST(
      archiveRequest(meldedAgariRequest(), "https://evil.example"),
    );

    expect(response.status).toBe(403);
    expect(mockAuthenticate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("同じ IP の枠を使い切ると、アカウントが違っても 429", async () => {
    for (let index = 0; index < LIMIT; index++) {
      signedInAs(`user-${index}`);
      expect((await POST(archiveRequest())).status).toBe(204);
    }
    signedInAs("user-next");

    const response = await POST(archiveRequest());

    expect(response.status).toBe(429);
    expect(mockAuthenticate).toHaveBeenCalledTimes(LIMIT);
  });

  it("同じアカウントの枠を使い切ると、回線（IP）を変えても 429", async () => {
    for (let index = 0; index < LIMIT; index++) {
      mockGetClientIp.mockResolvedValue(`198.51.100.${index}`);
      expect((await POST(archiveRequest())).status).toBe(204);
    }
    mockGetClientIp.mockResolvedValue("192.0.2.1");

    const response = await POST(archiveRequest());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
    expect(mockInsert).toHaveBeenCalledTimes(LIMIT);
  });

  it("DB の失敗は 500", async () => {
    chain.onConflictDoNothing.mockRejectedValue(new Error("down"));

    const response = await POST(archiveRequest());

    expect(response.status).toBe(500);
  });
});
