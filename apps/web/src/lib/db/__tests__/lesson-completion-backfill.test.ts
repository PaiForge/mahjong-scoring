import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LESSON_REGISTRY } from "@mahjong-scoring/features/lessons/registry";
import { describe, expect, it } from "vitest";

/**
 * レッスンの不変条件: どのレッスンの章も、その章の読了をレッスンの完了へ
 * 引き継ぐマイグレーションを持つ。
 *
 * 黒帯への道は、レッスンのある章をレッスンの完了だけで「学んだ」とし、
 * 読了では進めない（features の journey/journey.ts）。レッスンの無い章は
 * 読了で学んだことになっているので、引き継ぎなしにレッスンを足すと、
 * その章を読了していた人の進捗が黙って後退する。
 *
 * 検査は `drizzle/*.sql` の中に、`lesson_completions` へ入れる文で章の
 * スラッグを挙げたものがあるかだけを見る（5級の分は
 * `*_backfill_kyu5_lesson_completions.sql`）。
 */
const DRIZZLE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../drizzle",
);

const backfills = readdirSync(DRIZZLE_DIR)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => readFileSync(join(DRIZZLE_DIR, name), "utf-8"))
  .filter(
    (sql) =>
      sql.includes('INSERT INTO "lesson_completions"') &&
      sql.includes('FROM "learn_chapter_reads"'),
  );

describe("レッスン完了の引き継ぎ", () => {
  it.each(LESSON_REGISTRY.map((lesson) => lesson.chapterSlug))(
    "%s の読了をレッスンの完了へ引き継ぐマイグレーションがある",
    (chapterSlug) => {
      expect(backfills.some((sql) => sql.includes(`'${chapterSlug}'`))).toBe(
        true,
      );
    },
  );
});
