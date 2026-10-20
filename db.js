// Data store with two backends and the same async API:
//  - Postgres (Neon) when DATABASE_URL / POSTGRES_URL is set — used on Vercel
//  - SQLite file in DATA_DIR otherwise — used locally / on a server with a disk
const path = require('path');
const fs = require('fs');

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
].map(([name, role, email], i) => ({ name, role_en: ROLES[role][0], role_es: ROLES[role][1], email, sort_order: (i + 1) * 10 }));

const TEAM_FIELDS = ['name', 'role_en', 'role_es', 'email', 'phone', 'bio_en', 'bio_es', 'photo', 'sort_order', 'active'];
const PUBLIC_COLS = 'id, name, role_en, role_es, email, phone, bio_en, bio_es, photo';
const MESSAGE_FIELDS = ['name', 'email', 'phone', 'area', 'language', 'message', 'ip'];

const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// ---------- SQLite ----------
function sqliteBackend() {
  const Database = require('better-sqlite3');
  const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, 'rudelman.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role_en TEXT NOT NULL, role_es TEXT NOT NULL,
      email TEXT, phone TEXT, bio_en TEXT, bio_es TEXT, photo TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, area TEXT,
      language TEXT, message TEXT NOT NULL, ip TEXT, is_read INTEGER NOT NULL DEFAULT 0,
      emailed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `);
  if (db.prepare('SELECT COUNT(*) AS n FROM team_members').get().n === 0) {
    const insert = db.prepare('INSERT INTO team_members (name, role_en, role_es, email, sort_order) VALUES (@name, @role_en, @role_es, @email, @sort_order)');
    db.transaction(() => SEED_TEAM.forEach((m) => insert.run(m)))();
  }
  const pick = (m, fields) => Object.fromEntries(fields.map((f) => [f, m[f] ?? null]));
  return {
    uploadsDir: path.join(DATA_DIR, 'uploads'),
    publicTeam: async () => db.prepare(`SELECT ${PUBLIC_COLS} FROM team_members WHERE active = 1 ORDER BY sort_order, id`).all(),
    allTeam: async () => db.prepare('SELECT * FROM team_members ORDER BY sort_order, id').all(),
    getMember: async (id) => db.prepare('SELECT * FROM team_members WHERE id = ?').get(id),
    maxSort: async () => db.prepare('SELECT MAX(sort_order) AS s FROM team_members').get().s || 0,
    createMember: async (m) => {
      const { lastInsertRowid } = db.prepare(`INSERT INTO team_members (${TEAM_FIELDS}) VALUES (${TEAM_FIELDS.map((f) => '@' + f)})`).run(pick(m, TEAM_FIELDS));
      return db.prepare('SELECT * FROM team_members WHERE id = ?').get(lastInsertRowid);
    },
    updateMember: async (id, m) => {
      db.prepare(`UPDATE team_members SET ${TEAM_FIELDS.map((f) => `${f} = @${f}`)} WHERE id = @id`).run({ ...pick(m, TEAM_FIELDS), id });
      return db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    },
    deleteMember: async (id) => { db.prepare('DELETE FROM team_members WHERE id = ?').run(id); },
    createMessage: async (m) => Number(db.prepare(`INSERT INTO messages (${MESSAGE_FIELDS}) VALUES (${MESSAGE_FIELDS.map((f) => '@' + f)})`).run(pick(m, MESSAGE_FIELDS)).lastInsertRowid),
    markEmailed: async (id) => { db.prepare('UPDATE messages SET emailed = 1 WHERE id = ?').run(id); },
    listMessages: async () => db.prepare('SELECT * FROM messages ORDER BY created_at DESC, id DESC').all(),
    setRead: async (id, read) => { db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(read ? 1 : 0, id); },
    deleteMessage: async (id) => { db.prepare('DELETE FROM messages WHERE id = ?').run(id); },
  };
}

// ---------- Postgres (Neon serverless driver, HTTP) ----------
function postgresBackend() {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(PG_URL);
  const q = async (text, params = []) => sql.query(text, params);
  const CREATED = `to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS created_at`;
  const TEAM_SELECT = `id, ${TEAM_FIELDS.join(', ')}, ${CREATED}`;

  let ready;
  const init = () => (ready ||= (async () => {
    await q(`CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, role_en TEXT NOT NULL, role_es TEXT NOT NULL,
      email TEXT, phone TEXT, bio_en TEXT, bio_es TEXT, photo TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, area TEXT,
      language TEXT, message TEXT NOT NULL, ip TEXT, is_read INTEGER NOT NULL DEFAULT 0,
      emailed INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    // Seed once, guarded by an advisory lock so concurrent cold starts don't double-insert
    await q(`DO $$ BEGIN
      PERFORM pg_advisory_xact_lock(4242);
      IF NOT EXISTS (SELECT 1 FROM team_members) THEN
        INSERT INTO team_members (name, role_en, role_es, email, sort_order)
        SELECT * FROM json_to_recordset('${JSON.stringify(SEED_TEAM).replace(/'/g, "''")}')
          AS t(name TEXT, role_en TEXT, role_es TEXT, email TEXT, sort_order INTEGER);
      END IF;
    END $$`);
  })().catch((e) => { ready = null; throw e; }));

  const values = (m, fields) => fields.map((f) => m[f] ?? null);
  const placeholders = (n, start = 1) => Array.from({ length: n }, (_, i) => `$${i + start}`).join(', ');
  const withInit = (fn) => async (...args) => { await init(); return fn(...args); };

  return {
    uploadsDir: null,
    publicTeam: withInit(async () => q(`SELECT ${PUBLIC_COLS} FROM team_members WHERE active = 1 ORDER BY sort_order, id`)),
    allTeam: withInit(async () => q(`SELECT ${TEAM_SELECT} FROM team_members ORDER BY sort_order, id`)),
    getMember: withInit(async (id) => (await q(`SELECT ${TEAM_SELECT} FROM team_members WHERE id = $1`, [id]))[0]),
    maxSort: withInit(async () => (await q('SELECT COALESCE(MAX(sort_order), 0) AS s FROM team_members'))[0].s),
    createMember: withInit(async (m) => (await q(
      `INSERT INTO team_members (${TEAM_FIELDS}) VALUES (${placeholders(TEAM_FIELDS.length)}) RETURNING ${TEAM_SELECT}`,
      values(m, TEAM_FIELDS)))[0]),
    updateMember: withInit(async (id, m) => (await q(
      `UPDATE team_members SET ${TEAM_FIELDS.map((f, i) => `${f} = $${i + 1}`)} WHERE id = $${TEAM_FIELDS.length + 1} RETURNING ${TEAM_SELECT}`,
      [...values(m, TEAM_FIELDS), id]))[0]),
    deleteMember: withInit(async (id) => { await q('DELETE FROM team_members WHERE id = $1', [id]); }),
    createMessage: withInit(async (m) => (await q(
      `INSERT INTO messages (${MESSAGE_FIELDS}) VALUES (${placeholders(MESSAGE_FIELDS.length)}) RETURNING id`,
      values(m, MESSAGE_FIELDS)))[0].id),
    markEmailed: withInit(async (id) => { await q('UPDATE messages SET emailed = 1 WHERE id = $1', [id]); }),
    listMessages: withInit(async () => q(`SELECT id, ${MESSAGE_FIELDS.join(', ')}, is_read, emailed, ${CREATED} FROM messages ORDER BY messages.created_at DESC, id DESC`)),
    setRead: withInit(async (id, read) => { await q('UPDATE messages SET is_read = $1 WHERE id = $2', [read ? 1 : 0, id]); }),
    deleteMessage: withInit(async (id) => { await q('DELETE FROM messages WHERE id = $1', [id]); }),
  };
}

const store = PG_URL ? postgresBackend() : sqliteBackend();
store.kind = PG_URL ? 'postgres' : 'sqlite';
module.exports = store;
