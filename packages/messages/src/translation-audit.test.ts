// 長さの warn の一覧を標準出力へ書くため、Node の型を読み込む（`en.test.ts` と同じく
// tsconfig の `types` には足さない）
/// <reference types="node" />
import { beforeAll, describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";
import {
  auditAllowKey,
  auditEnglishText,
  collectAuditIssues,
  TRANSLATION_AUDIT_ALLOW,
  type AuditIssue,
  type AuditRule,
} from "./translation-audit";
import { AUDIT_PROPER_NOUNS, AUDIT_WORDS } from "./translation-audit-words";
import { EN_TRANSLATED_NAMESPACES } from "./translation-status";
import { flatten, namespaceOf } from "./test-utils/message-tree";

/** 完訳の名前空間の葉を ja / en の組で並べる */
function pairedLeaves(): {
  readonly namespace: string;
  readonly key: string;
  readonly ja: string | undefined;
  readonly en: string;
}[] {
  return EN_TRANSLATED_NAMESPACES.flatMap((namespace) => {
    const jaLeaves = new Map(
      flatten(namespaceOf(ja, namespace)).map((leaf) => [
        leaf.path,
        leaf.value,
      ]),
    );
    return flatten(namespaceOf(en, namespace))
      .filter((leaf) => typeof leaf.value === "string")
      .map((leaf) => {
        const jaValue = jaLeaves.get(leaf.path);
        return {
          namespace,
          key: `${namespace}.${leaf.path}`,
          ja: typeof jaValue === "string" ? jaValue : undefined,
          en: String(leaf.value),
        };
      });
  });
}

/** 指摘を 1 行の文字列にする（失敗の表示で、どのキーの何かを読めるように） */
function describeIssue(issue: AuditIssue): string {
  return `${issue.key} [${issue.rule}] ${issue.message}`;
}

const AUDIT_RULES: readonly AuditRule[] = [
  "spelling",
  "grammar",
  "number",
  "properNoun",
  "length",
];

/** 辞書の全葉を検査した結果（例外を掛ける前） */
let rawIssues: readonly AuditIssue[] = [];

beforeAll(async () => {
  const leaves = pairedLeaves();
  const results = await Promise.all(
    leaves.map((leaf) => collectAuditIssues(leaf.key, leaf.en, leaf.ja)),
  );
  rawIssues = results.flat();
}, 300_000);

/** 例外を掛けた後の指摘 */
function reportedIssues(): AuditIssue[] {
  return rawIssues.filter(
    (issue) =>
      TRANSLATION_AUDIT_ALLOW[auditAllowKey(issue.rule, issue.key)] ===
      undefined,
  );
}

describe("完訳の名前空間の訳文の機械検査", () => {
  // 名前空間ごとに分ける: 翻訳は名前空間のファイル単位で進めるので、どの名前空間に
  // 赤が残るかをテスト名で読めるようにする
  it.each(EN_TRANSLATED_NAMESPACES)(
    "%s に綴り・文法・数・固有名の誤り（error）が無い",
    (namespace) => {
      const errors = reportedIssues()
        .filter((issue) => issue.severity === "error")
        .filter((issue) => issue.key.startsWith(`${namespace}.`))
        .map(describeIssue);
      expect(errors).toEqual([]);
    },
  );

  it("英語が日本語の 3 倍を超える葉（warn）は落とさず一覧に出す", () => {
    // 画面の折り返し・はみ出しの候補。実画面で見て判断する
    const warnings = reportedIssues()
      .filter((issue) => issue.severity === "warn")
      .map(describeIssue);
    if (warnings.length > 0) {
      // console は既定のレポーターが通ったテストの分を出さないので、標準出力へ直接書く
      process.stdout.write(
        `訳文の機械検査の warn（${warnings.length} 件）:\n${warnings.join("\n")}\n`,
      );
    }
    expect(warnings.every((line) => line.includes("[length]"))).toBe(true);
  });
});

describe("例外の一覧", () => {
  it("例外のキーは `<規則>:<キー>` の形で、理由の文を持つ", () => {
    const malformed = Object.entries(TRANSLATION_AUDIT_ALLOW).filter(
      ([allowKey, reason]) => {
        const rule = allowKey.slice(0, allowKey.indexOf(":"));
        return (
          !AUDIT_RULES.some((known) => known === rule) || reason.trim() === ""
        );
      },
    );
    expect(malformed).toEqual([]);
  });

  it("例外はどれも実際に指摘を消している（使われない例外を残さない）", () => {
    const used = new Set(
      rawIssues.map((issue) => auditAllowKey(issue.rule, issue.key)),
    );
    const unused = Object.keys(TRANSLATION_AUDIT_ALLOW).filter(
      (allowKey) => !used.has(allowKey),
    );
    expect(unused).toEqual([]);
  });
});

describe("検査の規則", () => {
  /** 1 つの文の error の指摘を `[規則] 中身` の一覧にする（長さの warn は別のテストで見る） */
  async function audit(enText: string, jaText?: string): Promise<string[]> {
    const issues = await auditEnglishText("sample.key", enText, jaText);
    return issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => `[${issue.rule}] ${issue.message}`);
  }

  it("綴り: 辞書に無い語を落とす", async () => {
    expect(await audit("This is a clossed hand.")).toEqual([
      '[spelling] 辞書に無い語 "clossed"',
    ]);
  });

  it("綴り: 訳語表・用語集のローマ字と固有名は既知の語として通す", async () => {
    expect(
      await audit(
        "Chiitoitsu with riichi and menzen tsumo, paid through the App Store or Stripe.",
      ),
    ).toEqual([]);
    expect(AUDIT_WORDS).toContain("chiitoitsu");
    expect(AUDIT_WORDS).toContain("yaochuuhai");
  });

  it("綴り: ICU の引数・タグの記法と URL・メールアドレスは語として検査しない", async () => {
    expect(
      await audit(
        "Read the <termsLink>terms</termsLink> at https://example.com/qwzxv or write to qwzxv@example.com, {qwzxvCount} times.",
      ),
    ).toEqual([]);
  });

  it("文法: a / an の取り違えを落とす", async () => {
    const issues = await audit("This is an hand.");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/^\[grammar\] retext-indefinite-article/);
  });

  it("文法: 語の重複を落とす", async () => {
    const issues = await audit("Win the the hand.");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/^\[grammar\] retext-repeated-words/);
  });

  it("文法: 文と文の間の空白は 1 つ", async () => {
    const issues = await audit("Win the hand.  Then count the fu.");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/^\[grammar\] retext-sentence-spacing/);
  });

  it("文体: 曲がった引用符・アポストロフィを落とし、直線は通す", async () => {
    expect(await audit("Don't count it.")).toEqual([]);
    const issues = await audit("Don’t count it.");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/^\[grammar\] retext-quotes/);
  });

  it("文法: select の枝ごとに文として検査する", async () => {
    const issues = await audit(
      "{count, select, 1 {This is an hand.} other {These are hands.}}",
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/^\[grammar\] retext-indefinite-article/);
  });

  it("数: 日本語にある数が英語に無ければ落とす（全角・3 桁区切りは揃えて比べる）", async () => {
    expect(
      await audit("Worth 30 fu and 1,000 points.", "３０符で1000点"),
    ).toEqual([]);
    expect(await audit("Worth 30 fu.", "30符で1,000点")).toEqual([
      "[number] 日本語にある数が英語に無い: 1000",
    ]);
  });

  it("数: 英語で語として書いた数は数として数える", async () => {
    expect(await audit("Pick two tiles twice.", "2枚を2回選ぶ")).toEqual([]);
    expect(
      await audit("One more han doubles the score", "翻が1つ上がると点数は2倍"),
    ).toEqual([]);
    expect(await audit("Jan", "1月")).toEqual([]);
  });

  it("固有名: 日本語にある固有名が英語に同じ綴りで無ければ落とす", async () => {
    expect(await audit("Pay through the store.", "App Store で支払う")).toEqual(
      ["[properNoun] 日本語にある固有名が英語に同じ綴りで無い: App Store"],
    );
    expect(
      await audit("Pay through the App Store.", "App Store で支払う"),
    ).toEqual([]);
    // 語の一部（Profile の Pro）は固有名として数えない
    expect(await audit("Edit your profile.", "Profile")).toEqual([]);
    expect(AUDIT_PROPER_NOUNS).toContain("Apple");
  });

  it("長さ: 英語が日本語の 3 倍を超えたら warn（error にしない）", async () => {
    const issues = await auditEnglishText("sample.key", "Non-dealer", "子");
    expect(issues).toEqual([
      {
        key: "sample.key",
        rule: "length",
        message: "英語 10 字 / 日本語 1 字（3 倍超）",
        severity: "warn",
      },
    ]);
  });

  it("日本語を渡さなければ数・固有名・長さは検査しない", async () => {
    expect(await audit("Worth 30 fu through the store.")).toEqual([]);
  });
});
