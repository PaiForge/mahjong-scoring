import { describe, expect, it } from "vitest";
import { validateImageBinarySignature } from "./binary-signature";
import { IMAGE_SIGNATURES, matchesSignature } from "./magic-bytes";

/** 先頭バイト列から 16 バイトの ArrayBuffer を作る */
function bufferOf(parts: readonly { offset: number; bytes: number[] }[]) {
  const arr = new Uint8Array(16);
  for (const { offset, bytes } of parts) arr.set(bytes, offset);
  return arr.buffer;
}

describe("validateImageBinarySignature", () => {
  it("申告された MIME のシグネチャと一致したときだけ通す", () => {
    const jpeg = bufferOf(IMAGE_SIGNATURES.jpeg);
    const webp = bufferOf(IMAGE_SIGNATURES.webp);
    expect(validateImageBinarySignature(jpeg, "image/jpeg")).toBe(true);
    expect(validateImageBinarySignature(jpeg, "image/png")).toBe(false);
    expect(validateImageBinarySignature(webp, "image/webp")).toBe(true);
    // RIFF だけで WEBP が無い（WAV 等）は通さない
    expect(
      validateImageBinarySignature(
        bufferOf([IMAGE_SIGNATURES.webp[0]]),
        "image/webp",
      ),
    ).toBe(false);
  });

  it("表に無い MIME（SVG 等）は中身を問わず通さない", () => {
    expect(
      validateImageBinarySignature(
        bufferOf(IMAGE_SIGNATURES.png),
        "image/svg+xml",
      ),
    ).toBe(false);
  });
});

describe("matchesSignature", () => {
  it("短すぎる入力は一致しない", () => {
    expect(
      matchesSignature(new Uint8Array([0xff, 0xd8]), IMAGE_SIGNATURES.jpeg),
    ).toBe(false);
    expect(matchesSignature(new Uint8Array(0), IMAGE_SIGNATURES.png)).toBe(
      false,
    );
  });
});
