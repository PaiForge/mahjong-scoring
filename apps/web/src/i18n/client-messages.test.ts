/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { messages } from "@mahjong-scoring/messages/ja";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { describe, expect, it } from "vitest";

import {
  ADMIN_MESSAGE_NAMESPACES,
  SERVER_ONLY_MESSAGE_NAMESPACES,
  adminClientMessages,
  selectClientMessages,
} from "./client-messages";
import { loadMessages } from "./request";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_SRC = resolve(HERE, "..");
const FEATURES_SRC = resolve(HERE, "../../../../packages/features/src");
const ADMIN_DIR = resolve(WEB_SRC, "app/admin");
/** 管理画面が import してよい共有部品の置き場（`apps/web/src/app/CLAUDE.md` の「共通 UI コンポーネント」） */
const SHARED_COMPONENTS_DIR = resolve(WEB_SRC, "app/_components");

/** 走査対象のソース（テストは除く。テストは本物の辞書を丸ごと渡してよい） */
function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}

/**
 * ソース 1 ファイルがクライアントの辞書から引く名前空間（先頭のセグメント）
 *
 * 見るのは次の 3 つ。`getTranslations` はサーバー専用なので見ない。
 * 1. `useTranslations("ns")` / `useTranslations(\`ns.${...}\`)` の名前空間
 * 2. レジストリの `namespace: "ns"` / `translationNamespace: "ns"`
 *    （`useTranslations(menu.namespace)` のように変数で渡る分）
 * 3. 辞書全体を引く翻訳関数（`useTranslations()` / `tAll`）に渡す `"ns.key"` の先頭
 */
function referencedNamespaces(source: string): Set<string> {
  const found = new Set<string>();
  for (const match of source.matchAll(
    /useTranslations\(\s*(?:"([^"]+)"|`([^`$]+)\$)/g,
  )) {
    found.add((match[1] ?? match[2] ?? "").split(".")[0]);
  }
  for (const match of source.matchAll(
    /\b(?:translationNamespace|namespace)\s*:\s*"([^"]+)"/g,
  )) {
    found.add(match[1].split(".")[0]);
  }
  if (/useTranslations\(\s*\)/.test(source) || /\btAll\b/.test(source)) {
    for (const match of source.matchAll(/\bt(?:All)?\(\s*[`"]([a-zA-Z]+)\./g)) {
      found.add(match[1]);
    }
  }
  found.delete("");
  return found;
}

describe("クライアントに渡す辞書", () => {
  it("サーバー専用の名前空間はクライアント側のコードから参照されていない", () => {
    const serverOnly = new Set<string>(SERVER_ONLY_MESSAGE_NAMESPACES);
    const violations: string[] = [];
    for (const file of [
      ...listSourceFiles(WEB_SRC),
      ...listSourceFiles(FEATURES_SRC),
    ]) {
      const source = readFileSync(file, "utf8");
      for (const namespace of referencedNamespaces(source)) {
        if (serverOnly.has(namespace)) {
          violations.push(`${relative(WEB_SRC, file)}: ${namespace}`);
        }
      }
    }
    // 落ちたら、その名前空間を SERVER_ONLY_MESSAGE_NAMESPACES から外す
    // （クライアントで使い始めた）か、サーバーの getTranslations() に寄せる
    expect(violations).toEqual([]);
  });

  it("管理画面の名前空間は管理画面の配下でしか参照されていない", () => {
    const adminOnly = new Set<string>(ADMIN_MESSAGE_NAMESPACES);
    const violations: string[] = [];
    for (const file of [
      ...listSourceFiles(WEB_SRC),
      ...listSourceFiles(FEATURES_SRC),
    ]) {
      if (file.startsWith(ADMIN_DIR)) continue;
      const source = readFileSync(file, "utf8");
      for (const namespace of referencedNamespaces(source)) {
        if (adminOnly.has(namespace)) {
          violations.push(`${relative(WEB_SRC, file)}: ${namespace}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("管理画面の配下と共有部品が引く名前空間は管理画面の辞書にある", () => {
    // 管理画面の Provider は辞書を置き換えるので、ここに無い名前空間は
    // 管理画面の中では引けない（`MISSING_MESSAGE`）
    const available = new Set(Object.keys(adminClientMessages));
    const violations: string[] = [];
    for (const file of [
      ...listSourceFiles(ADMIN_DIR),
      ...listSourceFiles(SHARED_COMPONENTS_DIR),
    ]) {
      const source = readFileSync(file, "utf8");
      for (const namespace of referencedNamespaces(source)) {
        if (!available.has(namespace)) {
          violations.push(`${relative(WEB_SRC, file)}: ${namespace}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("ルートと管理画面の辞書を合わせると全名前空間からサーバー専用の分を引いたものになる", () => {
    const expected = Object.keys(messages)
      .filter(
        (namespace) =>
          !(SERVER_ONLY_MESSAGE_NAMESPACES as readonly string[]).includes(
            namespace,
          ),
      )
      .sort();
    // 共有部品の名前空間（`nav`）は両方の辞書に入るので重複を除く
    const actual = [
      ...new Set([
        ...Object.keys(selectClientMessages(messages)),
        ...Object.keys(adminClientMessages),
      ]),
    ].sort();
    expect(actual).toEqual(expected);
  });

  it("サーバー専用と管理画面の名前空間は重ならない", () => {
    for (const namespace of ADMIN_MESSAGE_NAMESPACES) {
      expect(SERVER_ONLY_MESSAGE_NAMESPACES).not.toContain(namespace);
    }
  });
});

describe("言語ごとのクライアント辞書", () => {
  /** 辞書の名前空間の一覧（並べ替え済み） */
  function namespaceKeys(dictionary: object): string[] {
    return Object.keys(dictionary).sort();
  }

  it("loadMessages は言語ごとに 1 つの辞書だけを返し、英語に日本語を混ぜない", async () => {
    expect(await loadMessages("ja")).toBe(messages);
    expect(await loadMessages("en")).toBe(enMessages);
  });

  it("英語のクライアント辞書は英語の辞書からサーバー専用・管理画面の名前空間を除いたもの", () => {
    const excluded = new Set<string>([
      ...SERVER_ONLY_MESSAGE_NAMESPACES,
      ...ADMIN_MESSAGE_NAMESPACES,
    ]);
    const client = selectClientMessages(enMessages);
    expect(namespaceKeys(client)).toEqual(
      namespaceKeys(enMessages).filter((namespace) => !excluded.has(namespace)),
    );
    for (const [namespace, value] of Object.entries(client)) {
      // 値は英語の辞書の名前空間そのもの（日本語の同じ名前空間ではない）
      expect(value).toBe(enMessages[namespace as keyof typeof enMessages]);
    }
  });

  it("英語のクライアント辞書は未訳の名前空間を持たない（日本語で埋めない）", () => {
    const client = selectClientMessages(enMessages);
    const translated = new Set(Object.keys(enMessages));
    expect(Object.keys(client).filter((ns) => !translated.has(ns))).toEqual([]);
    expect(Object.keys(client).length).toBeLessThan(
      Object.keys(selectClientMessages(messages)).length,
    );
  });

  it("サーバー専用の名前空間はどの言語のクライアント辞書にも入らない", () => {
    for (const dictionary of [messages, enMessages]) {
      const client = selectClientMessages(dictionary);
      for (const namespace of [
        ...SERVER_ONLY_MESSAGE_NAMESPACES,
        ...ADMIN_MESSAGE_NAMESPACES,
      ]) {
        expect(Object.keys(client)).not.toContain(namespace);
      }
    }
  });
});
