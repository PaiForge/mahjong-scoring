import { describe, expect, it } from "vitest";
import {
  parseGeneratorOptionsFromParams,
  parseModeFlagsFromParams,
} from "../parse-practice-params";

describe("parseGeneratorOptionsFromParams", () => {
  it("ranges 未指定時は両方の点数帯を含む", () => {
    const result = parseGeneratorOptionsFromParams(new URLSearchParams());
    expect(result.allowedRanges).toEqual(["nonMangan", "manganPlus"]);
  });

  it("ranges=non のみ指定すると nonMangan だけになる", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("ranges=non"),
    );
    expect(result.allowedRanges).toEqual(["nonMangan"]);
  });

  it("ranges=plus のみ指定すると manganPlus だけになる", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("ranges=plus"),
    );
    expect(result.allowedRanges).toEqual(["manganPlus"]);
  });

  it("ranges を複数指定すると両方含む", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("ranges=non&ranges=plus"),
    );
    expect(result.allowedRanges).toEqual(["nonMangan", "manganPlus"]);
  });

  it("roles 未指定時は親・子とも含む", () => {
    const result = parseGeneratorOptionsFromParams(new URLSearchParams());
    expect(result.includeParent).toBe(true);
    expect(result.includeChild).toBe(true);
  });

  it("roles=oya のみ指定すると子を含まない", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("roles=oya"),
    );
    expect(result.includeParent).toBe(true);
    expect(result.includeChild).toBe(false);
  });

  it("roles=ko のみ指定すると親を含まない", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("roles=ko"),
    );
    expect(result.includeParent).toBe(false);
    expect(result.includeChild).toBe(true);
  });
});

describe("parseModeFlagsFromParams", () => {
  it("未指定時は全フラグが false", () => {
    const result = parseModeFlagsFromParams(new URLSearchParams());
    expect(result).toEqual({
      requireYaku: false,
      simplifyMangan: false,
      requireFuForMangan: false,
      autoNext: false,
    });
  });

  it("各パラメータを個別に読み取る", () => {
    const result = parseModeFlagsFromParams(
      new URLSearchParams("mode=with_yaku&simple=1&fu_mangan=1&auto_next=1"),
    );
    expect(result).toEqual({
      requireYaku: true,
      simplifyMangan: true,
      requireFuForMangan: true,
      autoNext: true,
    });
  });

  it("値が異なる場合は false になる", () => {
    const result = parseModeFlagsFromParams(
      new URLSearchParams("mode=normal&simple=0&fu_mangan=0&auto_next=0"),
    );
    expect(result).toEqual({
      requireYaku: false,
      simplifyMangan: false,
      requireFuForMangan: false,
      autoNext: false,
    });
  });
});

describe("parseGeneratorOptionsFromParams: yaku", () => {
  it("yaku 未指定時は requiredYaku を undefined で明示する（マージで前回条件を残さない）", () => {
    const result = parseGeneratorOptionsFromParams(new URLSearchParams());
    expect("requiredYaku" in result).toBe(true);
    expect(result.requiredYaku).toBeUndefined();
  });

  it("yaku のトークンを役名（日本語）へ解釈する", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("yaku=pinfu&yaku=tanyao"),
    );
    expect(result.requiredYaku).toEqual(["平和", "断么九"]);
  });

  it("未知のトークンは捨て、有効なものだけ残す", () => {
    const result = parseGeneratorOptionsFromParams(
      new URLSearchParams("yaku=kokushi&yaku=pinfu"),
    );
    expect(result.requiredYaku).toEqual(["平和"]);
  });
});
