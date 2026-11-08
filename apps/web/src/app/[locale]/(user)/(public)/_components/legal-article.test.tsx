import { render, screen } from "@testing-library/react";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { createTranslator } from "use-intl";
import { describe, expect, it, vi } from "vitest";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/**
 * 本物の辞書で引く next-intl の差し替え
 *
 * サーバー部品は `getTranslations({ locale, namespace })` で言語を明示し、
 * `LegalLink` は同期の `useTranslations(namespace)` でリクエストの言語を読む。
 * リクエストの言語はページの `prepareRouteLocale` が確定させる値で、テストでは
 * `requestLocale` で差し替える。
 */
const intl = vi.hoisted(() => ({
  requestLocale: "ja" as "ja" | "en",
}));

/**
 * その言語の本物の辞書で名前空間の翻訳関数を作る
 *
 * 名前空間は実行時の文字列で受けるため、型は 1 つの名前空間に寄せて渡す
 * （モックの戻り値の型は呼び出し側に見えない）。
 */
function translatorFor(locale: SupportedLocale, namespace: string) {
  return createTranslator({
    locale,
    messages: locale === "en" ? enMessages : jaMessages,
    namespace: namespace as "legal",
  });
}

vi.mock("next-intl/server", () => ({
  getTranslations: ({
    locale,
    namespace,
  }: {
    locale: SupportedLocale;
    namespace: string;
  }) => Promise.resolve(translatorFor(locale, namespace)),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) =>
    translatorFor(intl.requestLocale, namespace),
}));

vi.mock("next/link", async () => await import("@/test/next-link-mock"));

import {
  LegalClosing,
  LegalLastUpdated,
  LegalLink,
  LegalTranslationNote,
} from "./legal-article";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 非同期のサーバー部品を解いてから描く */
async function renderServer(node: Promise<ReactElement | undefined>) {
  const element = await node;
  return render(<>{element}</>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LegalLink", () => {
  it("日本語では渡した href のまま張る（日本語のページの出力を変えない）", () => {
    intl.requestLocale = "ja";
    render(
      <LegalLink href="/contact" locale="ja">
        お問い合わせ
      </LegalLink>,
    );

    const link = screen.getByRole("link", { name: "お問い合わせ" });
    expect(link.getAttribute("href")).toBe("/contact");
    expect(link.hasAttribute("hrefLang")).toBe(false);
  });

  it("英語で公開しているページへは /en の URL で張り、「日本語のみ」の印を出さない", () => {
    intl.requestLocale = "en";
    render(
      <LegalLink href="/mypage/profile/edit" locale="en">
        profile
      </LegalLink>,
    );

    const link = screen.getByRole("link", { name: "profile" });
    expect(link.getAttribute("href")).toBe("/en/mypage/profile/edit");
    expect(link.hasAttribute("hrefLang")).toBe(false);
    expect(screen.queryByText("Japanese only")).toBeNull();
  });

  it("英語で未公開のページへは日本語の URL へ hrefLang 付きの素の <a> で張り、「日本語のみ」を添える", () => {
    intl.requestLocale = "en";
    render(
      <LegalLink href="/leaderboard" locale="en">
        rankings
      </LegalLink>,
    );

    const link = screen.getByRole("link", { name: "rankings" });
    expect(link.getAttribute("href")).toBe("/leaderboard");
    expect(link.getAttribute("hrefLang")).toBe("ja");
    expect(screen.getByText("Japanese only")).toBeTruthy();
  });

  it("外部リンクは言語に依らず新しいタブで開く", () => {
    intl.requestLocale = "en";
    render(
      <LegalLink
        href="https://policies.google.com/privacy"
        locale="en"
        external
      >
        Google
      </LegalLink>,
    );

    const link = screen.getByRole("link", { name: "Google" });
    expect(link.getAttribute("href")).toBe(
      "https://policies.google.com/privacy",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("LegalLastUpdated", () => {
  it("日本語は従来どおり「最終更新日: 2026年10月10日」", async () => {
    const { container } = await renderServer(
      LegalLastUpdated({ date: "2026-10-10", locale: "ja" }),
    );

    const time = container.querySelector("time");
    expect(time?.textContent).toBe("最終更新日: 2026年10月10日");
    expect(time?.getAttribute("dateTime")).toBe("2026-10-10");
  });

  it("英語は英語の書式（Last updated: October 10, 2026）", async () => {
    const { container } = await renderServer(
      LegalLastUpdated({ date: "2026-10-10", locale: "en" }),
    );

    expect(container.querySelector("time")?.textContent).toBe(
      "Last updated: October 10, 2026",
    );
  });
});

describe("LegalTranslationNote", () => {
  it("日本語のページでは何も描かない", async () => {
    await expect(
      LegalTranslationNote({ path: "/terms", locale: "ja" }),
    ).resolves.toBeUndefined();
  });

  it("英語では参考訳である旨を出し、日本語の同じページ（接頭辞なし）へ hrefLang 付きで張る", async () => {
    const { container } = await renderServer(
      LegalTranslationNote({ path: "/terms", locale: "en" }),
    );

    expect(container.textContent).toBe(
      "This English version is provided for convenience. The Japanese version is the authoritative text.",
    );
    const link = screen.getByRole("link", { name: "Japanese version" });
    expect(link.getAttribute("href")).toBe("/terms");
    expect(link.getAttribute("hrefLang")).toBe("ja");
  });
});

/**
 * 木の中の非同期のサーバー部品（`LegalLastUpdated` 等）を先に解く
 *
 * jsdom の React（クライアント）は async の関数部品を描けないため、RSC が
 * 行うのと同じく await した結果に置き換えてから描く。同期の部品はそのまま
 * React に描かせる（フックを描画の外で呼ばない）。
 */
async function resolveAsync(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveAsync));
  if (!isValidElement(node)) return node;
  const { type, props } = node as ReactElement<{ children?: ReactNode }>;
  if (typeof type === "function" && type.constructor.name === "AsyncFunction") {
    const rendered = (await (type as (p: unknown) => Promise<ReactNode>)(
      props,
    )) as ReactNode;
    return resolveAsync(rendered);
  }
  if (props.children === undefined) return node;
  return cloneElement(node, undefined, await resolveAsync(props.children));
}

describe("LegalClosing", () => {
  it("英語ではお問い合わせのリンクを /en/contact に張り、最終更新日を英語で出す", async () => {
    intl.requestLocale = "en";
    const { container } = await renderServer(
      LegalClosing({
        page: "terms",
        lastUpdated: "2026-10-10",
        locale: "en",
      }).then(resolveAsync) as Promise<ReactElement>,
    );

    const contactLinks = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(contactLinks).toEqual(["/en/contact"]);
    expect(container.querySelector("time")?.textContent).toBe(
      "Last updated: October 10, 2026",
    );
  });

  it("日本語ではお問い合わせのリンクを /contact に張る", async () => {
    intl.requestLocale = "ja";
    const { container } = await renderServer(
      LegalClosing({
        page: "terms",
        lastUpdated: "2026-10-10",
        locale: "ja",
      }).then(resolveAsync) as Promise<ReactElement>,
    );

    const contactLinks = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(contactLinks).toEqual(["/contact"]);
    expect(container.querySelector("time")?.textContent).toBe(
      "最終更新日: 2026年10月10日",
    );
  });
});
