CREATE TABLE "AgencyBrand" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "AgencyBrand_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"agency_user_id" integer NOT NULL,
	"brand_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "AgencyBrand_agency_brand_uq" UNIQUE("agency_user_id","brand_id")
);
--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "persons" integer;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "male_pct" double precision;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "female_pct" double precision;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "nse_high_pct" double precision;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "nse_mid_pct" double precision;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD COLUMN "nse_low_pct" double precision;--> statement-breakpoint
ALTER TABLE "AgencyBrand" ADD CONSTRAINT "AgencyBrand_agency_user_id_User_id_fk" FOREIGN KEY ("agency_user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AgencyBrand" ADD CONSTRAINT "AgencyBrand_brand_id_Brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AgencyBrand_agency_idx" ON "AgencyBrand" USING btree ("agency_user_id");--> statement-breakpoint
CREATE INDEX "AgencyBrand_brand_idx" ON "AgencyBrand" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "Obs_brand_year_month_idx" ON "ElementRecord" USING btree ("brand_id","year","month");