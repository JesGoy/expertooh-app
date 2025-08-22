#!/usr/bin/env node
/* Inspect an Excel file: sheets, headers, and sample rows */
const xlsx = require('xlsx');

function main() {
  const [, , fileArg, rowsArg] = process.argv;
  if (!fileArg) {
    console.error('Usage: node scripts/inspect-excel.js <path-to-xlsx> [rows]');
    process.exit(1);
  }
  const rowsToShow = Math.max(1, Math.min(50, Number(rowsArg) || 10));
  const wb = xlsx.readFile(fileArg, { cellDates: true });
  console.log('Sheets:', wb.SheetNames);
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const json = xlsx.utils.sheet_to_json(ws, { defval: null });
    console.log(`\n=== Sheet: ${name} (rows: ${json.length}) ===`);
    if (!json.length) continue;
    console.log('Headers:', Object.keys(json[0] || {}));
    for (const row of json.slice(0, rowsToShow)) console.log(row);
  }
}

main();
