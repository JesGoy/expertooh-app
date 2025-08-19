#!/usr/bin/env node
// Simple bcryptjs hasher for quick manual password hashing.
// Usage:
//   npm run hash -- <password> [rounds]
// Example:
//   npm run hash -- 123456 10

const bcrypt = require('bcryptjs');

async function main() {
  const [, , password, roundsArg] = process.argv;
  if (!password) {
    console.error('Usage: npm run hash -- <password> [rounds]');
    process.exit(1);
  }
  const rounds = Number(roundsArg) || 10;
  if (!Number.isFinite(rounds) || rounds < 4 || rounds > 15) {
    console.error('Rounds must be a number between 4 and 15.');
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, rounds);
    console.log(hash);
  } catch (err) {
    console.error('Error hashing password:', err?.message || err);
    process.exit(2);
  }
}

main();
