-- 章の「読了」をレッスンの完了へ畳む。
--
-- レッスンは教本の章そのもの（/learn/<slug>）になり、章ごとの印は
-- lesson_completions の「完了」1 つだけになった（features の journey/journey.ts）。
-- 以前の読了（learn_chapter_reads。本人が押すだけの印）は廃止し、記録を
-- 完了へ移してからテーブルを落とす。確認問題を持つ章の読了は、章ごとの
-- 引き継ぎ（*_backfill_*_lesson_completion*.sql）ですでに完了になっているので
-- 衝突は無視し、確認問題を持たない章（基礎・点数記憶術）の読了がここで
-- 初めて完了になる。完了日時は読了日時をそのまま使う。
INSERT INTO "lesson_completions" ("user_id", "lesson_slug", "completed_at")
SELECT "user_id", "chapter_slug", "read_at"
FROM "learn_chapter_reads"
ON CONFLICT ("user_id", "lesson_slug") DO NOTHING;
--> statement-breakpoint
DROP TABLE "learn_chapter_reads" CASCADE;
