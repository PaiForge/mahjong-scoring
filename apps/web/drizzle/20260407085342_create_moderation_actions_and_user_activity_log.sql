CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(50),
	"target_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_ma_actor" ON "moderation_actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_ma_target" ON "moderation_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_ma_action" ON "moderation_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_ma_created_at" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ual_user" ON "user_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ual_action" ON "user_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_ual_target" ON "user_activity_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_ual_created_at" ON "user_activity_log" USING btree ("created_at");