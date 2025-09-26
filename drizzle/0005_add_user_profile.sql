DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE "user_profile" AS ENUM ('admin','agencia','cliente','proveedor');
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile" "user_profile" NOT NULL DEFAULT 'cliente';