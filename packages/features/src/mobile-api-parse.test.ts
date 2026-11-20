import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseWithSchema } from "./mobile-api-parse";

describe("parseWithSchema", () => {
  const schema = z.object({ count: z.number() });

  it("スキーマに合う値はそのまま返す", () => {
    expect(parseWithSchema(schema, { count: 3 })).toEqual({ count: 3 });
  });

  it("スキーマに合わない値は undefined を返す", () => {
    expect(parseWithSchema(schema, { count: "3" })).toBeUndefined();
    expect(parseWithSchema(schema, null)).toBeUndefined();
  });

  it("スキーマが変換した後の値を返す", () => {
    const withDefault = z.object({ n: z.number().default(7) });
    expect(parseWithSchema(withDefault, {})).toEqual({ n: 7 });
  });
});
