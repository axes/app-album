CREATE TABLE "user_album_stickers" (
	"user_album_id" uuid NOT NULL,
	"sticker_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_album_stickers_user_album_id_sticker_id_pk" PRIMARY KEY("user_album_id","sticker_id"),
	CONSTRAINT "user_album_stickers_quantity_check" CHECK ("user_album_stickers"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "user_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"album_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_albums_user_album_unique" UNIQUE("user_id","album_id")
);
--> statement-breakpoint
ALTER TABLE "user_album_stickers" ADD CONSTRAINT "user_album_stickers_user_album_id_user_albums_id_fk" FOREIGN KEY ("user_album_id") REFERENCES "public"."user_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_album_stickers" ADD CONSTRAINT "user_album_stickers_sticker_id_stickers_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."stickers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_albums" ADD CONSTRAINT "user_albums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_albums" ADD CONSTRAINT "user_albums_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE restrict ON UPDATE no action;