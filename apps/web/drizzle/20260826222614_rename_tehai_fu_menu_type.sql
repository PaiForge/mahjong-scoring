-- 練習「手牌の符計算」を「面子と雀頭の符計算」へ改名したことに伴う menu_type の付け替え。
-- 出題内容は変わっていないため、記録済みのスコア・EXP はそのまま引き継ぐ。
-- menu_type は varchar で enum ではないので、値の更新だけで完結する。
UPDATE "challenge_results" SET "menu_type" = 'mentsu_jantou_fu' WHERE "menu_type" = 'tehai_fu';
--> statement-breakpoint
UPDATE "challenge_best_scores" SET "menu_type" = 'mentsu_jantou_fu' WHERE "menu_type" = 'tehai_fu';
--> statement-breakpoint
UPDATE "exp_events" SET "menu_type" = 'mentsu_jantou_fu' WHERE "menu_type" = 'tehai_fu';
