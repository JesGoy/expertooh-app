#!/usr/bin/env node
/*
  Importa registros desde el CSV "Base de OR 2017-2025(BASE).csv" para UN año
  (por defecto 2025), normalizando al esquema OOH:
    - Provider / Type / Category / Brand (upsert + cache en memoria)
    - Commune por nombre (precargada en memoria; cruce con provincia/región)
    - Element (dedup por provider+address+commune+type)
    - ElementRecord (insert en lotes)

  Detalles del CSV:
    - Separador ';'
    - Números en formato chileno: "1.600.000" -> 1600000 ; "72,5" -> 72.5
    - Fecha en "FECHA Registro" = dd/mm/yyyy ; hora en "HORA"
    - Mes en texto ("enero" -> 1)
    - Columnas extra (VISITAS, PERSONAS, HOMBRES, MUJERES, NSE_*) se ignoran:
      no existen en el esquema actual.

  Uso:
    node scripts/import-year-csv.js
    node scripts/import-year-csv.js --year=2025 --file="Base de OR 2017-2025(BASE).csv"
    node scripts/import-year-csv.js --years=2021,2022,2023 --require-audience
    node scripts/import-year-csv.js --limit=100      # solo para pruebas
    node scripts/import-year-csv.js --dry-run        # parsea y cuenta, no escribe en BD

  Flags:
    --year=YYYY            un año objetivo (default 2025)
    --years=Y1,Y2,...      lista de años (tiene prioridad sobre --year)
    --require-audience     solo importa filas con PERSONAS no vacía (audiencia completa)

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

const fs = require('fs');
const readline = require('readline');

// ---------- args ----------
function getArg(name, def) {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : def;
}
const TARGET_YEARS = new Set(
  (getArg('years', '') || getArg('year', '2025')).split(',').map((y) => y.trim()).filter(Boolean),
);
const FILE = getArg('file', 'Base de OR 2017-2025(BASE).csv');
const LIMIT = Number(getArg('limit', '0')) || 0; // 0 = sin límite
const BATCH_SIZE = Number(getArg('batch', '500')) || 500;
const SHOW = Number(getArg('show', '0')) || 0; // imprime N registros parseados (útil con --dry-run)
const DRY_RUN = process.argv.includes('--dry-run');
const REQUIRE_AUDIENCE = process.argv.includes('--require-audience');

// ---------- helpers ----------
function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseCsvLine(line, delim = ';') {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function normOrNull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (!t || t.toLowerCase() === 'null') return null;
  return t;
}

function beforeComma(str) {
  const s = normOrNull(str);
  if (!s) return null;
  const i = s.indexOf(',');
  return (i >= 0 ? s.slice(0, i) : s).trim() || null;
}

function monthToNumber(mes) {
  const m = normOrNull(mes);
  if (!m) return null;
  const key = m.toLowerCase();
  const map = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  };
  if (map[key]) return map[key];
  const n = parseInt(key, 10);
  return n >= 1 && n <= 12 ? n : null;
}

// Formato chileno: '.' = separador de miles, ',' = decimal
function parseNumberCL(v) {
  const s = normOrNull(v);
  if (!s) return null;
  const cleaned = s.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseIntOrNull(v) {
  const s = normOrNull(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseDateCL(dateStr, timeStr) {
  const d = normOrNull(dateStr);
  if (!d) return null;
  let yyyy, mm, dd, m;
  if ((m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    // ISO: yyyy-mm-dd (formato usado en filas recientes, p.ej. 2025)
    yyyy = +m[1]; mm = +m[2]; dd = +m[3];
  } else if ((m = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/))) {
    // dd/mm/yyyy o dd-mm-yyyy (formato usado en filas antiguas)
    dd = +m[1]; mm = +m[2]; yyyy = +m[3];
  } else {
    return null;
  }
  let hh = 0, mi = 0, ss = 0;
  const t = normOrNull(timeStr);
  if (t) {
    const tm = t.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (tm) { hh = +tm[1]; mi = +tm[2]; ss = tm[3] ? +tm[3] : 0; }
  }
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, hh, mi, ss));
  return isNaN(dt.getTime()) ? null : dt;
}

async function main() {
  if (!fs.existsSync(FILE)) throw new Error(`No se encontró el archivo: ${FILE}`);

  let sql = null;
  if (!DRY_RUN) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL no está definida (revisa .env.local)');
    const { neon } = require('@neondatabase/serverless');
    sql = neon(dbUrl);
  }

  const yearsLabel = [...TARGET_YEARS].join(',');
  console.log(`Archivo: ${FILE}`);
  console.log(
    `Años objetivo: ${yearsLabel}${REQUIRE_AUDIENCE ? ' | solo filas con audiencia (PERSONAS)' : ''}` +
    `${LIMIT ? ` | límite: ${LIMIT}` : ''}${DRY_RUN ? ' | DRY-RUN' : ''}`,
  );

  // Precarga de comunas (nombre en minúsculas) para cruce en memoria
  const mapTriple = new Map(); // comuna|provincia|region -> id
  const mapNameProv = new Map(); // comuna|provincia -> id
  const mapName = new Map(); // comuna -> id
  if (sql) {
    const rows = await sql(
      `SELECT c.id, lower(c.name) AS c, lower(p.name) AS p, lower(r.name) AS r
       FROM "Commune" c
       JOIN "Province" p ON p.id = c.province_id
       JOIN "Region" r ON r.id = p.region_id`
    );
    for (const row of rows) {
      mapTriple.set(`${row.c}|${row.p}|${row.r}`, row.id);
      if (!mapNameProv.has(`${row.c}|${row.p}`)) mapNameProv.set(`${row.c}|${row.p}`, row.id);
      if (!mapName.has(row.c)) mapName.set(row.c, row.id);
    }
    console.log(`Comunas precargadas: ${rows.length}`);
  }

  function resolveCommuneId(comuna, provincia, region) {
    if (!comuna) return null;
    const c = comuna.toLowerCase();
    const p = (provincia || '').toLowerCase();
    const r = (region || '').toLowerCase();
    return (
      mapTriple.get(`${c}|${p}|${r}`) ??
      mapNameProv.get(`${c}|${p}`) ??
      mapName.get(c) ??
      null
    );
  }

  // Caches de dimensiones
  const providerCache = new Map();
  const typeCache = new Map();
  const categoryCache = new Map();
  const brandCache = new Map();
  const elementCache = new Map();

  async function upsertDim(table, name) {
    const rows = await sql(
      `INSERT INTO "${table}" (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    return rows[0].id;
  }

  async function getProviderId(name) {
    if (!name) return null;
    if (providerCache.has(name)) return providerCache.get(name);
    const id = await upsertDim('Provider', name);
    providerCache.set(name, id);
    return id;
  }
  async function getTypeId(name) {
    if (!name) return null;
    if (typeCache.has(name)) return typeCache.get(name);
    const id = await upsertDim('Type', name);
    typeCache.set(name, id);
    return id;
  }
  async function getCategoryId(name) {
    if (!name) return null;
    if (categoryCache.has(name)) return categoryCache.get(name);
    const id = await upsertDim('Category', name);
    categoryCache.set(name, id);
    return id;
  }
  async function getBrandId(brandName, categoryName) {
    if (!brandName) return null;
    const key = `${categoryName || ''}|${brandName}`;
    if (brandCache.has(key)) return brandCache.get(key);
    let catId = await getCategoryId(categoryName) ?? (await getCategoryId('Sin categoría'));
    const rows = await sql(
      `INSERT INTO "Brand" (name, category_id) VALUES ($1, $2)
       ON CONFLICT (category_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [brandName, catId]
    );
    const id = rows[0].id;
    brandCache.set(key, id);
    return id;
  }
  async function getElementId(providerId, typeId, communeId, address, status) {
    if (!providerId || !address) return null;
    const key = `${providerId}|${address}|${communeId || ''}|${typeId || ''}`;
    if (elementCache.has(key)) return elementCache.get(key);
    const ins = await sql(
      `INSERT INTO "Element" (provider_id, type_id, commune_id, address, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [providerId, typeId, communeId, address, status]
    );
    const id = ins[0].id;
    elementCache.set(key, id);
    return id;
  }

  // Buffer de ElementRecord para inserts en lote
  let buffer = [];
  const REC_COLS = [
    'element_id', 'brand_id', 'photo_url', 'notes', 'captured_at', 'year', 'month',
    'value_clp', 'area_m2', 'status', 'user_agent',
    'persons', 'male_pct', 'female_pct', 'nse_high_pct', 'nse_mid_pct', 'nse_low_pct',
  ];
  async function flush() {
    if (!buffer.length || DRY_RUN) { buffer = []; return; }
    const params = [];
    const values = [];
    let p = 1;
    for (const rec of buffer) {
      const ph = REC_COLS.map(() => `$${p++}`).join(',');
      values.push(`(${ph})`);
      params.push(...REC_COLS.map((c) => rec[c]));
    }
    const q = `INSERT INTO "ElementRecord" (${REC_COLS.map((c) => `"${c}"`).join(',')}) VALUES ${values.join(',')}`;
    await sql(q, params);
    buffer = [];
  }

  // Lectura en streaming
  const rl = readline.createInterface({
    input: fs.createReadStream(FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let idx = null;
  let seen = 0;       // filas del año objetivo
  let inserted = 0;   // records insertados
  let skippedNoElement = 0; // sin provider/address -> sin element
  let totalLines = 0;

  for await (const rawLine of rl) {
    totalLines++;
    if (idx === null) {
      const header = parseCsvLine(rawLine).map((h, i) => (i === 0 ? stripBom(h) : h).trim());
      idx = {};
      header.forEach((h, i) => { idx[h] = i; });
      const required = ['NOMBRE_PROVEEDOR', 'DIRECCION', 'AÑO', 'MES', 'FECHA Registro', 'VALOR', 'MTS2'];
      const missing = required.filter((k) => idx[k] === undefined);
      if (missing.length) throw new Error(`Faltan columnas esperadas en el CSV: ${missing.join(', ')}`);
      continue;
    }
    if (!rawLine.trim()) continue;

    const f = parseCsvLine(rawLine);
    const yearRaw = (f[idx['AÑO']] || '').trim();
    if (!TARGET_YEARS.has(yearRaw)) continue; // filtro rápido por año

    // filtro por audiencia: PERSONAS no vacía
    const personsRaw = idx['PERSONAS'] !== undefined ? (f[idx['PERSONAS']] || '').trim() : '';
    if (REQUIRE_AUDIENCE && !personsRaw) continue;

    seen++;

    const provName = normOrNull(f[idx['NOMBRE_PROVEEDOR']]);
    const typeName = normOrNull(f[idx['TIPO_ELEMENTO']]);
    const brandName = normOrNull(f[idx['NOMBRE_MARCA']]);
    const categoryName = normOrNull(f[idx['CATEGORIA']]);
    const comuna = beforeComma(f[idx['NOMBRE_COMUNA']]);
    const provincia = beforeComma(f[idx['NOMBRE_PROVINCIA']]);
    const region = beforeComma(f[idx['NOMBRE_REGION']]);
    const address = normOrNull(f[idx['DIRECCION']]);
    const status = parseIntOrNull(f[idx['STATUS']]);
    const photoUrl = normOrNull(f[idx['FOTO']]);
    const notes = normOrNull(f[idx['OBSERVACION']]) || normOrNull(f[idx['DESCRIPCION']]);
    const year = parseIntOrNull(yearRaw);
    const month = monthToNumber(f[idx['MES']]);
    const valueCLP = parseNumberCL(f[idx['VALOR']]);
    const areaM2 = parseNumberCL(f[idx['MTS2']]);
    const userAgent = normOrNull(f[idx['USUARIO_MOVIL']]);
    const capturedAt = parseDateCL(f[idx['FECHA Registro']], f[idx['HORA']]);
    // audiencia: PERSONAS entero; HOMBRES/MUJERES/NSE_* proporciones 0-1 con coma decimal
    const persons = parseIntOrNull(personsRaw);
    const malePct = parseNumberCL(f[idx['HOMBRES']]);
    const femalePct = parseNumberCL(f[idx['MUJERES']]);
    const nseHighPct = parseNumberCL(f[idx['NSE_ALTO']]);
    const nseMidPct = parseNumberCL(f[idx['NSE_MEDIO']]);
    const nseLowPct = parseNumberCL(f[idx['NSE_BAJO']]);

    if (SHOW && seen <= SHOW) {
      console.log(JSON.stringify({
        provName, typeName, brandName, categoryName,
        comuna, provincia, region, address,
        month, year,
        valueCLP, areaM2,
        capturedAt: capturedAt ? capturedAt.toISOString() : null,
        photoUrl, userAgent, status,
        persons, malePct, femalePct, nseHighPct, nseMidPct, nseLowPct,
      }, null, 2));
    }

    if (DRY_RUN) {
      if (!provName || !address) skippedNoElement++;
      else inserted++;
      if (LIMIT && seen >= LIMIT) break;
      continue;
    }

    const providerId = await getProviderId(provName);
    const typeId = await getTypeId(typeName);
    const communeId = resolveCommuneId(comuna, provincia, region);
    const brandId = await getBrandId(brandName, categoryName);
    const elementId = await getElementId(providerId, typeId, communeId, address, status);

    if (!elementId) { skippedNoElement++; continue; }

    buffer.push({
      element_id: elementId,
      brand_id: brandId,
      photo_url: photoUrl,
      notes,
      captured_at: capturedAt ? capturedAt.toISOString() : null,
      year,
      month,
      value_clp: valueCLP,
      area_m2: areaM2,
      status,
      user_agent: userAgent,
      persons,
      male_pct: malePct,
      female_pct: femalePct,
      nse_high_pct: nseHighPct,
      nse_mid_pct: nseMidPct,
      nse_low_pct: nseLowPct,
    });
    inserted++;

    if (buffer.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  insertados: ${inserted}  (leídas ${yearsLabel}: ${seen})   `);
    }

    if (LIMIT && seen >= LIMIT) break;
  }

  await flush();

  console.log(`\n\nResumen (${yearsLabel}):`);
  console.log(`  Líneas leídas del archivo : ${totalLines - 1}`);
  console.log(`  Filas objetivo (${yearsLabel}${REQUIRE_AUDIENCE ? ', con audiencia' : ''}): ${seen}`);
  console.log(`  ElementRecord insertados  : ${inserted}`);
  console.log(`  Filas sin proveedor/dirección (descartadas): ${skippedNoElement}`);
  if (!DRY_RUN) {
    console.log(`  Providers   creados/usados: ${providerCache.size}`);
    console.log(`  Types       creados/usados: ${typeCache.size}`);
    console.log(`  Categories  creadas/usadas: ${categoryCache.size}`);
    console.log(`  Brands      creadas/usadas: ${brandCache.size}`);
    console.log(`  Elements    creados/usados: ${elementCache.size}`);
  }
  console.log(DRY_RUN ? '\nDRY-RUN completado (no se escribió en BD).' : '\nImportación completada.');
}

main().catch((err) => {
  console.error('\nError en import:', err?.message || err);
  process.exit(1);
});
