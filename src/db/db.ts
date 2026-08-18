import Dexie, { type EntityTable } from 'dexie';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: number;
  department_id: number;
  name: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: number;
  batch_id: number;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Timetable {
  id: number;
  owner_id: number;
  name: string;
  type: 'master' | 'public';
  department_id?: number;
  batch_id?: number;
  division_id?: number;
  academic_year: string;
  semester: string;
  effective_from: string;
  effective_to: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  source_filename?: string;
  source_format?: string;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntry {
  id: number;
  timetable_id: number;
  day_of_week?: string; // e.g. "Monday"
  specific_date?: string; // e.g. "YYYY-MM-DD"
  start_time: string; // e.g. "09:00"
  end_time: string; // e.g. "10:00"
  start_minutes: number; // e.g. 540
  end_minutes: number; // e.g. 600
  subject: string;
  subject_code?: string;
  teacher?: string;
  room?: string;
  activity_type?: string;
  notes?: string;
  source_row_number?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: number;
  name: string;
  day_of_week?: string;
  start_time: string;
  end_time: string;
  slot_type: 'class_period' | 'break' | 'free_period' | 'custom';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackedActivity {
  id: number;
  master_timetable_id: number;
  source_timetable_id: number;
  source_entry_id: number;
  activity_date: string; // YYYY-MM-DD
  status: 'Available' | 'Planned' | 'In progress' | 'Completed' | 'Skipped' | 'Not applicable';
  priority?: number;
  notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

const db = new Dexie('TimetableTrackerDB') as Dexie & {
  users: EntityTable<User, 'id'>;
  departments: EntityTable<Department, 'id'>;
  batches: EntityTable<Batch, 'id'>;
  divisions: EntityTable<Division, 'id'>;
  timetables: EntityTable<Timetable, 'id'>;
  timetable_entries: EntityTable<TimetableEntry, 'id'>;
  time_slots: EntityTable<TimeSlot, 'id'>;
  tracked_activities: EntityTable<TrackedActivity, 'id'>;
};

// Schema declaration
db.version(1).stores({
  users: '++id, name, email',
  departments: '++id, name, code',
  batches: '++id, department_id, name, academic_year',
  divisions: '++id, batch_id, name',
  timetables: '++id, owner_id, type, department_id, batch_id, division_id, status',
  timetable_entries: '++id, timetable_id, day_of_week, specific_date, start_minutes, end_minutes',
  time_slots: '++id, slot_type, sort_order',
  tracked_activities: '++id, master_timetable_id, source_timetable_id, source_entry_id, activity_date, status, [master_timetable_id+source_entry_id+activity_date]'
});

export { db };
