CREATE TABLE "user_admin_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_label" varchar(64) NOT NULL,
	"target_user_id" uuid NOT NULL,
	"action" varchar(32) NOT NULL,
	"previous_value" varchar(16) NOT NULL,
	"new_value" varchar(16) NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_admin_events_action_check" CHECK ("user_admin_events"."action" in ('role_change', 'block', 'unblock'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(254);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_owner_type" varchar(16);--> statement-breakpoint
UPDATE "users"
SET "email" = 'legacy+' || "id"::text || '@invalid.example',
    "email_owner_type" = 'other'
WHERE "email" IS NULL OR "email_owner_type" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_owner_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(16) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(16) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_admin_events" ADD CONSTRAINT "user_admin_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_admin_events" ADD CONSTRAINT "user_admin_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check" CHECK ("users"."email" = lower(trim("users"."email")));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" in ('user', 'admin'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("users"."status" in ('active', 'banned'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_owner_type_check" CHECK ("users"."email_owner_type" in ('self', 'parent', 'guardian', 'other'));
