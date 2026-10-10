/**
 * ローカル開発用のお知らせの投入
 * お知らせシード
 *
 * 一覧（`/announcements`）・ダッシュボードの最新のお知らせ・アプリの一覧と
 * 詳細を、管理画面で書かずに確認できるよう、公開済みのお知らせを入れる。
 *
 * - ピン留めの 1 件（一覧の先頭に固定され、印が付く）
 * - 本文の書式を一通り使った 1 件（見出し・段落・強調・リンク・箇条書き・
 *   番号付き・引用・コード・表・区切り線）。web とアプリで描き分けを見比べる
 * - 公開日だけ違う短い記事が数件（並びが公開日の新しい順になること）
 *
 * slug が `dev-` で始まる行だけを宣言した状態へ消して入れ直す。管理画面で
 * 書いた手元のお知らせには触れない。
 */
import { like } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { announcements, type NewAnnouncement } from "../../src/lib/db/schema";

const SLUG_PREFIX = "dev-";

const DAY_MS = 24 * 60 * 60 * 1000;

const FORMATTING_SAMPLE = `# 書式の見本

お知らせの本文で使える書式を一通り並べた記事です。**太字**・*斜体*・~~打ち消し~~・\`コード\` を地の文に混ぜられます。

## リンク

サイトの中のページ（[レッスン一覧](/lessons)）と、外のページ（[麻雀のルール](https://ja.wikipedia.org/wiki/麻雀)）へのリンクです。URL だけでも https://example.com のようにリンクになります。

## 箇条書き

- 符計算のレッスンを追加しました
- 点数表の見た目を整えました
  - スマホ幅での折り返しを直しました
- 不具合を直しました

1. レッスンを読む
2. 練習で確かめる
3. 昇級試験を受ける

## 引用とコード

> 符は 10 符単位に切り上げます。

\`\`\`
30符 4翻 = 7700点
\`\`\`

---

## 表

| 翻 | 30符 | 40符 |
| --- | --- | --- |
| 1翻 | 1000 | 1300 |
| 2翻 | 2000 | 2600 |
`;

/** 公開日を今からの日数で決めるお知らせ */
interface SeedAnnouncement {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly daysAgo: number;
  readonly pinned?: boolean;
}

const SEED_ANNOUNCEMENTS: readonly SeedAnnouncement[] = [
  {
    slug: "dev-maintenance",
    title: "メンテナンスのお知らせ",
    content:
      "10月20日（月）2:00〜4:00 にメンテナンスを行います。この間はログインと記録の保存ができません。",
    daysAgo: 20,
    pinned: true,
  },
  {
    slug: "dev-formatting",
    title: "書式の見本",
    content: FORMATTING_SAMPLE,
    daysAgo: 1,
  },
  {
    slug: "dev-new-lesson",
    title: "符計算のレッスンを追加しました",
    content:
      "雀頭の符を学ぶレッスンを追加しました。[レッスン一覧](/lessons) からどうぞ。",
    daysAgo: 5,
  },
  {
    slug: "dev-ranking",
    title: "月間ランキングを始めました",
    content: "練習ごとに、その月の成績で順位を出します。",
    daysAgo: 40,
  },
];

/**
 * `dev-` のお知らせを宣言した状態へ入れ直す
 * お知らせ再投入
 *
 * @returns 投入した行数
 */
export async function reseedAnnouncements(
  db: PostgresJsDatabase,
  now: Date = new Date(),
): Promise<number> {
  const rows: NewAnnouncement[] = SEED_ANNOUNCEMENTS.map((seed) => {
    const publishedAt = new Date(now.getTime() - seed.daysAgo * DAY_MS);
    return {
      slug: seed.slug,
      title: seed.title,
      content: seed.content,
      locale: "ja",
      status: "published",
      pinnedAt: seed.pinned === true ? publishedAt : null,
      publishedAt,
    };
  });
  await db.transaction(async (tx) => {
    await tx
      .delete(announcements)
      .where(like(announcements.slug, `${SLUG_PREFIX}%`));
    await tx.insert(announcements).values(rows);
  });
  return rows.length;
}
