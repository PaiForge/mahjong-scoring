/**
 * 役の早見表の役名・牌の見出しの言語対応のテスト
 *
 * @description
 * - 日本語: 役名は core の `YAKU_HAN_ENTRIES.name` と同じ文字列（表示を変えない。
 *   `locale` を省いた呼び出し — 点数訓練のモーダル — も同じ）
 * - 英語: 役名を辞書 `yakuNames`、役牌の牌の見出しを `reference.yaku.variants`
 *   から引き、core の日本語の役名・牌の名前を描かない
 *
 * 英語の辞書は翻訳の途中で日本語の写しのことがあるため、英語の検査は
 * 日本語の辞書の `yakuNames` と `variants` だけを差し替えた辞書で行う。
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
// 役牌の例を開くと牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { NextIntlClientProvider } from "next-intl";

import { YAKU_HAN_ENTRIES, YAKUHAI_ENTRY_NAME } from "@mahjong-scoring/core";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";
import { YAKU_TO_KEY } from "@mahjong-scoring/features/yaku/yaku-labels";

import { YakuCheatsheet } from "./yaku-cheatsheet";

const SHOWN = YAKU_HAN_ENTRIES.filter((entry) =>
  hasYakuCheatsheetEntry(entry.name),
);

/** 役名をキーから作った英語風の名前にした辞書 */
const englishLike = {
  ...jaMessages,
  yakuNames: Object.fromEntries(
    Object.keys(jaMessages.yakuNames).map((key) => [key, `Yaku ${key}`]),
  ),
  reference: {
    ...jaMessages.reference,
    yaku: {
      ...jaMessages.reference.yaku,
      variants: { haku: "White", hatsu: "Green", chun: "Red" },
    },
  },
};

function renderCheatsheet(locale: "ja" | "en") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ja" ? jaMessages : englishLike}
    >
      <YakuCheatsheet withAnchors locale={locale} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("YakuCheatsheet", () => {
  it("locale を省くと日本語と同じく core の役名を出す", () => {
    render(
      <NextIntlClientProvider locale="ja" messages={englishLike}>
        <YakuCheatsheet />
      </NextIntlClientProvider>,
    );
    for (const entry of SHOWN) {
      expect(screen.getByText(entry.name), entry.name).toBeDefined();
    }
  });

  it("日本語では core の役名をそのまま出す", () => {
    renderCheatsheet("ja");
    for (const entry of SHOWN) {
      expect(screen.getByText(entry.name), entry.name).toBeDefined();
    }
  });

  it("英語では役名を yakuNames から引き、core の日本語の役名を出さない", () => {
    renderCheatsheet("en");
    for (const entry of SHOWN) {
      expect(screen.getByText(`Yaku ${YAKU_TO_KEY[entry.name]}`)).toBeDefined();
      expect(screen.queryByText(entry.name), entry.name).toBeNull();
    }
  });

  it("英語では役牌の牌の見出しを辞書の variants から引く", () => {
    const { container } = renderCheatsheet("en");
    fireEvent.click(
      screen.getByText(`Yaku ${YAKU_TO_KEY[YAKUHAI_ENTRY_NAME]}`),
    );

    const text = container.textContent ?? "";
    expect(text).toContain("White");
    expect(text).toContain("Green");
    expect(text).toContain("Red");
    expect(text).not.toMatch(/[白發中]/);
  });
});
