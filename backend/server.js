const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create tables mirroring the Dexie schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      code TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER,
      name TEXT,
      academic_year TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS divisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER,
      name TEXT,
      display_name TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    );
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    );
    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      day_of_week TEXT,
      start_time TEXT,
      end_time TEXT,
      slot_type TEXT,
      sort_order INTEGER,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS tracked_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    );
  `);
  
  return db;
}

initDB().then(db => {
  console.log('Connected to SQLite database');
  
  // Attach db to req for routes to use
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use('/api', routes);

  // Serve static files from the React frontend app
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../dist')));

  // AFTER defining routes, anything that doesn't match what's above, we send back index.html
  app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
