import { describe, expect, it } from "vitest";

import {
  canReloadNow,
  isEditingElement,
  resolveFullNavigationHref,
} from "./app-version-policy";

// 相対 href は jsdom の location（http://localhost:3000）で解決されるため、
// 「同じオリジン」の基準もそこから取る
const ORIGIN = window.location.origin;
const LOCATION = { origin: ORIGIN, pathname: "/lessons/yaku", search: "" };

function clickOn(target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  Object.defineProperty(event, "target", { value: target });
  return event;
}

function anchor(href: string, attrs: Record<string, string> = {}) {
  const a = document.createElement("a");
  a.href = href;
  for (const [name, value] of Object.entries(attrs)) {
    a.setAttribute(name, value);
  }
  document.body.append(a);
  return a;
}

describe("isEditingElement", () => {
  it("文字を打つ要素だけを入力中とみなす", () => {
    const text = document.createElement("input");
    const textarea = document.createElement("textarea");
    const select = document.createElement("select");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const button = document.createElement("button");
    const editable = document.createElement("div");
    editable.contentEditable = "true";

    expect(isEditingElement(text)).toBe(true);
    expect(isEditingElement(textarea)).toBe(true);
    expect(isEditingElement(select)).toBe(true);
    expect(isEditingElement(checkbox)).toBe(false);
    expect(isEditingElement(button)).toBe(false);
    // jsdom は isContentEditable を実装しないため、ここでは偽になることだけ固定する
    expect(isEditingElement(editable)).toBe(false);
    expect(isEditingElement(document.body)).toBe(false);
    expect(isEditingElement(undefined)).toBe(false);
  });
});

describe("canReloadNow", () => {
  it("通常のページで入力中でなければ再読み込みしてよい", () => {
    expect(canReloadNow("/lessons/yaku", document.body)).toBe(true);
    expect(canReloadNow("/exam/mangan", undefined)).toBe(true);
  });

  it.each([
    "/practice/jantou-fu/play",
    "/practice/agari-score/training",
    "/exam/mangan/play",
  ])("出題セッションの最中（%s）は再読み込みしない", (pathname) => {
    expect(canReloadNow(pathname, document.body)).toBe(false);
  });

  it("入力中は再読み込みしない", () => {
    const input = document.createElement("input");
    expect(canReloadNow("/sign-in", input)).toBe(false);
  });
});

describe("resolveFullNavigationHref", () => {
  it("同じオリジンの画面内リンクなら遷移先の URL を返す", () => {
    const a = anchor("/practice");
    const inner = document.createElement("span");
    a.append(inner);

    expect(resolveFullNavigationHref(clickOn(inner), LOCATION)).toBe(
      `${ORIGIN}/practice`,
    );
  });

  it.each([
    ["別オリジン", "https://example.com/x", {}],
    ["download 付き", "/file.pdf", { download: "" }],
    ["target 付き", "/practice", { target: "_blank" }],
  ])("%s は差し替えない", (_label, href, attrs) => {
    const a = anchor(href, attrs);
    expect(resolveFullNavigationHref(clickOn(a), LOCATION)).toBeUndefined();
  });

  it("同じページ内のハッシュ移動は差し替えない", () => {
    const a = anchor("/lessons/yaku#section");
    expect(resolveFullNavigationHref(clickOn(a), LOCATION)).toBeUndefined();
  });

  it("別ページへのハッシュ付きリンクは差し替える", () => {
    const a = anchor("/lessons#chapter-yaku");
    expect(resolveFullNavigationHref(clickOn(a), LOCATION)).toBe(
      `${ORIGIN}/lessons#chapter-yaku`,
    );
  });

  it.each([
    ["修飾キー付き", { metaKey: true }],
    ["中クリック", { button: 1 }],
  ])("%s はブラウザの既定に任せる", (_label, init) => {
    const a = anchor("/practice");
    expect(
      resolveFullNavigationHref(clickOn(a, init), LOCATION),
    ).toBeUndefined();
  });

  it("既定の動作が取り消されたクリックには触らない", () => {
    const a = anchor("/practice");
    const event = clickOn(a);
    event.preventDefault();
    expect(resolveFullNavigationHref(event, LOCATION)).toBeUndefined();
  });

  it("リンクの外のクリックには触らない", () => {
    const button = document.createElement("button");
    document.body.append(button);
    expect(
      resolveFullNavigationHref(clickOn(button), LOCATION),
    ).toBeUndefined();
  });
});
