-- トラッキング ID を web とモバイルで別に持つ（src/lib/db/schema.ts の
-- adNetworkSettings の TSDoc 参照）。既存の行は web の設定になる。
--
-- 主キーは network 単独から (network, platform) に替える。drizzle-kit は既存の
-- 主キーの名前を引けないため、Postgres の既定の名前（<テーブル>_pkey）で落とす。
ALTER TABLE "ad_network_settings" ADD COLUMN "platform" varchar(20) DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_network_settings" DROP CONSTRAINT "ad_network_settings_pkey";--> statement-breakpoint
ALTER TABLE "ad_network_settings" ADD CONSTRAINT "ad_network_settings_network_platform_pk" PRIMARY KEY("network","platform");--> statement-breakpoint
ALTER TABLE "ad_network_settings" ADD CONSTRAINT "ad_network_settings_chk_platform" CHECK ("ad_network_settings"."platform" IN ('web', 'mobile'));--> statement-breakpoint
-- モバイルにも今の ID を写す。モバイルの ASIN の広告は今まで web と同じ ID で
-- 出ていたため、写さないとデプロイした瞬間からモバイルの ID を設定するまで
-- アプリの広告が消える。値は DB の中で写すだけで、コードには現れない。
-- 成果を分けたくなったら、管理画面でモバイルの ID を差し替える。
INSERT INTO "ad_network_settings" ("network", "platform", "tracking_id", "updated_at")
SELECT "network", 'mobile', "tracking_id", now()
FROM "ad_network_settings"
WHERE "platform" = 'web'
ON CONFLICT DO NOTHING;
