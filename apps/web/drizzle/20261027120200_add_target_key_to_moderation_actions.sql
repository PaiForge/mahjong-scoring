ALTER TABLE "moderation_actions" ALTER COLUMN "target_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD COLUMN "target_key" text;--> statement-breakpoint
CREATE INDEX "idx_ma_target_key" ON "moderation_actions" USING btree ("target_type","target_key");--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_chk_target" CHECK (("moderation_actions"."target_type" = 'user') = ("moderation_actions"."target_id" IS NOT NULL) AND ("moderation_actions"."target_id" IS NOT NULL) <> ("moderation_actions"."target_key" IS NOT NULL));