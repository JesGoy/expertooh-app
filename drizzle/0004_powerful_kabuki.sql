ALTER TABLE "Subcategory" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Subcategory" CASCADE;--> statement-breakpoint
ALTER TABLE "ElementObservation" RENAME TO "ElementRecord";--> statement-breakpoint
ALTER TABLE "Format" RENAME TO "Type";--> statement-breakpoint
ALTER TABLE "Element" RENAME COLUMN "format_id" TO "type_id";--> statement-breakpoint
ALTER TABLE "Provider" RENAME COLUMN "code" TO "rut";--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP CONSTRAINT "ElementObservation_element_id_Element_id_fk";
--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP CONSTRAINT "ElementObservation_brand_id_Brand_id_fk";
--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP CONSTRAINT "ElementObservation_category_id_Category_id_fk";
--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP CONSTRAINT "ElementObservation_subcategory_id_Subcategory_id_fk";
--> statement-breakpoint
ALTER TABLE "Element" DROP CONSTRAINT "Element_format_id_Format_id_fk";
--> statement-breakpoint
DROP INDEX "Brand_name_key";--> statement-breakpoint
DROP INDEX "Obs_category_idx";--> statement-breakpoint
DROP INDEX "Element_provider_extcode_key";--> statement-breakpoint
DROP INDEX "Element_format_idx";--> statement-breakpoint
DROP INDEX "Format_name_key";--> statement-breakpoint
DROP INDEX "Provider_code_key";--> statement-breakpoint
ALTER TABLE "Brand" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_category_id_Category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD CONSTRAINT "ElementRecord_element_id_Element_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."Element"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ElementRecord" ADD CONSTRAINT "ElementRecord_brand_id_Brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."Brand"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Element" ADD CONSTRAINT "Element_type_id_Type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."Type"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Brand_category_name_key" ON "Brand" USING btree ("category_id","name");--> statement-breakpoint
CREATE INDEX "Element_type_idx" ON "Element" USING btree ("type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Type_name_key" ON "Type" USING btree ("name");--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "ElementRecord" DROP COLUMN "subcategory_id";--> statement-breakpoint
ALTER TABLE "Element" DROP COLUMN "external_code";