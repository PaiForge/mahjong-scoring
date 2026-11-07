// ファイルの一覧を読むため、このテストは Node の API に触れる。型は tsconfig の
// `types` ではなくここで読み込み、辞書の本体に Node の型が漏れないようにする。
/// <reference types="node" />
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";
import { EN_TRANSLATED_NAMESPACES } from "./translation-status";

const EN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "en");

/** 名前空間（camelCase）から辞書ファイル名（kebab-case）を作る（`ja.test.ts` と同じ規則） */
function toFileName(namespace: string): string {
  return `${namespace.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.json`;
}

/** 辞書の木の葉 1 つ（`a.b.c` のパスと値） */
interface Leaf {
  readonly path: string;
  readonly value: unknown;
}

/**
 * 辞書の木を葉の一覧にする。配列は添字をパスに入れ、オブジェクトと配列の違いも
 * パスに残す（`[0]` / `.key`）ので、形の違いはパスの集合の違いとして現れる
 */
function flatten(value: unknown, path = ""): Leaf[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${path}[${index}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, path === "" ? key : `${path}.${key}`),
    );
  }
  return [{ path, value }];
}

/** 名前空間の値を引く（完訳の名前空間の一覧から ja / en の両方を引くため） */
function namespaceOf(dictionary: object, namespace: string): unknown {
  return Object.entries(dictionary).find(([key]) => key === namespace)?.[1];
}

/** 英語の完訳の名前空間ごとに、葉を ja / en の組で並べる */
function pairedLeaves(): {
  readonly key: string;
  readonly ja: unknown;
  readonly en: unknown;
}[] {
  return EN_TRANSLATED_NAMESPACES.flatMap((namespace) => {
    const jaLeaves = new Map(
      flatten(namespaceOf(ja, namespace)).map((leaf) => [leaf.path, leaf]),
    );
    return flatten(namespaceOf(en, namespace)).map((leaf) => ({
      key: `${namespace}.${leaf.path}`,
      ja: jaLeaves.get(leaf.path)?.value,
      en: leaf.value,
    }));
  });
}

/**
 * ICU の構造を比べられる形の文字列の集合にする
 *
 * 引数（名前と型・書式）、select の選択肢の集合、rich text のタグを拾う。select の
 * 枝・タグの中は親の位置をパスに付けて区別するので、「ある枝でだけ `{count}` を落とした」
 * も食い違いになる。地の文（literal）は比べない。
 */
function icuSignature(message: string): string[] {
  const signature = new Set<string>();
  const walk = (elements: readonly MessageFormatElement[], scope: string) => {
    for (const element of elements) {
      switch (element.type) {
        case TYPE.literal:
          break;
        case TYPE.argument:
          signature.add(`${scope}{${element.value}}`);
          break;
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          signature.add(
            `${scope}{${element.value}, ${TYPE[element.type]}, ${JSON.stringify(element.style ?? null)}}`,
          );
          break;
        case TYPE.select:
        case TYPE.plural: {
          const options = Object.keys(element.options).sort();
          signature.add(
            `${scope}{${element.value}, ${TYPE[element.type]}, [${options.join(" ")}]}`,
          );
          for (const option of options) {
            walk(
              element.options[option]?.value ?? [],
              `${scope}${element.value}=${option}/`,
            );
          }
          break;
        }
        case TYPE.pound:
          signature.add(`${scope}#`);
          break;
        case TYPE.tag:
          signature.add(`${scope}<${element.value}>`);
          walk(element.children, `${scope}<${element.value}>/`);
          break;
      }
    }
  };
  walk(parse(message, { requiresOtherClause: true }), "");
  return [...signature].sort();
}

/** ICU の木に plural / selectordinal があるか（入れ子の中も見る） */
function hasPlural(elements: readonly MessageFormatElement[]): boolean {
  return elements.some((element) => {
    if (element.type === TYPE.plural) return true;
    if (element.type === TYPE.select) {
      return Object.values(element.options).some((option) =>
        hasPlural(option.value),
      );
    }
    if (element.type === TYPE.tag) return hasPlural(element.children);
    return false;
  });
}

/**
 * 日本語の文字（かな・漢字・全角の記号）
 *
 * 英語の辞書に残っていれば、訳し忘れか日本語の約物（「・」「（）」「：」）の写し忘れ。
 */
// 範囲は文字コードの文字列で書く（正規表現リテラルに書くと整形で範囲の端の全角空白が
// 生の文字に戻り、no-irregular-whitespace に掛かる）。CJK 記号と句読点・ひらがな・
// カタカナ・カタカナ拡張・CJK 統合漢字拡張 A・CJK 統合漢字・半角全角形
const JAPANESE_CHARACTERS = new RegExp(
  "[\\u3000-\\u303F\\u3040-\\u30FF\\u31F0-\\u31FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uFF00-\\uFFEF]",
);

/**
 * 英語の辞書でも日本語のまま持つ値（日本語と同じ値であることも検査する）
 *
 * サイト名は日本語のブランド名を保つ。英語の正式なブランド名は推測で作らず、
 * 英語の説明（"Riichi Mahjong Scoring"）はキャッチコピー（`metadata.siteTagline`）が
 * 併記する。ロゴはサイト名を二色に分けて描くので、その 2 つも同じ扱い。
 */
const JAPANESE_ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "metadata.siteName",
  "nav.brandMahjong",
  "nav.brandScoring",
]);

/**
 * 先頭の空白を持ってよい値
 *
 * 呼び出し側が数や風の名前の直後に連結する接尾辞（`{han}{hanSuffix}` →
 * `1 han`、`東{round}` → `東 round`）。日本語は空白を入れずに続けるので、英語では
 * 値の側に区切りの空白を持たせる。単独で見出しにもなる（`hanSuffix` は満貫以上の表の
 * 列見出し）が、要素の先頭の空白は描画で詰まるので見た目に出ない。
 * 呼び出し側を ICU の文型（`{han} han`）に改めたら、ここから外す。
 */
const LEADING_SPACE_ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "scoreTable.fuSuffix",
  "scoreTable.hanSuffix",
  "common.round",
  "common.wind",
]);

/**
 * 前後に空白を持ってよい値（語と語の間に挟む区切り）
 *
 * 日本語は「・」で詰めて並べるが、英語は区切りの前後に空白を置く（`Closed / Open`）。
 */
const SEPARATOR_KEYS: ReadonlySet<string> = new Set([
  "reference.yaku.exampleLabelSeparator",
]);

/** 訳し残しの目印（翻訳の途中で置きがちな仮の値） */
const PLACEHOLDER_PATTERN = /\b(TODO|TBD|FIXME|XXX)\b|\[(ja|en)\]|__/i;

describe("英語の辞書の束ね方", () => {
  it("辞書ファイルと束ねた名前空間が過不足なく一致する", () => {
    // ファイルを置いて en.ts への追記を忘れると、その名前空間の文言が英語で丸ごと
    // 引けなくなる（キー文字列がそのまま画面に出る）
    const files = readdirSync(EN_DIR)
      .filter((name) => name.endsWith(".json"))
      .sort();
    const bundled = Object.keys(en).map(toFileName).sort();
    expect(bundled).toEqual(files);
  });

  it("束ねた名前空間が完訳の名前空間の一覧と一致する（未着手の名前空間を束ねない）", () => {
    expect(Object.keys(en).sort()).toEqual(
      [...EN_TRANSLATED_NAMESPACES].sort(),
    );
  });
});

describe("完訳の名前空間は日本語と同じ形を持つ", () => {
  it.each(EN_TRANSLATED_NAMESPACES)(
    "%s の葉のキーと入れ子の形が日本語と一致する",
    (namespace) => {
      const paths = (dictionary: object) =>
        flatten(namespaceOf(dictionary, namespace))
          .map((leaf) => leaf.path)
          .sort();
      expect(paths(en)).toEqual(paths(ja));
    },
  );

  it("葉はすべて文字列", () => {
    const nonString = pairedLeaves().filter(
      (leaf) => typeof leaf.en !== "string",
    );
    expect(nonString).toEqual([]);
  });
});

describe("訳し残しが無い", () => {
  it("空の値・空白だけの値を持たない", () => {
    const empty = pairedLeaves()
      .filter((leaf) => typeof leaf.en === "string" && leaf.en.trim() === "")
      .map((leaf) => leaf.key);
    expect(empty).toEqual([]);
  });

  it("前後に余計な空白を持たない（接尾辞の先頭と区切りの前後の空白だけ許す）", () => {
    const padded = pairedLeaves()
      .filter((leaf) => typeof leaf.en === "string")
      .filter((leaf) => !SEPARATOR_KEYS.has(leaf.key))
      .filter((leaf) => {
        const value = String(leaf.en);
        const leading = /^\s/.test(value);
        const trailing = /\s$/.test(value);
        return (
          trailing || (leading && !LEADING_SPACE_ALLOWED_KEYS.has(leaf.key))
        );
      })
      .map((leaf) => leaf.key);
    expect(padded).toEqual([]);
  });

  it("仮の値（TODO・[ja] 等）を持たない", () => {
    const placeholders = pairedLeaves()
      .filter((leaf) => PLACEHOLDER_PATTERN.test(String(leaf.en)))
      .map((leaf) => leaf.key);
    expect(placeholders).toEqual([]);
  });

  it("日本語の文字を残さない（ブランド名だけは日本語のまま持つ）", () => {
    const japanese = pairedLeaves()
      .filter((leaf) => !JAPANESE_ALLOWED_KEYS.has(leaf.key))
      .filter((leaf) => JAPANESE_CHARACTERS.test(String(leaf.en)))
      .map((leaf) => `${leaf.key}: ${String(leaf.en)}`);
    expect(japanese).toEqual([]);
  });

  it("日本語のまま持つ値は日本語の辞書と同じ値", () => {
    const allowed = pairedLeaves().filter((leaf) =>
      JAPANESE_ALLOWED_KEYS.has(leaf.key),
    );
    expect(allowed.map((leaf) => leaf.key).sort()).toEqual(
      [...JAPANESE_ALLOWED_KEYS].sort(),
    );
    for (const leaf of allowed) {
      expect(leaf.en, leaf.key).toBe(leaf.ja);
    }
  });

  it("空白を許す値は実在するキーで、実際に接尾辞・区切りの形をしている", () => {
    // 呼び出し側を ICU の文型に改めてキーが消えたり空白を外したりしたら、
    // 許可の一覧も畳む（使われない例外を残さない）
    const leaves = new Map(pairedLeaves().map((leaf) => [leaf.key, leaf.en]));
    for (const key of LEADING_SPACE_ALLOWED_KEYS) {
      expect(String(leaves.get(key)), key).toMatch(/^ \S/);
    }
    for (const key of SEPARATOR_KEYS) {
      expect(String(leaves.get(key)), key).toMatch(/^ \S+ $/);
    }
  });
});

describe("ICU の引数・選択肢・タグが日本語と一致する", () => {
  it.each(pairedLeaves().map((leaf) => [leaf.key, leaf] as const))(
    "%s",
    (_key, leaf) => {
      expect(icuSignature(String(leaf.en))).toEqual(
        icuSignature(String(leaf.ja)),
      );
    },
  );
});

describe("アプリでも引ける書き方", () => {
  it("ICU の plural / selectordinal を使わない", () => {
    // アプリの JS（Static Hermes）には Intl.PluralRules が無く、plural は書式に
    // 失敗して画面に辞書キーがそのまま出る（日本語の辞書と同じ禁止）。英語の複数形は
    // `{count, select, 1 {…} other {…}}` か、数で形が変わらない文型で書く
    const offending = pairedLeaves()
      .filter((leaf) =>
        hasPlural(parse(String(leaf.en), { requiresOtherClause: true })),
      )
      .map((leaf) => leaf.key);
    expect(offending).toEqual([]);
  });
});

describe("サイト名とキャッチコピー", () => {
  it("サイト名は日本語のブランド名を保ち、キャッチコピーが英語の説明を併記する", () => {
    expect(en.metadata.siteName).toBe(ja.metadata.siteName);
    expect(en.metadata.siteTagline).toContain("Riichi Mahjong Scoring");
  });

  it("ロゴの二色の文字を連結するとサイト名になる", () => {
    expect(`${en.nav.brandMahjong}${en.nav.brandScoring}`).toBe(
      en.metadata.siteName,
    );
  });
});
