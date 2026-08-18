const express = require('express');
const router = express.Router();

// Helper for db
const getDb = (req) => req.db;

// -- Users --
router.get('/users/count', async (req, res) => {
  const result = await getDb(req).get('SELECT COUNT(*) as count FROM users');
  res.json(result.count);
});

router.post('/users', async (req, res) => {
  const { name, email, created_at, updated_at } = req.body;
  const result = await getDb(req).run(
    'INSERT INTO users (name, email, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [name, email, created_at, updated_at]
  );
  res.json({ id: result.lastID });
});

// -- Time Slots --
router.get('/time_slots/count', async (req, res) => {
  const result = await getDb(req).get('SELECT COUNT(*) as count FROM time_slots');
  res.json(result.count);
});

router.post('/time_slots/bulk', async (req, res) => {
  const slots = req.body;
  const db = getDb(req);
  for (const s of slots) {
    await db.run(
      'INSERT INTO time_slots (name, slot_type, sort_order, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.name, s.slot_type, s.sort_order, s.start_time, s.end_time, s.created_at, s.updated_at]
    );
  }
  res.json({ success: true });
});

// -- Dashboard Stats --
router.get('/stats', async (req, res) => {
  const db = getDb(req);
  const masterClasses = await db.get('SELECT COUNT(*) as count FROM timetable_entries WHERE timetable_id = 1');
  const publicGroups = await db.get('SELECT COUNT(*) as count FROM timetables WHERE type = "public"');
  const trackedPending = await db.get('SELECT COUNT(*) as count FROM tracked_activities WHERE status = "Planned"');
  const trackedCompleted = await db.get('SELECT COUNT(*) as count FROM tracked_activities WHERE status = "Completed"');
  
  res.json({
    masterClasses: masterClasses.count,
    publicGroups: publicGroups.count,
    trackedPending: trackedPending.count,
    trackedCompleted: trackedCompleted.count
  });
});

// -- Timetables --
router.get('/timetables', async (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM timetables';
  let params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  const result = await getDb(req).all(query, params);
  res.json(result);
});

router.get('/timetables/:id', async (req, res) => {
  const result = await getDb(req).get('SELECT * FROM timetables WHERE id = ?', req.params.id);
  res.json(result);
});

router.post('/timetables', async (req, res) => {
  const t = req.body;
  const db = getDb(req);
  
  if (t.id) {
    // Put (update or insert with id)
    await db.run(
      `INSERT OR REPLACE INTO timetables (id, owner_id, name, type, department_id, batch_id, division_id, academic_year, semester, effective_from, effective_to, version, status, source_filename, source_format, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.owner_id, t.name, t.type, t.department_id, t.batch_id, t.division_id, t.academic_year, t.semester, t.effective_from, t.effective_to, t.version, t.status, t.source_filename, t.source_format, t.created_at, t.updated_at]
    );
    res.json({ id: t.id });
  } else {
    const result = await db.run(
      `INSERT INTO timetables (owner_id, name, type, department_id, batch_id, division_id, academic_year, semester, effective_from, effective_to, version, status, source_filename, source_format, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.owner_id, t.name, t.type, t.department_id, t.batch_id, t.division_id, t.academic_year, t.semester, t.effective_from, t.effective_to, t.version, t.status, t.source_filename, t.source_format, t.created_at, t.updated_at]
    );
    res.json({ id: result.lastID });
  }
});

// -- Timetable Entries --
router.get('/timetable_entries', async (req, res) => {
  const { timetable_id } = req.query;
  const db = getDb(req);
  let result;
  
  if (timetable_id) {
    if (timetable_id.includes(',')) {
      const ids = timetable_id.split(',').map(id => parseInt(id, 10));
      const placeholders = ids.map(() => '?').join(',');
      result = await db.all(`SELECT * FROM timetable_entries WHERE timetable_id IN (${placeholders})`, ids);
    } else {
      result = await db.all('SELECT * FROM timetable_entries WHERE timetable_id = ?', timetable_id);
    }
  } else {
    result = await db.all('SELECT * FROM timetable_entries');
  }
  res.json(result);
});

router.get('/timetable_entries/:id', async (req, res) => {
  const result = await getDb(req).get('SELECT * FROM timetable_entries WHERE id = ?', req.params.id);
  res.json(result);
});

router.post('/timetable_entries/bulk', async (req, res) => {
  const entries = req.body;
  const db = getDb(req);
  for (const e of entries) {
    await db.run(
      `INSERT INTO timetable_entries (timetable_id, day_of_week, specific_date, start_time, end_time, start_minutes, end_minutes, subject, subject_code, teacher, room, activity_type, notes, source_row_number, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.timetable_id, e.day_of_week, e.specific_date, e.start_time, e.end_time, e.start_minutes, e.end_minutes, e.subject, e.subject_code, e.teacher, e.room, e.activity_type, e.notes, e.source_row_number, e.created_at, e.updated_at]
    );
  }
  res.json({ success: true });
});

router.delete('/timetable_entries', async (req, res) => {
  const { timetable_id } = req.query;
  if (timetable_id) {
    await getDb(req).run('DELETE FROM timetable_entries WHERE timetable_id = ?', timetable_id);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'timetable_id required' });
  }
});

// -- Tracked Activities --
router.get('/tracked_activities', async (req, res) => {
  const result = await getDb(req).all('SELECT * FROM tracked_activities');
  res.json(result);
});

router.post('/tracked_activities', async (req, res) => {
  const a = req.body;
  const result = await getDb(req).run(
    `INSERT INTO tracked_activities (master_timetable_id, source_timetable_id, source_entry_id, activity_date, status, priority, notes, completed_at, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.master_timetable_id, a.source_timetable_id, a.source_entry_id, a.activity_date, a.status, a.priority, a.notes, a.completed_at, a.created_at, a.updated_at]
  );
  res.json({ id: result.lastID });
});

router.put('/tracked_activities/:id', async (req, res) => {
  const { status, completed_at, notes, priority } = req.body;
  const updates = [];
  const params = [];
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (completed_at !== undefined) { updates.push('completed_at = ?'); params.push(completed_at); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  
  if (updates.length > 0) {
    params.push(req.params.id);
    await getDb(req).run(`UPDATE tracked_activities SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  res.json({ success: true });
});

router.delete('/tracked_activities/:id', async (req, res) => {
  await getDb(req).run('DELETE FROM tracked_activities WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// -- Departments / Batches / Divisions --
router.get('/departments', async (req, res) => {
  const { name } = req.query;
  let query = 'SELECT * FROM departments';
  let params = [];
  if (name) {
    query += ' WHERE name = ?';
    params.push(name);
  }
  const result = await getDb(req).all(query, params);
  res.json(result);
});

router.post('/departments', async (req, res) => {
  const { name, code, created_at, updated_at } = req.body;
  const result = await getDb(req).run('INSERT INTO departments (name, code, created_at, updated_at) VALUES (?, ?, ?, ?)', [name, code, created_at, updated_at]);
  res.json({ id: result.lastID, name, code });
});

router.get('/departments/:id', async (req, res) => {
  const result = await getDb(req).get('SELECT * FROM departments WHERE id = ?', req.params.id);
  res.json(result);
});

router.get('/batches', async (req, res) => {
  const { department_id, name } = req.query;
  let query = 'SELECT * FROM batches WHERE 1=1';
  let params = [];
  if (department_id) { query += ' AND department_id = ?'; params.push(department_id); }
  if (name) { query += ' AND name = ?'; params.push(name); }
  const result = await getDb(req).all(query, params);
  res.json(result);
});

router.post('/batches', async (req, res) => {
  const { department_id, name, academic_year, created_at, updated_at } = req.body;
  const result = await getDb(req).run('INSERT INTO batches (department_id, name, academic_year, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [department_id, name, academic_year, created_at, updated_at]);
  res.json({ id: result.lastID, department_id, name });
});

router.get('/batches/:id', async (req, res) => {
  const result = await getDb(req).get('SELECT * FROM batches WHERE id = ?', req.params.id);
  res.json(result);
});

router.get('/divisions', async (req, res) => {
  const { batch_id, name } = req.query;
  let query = 'SELECT * FROM divisions WHERE 1=1';
  let params = [];
  if (batch_id) { query += ' AND batch_id = ?'; params.push(batch_id); }
  if (name) { query += ' AND name = ?'; params.push(name); }
  const result = await getDb(req).all(query, params);
  res.json(result);
});

router.post('/divisions', async (req, res) => {
  const { batch_id, name, display_name, created_at, updated_at } = req.body;
  const result = await getDb(req).run('INSERT INTO divisions (batch_id, name, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [batch_id, name, display_name, created_at, updated_at]);
  res.json({ id: result.lastID, batch_id, name });
});

router.get('/divisions/:id', async (req, res) => {
  const result = await getDb(req).get('SELECT * FROM divisions WHERE id = ?', req.params.id);
  res.json(result);
});


module.exports = router;
