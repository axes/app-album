CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(30) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_username_length_check" CHECK (char_length("users"."username") between 3 and 30),
	CONSTRAINT "users_username_lowercase_check" CHECK ("users"."username" = lower(trim("users"."username"))),
	CONSTRAINT "users_username_format_check" CHECK ("users"."username" ~ '^[a-z0-9_]+$')
);
