CREATE TABLE "user_ranks" (
	"user_id" uuid NOT NULL,
	"rank_slug" varchar(30) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_ranks_user_id_rank_slug_pk" PRIMARY KEY("user_id","rank_slug")
);
