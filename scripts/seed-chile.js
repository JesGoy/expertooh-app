#!/usr/bin/env node
/*
  Seed Chile Regions, Provinces, Communes from Gobierno Digital DPA API
  - API docs: https://apis.digital.gob.cl/dpa
  - Tables expected: "Region" (code,name), "Province" (code,name,region_id), "Commune" (code,name,province_id)

  Usage:
    DATABASE_URL=... node scripts/seed-chile.js

  Or via npm script:
    npm run seed:chile
*/

// Load environment from .env.local (and .env fallback) for Node scripts
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

const { neon } = require('@neondatabase/serverless');

const DPA_BASE = 'https://apis.digital.gob.cl/dpa';

async function fetchJson(url) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(to);
  }
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL no está definida');
    process.exit(1);
  }
  const sql = neon(url);

  console.log('Descargando regiones…');
  /** @type {{codigo:string,nombre:string}[]} */
  const regiones = await fetchJson(`${DPA_BASE}/regiones`);

  // Insert regions
  const regionCodeToId = new Map();
  for (const r of regiones) {
    const code = String(r.codigo);
    const name = r.nombre;
    const rows = await sql(
      `INSERT INTO "Region" (code, name) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [code, name]
    );
    const id = rows[0].id;
    regionCodeToId.set(code, id);
  }
  console.log(`Regiones insertadas/actualizadas: ${regionCodeToId.size}`);

  // Provinces and communes
  const provinceCodeToId = new Map();
  for (const r of regiones) {
    const regionCode = String(r.codigo);
    const regionId = regionCodeToId.get(regionCode);
    if (!regionId) throw new Error(`Region id no encontrado para código ${regionCode}`);

    console.log(`Descargando provincias de región ${regionCode}…`);
    /** @type {{codigo:string,nombre:string}[]} */
    const provincias = await fetchJson(`${DPA_BASE}/regiones/${regionCode}/provincias`);

    for (const p of provincias) {
      const provCode = String(p.codigo);
      const name = p.nombre;
      const rows = await sql(
        `INSERT INTO "Province" (code, name, region_id) VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, region_id = EXCLUDED.region_id
         RETURNING id`,
        [provCode, name, regionId]
      );
      const provId = rows[0].id;
      provinceCodeToId.set(provCode, provId);

      console.log(`  Descargando comunas de provincia ${provCode}…`);
      /** @type {{codigo:string,nombre:string}[]} */
      const comunas = await fetchJson(`${DPA_BASE}/provincias/${provCode}/comunas`);
      for (const c of comunas) {
        const comCode = String(c.codigo);
        const cname = c.nombre;
        await sql(
          `INSERT INTO "Commune" (code, name, province_id) VALUES ($1, $2, $3)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, province_id = EXCLUDED.province_id`,
          [comCode, cname, provId]
        );
      }
    }
  }

  console.log('Seed de Chile (Regiones/Provincias/Comunas) completado.');
}

seed().catch((err) => {
  console.error('Error en seeding:', err?.message || err);
  process.exit(1);
});
