import { pgTable, text, timestamp, integer, varchar, uniqueIndex, index, doublePrecision, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { unique } from 'drizzle-orm/pg-core';

// NUEVO enum de perfiles
export const userProfileEnum = pgEnum('user_profile', ['admin', 'agencia', 'cliente', 'proveedor']);

// Matches Neon table: "User"
export const userTable = pgTable(
  'User',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: integer('status'),
    lastLoginAt: timestamp('last_login_at'),
    profile: userProfileEnum('profile').notNull().default('cliente'), // <--- NUEVO
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      emailUnique: uniqueIndex('User_email_key').on(table.email),
      usernameUnique: uniqueIndex('User_username_key').on(table.username),
    };
  },
);

export type UserRow = typeof userTable.$inferSelect;

// --- Geo hierarchy: Region > Province > Commune ---

export const regionTable = pgTable(
  'Region',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 120 }).notNull(),
    code: varchar('code', { length: 20 }), // optional ISO/code
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      regionNameUnique: uniqueIndex('Region_name_key').on(table.name),
      regionCodeUnique: uniqueIndex('Region_code_key').on(table.code),
    };
  },
);

export const provinceTable = pgTable(
  'Province',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    regionId: integer('region_id').notNull().references(() => regionTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    code: varchar('code', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      provinceRegionIdx: index('Province_region_idx').on(table.regionId),
      provinceUniqueInRegion: uniqueIndex('Province_region_name_key').on(table.regionId, table.name),
      provinceCodeUnique: uniqueIndex('Province_code_key').on(table.code),
    };
  },
);

export const communeTable = pgTable(
  'Commune',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    provinceId: integer('province_id').notNull().references(() => provinceTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    code: varchar('code', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      communeProvinceIdx: index('Commune_province_idx').on(table.provinceId),
      communeUniqueInProvince: uniqueIndex('Commune_province_name_key').on(table.provinceId, table.name),
      communeCodeUnique: uniqueIndex('Commune_code_key').on(table.code),
    };
  },
);

export type RegionRow = typeof regionTable.$inferSelect;
export type ProvinceRow = typeof provinceTable.$inferSelect;
export type CommuneRow = typeof communeTable.$inferSelect;

// === OOH domain (normalized from Excel) ===

// Provider of the physical element/site
export const providerTable = pgTable(
  'Provider',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 160 }).notNull(),
    rut: varchar('rut', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    providerNameUnique: uniqueIndex('Provider_name_key').on(t.name)
    
  }),
);

// Format/type of the element (e.g., "Pantalla Led")
export const typeTable = pgTable(
  'Type',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({ typeNameUnique: uniqueIndex('Type_name_key').on(t.name) }),
);

// Brand/advertiser
export const brandTable = pgTable(
  'Brand',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 160 }).notNull(),
    categoryId: integer('category_id').notNull().references(() => categoryTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    brandUniqueInCategory: uniqueIndex('Brand_category_name_key').on(t.categoryId, t.name),
  }),
);

// Category and Subcategory (dimension)
export const categoryTable = pgTable(
  'Category',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 160 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({ categoryNameUnique: uniqueIndex('Category_name_key').on(t.name) }),
);

// Physical advertising element/site
export const elementTable = pgTable(
  'Element',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    providerId: integer('provider_id').notNull().references(() => providerTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    typeId: integer('type_id').references(() => typeTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    communeId: integer('commune_id').references(() => communeTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    address: varchar('address', { length: 255 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    status: integer('status'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    elementProviderIdx: index('Element_provider_idx').on(t.providerId),
    elementTypeIdx: index('Element_type_idx').on(t.typeId),
    elementCommuneIdx: index('Element_commune_idx').on(t.communeId),
  }),
);

// Observations/records per element (brand, category, media, metrics)
export const elementRecordTable = pgTable(
  'ElementRecord',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    elementId: integer('element_id').notNull().references(() => elementTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    brandId: integer('brand_id').references(() => brandTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
   
    photoUrl: text('photo_url'),
    notes: text('notes'), // OBSERVACION / DESCRIPCION
    // metrics and time
    capturedAt: timestamp('captured_at'), // from "Fecha" or FECHA Registro + HORA
    year: integer('year'),
    month: integer('month'), // 1-12
    valueCLP: numeric('value_clp', { precision: 15, scale: 2 }), // from " VALOR "
    areaM2: doublePrecision('area_m2'), // from MTS2
    status: integer('status'),
    userAgent: varchar('user_agent', { length: 120 }), // USUARIO_MOVIL
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    obsElementIdx: index('Obs_element_idx').on(t.elementId),
    obsBrandIdx: index('Obs_brand_idx').on(t.brandId),

    obsCapturedIdx: index('Obs_captured_idx').on(t.capturedAt),
    obsYearMonthIdx: index('Obs_year_month_idx').on(t.year, t.month),
  }),
);

export const agencyBrandTable = pgTable(
  'AgencyBrand',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    agencyUserId: integer('agency_user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brandTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uq: unique('AgencyBrand_agency_brand_uq').on(t.agencyUserId, t.brandId),
    idxAgency: index('AgencyBrand_agency_idx').on(t.agencyUserId),
    idxBrand: index('AgencyBrand_brand_idx').on(t.brandId),
  }),
);

export type ProviderRow = typeof providerTable.$inferSelect;
export type TypeRow = typeof typeTable.$inferSelect;
export type BrandRow = typeof brandTable.$inferSelect;
export type CategoryRow = typeof categoryTable.$inferSelect;

export type ElementRow = typeof elementTable.$inferSelect;
export type ElementRecordRow = typeof elementRecordTable.$inferSelect;
export type AgencyBrandRow = typeof agencyBrandTable.$inferSelect;
