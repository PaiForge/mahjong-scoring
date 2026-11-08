/**
 * 道場の metadata の公開状態の合成（withPublicationRobots）のテスト
 *
 * @description
 * 英語の道場は noindex で、hreflang を外して自己 canonical だけを残す。
 * 日本語は入力の metadata をそのまま返す（出力を変えない）。
 */
import { describe, expect, it } from "vitest";

import { createMetadata } from "@/app/_lib/metadata";

import { withPublicationRobots } from "./publication-metadata";

describe("withPublicationRobots", () => {
  it.each(["/dojo", "/dojo/ranks/kyu-5"])(
    "日本語の %s は入力のまま返す（robots を足さず hreflang も残す）",
    (path) => {
      const metadata = createMetadata({ title: "t", path, locale: "ja" });

      const result = withPublicationRobots(metadata, path, "ja");

      expect(result).toBe(metadata);
      expect(result.robots).toBeUndefined();
      expect(result.alternates?.languages).toBeDefined();
    },
  );

  it.each(["/dojo", "/dojo/ranks/kyu-5"])(
    "英語の %s は noindex にし、hreflang を外して自己 canonical だけを残す",
    (path) => {
      const metadata = createMetadata({ title: "t", path, locale: "en" });

      const result = withPublicationRobots(metadata, path, "en");

      expect(result.robots).toEqual({ index: false, follow: true });
      expect(result.alternates).toEqual({ canonical: `/en${path}` });
      expect(result.title).toBe(metadata.title);
    },
  );
});
