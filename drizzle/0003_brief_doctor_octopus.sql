CREATE TABLE "Brand" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Brand_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ElementObservation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ElementObservation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"element_id" integer NOT NULL,
	"brand_id" integer,
	"category_id" integer,
	"subcategory_id" integer,
	"photo_url" text,
	"notes" text,
	"captured_at" timestamp,
	"year" integer,
	"month" integer,
	"value_clp" numeric(15, 2),
	"area_m2" double precision,
	"status" integer,
	"user_agent" varchar(120),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Subcategory" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Subcategory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "Element_provider_code_key";--> statement-breakpoint
ALTER TABLE "Element" ALTER COLUMN "status" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "Element" ADD COLUMN "external_code" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "ElementObservation" ADD CONSTRAINT "ElementObservation_element_id_Element_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."Element"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ElementObservation" ADD CONSTRAINT "ElementObservation_brand_id_Brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."Brand"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ElementObservation" ADD CONSTRAINT "ElementObservation_category_id_Category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ElementObservation" ADD CONSTRAINT "ElementObservation_subcategory_id_Subcategory_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."Subcategory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_category_id_Category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Category_name_key" ON "Category" USING btree ("name");--> statement-breakpoint
CREATE INDEX "Obs_element_idx" ON "ElementObservation" USING btree ("element_id");--> statement-breakpoint
CREATE INDEX "Obs_brand_idx" ON "ElementObservation" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "Obs_category_idx" ON "ElementObservation" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "Obs_captured_idx" ON "ElementObservation" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "Obs_year_month_idx" ON "ElementObservation" USING btree ("year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "Subcategory_category_name_key" ON "Subcategory" USING btree ("category_id","name");--> statement-breakpoint
CREATE INDEX "Subcategory_category_idx" ON "Subcategory" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Element_provider_extcode_key" ON "Element" USING btree ("provider_id","external_code");--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "faces";--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "width_cm";--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "height_cm";--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "lighting";