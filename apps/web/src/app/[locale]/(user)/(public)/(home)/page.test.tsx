/**
 * トップページの Organization / WebSite の JSON-LD のテスト
 *
 * JSON-LD がページの言語で組まれ（`inLanguage`・説明）、`@id`・`url` は言語で
 * 変わらないことを固定する。英語の公開状態は許可リストを差し替えて与える。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const { enPublished } = vi.hoisted(() => ({
  enPublished: { current: new Set<string>() },
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  setRequestLocale: vi.fn(),
}));
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));
vi.mock("@/i18n/translated-publications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/i18n/translated-publications")>()),
  getTranslatedPublication: (path: string) =>
    enPublished.current.has(path) ? "published-indexable" : "unpublished",
}));
vi.mock(
  "@/app/[locale]/(user)/(public)/lessons/_components/chapter-toc-list",
  () => ({ ChapterTocList: () => null }),
);

const { default: Home } = await import("./page");
const { buildSiteSchema } = await import("@/app/_lib/site-schema");

interface SchemaNode {
  readonly "@type": string;
  readonly "@id"?: string;
  readonly url?: string;
  readonly inLanguage?: string;
}

/** トップのページの props（`searchParams` は読まないが型が要求する） */
function pageProps(locale: string) {
  return {
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve({}),
  };
}

async function renderSchema(locale: "ja" | "en"): Promise<unknown> {
  const page = await Home(pageProps(locale));
  const { container } = render(page);
  const script = container.querySelector('script[type="application/ld+json"]');
  if (script === null) throw new Error("JSON-LD が無い");
  return JSON.parse(script.textContent ?? "");
}

function websiteOf(schema: unknown): SchemaNode {
  const graph = (schema as { readonly "@graph": readonly SchemaNode[] })[
    "@graph"
  ];
  const website = graph.find((node) => node["@type"] === "WebSite");
  if (website === undefined) throw new Error("WebSite が無い");
  return website;
}

describe("Home の JSON-LD", () => {
  beforeEach(() => {
    enPublished.current = new Set(["/", "/lessons"]);
  });

  it("日本語のトップは今までどおり既定（日本語）の JSON-LD を出す", async () => {
    await expect(renderSchema("ja")).resolves.toEqual(
      JSON.parse(JSON.stringify(buildSiteSchema("name.value"))),
    );
  });

  it("英語のトップは英語の JSON-LD を出し、WebSite の @id と url は日本語と同じ", async () => {
    const en = await renderSchema("en");
    expect(en).toEqual(
      JSON.parse(JSON.stringify(buildSiteSchema("name.value", "en"))),
    );

    const enWebsite = websiteOf(en);
    const jaWebsite = websiteOf(await renderSchema("ja"));
    expect(enWebsite.inLanguage).toMatch(/^en/);
    expect(enWebsite["@id"]).toBe(jaWebsite["@id"]);
    expect(enWebsite.url).toBe(jaWebsite.url);
  });

  it("英語のトップが未公開なら 404", async () => {
    enPublished.current = new Set();
    await expect(Home(pageProps("en"))).rejects.toThrow("notFound");
  });
});
