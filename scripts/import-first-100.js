#!/usr/bin/env node
/*
  Importa los primeros 100 registros normalizados desde data-muestra/BD-MUESTRA.xlsx
  - Crea/usa Provider, Type, Category, Brand
  - Busca Commune por nombre (antes de la coma) y opcionalmente cruza con Provincia/Región
  - Dedup de Element por (provider_id, address, commune_id, type_id)
  - Inserta ElementRecord con métricas y metadatos

  Uso:
    DATABASE_URL=... node scripts/import-first-100.js
*/

// Carga variables de entorno desde .env.local / .env
try {
  const path = require('path');
  const fs = require('fs');
  const root = process.cwd();
  const envLocal = path.resolve(root, '.env.local');
  const envDefault = path.resolve(root, '.env');
  const dotenv = require('dotenv');
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
  else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault });
} catch {}

const xlsx = require('xlsx');
const { neon } = require('@neondatabase/serverless');

function beforeComma(str) {
  if (!str || typeof str !== 'string') return null;
  const i = str.indexOf(',');
  return (i >= 0 ? str.slice(0, i) : str).trim();
}

function normOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : null;
  }
  return v;
}

function monthToNumber(mes) {
  if (!mes || typeof mes !== 'string') return null;
  const m = mes.trim().toLowerCase();
  const map = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  };
  return map[m] || null;
}

async function upsertOne(sql, table, cols, vals, conflict) {
  // Builds INSERT ... ON CONFLICT (...) DO UPDATE SET ... RETURNING id
  const columns = cols.map((c) => `"${c}"`).join(', ');
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols
    .filter((c) => c !== 'id')
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');
  const conflictCols = conflict.map((c) => (Array.isArray(c) ? c.map((x) => `"${x}"`).join(', ') : `"${c}"`)).join(', ');
  const query = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})
    ON CONFLICT (${conflictCols}) DO UPDATE SET ${updates} RETURNING id`;
  const rows = await sql(query, vals);
  return rows[0]?.id;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL no está definida');
  const sql = neon(dbUrl);

  const file = 'data-muestra/BD-MUESTRA.xlsx';
  const wb = xlsx.readFile(file, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
  const limit = Math.min(100, rows.length);

  console.log(`Procesando ${limit} filas…`);

  // Caches en memoria para reducir I/O
  const providerCache = new Map(); // name -> id
  const typeCache = new Map(); // name -> id
  const categoryCache = new Map(); // name -> id
  const brandCache = new Map(); // categoryName|brandName -> id
  const communeCache = new Map(); // key -> id
  const elementCache = new Map(); // key -> id

  for (let i = 0; i < limit; i++) {
    const r = rows[i];
    // Campos
    const provName = normOrNull(r['NOMBRE_PROVEEDOR']);
    const typeName = normOrNull(r['TIPO_ELEMENTO']);
    const brandName = normOrNull(r['NOMBRE_MARCA']);
    const categoryName = normOrNull(r['CATEGORIA']);
    const comunaNameRaw = normOrNull(r['NOMBRE_COMUNA']);
    const provinciaNameRaw = normOrNull(r['NOMBRE_PROVINCIA']);
    const regionNameRaw = normOrNull(r['NOMBRE_REGION']);
    const comunaName = beforeComma(comunaNameRaw);
    const provinciaName = beforeComma(provinciaNameRaw);
    const regionName = beforeComma(regionNameRaw);
    const address = normOrNull(r['DIRECCION']);
    const status = r['STATUS'] ?? null;
    const photoUrl = normOrNull(r['FOTO']);
    const notes = normOrNull(r['OBSERVACION']) || normOrNull(r['DESCRIPCION']);
    const year = r['AÑO'] ?? null;
    let month = r['MES'];
    month = typeof month === 'string' ? monthToNumber(month) : month ?? null;
    const valueCLP = r[' VALOR '] ?? null;
    const areaM2 = r['MTS2'] ?? null;
    const userAgent = normOrNull(r['USUARIO_MOVIL']);
    // Fecha preferente: "Fecha" si viene como Date; si no, FECHA Registro + HORA
    let capturedAt = r['Fecha'];
    if (!(capturedAt instanceof Date) && r['FECHA Registro']) {
      const f = r['FECHA Registro'];
      const h = r['HORA'] || '00:00:00';
      const iso = `${f}T${h}`;
      const d = new Date(iso);
      capturedAt = isNaN(d.getTime()) ? null : d;
    }

    // Provider
    let providerId = null;
    if (provName) {
      providerId = providerCache.get(provName);
      if (!providerId) {
        const rows = await sql(
          `INSERT INTO "Provider" (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [provName]
        );
        providerId = rows[0].id;
        providerCache.set(provName, providerId);
      }
    }

    // Type
    let typeId = null;
    if (typeName) {
      typeId = typeCache.get(typeName);
      if (!typeId) {
        const rows = await sql(
          `INSERT INTO "Type" (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [typeName]
        );
        typeId = rows[0].id;
        typeCache.set(typeName, typeId);
      }
    }

    // Category
    let categoryId = null;
    if (categoryName) {
      categoryId = categoryCache.get(categoryName);
      if (!categoryId) {
        const rows = await sql(
          `INSERT INTO "Category" (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [categoryName]
        );
        categoryId = rows[0].id;
        categoryCache.set(categoryName, categoryId);
      }
    }

    // Brand (scoped por categoría)
    let brandId = null;
    if (brandName) {
      const key = `${categoryName || ''}|${brandName}`;
      brandId = brandCache.get(key);
      if (!brandId) {
        // Si no hay categoría para la marca, crea una genérica "Sin categoría"
        let catId = categoryId;
        if (!catId) {
          const fallback = 'Sin categoría';
          catId = categoryCache.get(fallback);
          if (!catId) {
            const rows = await sql(
              `INSERT INTO "Category" (name) VALUES ($1)
               ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [fallback]
            );
            catId = rows[0].id;
            categoryCache.set(fallback, catId);
          }
        }
        const rows = await sql(
          `INSERT INTO "Brand" (name, category_id) VALUES ($1, $2)
           ON CONFLICT (category_id, name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [brandName, catId]
        );
        brandId = rows[0].id;
        brandCache.set(key, brandId);
      }
    }

    // Commune (intenta por nombre; si hay provincia/región, usa join para precisión)
    let communeId = null;
    if (comunaName) {
      const ckey = `${comunaName}|${provinciaName || ''}|${regionName || ''}`.toLowerCase();
      communeId = communeCache.get(ckey);
      if (!communeId) {
        const res = await sql(
          `SELECT c.id
           FROM "Commune" c
           JOIN "Province" p ON p.id = c.province_id
           JOIN "Region" r ON r.id = p.region_id
           WHERE lower(c.name) = lower($1)
             AND ($2::text IS NULL OR lower(p.name) = lower($2))
             AND ($3::text IS NULL OR lower(r.name) = lower($3))
           LIMIT 1`,
          [comunaName, provinciaName, regionName]
        );
        if (res.length) {
          communeId = res[0].id;
          communeCache.set(ckey, communeId);
        }
      }
    }

    // Element (dedup por provider+address+commune+type)
    let elementId = null;
    if (providerId && address) {
      const ekey = `${providerId}|${address}|${communeId || ''}|${typeId || ''}`;
      elementId = elementCache.get(ekey);
      if (!elementId) {
        const found = await sql(
          `SELECT id FROM "Element"
           WHERE provider_id = $1 AND address = $2
             AND (commune_id IS NOT DISTINCT FROM $3)
             AND (type_id IS NOT DISTINCT FROM $4)
           LIMIT 1`,
          [providerId, address, communeId, typeId]
        );
        if (found.length) {
          elementId = found[0].id;
        } else {
          const ins = await sql(
            `INSERT INTO "Element" (provider_id, type_id, commune_id, address, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [providerId, typeId, communeId, address, status]
          );
          elementId = ins[0].id;
        }
        elementCache.set(ekey, elementId);
      }
    }

    // ElementRecord
    if (elementId) {
      await sql(
        `INSERT INTO "ElementRecord"
           (element_id, brand_id, photo_url, notes, captured_at, year, month, value_clp, area_m2, status, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          elementId,
          brandId,
          photoUrl,
          notes,
          capturedAt instanceof Date ? capturedAt.toISOString() : null,
          year,
          month,
          valueCLP,
          areaM2,
          status,
          userAgent,
        ]
      );
    }

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1} filas procesadas…`);
  }

  console.log('Importación de 100 filas completada.');
}

main().catch((err) => {
  console.error('Error en import:', err?.message || err);
  process.exit(1);
});
