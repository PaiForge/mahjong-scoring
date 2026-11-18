import { describe, expect, it } from "vitest";

import {
  archiveSendOutcomeOf,
  MOBILE_PRACTICE_PROBLEMS_API_PATH,
  PRACTICE_PROBLEMS_API_PATH,
} from "./mobile-api";

describe("archiveSendOutcomeOf", () => {
  it("2xx は保存できたものとして終える（成功の 204 と範囲の両端）", () => {
    expect(archiveSendOutcomeOf(200)).toBe("done");
    expect(archiveSendOutcomeOf(204)).toBe("done");
    expect(archiveSendOutcomeOf(299)).toBe("done");
  });

  it("5xx はサーバーの一時的な失敗として送り直す", () => {
    expect(archiveSendOutcomeOf(500)).toBe("retry");
    expect(archiveSendOutcomeOf(503)).toBe("retry");
  });

  it("2xx・5xx 以外は送り直しても変わらないので捨てる（429 も練習を止めない）", () => {
    expect(archiveSendOutcomeOf(199)).toBe("drop");
    expect(archiveSendOutcomeOf(300)).toBe("drop");
    expect(archiveSendOutcomeOf(400)).toBe("drop");
    expect(archiveSendOutcomeOf(401)).toBe("drop");
    expect(archiveSendOutcomeOf(403)).toBe("drop");
    expect(archiveSendOutcomeOf(429)).toBe("drop");
    expect(archiveSendOutcomeOf(499)).toBe("drop");
  });
});

describe("保存 API のパス", () => {
  it("web の API はサイトの origin からの /api 配下の絶対パス", () => {
    expect(PRACTICE_PROBLEMS_API_PATH.startsWith("/api/")).toBe(true);
  });

  it("アプリ向け API は版付きの接頭辞の下に、web と同じ資源名で置く", () => {
    const resource = PRACTICE_PROBLEMS_API_PATH.slice("/api".length);
    expect(resource.length).toBeGreaterThan(1);
    expect(MOBILE_PRACTICE_PROBLEMS_API_PATH).toBe(`/api/mobile/v1${resource}`);
  });
});
