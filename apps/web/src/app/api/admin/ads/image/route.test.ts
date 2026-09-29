/**
 * @vitest-environment node
 */
/**
 * 広告画像 API のルートハンドラのテスト
 *
 * 管理者以外は Storage に触れずに 403、管理者は WebP に正規化した画像を
 * ad-creatives バケットに置き、保存時の検証と同じ接頭辞の URL を返す。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuthorizeApiRequest,
  mockRequireAdmin,
  mockCreateAdminClient,
  mockSharp,
  mockToBuffer,
} = vi.hoisted(() => ({
  mockAuthorizeApiRequest: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockSharp: vi.fn(),
  mockToBuffer: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  authorizeApiRequest: mockAuthorizeApiRequest,
}));
vi.mock("@/app/admin/_lib/auth", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));
vi.mock("@/app/admin/ads/_lib/image-url", () => ({
  AD_IMAGE_BUCKET: "ad-creatives",
  adImageUrlPrefix: () =>
    "https://example.supabase.co/storage/v1/object/public/ad-creatives/",
}));
vi.mock("sharp", () => ({ default: mockSharp }));

import { POST } from "./route";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PROCESSED = Buffer.from([0x77, 0x65, 0x62, 0x70]);

let mockUpload: ReturnType<typeof vi.fn>;
let mockStorageFrom: ReturnType<typeof vi.fn>;

function pngRequest(): Request {
  const body = new FormData();
  body.set(
    "file",
    new File([new Uint8Array([...PNG_HEADER, 0, 0])], "a.png", {
      type: "image/png",
    }),
  );
  return new Request("https://example.test/api/admin/ads/image", {
    method: "POST",
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpload = vi.fn().mockResolvedValue({ error: undefined });
  mockStorageFrom = vi.fn(() => ({ upload: mockUpload }));
  mockCreateAdminClient.mockReturnValue({
    storage: { from: mockStorageFrom },
  });
  mockAuthorizeApiRequest.mockResolvedValue({
    ok: true,
    user: { id: "admin-1" },
  });
  mockToBuffer.mockResolvedValue(PROCESSED);
  const chain = {
    rotate: () => chain,
    resize: () => chain,
    webp: () => chain,
    toBuffer: mockToBuffer,
  };
  mockSharp.mockReturnValue(chain);
});

describe("POST /api/admin/ads/image", () => {
  it("管理者でなければ Storage に触れずに 403", async () => {
    mockRequireAdmin.mockResolvedValue({ error: "unauthorized" });

    const response = await POST(pngRequest());

    expect(response.status).toBe(403);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("管理者なら正規化した WebP を置き、バケットの公開 URL を返す", async () => {
    mockRequireAdmin.mockResolvedValue({ userId: "admin-1" });

    const response = await POST(pngRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockStorageFrom).toHaveBeenCalledWith("ad-creatives");
    const [fileName, bytes, options] = mockUpload.mock.calls[0];
    expect(fileName).toMatch(/^[0-9a-f-]+\.webp$/);
    expect(bytes).toBe(PROCESSED);
    expect(options).toEqual({ contentType: "image/webp" });
    expect(body.url).toBe(
      `https://example.supabase.co/storage/v1/object/public/ad-creatives/${fileName}`,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("デコードできない画像は保存せずに 400", async () => {
    mockRequireAdmin.mockResolvedValue({ userId: "admin-1" });
    mockToBuffer.mockRejectedValue(new Error("bad image"));

    const response = await POST(pngRequest());

    expect(response.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
