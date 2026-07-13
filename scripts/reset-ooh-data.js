#!/usr/bin/env node
/*
  Limpia (TRUNCATE) los datos del dominio OOH conservando usuarios y geografía.

  Se vacían (y se reinician sus identidades):
    ElementRecord, Element, Brand, Category, Provider, Type, AgencyBrand

  Se CONSERVAN:
    User            (cuentas de login)
    Region/Province/Commune  (jerarquía geográfica sembrada con seed-chile.js)

  Nota: AgencyBrand (asignaciones marca<->agencia) se limpia también porque
  referencia a Brand y esas asignaciones quedan sin sentido tras borrar las marcas.

  Uso:
    node scripts/reset-ooh-data.js          # DRY-RUN: solo muestra conteos, no borra nada
    node scripts/reset-ooh-data.js --yes     # Ejecuta el TRUNCATE

  Requiere DATABASE_URL (se lee de .env.local / .env).
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

const { neon } = require('@neondatabase/serverless');

const TABLES_TO_TRUNCATE = ['ElementRecord', 'Element', 'Brand', 'Category', 'Provider', 'Type', 'AgencyBrand'];
const TABLES_PRESERVED = ['User', 'Region', 'Province', 'Commune'];

async function count(sql, table) {
  try {
    const rows = await sql(`SELECT count(*)::int AS n FROM "${table}"`);
    return rows[0]?.n ?? 0;
  } catch (e) {
    return `??? (${e?.message || e})`;
  }
}

async function main() {
  const apply = process.argv.includes('--yes');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL no está definida (revisa .env.local)');
  const sql = neon(dbUrl);

  console.log('Conteo ANTES:');
  for (const t of [...TABLES_TO_TRUNCATE, ...TABLES_PRESERVED]) {
    const mark = TABLES_TO_TRUNCATE.includes(t) ? '🗑️ ' : '💾';
    console.log(`  ${mark} ${t.padEnd(14)} ${await count(sql, t)}`);
  }

  if (!apply) {
    console.log('\nDRY-RUN. No se borró nada. Ejecuta con --yes para aplicar el TRUNCATE.');
    return;
  }

  const list = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
  console.log(`\nEjecutando: TRUNCATE ${list} RESTART IDENTITY CASCADE …`);
  await sql(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

  console.log('\nConteo DESPUÉS:');
  for (const t of [...TABLES_TO_TRUNCATE, ...TABLES_PRESERVED]) {
    console.log(`  ${t.padEnd(14)} ${await count(sql, t)}`);
  }
  console.log('\nLimpieza completada.');
}

main().catch((err) => {
  console.error('Error en reset:', err?.message || err);
  process.exit(1);
});
