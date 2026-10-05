// Writes public/team.json from the database, for static hosting (GitHub Pages)
// where there is no server to answer /api/team.
const fs = require('fs');
const path = require('path');
const { db } = require('../db');

const rows = db
  .prepare(
    `SELECT id, name, role_en, role_es, email, phone, bio_en, bio_es, photo
     FROM team_members WHERE active = 1 ORDER BY sort_order, id`
  )
  .all()
  // Uploaded photos live on the server, not in the repo
  .map((m) => ({ ...m, photo: m.photo && m.photo.startsWith('/uploads/') ? null : m.photo }));

const out = path.join(__dirname, '..', 'public', 'team.json');
fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
console.log(`Wrote ${rows.length} team members to ${out}`);
