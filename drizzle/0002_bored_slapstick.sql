CREATE TABLE "album_admin_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"album_id" uuid NOT NULL,
	"album_title" varchar(160) NOT NULL,
	"action" varchar(32) NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "album_admin_events_action_check" CHECK ("album_admin_events"."action" in ('create', 'publish', 'unpublish', 'delete'))
);
--> statement-breakpoint
CREATE TABLE "album_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "album_sections_album_position_unique" UNIQUE("album_id","position"),
	CONSTRAINT "album_sections_album_id_id_unique" UNIQUE("album_id","id"),
	CONSTRAINT "album_sections_name_check" CHECK (char_length(trim("album_sections"."name")) between 1 and 160)
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"publisher" varchar(160),
	"year" integer,
	"cover_url" varchar(2048),
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "albums_slug_unique" UNIQUE("slug"),
	CONSTRAINT "albums_slug_format_check" CHECK ("albums"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "albums_title_check" CHECK (char_length(trim("albums"."title")) between 1 and 160),
	CONSTRAINT "albums_status_check" CHECK ("albums"."status" in ('draft', 'published')),
	CONSTRAINT "albums_year_check" CHECK ("albums"."year" is null or "albums"."year" between 1800 and 2200)
);
--> statement-breakpoint
CREATE TABLE "stickers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"section_id" uuid,
	"code" varchar(64) NOT NULL,
	"name" varchar(160),
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stickers_album_code_unique" UNIQUE("album_id","code"),
	CONSTRAINT "stickers_album_position_unique" UNIQUE("album_id","position"),
	CONSTRAINT "stickers_code_check" CHECK (char_length(trim("stickers"."code")) between 1 and 64)
);
--> statement-breakpoint
ALTER TABLE "album_admin_events" ADD CONSTRAINT "album_admin_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_sections" ADD CONSTRAINT "album_sections_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_album_section_fk" FOREIGN KEY ("album_id","section_id") REFERENCES "public"."album_sections"("album_id","id") ON DELETE restrict ON UPDATE no action;