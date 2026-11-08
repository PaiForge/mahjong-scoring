import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

import { buildQrCodePath } from "./qr-code-path";

describe("buildQrCodePath", () => {
  const text = "https://apps.apple.com/jp/app/id6820905974";

  it("ライブラリのモジュールの行列と同じ数の暗いマスを path にする", () => {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
    const dark = Array.from(modules.data).filter(Boolean).length;
    const { size, d } = buildQrCodePath(text);

    expect(size).toBe(modules.size);
    expect(d.match(/M\d+ \d+h1v1h-1z/g)).toHaveLength(dark);
  });

  it("左上の位置検出パターンの角（0, 0）は暗いマス", () => {
    expect(buildQrCodePath(text).d.startsWith("M0 0h1v1h-1z")).toBe(true);
  });
});
