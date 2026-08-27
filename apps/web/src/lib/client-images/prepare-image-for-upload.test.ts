/**
 * アップロード前画像正規化の純粋関数テスト
 *
 * @description
 * - 形式判定はマジックバイトのみで行う（`file.type` は見ない）
 * - HEIF 系ブランドと、同じ ftyp を持つ動画コンテナ（mp4 等）を取り違えない
 * - 再処理の要否と縮小倍率のポリシー
 *
 * canvas / libheif を要する経路は jsdom では動かないため、ここでは扱わない。
 */
import { describe, expect, it } from "vitest";

import {
  MAX_LONG_EDGE,
  TARGET_MAX_BYTES,
  computeScale,
  needsResize,
  sniffImageKind,
} from "./prepare-image-for-upload";

/** 先頭バイト列から、少なくとも len バイトの Uint8Array を作る */
function bytes(head: readonly number[], len = head.length): Uint8Array {
  const arr = new Uint8Array(Math.max(len, head.length));
  arr.set(head);
  return arr;
}

/** オフセット 8 に指定ブランドを持つ ftyp ボックス */
function ftyp(brand: string): Uint8Array {
  const b = new Uint8Array(16);
  b.set([0x00, 0x00, 0x00, 0x18], 0); // ボックスサイズ（任意）
  b.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  b.set(
    [
      brand.charCodeAt(0),
      brand.charCodeAt(1),
      brand.charCodeAt(2),
      brand.charCodeAt(3),
    ],
    8,
  );
  return b;
}

describe("sniffImageKind", () => {
  it("JPEG を SOI マーカーで判定する", () => {
    expect(sniffImageKind(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
  });

  it("PNG を 8 バイトのシグネチャで判定する", () => {
    expect(
      sniffImageKind(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("png");
  });

  it("WebP を RIFF / WEBP の 2 つの fourcc で判定する", () => {
    const b = bytes([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageKind(b)).toBe("webp");
  });

  it.each([
    "heic",
    "heix",
    "heim",
    "heis",
    "hevc",
    "hevx",
    "mif1",
    "msf1",
    "heif",
  ])("HEIF 系ブランド %s を判定する", (brand) => {
    expect(sniffImageKind(ftyp(brand))).toBe("heic");
  });

  it("HEIF 以外の ftyp ブランド（mp4 等）を HEIC と誤認しない", () => {
    expect(sniffImageKind(ftyp("isom"))).toBe("other");
    expect(sniffImageKind(ftyp("mp42"))).toBe("other");
  });

  it("未知・短すぎる入力は other を返す", () => {
    expect(sniffImageKind(bytes([0x00, 0x01, 0x02, 0x03]))).toBe("other");
    expect(sniffImageKind(bytes([0xff, 0xd8]))).toBe("other"); // 途中で切れた JPEG
    expect(sniffImageKind(new Uint8Array(0))).toBe("other");
  });
});

describe("needsResize", () => {
  it("目標バイト数を超えたら true", () => {
    expect(needsResize(TARGET_MAX_BYTES + 1, 800)).toBe(true);
  });

  it("長辺の上限を超えたら true", () => {
    expect(needsResize(100_000, MAX_LONG_EDGE + 1)).toBe(true);
  });

  it("どちらも上限内なら false", () => {
    expect(needsResize(TARGET_MAX_BYTES, MAX_LONG_EDGE)).toBe(false);
    expect(needsResize(500_000, 1024)).toBe(false);
  });
});

describe("computeScale", () => {
  it("長辺が上限内なら 1（縮小しない）", () => {
    expect(computeScale(1600, 1200)).toBe(1);
    expect(computeScale(MAX_LONG_EDGE, MAX_LONG_EDGE)).toBe(1);
  });

  it("長辺を上限まで落とす倍率を返す", () => {
    expect(computeScale(4096, 2048)).toBe(0.5);
    expect(computeScale(2048, 4096)).toBe(0.5);
  });
});
