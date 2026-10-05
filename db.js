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

// Team as published on rudelmanlaw.com/team (October 2026).
const ROLES = {
  notary:   ['Attorney and Public Notary', 'Abogado(a) y Notario(a) Público(a)'],
  attorney: ['Attorney', 'Abogado(a)'],
  paralegal:['Paralegal', 'Asistente Legal'],
};
const SEED_TEAM = [
  ['Melvin Rudelman W.',     'notary',    'melvinr@rudelmanlaw.com'],
  ['Jennifer Hernández',     'attorney',  null],
  ['Carlos Solis A.',        'paralegal', 'recepcion@rudelmanlaw.com'],
  ['Gloriana Elizondo R.',   'paralegal', 'glorianae@rudelmanlaw.com'],
  ['Kattia Barrientos U.',   'notary',    'kattiab@rudelmanlaw.com'],
  ['Gunnar Núñez Svanholm',  'notary',    null],
  ['Emilia Rivas L.',        'paralegal', 'recepcion@rudelmanlaw.com'],
  ['Ariana Flores',          'paralegal', null],
  ['Roberto Ruffin Murillo', 'attorney',  'robertoru@rudelmanlaw.com'],
  ['Ericka Redondo S',       'notary',    null],
  ['Rona Meltzer S.',        'paralegal', 'ronam@rudelmanlaw.com'],
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
