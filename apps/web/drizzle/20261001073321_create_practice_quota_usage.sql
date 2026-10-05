CREATE TABLE "practice_quota_usage" (
	"user_id" uuid NOT NULL,
	"menu" varchar(50) NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "practice_quota_usage_user_id_menu_day_pk" PRIMARY KEY("user_id","menu","day"),
	CONSTRAINT "practice_quota_usage_chk_count" CHECK ("practice_quota_usage"."count" >= 0)
);
