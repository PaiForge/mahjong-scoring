-- 章末の広告スロット（learn-chapter-native-ad）をカードの形から行の形へ移す。
--
-- スロットは 1 つの形しか受け付けず、読み込みはスロットが結ぶ形で行を絞る
-- （src/lib/ads/registry.ts）。レジストリだけ native_row に変えると、既存の
-- カードの行は画面に出なくなり、管理画面でも行の形として編集できない。
--
-- 行の形は帯を持たないので手牌を外し、代わりに行頭の絵文字を入れる。
-- 画像も絵文字も無い行は、本番シード（scripts/seed/ad-creatives.ts）が
-- その本の行の形に付けている絵文字を ASIN から引き、知らない本には 📘 を置く
-- （ad_creatives_chk_has_visual が見た目の無い行を許さない）。
UPDATE "ad_creatives"
SET
  "kind" = 'native_row',
  "hand" = NULL,
  "icon" = CASE
    WHEN "image_path" IS NOT NULL OR ("icon" IS NOT NULL AND "icon" <> '') THEN "icon"
    WHEN "asin" = 'B0H74QCPBJ' THEN '📘'
    WHEN "asin" = 'B0FP1KHZXY' THEN '📗'
    WHEN "asin" = 'B08721VWS5' THEN '📙'
    WHEN "asin" = 'B0HGL2VJ5K' THEN '📕'
    WHEN "asin" = 'B0DGTQXJ9X' THEN '📒'
    ELSE '📘'
  END,
  "updated_at" = now()
WHERE "slot" = 'learn-chapter-native-ad' AND "kind" = 'native_card';
