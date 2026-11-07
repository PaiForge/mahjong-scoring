import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";
import { TERMINOLOGY } from "./terminology";

/** 辞書の値（入れ子を含む）を `名前空間.キー` と値の組で取り出す */
function entries(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    entries(child, path === "" ? key : `${path}.${key}`),
  );
}

/** 日本語の用語から訳語表の行を引く */
function termOf(japanese: string): string {
  const entry = TERMINOLOGY.find((term) =>
    term.ja.some((word) => word === japanese),
  );
  if (entry === undefined) throw new Error(`訳語表に無い用語: ${japanese}`);
  return entry.en;
}

describe("訳語表", () => {
  it("同じ日本語の用語を 2 つの訳語に割り当てない", () => {
    const words = TERMINOLOGY.flatMap((term) => term.ja);
    const duplicated = words.filter(
      (word, index) => words.indexOf(word) !== index,
    );
    expect(duplicated).toEqual([]);
  });

  it("使わない語は小文字の 1 語で、どの行の訳語にも当たらない", () => {
    // 訳語そのものが avoid に当たると、訳語表どおりに訳した文が検査で落ちる
    const avoided = TERMINOLOGY.flatMap((term) =>
      "avoid" in term ? term.avoid : [],
    );
    expect(avoided.filter((word) => !/^[a-z]+$/.test(word))).toEqual([]);
    const clashes = TERMINOLOGY.flatMap((term) =>
      avoided
        .filter((word) => new RegExp(`\\b${word}\\b`, "i").test(term.en))
        .map((word) => `${term.en}: ${word}`),
    );
    expect(clashes).toEqual([]);
  });

  it("英語の辞書に使わない訳語が現れない", () => {
    // 例: 親子を parent / child、翻を fan と訳す。「セッション」は UI に出さない内部の概念。
    // 認証の「セッションが切れました」（ログイン状態という別の概念）を訳すときは、
    // その文言だけを例外として明示する
    const values = entries(en, "");
    const offending = TERMINOLOGY.flatMap((term) =>
      ("avoid" in term ? term.avoid : []).flatMap((word) => {
        const pattern = new RegExp(`\\b${word}\\b`, "i");
        return values
          .filter(([, value]) => pattern.test(value))
          .map(([key]) => `${key}: ${word}`);
      }),
    );
    expect(offending).toEqual([]);
  });
});

describe("完訳の辞書が訳語表に従う", () => {
  it("点数表の打点の区分名は訳語表の表記（先頭だけ大文字）", () => {
    const tiers = [
      ["mangan", "満貫"],
      ["haneman", "跳満"],
      ["baiman", "倍満"],
      ["sanbaiman", "三倍満"],
      ["yakuman", "役満"],
    ] as const;
    for (const [key, japanese] of tiers) {
      expect(ja.scoreTable[key]).toBe(japanese);
      expect(en.scoreTable[key].toLowerCase()).toBe(termOf(japanese));
    }
  });

  it("親子は dealer / non-dealer で、点数表と共通の語で同じ訳にする", () => {
    // 点数表の切り替え（scoreTable.oya / ko）と答え合わせ等の表記（common.dealer /
    // nonDealer）が日本語で同じ語なら、英語でも同じ語にする。入れ替わると
    // 親の点数を子の点数として読ませてしまう
    expect(ja.scoreTable.oya).toBe(ja.common.dealer);
    expect(ja.scoreTable.ko).toBe(ja.common.nonDealer);
    expect(en.scoreTable.oya).toBe(en.common.dealer);
    expect(en.scoreTable.ko).toBe(en.common.nonDealer);
    expect(en.scoreTable.oya.toLowerCase()).toBe(termOf("親"));
    expect(en.scoreTable.ko.toLowerCase()).toBe(termOf("子"));
  });

  it("ロン / ツモは ron / tsumo で、点数表と共通の語で同じ訳にする", () => {
    expect(ja.scoreTable.ron).toBe(ja.common.ron);
    expect(ja.scoreTable.tsumo).toBe(ja.common.tsumo);
    expect(en.scoreTable.ron).toBe(en.common.ron);
    expect(en.scoreTable.tsumo).toBe(en.common.tsumo);
    expect(en.scoreTable.ron.toLowerCase()).toBe(termOf("ロン"));
    expect(en.scoreTable.tsumo.toLowerCase()).toBe(termOf("ツモ"));
  });

  it("翻・符の接尾辞は han / fu（数で形を変えない）", () => {
    expect(en.scoreTable.hanSuffix.trim()).toBe(termOf("翻"));
    expect(en.scoreTable.fuSuffix.trim()).toBe(termOf("符"));
  });
});

describe("練習の画面が訳語表に従う", () => {
  it("モードと画面の呼び名は訳語表の表記（UI のラベルなので先頭だけ大文字）", () => {
    // チャレンジ / トレーニング / 模試 / 道場 は画面をまたいで同じ語で呼ぶ。
    // ボタン・見出し・タブバーで別の語になると、同じモードが別物に見える
    expect(en.training.modeLabel).toBe(termOf("トレーニング"));
    expect(en.examTraining.pageTitle).toContain(termOf("模試"));
    expect(en.nav.dojo).toBe(termOf("道場"));
    expect(en.dojo.title).toBe(termOf("道場"));
    expect(en.exp.label).toBe(termOf("経験値"));
    expect(en.challenge.lives.toLowerCase()).toBe(termOf("ライフ"));
    expect(en.challenge.score.toLowerCase()).toBe(termOf("スコア"));
    expect(en.challenge.record.bestLabel.toLowerCase()).toBe(
      termOf("自己ベスト"),
    );
  });

  it("符の内訳の理由は、レッスン・用語集と同じ訳語で書く", () => {
    // 答え合わせの内訳（fuBreakdown.reasons）は core の符の理由の構造を辞書で描いたもの。
    // 内訳の語でレッスンや用語集を引き直すので、教材の訳語と食い違わせない
    const reasons = en.challenge.fuBreakdown.reasons;
    expect(reasons.futei.toLowerCase()).toBe(termOf("副底"));
    expect(reasons.menzenRon.toLowerCase()).toBe(termOf("門前加符"));
    expect(reasons.kuiPinfu.toLowerCase()).toBe(termOf("特例等の加符"));
    expect(reasons.jantouReasons.bakaze).toBe(termOf("場風"));
    expect(reasons.jantouReasons.jikaze).toBe(termOf("自風"));
    const machi = reasons.machi.toLowerCase();
    for (const japanese of ["単騎", "嵌張", "辺張"]) {
      expect(machi).toContain(`{${termOf(japanese)}}`);
    }
  });
});

describe("認証とアカウントの画面が訳語表に従う", () => {
  it("ナビ・設定と認証の画面で、ログイン・新規登録・ログアウトを同じ語で呼ぶ", () => {
    // ナビの「ログイン」と認証の画面の見出し・リンクが "Log in" と "Sign in" に割れると、
    // 同じ操作が別物に見える
    expect(en.nav.login.toLowerCase()).toBe(termOf("ログイン"));
    expect(en.auth.signInPageTitle).toBe(en.nav.login);
    expect(en.auth.signInLinkText).toBe(en.nav.login);
    expect(en.settings.account.signIn).toBe(en.nav.login);
    expect(en.nav.signUp.toLowerCase()).toBe(termOf("新規登録"));
    expect(en.signUp.pageTitle).toBe(en.nav.signUp);
    expect(en.auth.signUpLinkText).toBe(en.nav.signUp);
    expect(en.settings.account.signUp).toBe(en.nav.signUp);
    expect(en.nav.signOut.toLowerCase()).toBe(termOf("ログアウト"));
    expect(en.settings.account.signOut).toBe(en.nav.signOut);
  });

  it("ユーザー名・メールアドレスは登録の画面と設定で同じラベル", () => {
    expect(en.setupUsername.usernameLabel.toLowerCase()).toBe(
      termOf("ユーザー名"),
    );
    expect(en.settings.account.username).toBe(en.setupUsername.usernameLabel);
    expect(en.setupUsername.displayNameLabel.toLowerCase()).toBe(
      termOf("表示名"),
    );
    expect(en.auth.emailLabel.toLowerCase()).toBe(termOf("メールアドレス"));
    expect(en.signUp.emailLabel).toBe(en.auth.emailLabel);
    expect(en.forgotPassword.emailLabel).toBe(en.auth.emailLabel);
    expect(en.settings.account.email).toBe(en.auth.emailLabel);
  });

  it("サインインの失敗は、アカウントの有無を区別しない 1 文", () => {
    // メールアドレスが登録済みかどうかを画面から読めないようにする（アカウントの列挙を防ぐ）。
    // 「アカウントが無い」「パスワードだけが違う」と言い分けない
    const message = en.auth.emailSignInError.toLowerCase();
    expect(message).toContain("email address or password");
    expect(message).not.toMatch(
      /\b(?:no account|not registered|not found|does not exist|doesn't exist)\b/,
    );
  });
});

/**
 * 用語集の 1 語の文言（見出し語・読み）
 *
 * 辞書の JSON は語ごとに別の型として推論されるので、比べる 2 項目だけの形に寄せる。
 */
interface GlossaryHeading {
  readonly term: string;
  readonly reading: string;
}

/** 用語集の語を slug と見出しの組で並べる */
function glossaryHeadings(
  terms: Readonly<Record<string, GlossaryHeading>>,
): [string, GlossaryHeading][] {
  return Object.entries(terms);
}

describe("用語集が訳語表に従う", () => {
  const jaTerms = new Map(glossaryHeadings(ja.glossary.terms));
  const enTerms = glossaryHeadings(en.glossary.terms);

  it("用語集の語（日本語の見出し語）はすべて訳語表に載る", () => {
    // 用語集は英語の用語の入口なので、64 語の訳を先に訳語表で決める。
    // 載っていない語は、章ごとに別の英語で訳される
    const missing = [...jaTerms.values()]
      .map((heading) => heading.term)
      .filter(
        (word) =>
          !TERMINOLOGY.some((term) =>
            term.ja.some((japanese) => japanese === word),
          ),
      );
    expect(missing).toEqual([]);
  });

  it("用語ページのタイトル（見出し語と読み）が訳語表の訳語を含む", () => {
    // ページの名前を英語で検索する人の語に揃える。見出し語は説明的でよく
    // （七対子は "Seven pairs"）、その場合は読み（chiitoitsu）が訳語を受け持つ
    const mismatched = enTerms
      .filter(([slug, heading]) => {
        const japanese = jaTerms.get(slug)?.term ?? "";
        const title = `${heading.term} (${heading.reading})`.toLowerCase();
        return !title.includes(termOf(japanese).toLowerCase());
      })
      .map(
        ([slug, heading]) => `${slug}: ${heading.term} (${heading.reading})`,
      );
    expect(mismatched).toEqual([]);
  });

  it("見出し語は英字の大文字で始まり、A–Z の索引のどれかの行に入る", () => {
    const offIndex = enTerms
      .filter(([, heading]) => !/^[A-Z]/.test(heading.term))
      .map(([slug, heading]) => `${slug}: ${heading.term}`);
    expect(offIndex).toEqual([]);
  });

  it("読みは日本語の読みのローマ字（小文字の ASCII、語の区切りは空白 1 つ）", () => {
    const invalid = enTerms
      .filter(([, heading]) => !/^[a-z]+(?: [a-z]+)*$/.test(heading.reading))
      .map(([slug, heading]) => `${slug}: ${heading.reading}`);
    expect(invalid).toEqual([]);
  });
});
