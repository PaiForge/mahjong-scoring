CREATE TABLE "ad_network_settings" (
	"network" varchar(50) PRIMARY KEY NOT NULL,
	"tracking_id" varchar(64) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_network_settings_chk_network" CHECK ("ad_network_settings"."network" IN ('amazon_jp'))
);
--> statement-breakpoint
ALTER TABLE "ad_creatives" ALTER COLUMN "href" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_creatives" ADD COLUMN "asin" varchar(10);--> statement-breakpoint
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_chk_one_link" CHECK (("ad_creatives"."href" IS NULL) <> ("ad_creatives"."asin" IS NULL));--> statement-breakpoint
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_chk_asin" CHECK ("ad_creatives"."asin" ~ '^[A-Z0-9]{10}$');