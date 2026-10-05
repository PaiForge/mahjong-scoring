CREATE TABLE "ad_creative_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creative_id" uuid NOT NULL,
	"locale" varchar(10) NOT NULL,
	"title" varchar(255),
	"description" varchar(1000),
	CONSTRAINT "uq_ad_creative_translations_locale" UNIQUE("creative_id","locale"),
	CONSTRAINT "ad_creative_translations_chk_says_something" CHECK ("ad_creative_translations"."title" IS NOT NULL OR "ad_creative_translations"."description" IS NOT NULL),
	CONSTRAINT "ad_creative_translations_chk_default_locale_title" CHECK ("ad_creative_translations"."locale" <> 'ja' OR "ad_creative_translations"."title" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "ad_creatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(50) NOT NULL,
	"slot" varchar(50) NOT NULL,
	"href" varchar(2048) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"icon" varchar(16),
	"image_path" varchar(1024),
	"image_alt" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_creatives_chk_kind" CHECK ("ad_creatives"."kind" IN ('native_card', 'native_row')),
	CONSTRAINT "ad_creatives_chk_has_visual" CHECK (("ad_creatives"."icon" IS NOT NULL AND "ad_creatives"."icon" <> '') OR "ad_creatives"."image_path" IS NOT NULL),
	CONSTRAINT "ad_creatives_chk_image_alt_with_image" CHECK ("ad_creatives"."image_alt" IS NULL OR "ad_creatives"."image_path" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "ad_creative_translations" ADD CONSTRAINT "ad_creative_translations_creative_id_ad_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."ad_creatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ad_creatives_slot_active" ON "ad_creatives" USING btree ("slot","is_active");