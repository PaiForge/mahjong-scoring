import { describe, expect, it } from "vitest";

import { buildContactParams, readContactParams } from "./contact-params";

const data = {
  name: "山田 太郎",
  email: "taro@example.com",
  subject: "点数表について",
  message: "1 行目\n2 行目 & <b>記号</b>",
};

describe("contact-params", () => {
  it("組み立てたクエリを読み戻すと元の内容に戻る（往復）", () => {
    const params = new URLSearchParams(buildContactParams(data));
    expect(readContactParams(Object.fromEntries(params))).toEqual(data);
  });

  it("同じキーが複数あるときは先頭を採る", () => {
    expect(readContactParams({ ...data, name: ["first", "second"] })).toEqual({
      ...data,
      name: "first",
    });
  });

  it("キーが 1 つでも欠けていれば undefined", () => {
    expect(readContactParams({ ...data, message: undefined })).toBe(undefined);
    expect(readContactParams({})).toBe(undefined);
  });
});
