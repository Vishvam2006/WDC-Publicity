const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Database helper ───
// Neon serverless: each call creates a fresh connection from the pool
function getSQL() {
  return neon(process.env.DATABASE_URL);
}

// ─── Auto-migrate on first request ───
let migrated = false;
async function ensureTables() {
  if (migrated) return;
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT,
      code TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS batches (
      id SERIAL PRIMARY KEY,
      department_id INTEGER,
      name TEXT,
      academic_year TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS divisions (
      id SERIAL PRIMARY KEY,
      batch_id INTEGER,
      name TEXT,
      display_name TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS timetables (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER,
      name TEXT,
      type TEXT,
      department_id INTEGER,
      batch_id INTEGER,
      division_id INTEGER,
      academic_year TEXT,
      semester TEXT,
      effective_from TEXT,
      effective_to TEXT,
      version INTEGER,
      status TEXT,
      source_filename TEXT,
      source_format TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id SERIAL PRIMARY KEY,
      timetable_id INTEGER,
      day_of_week TEXT,
      specific_date TEXT,
      start_time TEXT,
      end_time TEXT,
      start_minutes INTEGER,
      end_minutes INTEGER,
      subject TEXT,
      subject_code TEXT,
      teacher TEXT,
      room TEXT,
      activity_type TEXT,
      notes TEXT,
      source_row_number INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS time_slots (
      id SERIAL PRIMARY KEY,
      name TEXT,
      day_of_week TEXT,
      start_time TEXT,
      end_time TEXT,
      slot_type TEXT,
      sort_order INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS tracked_activities (
      id SERIAL PRIMARY KEY,
      master_timetable_id INTEGER,
      source_timetable_id INTEGER,
      source_entry_id INTEGER,
      activity_date TEXT,
      status TEXT,
      priority INTEGER,
      notes TEXT,
      completed_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )`;
  migrated = true;
}

// Middleware: ensure tables exist before handling any request
app.use(async (req, res, next) => {
  try {
    await ensureTables();
    next();
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// ─── Dashboard Stats ───
app.get('/api/stats', async (req, res) => {
  try {
    const sql = getSQL();
    const [mc] = await sql`SELECT COUNT(*)::int as count FROM timetable_entries WHERE timetable_id = 1`;
    const [pg] = await sql`SELECT COUNT(*)::int as count FROM timetables WHERE type = 'public'`;
    const [tp] = await sql`SELECT COUNT(*)::int as count FROM tracked_activities WHERE status = 'Planned'`;
    const [tc] = await sql`SELECT COUNT(*)::int as count FROM tracked_activities WHERE status = 'Completed'`;
    res.json({
      masterClasses: mc.count,
      publicGroups: pg.count,
      trackedPending: tp.count,
      trackedCompleted: tc.count
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Timetables ───
app.get('/api/timetables', async (req, res) => {
  try {
    const sql = getSQL();
    const { type } = req.query;
    const rows = type
      ? await sql`SELECT * FROM timetables WHERE type = ${type}`
      : await sql`SELECT * FROM timetables`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/timetables/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT * FROM timetables WHERE id = ${req.params.id}`;
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/timetables', async (req, res) => {
  try {
    const sql = getSQL();
    const t = req.body;
    if (t.id) {
      // Upsert: delete then insert to simulate INSERT OR REPLACE
      await sql`DELETE FROM timetables WHERE id = ${t.id}`;
      await sql`INSERT INTO timetables (id, owner_id, name, type, department_id, batch_id, division_id, academic_year, semester, effective_from, effective_to, version, status, source_filename, source_format, created_at, updated_at)
        VALUES (${t.id}, ${t.owner_id}, ${t.name}, ${t.type}, ${t.department_id || null}, ${t.batch_id || null}, ${t.division_id || null}, ${t.academic_year}, ${t.semester}, ${t.effective_from}, ${t.effective_to}, ${t.version}, ${t.status}, ${t.source_filename || null}, ${t.source_format || null}, ${t.created_at}, ${t.updated_at})`;
      res.json({ id: t.id });
    } else {
      const [row] = await sql`INSERT INTO timetables (owner_id, name, type, department_id, batch_id, division_id, academic_year, semester, effective_from, effective_to, version, status, source_filename, source_format, created_at, updated_at)
        VALUES (${t.owner_id}, ${t.name}, ${t.type}, ${t.department_id || null}, ${t.batch_id || null}, ${t.division_id || null}, ${t.academic_year}, ${t.semester}, ${t.effective_from}, ${t.effective_to}, ${t.version}, ${t.status}, ${t.source_filename || null}, ${t.source_format || null}, ${t.created_at}, ${t.updated_at})
        RETURNING id`;
      res.json({ id: row.id });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Timetable Entries ───
app.get('/api/timetable_entries', async (req, res) => {
  try {
    const sql = getSQL();
    const { timetable_id } = req.query;
    if (timetable_id) {
      if (timetable_id.includes(',')) {
        const ids = timetable_id.split(',').map(Number);
        const rows = await sql`SELECT * FROM timetable_entries WHERE timetable_id = ANY(${ids})`;
        res.json(rows);
      } else {
        const rows = await sql`SELECT * FROM timetable_entries WHERE timetable_id = ${timetable_id}`;
        res.json(rows);
      }
    } else {
      const rows = await sql`SELECT * FROM timetable_entries`;
      res.json(rows);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/timetable_entries/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT * FROM timetable_entries WHERE id = ${req.params.id}`;
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/timetable_entries/bulk', async (req, res) => {
  try {
    const sql = getSQL();
    const entries = req.body;
    for (const e of entries) {
      await sql`INSERT INTO timetable_entries (timetable_id, day_of_week, specific_date, start_time, end_time, start_minutes, end_minutes, subject, subject_code, teacher, room, activity_type, notes, source_row_number, created_at, updated_at)
        VALUES (${e.timetable_id}, ${e.day_of_week || null}, ${e.specific_date || null}, ${e.start_time}, ${e.end_time}, ${e.start_minutes}, ${e.end_minutes}, ${e.subject}, ${e.subject_code || null}, ${e.teacher || null}, ${e.room || null}, ${e.activity_type || null}, ${e.notes || null}, ${e.source_row_number || null}, ${e.created_at}, ${e.updated_at})`;
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/timetable_entries', async (req, res) => {
  try {
    const sql = getSQL();
    const { timetable_id } = req.query;
    if (timetable_id) {
      await sql`DELETE FROM timetable_entries WHERE timetable_id = ${timetable_id}`;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'timetable_id required' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Tracked Activities ───
app.get('/api/tracked_activities', async (req, res) => {
  try {
    const sql = getSQL();
    const rows = await sql`SELECT * FROM tracked_activities`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tracked_activities', async (req, res) => {
  try {
    const sql = getSQL();
    const a = req.body;
    const [row] = await sql`INSERT INTO tracked_activities (master_timetable_id, source_timetable_id, source_entry_id, activity_date, status, priority, notes, completed_at, created_at, updated_at)
      VALUES (${a.master_timetable_id}, ${a.source_timetable_id}, ${a.source_entry_id}, ${a.activity_date}, ${a.status}, ${a.priority || null}, ${a.notes || null}, ${a.completed_at || null}, ${a.created_at}, ${a.updated_at})
      RETURNING id`;
    res.json({ id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tracked_activities/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const { status, completed_at, notes, priority } = req.body;
    // Build dynamic update — for simplicity, update all provided fields
    if (status !== undefined) {
      await sql`UPDATE tracked_activities SET status = ${status}, completed_at = ${completed_at || null} WHERE id = ${req.params.id}`;
    }
    if (notes !== undefined) {
      await sql`UPDATE tracked_activities SET notes = ${notes} WHERE id = ${req.params.id}`;
    }
    if (priority !== undefined) {
      await sql`UPDATE tracked_activities SET priority = ${priority} WHERE id = ${req.params.id}`;
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tracked_activities/:id', async (req, res) => {
  try {
    const sql = getSQL();
    await sql`DELETE FROM tracked_activities WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Departments ───
app.get('/api/departments', async (req, res) => {
  try {
    const sql = getSQL();
    const { name } = req.query;
    const rows = name
      ? await sql`SELECT * FROM departments WHERE name = ${name}`
      : await sql`SELECT * FROM departments`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/departments/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT * FROM departments WHERE id = ${req.params.id}`;
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/departments', async (req, res) => {
  try {
    const sql = getSQL();
    const { name, code, created_at, updated_at } = req.body;
    const [row] = await sql`INSERT INTO departments (name, code, created_at, updated_at) VALUES (${name}, ${code}, ${created_at}, ${updated_at}) RETURNING id`;
    res.json({ id: row.id, name, code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Batches ───
app.get('/api/batches', async (req, res) => {
  try {
    const sql = getSQL();
    const { department_id, name } = req.query;
    let rows;
    if (department_id && name) {
      rows = await sql`SELECT * FROM batches WHERE department_id = ${department_id} AND name = ${name}`;
    } else if (department_id) {
      rows = await sql`SELECT * FROM batches WHERE department_id = ${department_id}`;
    } else {
      rows = await sql`SELECT * FROM batches`;
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/batches/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT * FROM batches WHERE id = ${req.params.id}`;
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/batches', async (req, res) => {
  try {
    const sql = getSQL();
    const { department_id, name, academic_year, created_at, updated_at } = req.body;
    const [row] = await sql`INSERT INTO batches (department_id, name, academic_year, created_at, updated_at) VALUES (${department_id}, ${name}, ${academic_year}, ${created_at}, ${updated_at}) RETURNING id`;
    res.json({ id: row.id, department_id, name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Divisions ───
app.get('/api/divisions', async (req, res) => {
  try {
    const sql = getSQL();
    const { batch_id, name } = req.query;
    let rows;
    if (batch_id && name) {
      rows = await sql`SELECT * FROM divisions WHERE batch_id = ${batch_id} AND name = ${name}`;
    } else if (batch_id) {
      rows = await sql`SELECT * FROM divisions WHERE batch_id = ${batch_id}`;
    } else {
      rows = await sql`SELECT * FROM divisions`;
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/divisions/:id', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT * FROM divisions WHERE id = ${req.params.id}`;
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/divisions', async (req, res) => {
  try {
    const sql = getSQL();
    const { batch_id, name, display_name, created_at, updated_at } = req.body;
    const [row] = await sql`INSERT INTO divisions (batch_id, name, display_name, created_at, updated_at) VALUES (${batch_id}, ${name}, ${display_name}, ${created_at}, ${updated_at}) RETURNING id`;
    res.json({ id: row.id, batch_id, name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Users (for seed compatibility) ───
app.get('/api/users/count', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT COUNT(*)::int as count FROM users`;
    res.json(row.count);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const sql = getSQL();
    const { name, email, created_at, updated_at } = req.body;
    const [row] = await sql`INSERT INTO users (name, email, created_at, updated_at) VALUES (${name}, ${email}, ${created_at}, ${updated_at}) RETURNING id`;
    res.json({ id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Time Slots ───
app.get('/api/time_slots/count', async (req, res) => {
  try {
    const sql = getSQL();
    const [row] = await sql`SELECT COUNT(*)::int as count FROM time_slots`;
    res.json(row.count);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/time_slots/bulk', async (req, res) => {
  try {
    const sql = getSQL();
    for (const s of req.body) {
      await sql`INSERT INTO time_slots (name, slot_type, sort_order, start_time, end_time, created_at, updated_at) VALUES (${s.name}, ${s.slot_type}, ${s.sort_order}, ${s.start_time}, ${s.end_time}, ${s.created_at}, ${s.updated_at})`;
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
