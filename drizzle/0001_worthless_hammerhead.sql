CREATE TABLE "Commune" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Commune_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"province_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Province" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Province_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"region_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Region" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Region_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"code" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_province_id_Province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."Province"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Province" ADD CONSTRAINT "Province_region_id_Region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."Region"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Commune_province_idx" ON "Commune" USING btree ("province_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Commune_province_name_key" ON "Commune" USING btree ("province_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "Commune_code_key" ON "Commune" USING btree ("code");--> statement-breakpoint
CREATE INDEX "Province_region_idx" ON "Province" USING btree ("region_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Province_region_name_key" ON "Province" USING btree ("region_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "Province_code_key" ON "Province" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "Region_name_key" ON "Region" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Region_code_key" ON "Region" USING btree ("code");