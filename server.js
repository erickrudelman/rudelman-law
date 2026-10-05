require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { db, DATA_DIR } = require('./db');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const NOTIFY_TO = process.env.NOTIFY_TO || 'recepcion@rudelmanlaw.com';
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!ADMIN_PASSWORD) {
  console.warn('⚠  ADMIN_PASSWORD is not set — the admin panel is disabled until you set it in .env');
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ---------- Email ----------
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const MAIL_FROM =
  process.env.SMTP_FROM ||
  `"Rudelman Law Website" <${(process.env.SMTP_USER || '').includes('@') ? process.env.SMTP_USER : 'web@rudelmanlaw.com'}>`;

if (!mailer) {
  console.warn('⚠  SMTP is not configured — contact messages are saved to the database only (see /admin)');
}

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function notifyNewMessage(m) {
  if (!mailer) return false;
  const rows = [
    ['Nombre / Name', m.name],
    ['Email', m.email],
    ['Teléfono / Phone', m.phone || '—'],
    ['Área / Practice area', m.area || '—'],
    ['Idioma / Language', m.language || '—'],
  ];
  await mailer.sendMail({
    from: MAIL_FROM,
    to: NOTIFY_TO,
    replyTo: `"${m.name.replace(/"/g, '')}" <${m.email}>`,
    subject: `Nuevo mensaje web — ${m.name}${m.area ? ` (${m.area})` : ''}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${m.message}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;color:#172457">
        <h2 style="font-weight:normal;border-bottom:1px solid #C9BBA6;padding-bottom:8px">Nuevo mensaje desde rudelmanlaw.com</h2>
        <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
          ${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#777">${k}</td><td>${escapeHtml(v)}</td></tr>`).join('')}
        </table>
        <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap;background:#FFF8F1;padding:16px;border-left:3px solid #C9BBA6">${escapeHtml(m.message)}</p>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#999">Responda directamente a este correo para contestarle al cliente.</p>
      </div>`,
  });
  return true;
}

// ---------- Public API ----------
app.get('/api/team', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, role_en, role_es, email, phone, bio_en, bio_es, photo
       FROM team_members WHERE active = 1 ORDER BY sort_order, id`
    )
    .all();
  res.json(rows);
});

// Simple per-IP throttle: max 5 messages / 10 min
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

app.post('/api/contact', async (req, res) => {
  const body = req.body || {};
  // Honeypot: real visitors never fill the hidden "website" field
  if (body.website) return res.json({ ok: true });

  const m = {
    name: clip(body.name, 120),
    email: clip(body.email, 200),
    phone: clip(body.phone, 40),
    area: clip(body.area, 80),
    language: clip(body.language, 10),
    message: clip(body.message, 5000),
  };
  if (!m.name || !EMAIL_RE.test(m.email) || m.message.length < 5) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }
  if (throttled(req.ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO messages (name, email, phone, area, language, message, ip)
       VALUES (@name, @email, @phone, @area, @language, @message, @ip)`
    )
    .run({ ...m, ip: req.ip });

  try {
    if (await notifyNewMessage(m)) {
      db.prepare('UPDATE messages SET emailed = 1 WHERE id = ?').run(lastInsertRowid);
    }
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
  res.json({ ok: true });
});

// ---------- Admin auth ----------
const sign = (v) => crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('hex');

function makeToken() {
  const exp = Date.now() + 12 * 60 * 60 * 1000; // 12 h
  return `${exp}.${sign(String(exp))}`;
}

function validToken(token) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function readCookie(req, name) {
  const match = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function requireAdmin(req, res, next) {
  if (ADMIN_PASSWORD && validToken(readCookie(req, 'rl_admin'))) return next();
  res.status(401).json({ error: 'unauthorized' });
}

const loginAttempts = new Map();
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'admin_disabled' });
  const now = Date.now();
  const recent = (loginAttempts.get(req.ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (recent.length >= 10) return res.status(429).json({ error: 'too_many_attempts' });

  const given = Buffer.from(String(req.body?.password || ''));
  const real = Buffer.from(ADMIN_PASSWORD);
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) {
    recent.push(now);
    loginAttempts.set(req.ip, recent);
    return res.status(401).json({ error: 'wrong_password' });
  }
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `rl_admin=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'rl_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ ok: true, emailConfigured: Boolean(mailer), notifyTo: NOTIFY_TO });
});

// ---------- Admin: team ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
      cb(null, `team-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

function removePhoto(photo) {
  if (photo && photo.startsWith('/uploads/')) {
    fs.rm(path.join(UPLOAD_DIR, path.basename(photo)), { force: true }, () => {});
  }
}

function memberFromBody(b) {
  return {
    name: clip(b.name, 120),
    role_en: clip(b.role_en, 120),
    role_es: clip(b.role_es, 120) || clip(b.role_en, 120),
    email: clip(b.email, 200) || null,
    phone: clip(b.phone, 40) || null,
    bio_en: clip(b.bio_en, 2000) || null,
    bio_es: clip(b.bio_es, 2000) || null,
    sort_order: Number.parseInt(b.sort_order, 10) || 0,
    active: b.active === '0' || b.active === false ? 0 : 1,
  };
}

app.get('/api/admin/team', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM team_members ORDER BY sort_order, id').all());
});

app.post('/api/admin/team', requireAdmin, upload.single('photo'), (req, res) => {
  const m = memberFromBody(req.body);
  if (!m.name || !m.role_en) return res.status(400).json({ error: 'name_and_role_required' });
  if (!m.sort_order) m.sort_order = (db.prepare('SELECT MAX(sort_order) AS s FROM team_members').get().s || 0) + 10;
  m.photo = req.file ? `/uploads/${req.file.filename}` : null;
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO team_members (name, role_en, role_es, email, phone, bio_en, bio_es, photo, sort_order, active)
       VALUES (@name, @role_en, @role_es, @email, @phone, @bio_en, @bio_es, @photo, @sort_order, @active)`
    )
    .run(m);
  res.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(lastInsertRowid));
});

app.put('/api/admin/team/:id', requireAdmin, upload.single('photo'), (req, res) => {
  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const m = memberFromBody(req.body);
  if (!m.name || !m.role_en) return res.status(400).json({ error: 'name_and_role_required' });

  m.photo = existing.photo;
  if (req.file) {
    removePhoto(existing.photo);
    m.photo = `/uploads/${req.file.filename}`;
  } else if (req.body.remove_photo === '1') {
    removePhoto(existing.photo);
    m.photo = null;
  }
  db.prepare(
    `UPDATE team_members SET name=@name, role_en=@role_en, role_es=@role_es, email=@email, phone=@phone,
       bio_en=@bio_en, bio_es=@bio_es, photo=@photo, sort_order=@sort_order, active=@active WHERE id=@id`
  ).run({ ...m, id: existing.id });
  res.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(existing.id));
});

app.delete('/api/admin/team/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM team_members WHERE id = ?').run(existing.id);
  removePhoto(existing.photo);
  res.json({ ok: true });
});

// ---------- Admin: messages ----------
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC, id DESC').all());
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(req.body?.is_read ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code || 'server_error' });
});

app.listen(PORT, () => {
  console.log(`Rudelman Law running at http://localhost:${PORT}  (admin: /admin)`);
});
