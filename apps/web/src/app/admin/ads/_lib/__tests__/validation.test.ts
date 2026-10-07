import { describe, expect, it } from "vitest";

import { type AdCreativeInput, validateAdCreative } from "../validation";

const PREFIX =
  "https://example.supabase.co/storage/v1/object/public/ad-creatives/";
const IMAGE = `${PREFIX}0f8fad5b-d9cb-469f-a165-70867728950e.webp`;

function input(overrides: Partial<AdCreativeInput> = {}): AdCreativeInput {
  return {
    slot: "practice-grid-native-ad",
    asin: "",
    href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
    isActive: true,
    icon: "📘",
    imageUrl: "",
    imageAlt: "",
    hand: "",
    title: { ja: "麻雀の本", en: "" },
    description: { ja: "説明", en: "" },
    ...overrides,
  };
}

function errorOf(data: AdCreativeInput) {
  const result = validateAdCreative(data, PREFIX);
  return result.ok ? undefined : result.error;
}

describe("validateAdCreative", () => {
  it("正しい入力は空欄を undefined にし、書いたロケールだけの文言にする", () => {
    const result = validateAdCreative(input(), PREFIX);
    expect(result).toEqual({
      ok: true,
      value: {
        slot: "practice-grid-native-ad",
        asin: undefined,
        href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
        isActive: true,
        icon: "📘",
        imageUrl: undefined,
        imageAlt: undefined,
        hand: undefined,
        copy: { title: { ja: "麻雀の本" }, description: { ja: "説明" } },
      },
    });
  });

  it("ASIN があれば URL は使わず、商品ページの URL からも ASIN を取り出す", () => {
    const result = validateAdCreative(
      input({
        asin: "https://www.amazon.co.jp/書名/dp/B08721VWS5/ref=sr_1_1?qid=1",
        href: "not a url",
      }),
      PREFIX,
    );
    expect(result.ok && result.value).toMatchObject({
      asin: "B08721VWS5",
      href: undefined,
    });
  });

  it("ASIN として読めない値を弾く", () => {
    expect(errorOf(input({ asin: "https://www.amazon.co.jp/s?k=麻雀" }))).toBe(
      "errorAsinInvalid",
    );
  });

  it("レジストリに無いスロットを弾く", () => {
    expect(errorOf(input({ slot: "banner" }))).toBe("errorSlotInvalid");
  });

  it.each(["http://example.com", "javascript:alert(1)", "not a url"])(
    "https 以外の遷移先を弾く: %s",
    (href) => {
      expect(errorOf(input({ href }))).toBe("errorHrefInvalid");
    },
  );

  it("絵文字も画像も手牌も無ければ弾く", () => {
    expect(errorOf(input({ icon: " " }))).toBe("errorVisualRequired");
  });

  it("カード型は手牌だけでも通し、表記を前後の空白を除いて保存する", () => {
    const result = validateAdCreative(
      input({ icon: "", hand: " 123m456p789s11z22z " }),
      PREFIX,
    );
    expect(result.ok && result.value.hand).toBe("123m456p789s11z22z");
  });

  it.each([
    "abc",
    "123m456p789s111z222z",
    "123m[4-56p]",
    "123m(1111z)",
    "123m{5=555^p}",
    "123m406p",
    "[123m]",
    "123m8z",
  ])("帯に並べられない手牌を弾く: %s", (hand) => {
    expect(errorOf(input({ hand }))).toBe("errorHandInvalid");
  });

  it("行型のスロットには手牌を設定させない", () => {
    expect(
      errorOf(input({ slot: "learn-index-native-ad", hand: "123m" })),
    ).toBe("errorHandNotForRow");
  });

  it("ad-creatives バケットの WebP 以外の画像 URL を弾く", () => {
    expect(
      errorOf(
        input({ imageUrl: "https://evil.example/x.webp", imageAlt: "a" }),
      ),
    ).toBe("errorImageInvalid");
    expect(
      errorOf(input({ imageUrl: `${PREFIX}../avatars/x.webp`, imageAlt: "a" })),
    ).toBe("errorImageInvalid");
  });

  it("画像には代替テキストを求める", () => {
    expect(errorOf(input({ imageUrl: IMAGE }))).toBe("errorImageAltRequired");
    expect(
      validateAdCreative(input({ imageUrl: IMAGE, imageAlt: "書影" }), PREFIX)
        .ok,
    ).toBe(true);
  });

  it("画像が無いときの代替テキストは保存しない", () => {
    const result = validateAdCreative(input({ imageAlt: "残骸" }), PREFIX);
    expect(result.ok && result.value.imageAlt).toBeUndefined();
  });

  it("既定ロケール（ja）のタイトルが無ければ弾く", () => {
    expect(errorOf(input({ title: { ja: "", en: "Book" } }))).toBe(
      "errorTitleRequired",
    );
  });

  it("長すぎる文言を弾く", () => {
    expect(errorOf(input({ title: { ja: "あ".repeat(256) } }))).toBe(
      "errorCopyTooLong",
    );
  });
});
