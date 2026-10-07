import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseExtendedMpsz } from "@mahjong-scoring/core";

/**
 * 手書きの牌表記がすべて Extended MPSZ 2.0 として読めることの検査
 *
 * 例示の手牌・教本の出題・テストの保存データ・シードなど、牌をソースに
 * 文字列で書いている箇所はコンパイラでは検査されない。表記の版が上がると
 * 古い書き方（方向注釈の無い副露 `[123m]` など）が静かに読めなくなり、
 * 画面では手牌が消えるだけになる。そこでワークスペースのソースを走査し、
 * 牌表記に見える文字列（引用符・バッククォートで囲まれた、数字で始まり
 * サフィックスを含む MPSZ の文字だけの並び）を集めて、すべてを
 * riichi-mahjong の `parseExtendedMpsz` に通す。コメント中の例示も対象。
 */
const REPO_ROOT = resolve(__dirname, "../../../..");

/** 走査するディレクトリ（リポジトリルートからの相対パス） */
const SOURCE_DIRS = [
  "packages/core/src",
  "packages/features/src",
  "apps/web/src",
  "apps/web/scripts",
  "apps/mobile/src",
];

/**
 * 意図して不正な表記を書いているファイル。追加するときは理由を書くこと。
 */
const EXCLUDED_FILES: ReadonlyMap<string, string> = new Map([
  [
    "apps/web/scripts/_lib/legacy-mpsz.mts",
    "旧表記（1.x）から 2.0 への変換。入力として 1.x の表記を例示する",
  ],
  [
    "apps/web/scripts/_lib/legacy-mpsz.test.ts",
    "旧表記の変換のテスト。1.x の表記と変換できない表記を入力に使う",
  ],
  [
    "packages/core/src/problem/score/mpsz-serializer.ts",
    "受け付けない旧表記をコメントで例示している",
  ],
]);

/** 牌表記に見える文字列リテラル */
const MPSZ_LITERAL =
  /(["'`])([[{(]?\d[0-9mpsz[\]{}()=+^-]*[mpsz][0-9mpsz[\]{}()=+^-]*)\1/g;

function* walkSourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkSourceFiles(path);
    else if (/\.(ts|tsx|mts)$/.test(entry.name)) yield path;
  }
}

/** 走査対象のファイルから牌表記を集める（ファイル・文字列の組） */
function collectMpszLiterals(): readonly (readonly [string, string])[] {
  const literals: (readonly [string, string])[] = [];
  for (const dir of SOURCE_DIRS) {
    for (const path of walkSourceFiles(join(REPO_ROOT, dir))) {
      const file = relative(REPO_ROOT, path);
      if (EXCLUDED_FILES.has(file) || file.endsWith("mpsz-literals.test.ts")) {
        continue;
      }
      for (const match of readFileSync(path, "utf8").matchAll(MPSZ_LITERAL)) {
        literals.push([file, match[2] ?? ""]);
      }
    }
  }
  return literals;
}

const LITERALS = collectMpszLiterals();

describe("ソース中の牌表記", () => {
  it("走査で牌表記を拾えている", () => {
    // 走査のパターンが壊れて 0 件になると、下の検査が素通りになる
    expect(LITERALS.length).toBeGreaterThan(100);
    expect(LITERALS.map(([, literal]) => literal)).toContain(
      "234m22m567p46s[5=55z]",
    );
  });

  it.each(LITERALS)("%s: %s", (_file, literal) => {
    const result = parseExtendedMpsz(literal);
    expect(result.isOk() ? "ok" : result.error.message).toBe("ok");
  });

  it("除外したファイルが実在する", () => {
    for (const file of EXCLUDED_FILES.keys()) {
      expect(() => readFileSync(join(REPO_ROOT, file))).not.toThrow();
    }
  });
});
