-- 「面子の符」の章の読了を、その章のレッスンの完了として引き継ぐ。
--
-- 黒帯への道は、レッスンのある章をレッスンの完了だけで「学んだ」とする
-- （features の journey/journey.ts）。この章にレッスンを用意するまでは読了で
-- 「学んだ」になっていたので、それまでに読了した人の進捗を後退させないよう、
-- 読了者にレッスンの完了を付ける（5級の章の引き継ぎと同じ）。
-- 引き継ぐのはこの移行を流した時点の読了だけで、以後の読了は完了にならない。
--
-- レッスンのスラッグは章のスラッグと同じ（features の lessons/registry.ts）。
-- 完了日時は読了日時をそのまま使う。既に完了している行はそのまま残す。
INSERT INTO "lesson_completions" ("user_id", "lesson_slug", "completed_at")
SELECT "user_id", "chapter_slug", "read_at"
FROM "learn_chapter_reads"
WHERE "chapter_slug" = 'mentsu-fu'
ON CONFLICT ("user_id", "lesson_slug") DO NOTHING;
