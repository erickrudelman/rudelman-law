const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'rudelman.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS team_members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    role_en     TEXT NOT NULL,
    role_es     TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    bio_en      TEXT,
    bio_es      TEXT,
    photo       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    area        TEXT,
    language    TEXT,
    message     TEXT NOT NULL,
    ip          TEXT,
    is_read     INTEGER NOT NULL DEFAULT 0,
    emailed     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Initial team, in display order (updated October 2026).
const ROLES = {
  notaryM:   ['Attorney and Public Notary', 'Abogado y Notario Público'],
  notaryF:   ['Attorney and Public Notary', 'Abogada y Notaria Pública'],
  attorneyM: ['Attorney', 'Abogado'],
  attorneyF: ['Attorney', 'Abogada'],
  paralegal: ['Paralegal', 'Asistente Legal'],
  paralegalAdmin: ['Paralegal and Administrative Assistant', 'Asistente Legal y Administrativo'],
};
const SEED_TEAM = [
  ['Melvin Rudelman Wohlstein',   'notaryM',        'melvinr@rudelmanlaw.com'],
  ['Kattia Barrientos Ureña',     'notaryF',        'kattiab@rudelmanlaw.com'],
  ['Roberto Ruffin Murillo',      'notaryM',        'robertoru@rudelmanlaw.com'],
  ['Jennifer Hernández González', 'notaryF',        null],
  ['Gunnar Núñez Svanholm',       'notaryM',        null],
  ['Ericka Redondo Sáenz',        'notaryF',        null],
  ['Rodolfo Hernández Duranti',   'attorneyM',      null],
  ['Rona Meltzer Stemberg',       'attorneyF',      'ronam@rudelmanlaw.com'],
  ['Carolina Bolaños Herrera',    'paralegal',      null],
  ['Ariana Flores Ortiz',         'paralegal',      null],
  ['Gloriana Elizondo Mata',      'paralegal',      'glorianae@rudelmanlaw.com'],
  ['Emilia Rivas León',           'paralegal',      'recepcion@rudelmanlaw.com'],
  ['Carlos Solis Azofeifa',       'paralegalAdmin', 'recepcion@rudelmanlaw.com'],
];

if (db.prepare('SELECT COUNT(*) AS n FROM team_members').get().n === 0) {
  const insert = db.prepare(
    'INSERT INTO team_members (name, role_en, role_es, email, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    SEED_TEAM.forEach(([name, role, email], i) => {
      insert.run(name, ROLES[role][0], ROLES[role][1], email, (i + 1) * 10);
    });
  })();
}

module.exports = { db, DATA_DIR };
