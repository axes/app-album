ALTER TABLE "user_albums" ADD COLUMN "share_token" varchar(43);--> statement-breakpoint
ALTER TABLE "user_albums" ADD COLUMN "sharing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_albums" ADD CONSTRAINT "user_albums_share_token_unique" UNIQUE("share_token");