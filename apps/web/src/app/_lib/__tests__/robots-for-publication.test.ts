import { describe, expect, it, vi } from "vitest";

import type { Publication } from "@/i18n/route-policy";

/**
 * 英語の許可リストに noindex の行が入るのは英語化フェーズ 3a の公開からなので、
 * 公開状態の表は差し替えて、公開状態から robots を決めることだけを見る。
 */
const publications: Record<string, Publication> = {
  "ja:/dojo": "published-indexable",
  "en:/dojo": "published-noindex",
  "en:/practice": "published-indexable",
  "en:/dashboard": "unpublished",
};

vi.mock("@/i18n/route-policy", () => ({
  getPublication: (path: string, locale: string) =>
    publications[`${locale}:${path}`] ?? "unpublished",
}));

import { robotsForPublication } from "../metadata";

describe("robotsForPublication", () => {
  it("その言語で noindex のページには index: false, follow: true を返す", () => {
    expect(robotsForPublication("/dojo", "en")).toEqual({
      index: false,
      follow: true,
    });
  });

  it("索引対象・未公開のページには何も返さない（既存の指定を使う）", () => {
    expect(robotsForPublication("/dojo", "ja")).toBeUndefined();
    expect(robotsForPublication("/practice", "en")).toBeUndefined();
    expect(robotsForPublication("/dashboard", "en")).toBeUndefined();
  });
});
