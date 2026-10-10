import { describe, expect, it } from "vitest";

import {
  findRouteIndexByHref,
  paramsForHref,
  routePathname,
} from "./route-pathname";

describe("routePathname", () => {
  it("動的な部分を params で埋め、index を落とす", () => {
    expect(routePathname("practice/[slug]/index", { slug: "jantou-fu" })).toBe(
      "/practice/jantou-fu",
    );
    expect(routePathname("exam/[exam]/result", { exam: "kyu-4" })).toBe(
      "/exam/kyu-4/result",
    );
  });

  it("route group を落とす", () => {
    expect(routePathname("(tabs)", undefined)).toBe("/");
    expect(routePathname("sign-in", undefined)).toBe("/sign-in");
  });
});

describe("findRouteIndexByHref", () => {
  const routes = [
    { name: "(tabs)" },
    { name: "practice/[slug]/index", params: { slug: "jantou-fu" } },
    { name: "mypage/challenges/index" },
    { name: "practice/[slug]/index", params: { slug: "mentsu-fu" } },
    { name: "practice/[slug]/result", params: { slug: "jantou-fu" } },
  ];

  it("slug まで一致する画面を探す（名前だけ同じ画面は飛ばす）", () => {
    expect(
      findRouteIndexByHref(routes, 4, "/practice/jantou-fu?variant=default"),
    ).toBe(1);
  });

  it("今の画面に最も近いものを返す", () => {
    expect(findRouteIndexByHref(routes, 4, "/practice/mentsu-fu")).toBe(3);
  });

  it("無ければ undefined", () => {
    expect(findRouteIndexByHref(routes, 4, "/practice/machi-fu")).toBe(
      undefined,
    );
  });
});

describe("paramsForHref", () => {
  it("同じ slug で variant が違うときは href の variant に置き換える", () => {
    expect(
      paramsForHref(
        "practice/[slug]/index",
        { slug: "yaku", variant: "default" },
        "/practice/yaku?variant=all",
      ),
    ).toEqual({ slug: "yaku", variant: "all" });
  });

  it("href にクエリが無ければクエリの params は落とす（dismissTo と同じ）", () => {
    expect(
      paramsForHref(
        "exam/[exam]/index",
        { exam: "kyu-4", variant: "x" },
        "/exam/kyu-4",
      ),
    ).toEqual({ exam: "kyu-4" });
  });

  it("クエリの値を復号する", () => {
    expect(
      paramsForHref(
        "practice/[slug]/index",
        { slug: "a" },
        "/practice/a?q=a%20b",
      ),
    ).toEqual({ slug: "a", q: "a b" });
  });
});
