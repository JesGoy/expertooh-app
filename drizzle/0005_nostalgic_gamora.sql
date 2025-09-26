CREATE TYPE "public"."user_profile" AS ENUM('admin', 'agencia', 'cliente', 'proveedor');--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "profile" "user_profile" DEFAULT 'cliente' NOT NULL;