CREATE TABLE IF NOT EXISTS "AgencyBrand" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "agency_user_id" integer NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "brand_id" integer NOT NULL REFERENCES "Brand"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyBrand_agency_brand_uq" ON "AgencyBrand"("agency_user_id","brand_id");
CREATE INDEX IF NOT EXISTS "AgencyBrand_agency_idx" ON "AgencyBrand"("agency_user_id");
CREATE INDEX IF NOT EXISTS "AgencyBrand_brand_idx" ON "AgencyBrand"("brand_id");