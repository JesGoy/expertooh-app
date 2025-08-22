import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infra/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_5EOeaNKmjHq6@ep-blue-river-a80ri61b-pooler.eastus2.azure.neon.tech/expertooh?sslmode=require&channel_binding=require',
  },
});
//ver pq aca no funciona el url: process.env.DATABASE_URL
