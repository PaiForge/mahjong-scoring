// ファイルの一覧を読むため、このテストだけが Node の API に触れる。
// 型は tsconfig の `types` ではなくここで読み込み、辞書の本体に Node の
// 型が漏れないようにする。
/// <reference types="node" />
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { messages } from "./ja";

const JA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "ja");

/** 名前空間（camelCase）から辞書ファイル名（kebab-case）を作る */
function toFileName(namespace: string): string {
  return `${namespace.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.json`;
}

describe("日本語辞書の束ね方", () => {
  it("辞書ファイルと束ねた名前空間が過不足なく一致する", () => {
    // ファイルを置いて ja.ts への追記を忘れると、その名前空間の文言が
    // 実行時に丸ごと引けなくなる（キー文字列がそのまま画面に出る）
    const files = readdirSync(JA_DIR)
      .filter((name) => name.endsWith(".json"))
      .sort();
    const bundled = Object.keys(messages).map(toFileName).sort();
    expect(bundled).toEqual(files);
  });

  it("名前空間が camelCase の識別子である（ファイル名との対応が一意になる）", () => {
    for (const namespace of Object.keys(messages)) {
      expect(namespace).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    }
  });
});

/** 辞書の値（入れ子を含む）をすべて取り出す */
function allMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap(allMessages);
}

describe("アプリでも引ける書き方", () => {
  it("ICU の plural / selectordinal を使わない", () => {
    // アプリの JS（Hermes）には Intl.PluralRules が無く、plural は `=0` のような
    // 完全一致の分岐以外で書式に失敗し、画面に辞書キーがそのまま出る（2026-11 に
    // iOS の Release で実測）。日本語は数で形が変わらないので、数で分けたいときは
    // select（`{count, select, 0 {…} other {…}}`）で書く
    const offending = allMessages(messages).filter((message) =>
      /,\s*(plural|selectordinal)\s*,/.test(message),
    );
    expect(offending).toEqual([]);
  });
});
