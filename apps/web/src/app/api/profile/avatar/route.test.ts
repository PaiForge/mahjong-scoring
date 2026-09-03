/**
 * @vitest-environment node
 */
/**
 * アバター API のルートハンドラのテスト
 *
 * @description
 * このエンドポイントは「閲覧者本人に紐づく応答」を返すため、すべての出口が
 * `jsonPrivate` を通って `Cache-Control: private, no-store` を持たなければ
 * ならない。1つでも素の `NextResponse.json` に戻ると、共有キャッシュに他人の
 * アバター URL が乗りうる。ここが唯一その規約を機械的に守っている場所なので、
 * 成功・失敗を問わずすべての応答でヘッダを検査する。
 *
 * あわせて、コメントでしか表現されていない2つの仕様を固定する。
 * 1. アップロードに失敗したら profiles を更新しない
 * 2. DELETE は「先に参照を切ってから Storage を消す」順序で、Storage の削除に
 *    失敗しても操作全体は成功させる
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextResponse } from "next/server";

const {
  mockAuthorizeApiRequest,
  mockLogActivityEvent,
  mockRevalidateTag,
  mockUpdate,
  mockSharp,
  mockToBuffer,
} = vi.hoisted(() => ({
  mockAuthorizeApiRequest: vi.fn(),
  mockLogActivityEvent: vi.fn(),
  mockRevalidateTag: vi.fn(),
  mockUpdate: vi.fn(),
  mockSharp: vi.fn(),
  mockToBuffer: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));

vi.mock("@/lib/api-auth", () => ({
  authorizeApiRequest: mockAuthorizeApiRequest,
}));

vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));

vi.mock("@/lib/db", async () => ({
  db: { update: mockUpdate },
  profiles: (await import("@/test/schema-mock")).profiles,
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

// sharp は実物を通さない。ここで確かめたいのは正規化の画質ではなく、
// デコードが失敗したときに 400 へ落ちること・成功した結果が Storage へ
// そのまま渡ることなので、チェーンの形だけ模す。
vi.mock("sharp", () => ({ default: mockSharp }));

import { createQueryChain } from "@/test/drizzle-mock";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";
import { AVATAR_MAX_FILE_SIZE } from "@/lib/images/policy";

import { DELETE, POST } from "./route";

const USER_ID = "user-123";
const PUBLIC_URL = "https://storage.example/avatars/user-123/avatar.webp";

/** 正規化後の WebP のつもりのバイト列（中身は問わない） */
const PROCESSED = Buffer.from([0x77, 0x65, 0x62, 0x70]);

/** PNG のマジックナンバー（署名検証を通す最小の先頭） */
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

let mockUpload: ReturnType<typeof vi.fn>;
let mockRemove: ReturnType<typeof vi.fn>;
let mockGetPublicUrl: ReturnType<typeof vi.fn>;

/** 認証済みユーザーとして Storage を操作できる状態にする */
function authorized() {
  mockUpload = vi.fn().mockResolvedValue({ error: undefined });
  mockRemove = vi.fn().mockResolvedValue({ error: undefined });
  mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: PUBLIC_URL } }));

  mockAuthorizeApiRequest.mockResolvedValue({
    ok: true,
    user: { id: USER_ID },
    supabase: {
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          remove: mockRemove,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    },
  });
}

/** 画像ファイルを1つ持つ multipart リクエストを組み立てる */
function requestWithFile(file: File, method = "POST"): Request {
  const body = new FormData();
  body.set("file", file);
  return new Request("https://example.test/api/profile/avatar", {
    method,
    body,
  });
}

/** 署名の通る PNG として扱われるファイル */
function pngFile(type = "image/png"): File {
  return new File([new Uint8Array([...PNG_HEADER, 0x00, 0x00])], "a.png", {
    type,
  });
}

/**
 * 応答が「閲覧者に紐づく応答」の指示を持つことを確かめる
 *
 * このエンドポイントの全出口が満たすべき規約なので、個別のテストでも必ず通す。
 */
function expectPrivateCache(response: NextResponse) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
}

beforeEach(() => {
  vi.clearAllMocks();
  authorized();
  mockUpdate.mockReturnValue(createQueryChain(undefined));
  mockToBuffer.mockResolvedValue(PROCESSED);
  mockSharp.mockReturnValue({
    rotate: () => ({
      resize: () => ({ webp: () => ({ toBuffer: mockToBuffer }) }),
    }),
  });
});

describe("POST", () => {
  it("認可に失敗したら前処理が作った応答をそのまま返す", async () => {
    // 401 / 403 / 429 の作り分けは authorizeApiRequest の責務で、
    // ここはそれを握り潰さず返すことだけを守る。
    const denied = new Response(null, { status: 429 });
    mockAuthorizeApiRequest.mockResolvedValue({ ok: false, response: denied });

    expect(await POST(requestWithFile(pngFile()))).toBe(denied);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  describe("受け付けない入力", () => {
    it("multipart として読めなければ 400 invalidForm", async () => {
      // 送信側の誤りなので 500 にしない。
      const broken = new Request("https://example.test/api/profile/avatar", {
        method: "POST",
        body: "not-multipart",
        headers: { "Content-Type": "multipart/form-data; boundary=x" },
      });

      const response = await POST(broken);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "invalidForm" });
      expectPrivateCache(response);
    });

    it("file が無ければ 400 noFile", async () => {
      const body = new FormData();
      body.set("file", "文字列は File ではない");
      const response = await POST(
        new Request("https://example.test/api/profile/avatar", {
          method: "POST",
          body,
        }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "noFile" });
      expectPrivateCache(response);
    });

    it("許可していない形式は 400 invalidType", async () => {
      // SVG は Storage の URL を直接開くとスクリプトが動くため通さない。
      const svg = new File(["<svg />"], "a.svg", { type: "image/svg+xml" });

      const response = await POST(requestWithFile(svg));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "invalidType" });
      expectPrivateCache(response);
    });

    it("上限を超えるサイズは 400 tooLarge", async () => {
      // multipart を経ると File.size は実バイト数から作り直されるため、
      // size だけ差し替えても通らない。上限を1バイト超える実体を積む。
      const bytes = new Uint8Array(AVATAR_MAX_FILE_SIZE + 1);
      bytes.set(PNG_HEADER);
      const tooLarge = new File([bytes], "a.png", { type: "image/png" });

      const response = await POST(requestWithFile(tooLarge));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "tooLarge" });
      expectPrivateCache(response);
    });

    it("Content-Type を偽装した中身は 400 invalidType", async () => {
      // 許可形式を名乗るが先頭バイトが一致しないファイル。
      const fake = new File(["MZ..."], "a.png", { type: "image/png" });

      const response = await POST(requestWithFile(fake));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "invalidType" });
      expectPrivateCache(response);
      expect(mockSharp).not.toHaveBeenCalled();
    });

    it("デコードできない画像は 400 invalidImage", async () => {
      // 署名は通るが libvips が開けないもの（壊れた画像・圧縮爆弾）。
      mockToBuffer.mockRejectedValue(new Error("decode failed"));

      const response = await POST(requestWithFile(pngFile()));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "invalidImage" });
      expectPrivateCache(response);
    });
  });

  describe("Storage への保存", () => {
    it("正規化した画像をユーザーごとの固定パスへ上書き保存する", async () => {
      await POST(requestWithFile(pngFile()));

      expect(mockUpload).toHaveBeenCalledWith(
        `${USER_ID}/avatar.webp`,
        PROCESSED,
        { contentType: "image/webp", upsert: true },
      );
    });

    it("保存に失敗したら 500 を返し、プロフィールを更新しない", async () => {
      // 更新してしまうと、存在しないオブジェクトを指す URL が一覧に出る。
      mockUpload.mockResolvedValue({ error: new Error("storage down") });

      const response = await POST(requestWithFile(pngFile()));

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: "uploadFailed" });
      expectPrivateCache(response);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("成功時", () => {
    it("キャッシュバスト付きの URL を返す", async () => {
      // パスは不変なので、クエリを足さないと差し替えても古い画像が出続ける。
      const response = await POST(requestWithFile(pngFile()));

      expect(response.status).toBe(200);
      const body: { success: boolean; avatarUrl: string } =
        await response.json();
      expect(body.success).toBe(true);
      expect(body.avatarUrl).toMatch(
        new RegExp(`^${PUBLIC_URL.replace(/[/.]/g, "\\$&")}\\?t=\\d+$`),
      );
      expectPrivateCache(response);
    });

    it("プロフィールを更新し、ランキングのキャッシュを捨て、活動ログを残す", async () => {
      await POST(requestWithFile(pngFile()));

      const chain = mockUpdate.mock.results[0].value;
      expect(chain.set).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: expect.stringContaining("?t=") }),
      );
      // 一覧の行はアバター URL を含むため、捨てないと古い画像を出し続ける。
      expect(mockRevalidateTag).toHaveBeenCalledWith(
        LEADERBOARD_CACHE_TAG,
        "default",
      );
      expect(mockLogActivityEvent).toHaveBeenCalledWith({
        userId: USER_ID,
        action: "update_avatar",
        targetType: "user",
        targetId: USER_ID,
      });
    });
  });
});

describe("DELETE", () => {
  const request = () =>
    new Request("https://example.test/api/profile/avatar", {
      method: "DELETE",
    });

  it("認可に失敗したら前処理が作った応答をそのまま返す", async () => {
    const denied = new Response(null, { status: 401 });
    mockAuthorizeApiRequest.mockResolvedValue({ ok: false, response: denied });

    expect(await DELETE(request())).toBe(denied);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("参照を切ってから Storage を消す", async () => {
    // 逆順にすると、削除に失敗したときに「消えた画像を指す URL」が残り、
    // 一覧が壊れた画像を出す。
    const order: string[] = [];
    mockUpdate.mockImplementation(() => {
      order.push("db");
      return createQueryChain(undefined);
    });
    mockRemove.mockImplementation(() => {
      order.push("storage");
      return Promise.resolve({ error: undefined });
    });

    await DELETE(request());

    expect(order).toEqual(["db", "storage"]);
    expect(mockRemove).toHaveBeenCalledWith([`${USER_ID}/avatar.webp`]);
  });

  it("avatar_url を空に戻し、ランキングのキャッシュを捨て、活動ログを残す", async () => {
    const response = await DELETE(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expectPrivateCache(response);

    const chain = mockUpdate.mock.results[0].value;
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: null }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      LEADERBOARD_CACHE_TAG,
      "default",
    );
    expect(mockLogActivityEvent).toHaveBeenCalledWith({
      userId: USER_ID,
      action: "delete_avatar",
      targetType: "user",
      targetId: USER_ID,
    });
  });

  it("Storage の削除に失敗しても成功として返す", async () => {
    // 参照は既に切れているので、残るのは誰からも参照されないオブジェクトだけ。
    // 次のアップロードが同じパスを上書きする。
    mockRemove.mockResolvedValue({ error: new Error("storage down") });

    const response = await DELETE(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
