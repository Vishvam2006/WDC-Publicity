const API_URL = '/api';

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
  id?: number;
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
  id?: number;
  timetable_id: number;
  day_of_week?: string; 
  specific_date?: string; 
  start_time: string; 
  end_time: string; 
  start_minutes: number; 
  end_minutes: number; 
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
  id?: number;
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
  id?: number;
  master_timetable_id: number;
  source_timetable_id: number;
  source_entry_id: number;
  activity_date: string; 
  status: 'Available' | 'Planned' | 'In progress' | 'Completed' | 'Skipped' | 'Not applicable';
  priority?: number;
  notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const api = {
  // Stats
  getStats: async () => {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
  },

  // Users
  getUsersCount: async () => {
    const res = await fetch(`${API_URL}/users/count`);
    return res.json();
  },
  addUser: async (user: Omit<User, 'id'>) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user)
    });
    return res.json();
  },

  // Time Slots
  getTimeSlotsCount: async () => {
    const res = await fetch(`${API_URL}/time_slots/count`);
    return res.json();
  },
  bulkAddTimeSlots: async (slots: TimeSlot[]) => {
    const res = await fetch(`${API_URL}/time_slots/bulk`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slots)
    });
    return res.json();
  },

  // Timetables
  getTimetables: async (type?: string) => {
    const url = type ? `${API_URL}/timetables?type=${type}` : `${API_URL}/timetables`;
    const res = await fetch(url);
    return res.json();
  },
  getTimetable: async (id: number) => {
    const res = await fetch(`${API_URL}/timetables/${id}`);
    return res.json();
  },
  saveTimetable: async (timetable: Timetable) => {
    const res = await fetch(`${API_URL}/timetables`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(timetable)
    });
    return res.json();
  },

  // Timetable Entries
  getTimetableEntries: async (timetableId?: number | number[]) => {
    let url = `${API_URL}/timetable_entries`;
    if (timetableId !== undefined) {
      if (Array.isArray(timetableId)) {
        url += `?timetable_id=${timetableId.join(',')}`;
      } else {
        url += `?timetable_id=${timetableId}`;
      }
    }
    const res = await fetch(url);
    return res.json();
  },
  getTimetableEntry: async (id: number) => {
    const res = await fetch(`${API_URL}/timetable_entries/${id}`);
    return res.json();
  },
  bulkAddTimetableEntries: async (entries: TimetableEntry[]) => {
    const res = await fetch(`${API_URL}/timetable_entries/bulk`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entries)
    });
    return res.json();
  },
  deleteTimetableEntries: async (timetableId: number) => {
    const res = await fetch(`${API_URL}/timetable_entries?timetable_id=${timetableId}`, { method: 'DELETE' });
    return res.json();
  },

  // Tracked Activities
  getTrackedActivities: async () => {
    const res = await fetch(`${API_URL}/tracked_activities`);
    return res.json();
  },
  addTrackedActivity: async (activity: TrackedActivity) => {
    const res = await fetch(`${API_URL}/tracked_activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activity)
    });
    return res.json();
  },
  updateTrackedActivity: async (id: number, updates: Partial<TrackedActivity>) => {
    const res = await fetch(`${API_URL}/tracked_activities/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates)
    });
    return res.json();
  },
  deleteTrackedActivity: async (id: number) => {
    const res = await fetch(`${API_URL}/tracked_activities/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Metadata
  getDepartmentByName: async (name: string) => {
    const res = await fetch(`${API_URL}/departments?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    return data[0];
  },
  getDepartment: async (id: number) => {
    const res = await fetch(`${API_URL}/departments/${id}`);
    return res.json();
  },
  addDepartment: async (dept: Omit<Department, 'id'>) => {
    const res = await fetch(`${API_URL}/departments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dept)
    });
    return res.json();
  },
  getBatchByNameAndDept: async (name: string, deptId: number) => {
    const res = await fetch(`${API_URL}/batches?name=${encodeURIComponent(name)}&department_id=${deptId}`);
    const data = await res.json();
    return data[0];
  },
  getBatch: async (id: number) => {
    const res = await fetch(`${API_URL}/batches/${id}`);
    return res.json();
  },
  addBatch: async (batch: Omit<Batch, 'id'>) => {
    const res = await fetch(`${API_URL}/batches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch)
    });
    return res.json();
  },
  getDivisionByNameAndBatch: async (name: string, batchId: number) => {
    const res = await fetch(`${API_URL}/divisions?name=${encodeURIComponent(name)}&batch_id=${batchId}`);
    const data = await res.json();
    return data[0];
  },
  getDivision: async (id: number) => {
    const res = await fetch(`${API_URL}/divisions/${id}`);
    return res.json();
  },
  addDivision: async (div: Omit<Division, 'id'>) => {
    const res = await fetch(`${API_URL}/divisions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(div)
    });
    return res.json();
  }
};
