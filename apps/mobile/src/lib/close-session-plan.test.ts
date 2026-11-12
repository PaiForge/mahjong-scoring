import { describe, expect, it } from "vitest";

import { planCloseSession } from "./close-session-plan";

const tabs = { key: "tabs", name: "(tabs)" };
const session = { key: "session", name: "(session)" };
const intro = (slug: string, variant?: string) => ({
  key: `intro-${slug}`,
  name: "practice/[slug]/index",
  params: variant === undefined ? { slug } : { slug, variant },
});

describe("planCloseSession", () => {
  it("下が同じ練習の説明画面なら、params を exitHref のクエリで置き換えてから閉じる", () => {
    expect(
      planCloseSession(
        [tabs, intro("jantou-fu", "basic"), session],
        2,
        "/practice/jantou-fu?variant=all",
      ),
    ).toEqual({
      kind: "close",
      count: 1,
      replaceParams: {
        key: "intro-jantou-fu",
        params: { slug: "jantou-fu", variant: "all" },
      },
    });
  });

  it("exitHref にクエリが無ければ、説明画面のクエリの params は落とす", () => {
    expect(
      planCloseSession(
        [tabs, intro("jantou-fu", "basic"), session],
        2,
        "/practice/jantou-fu",
      ),
    ).toEqual({
      kind: "close",
      count: 1,
      replaceParams: { key: "intro-jantou-fu", params: { slug: "jantou-fu" } },
    });
  });

  it("下が別の練習の説明画面なら、params を触らずにそのまま閉じる", () => {
    expect(
      planCloseSession(
        [tabs, intro("jantou-fu"), intro("machi-fu"), session],
        3,
        "/practice/jantou-fu",
      ),
    ).toEqual({ kind: "close", count: 1 });
  });

  it("下がタブなど別の画面なら、そのまま閉じて下の画面へ戻る", () => {
    expect(planCloseSession([tabs, session], 1, "/practice/jantou-fu")).toEqual(
      { kind: "close", count: 1 },
    );
  });

  it("上に別のモーダルが重なっていれば、それもまとめて閉じる", () => {
    expect(
      planCloseSession(
        [tabs, intro("jantou-fu"), session, { key: "acc", name: "(account)" }],
        3,
        "/practice/jantou-fu",
      ),
    ).toMatchObject({ kind: "close", count: 2 });
  });

  it("下に画面が無ければ（ディープリンクで直接開いた）exitHref へ置き換える", () => {
    expect(planCloseSession([session], 0, "/practice/jantou-fu")).toEqual({
      kind: "replace",
    });
  });

  it("(session) が無ければ exitHref へ置き換える", () => {
    expect(
      planCloseSession([tabs, intro("jantou-fu")], 1, "/practice/jantou-fu"),
    ).toEqual({ kind: "replace" });
  });
});
