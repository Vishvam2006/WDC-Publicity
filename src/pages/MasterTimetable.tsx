import { useState } from 'react';
import { db } from '../db/db';
import { parseCsvText, parseMatrixCsv, validateTimetableRows } from '../services/csvParser';
import { timeToMinutes } from '../services/timetableEngine';

export default function MasterTimetable() {
  const [format, setFormat] = useState('list');
  const [subGroup, setSubGroup] = useState('');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setStatus('Parsing CSV...');
    try {
      let rows;
      if (format === 'matrix') {
        rows = await parseMatrixCsv(csvText, subGroup);
      } else {
        rows = await parseCsvText(csvText);
      }
      
      const { validRows, invalidRows } = validateTimetableRows(rows);

      if (invalidRows.length > 0) {
        setStatus(`Found ${invalidRows.length} invalid rows. Example error: ${invalidRows[0].errors.join(', ')}`);
        setLoading(false);
        return;
      }

      setStatus('Saving to database...');
      await db.timetables.put({
        id: 1, // Fix to 1 for MVP master
        owner_id: 1,
        name: 'My Master Timetable',
        type: 'master',
        academic_year: '2026-2027',
        semester: '1',
        effective_from: new Date().toISOString(),
        effective_to: new Date().toISOString(),
        version: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await db.timetable_entries.where('timetable_id').equals(1).delete();

      const entries = validRows.map(r => ({
        timetable_id: 1,
        day_of_week: r.day,
        specific_date: r.date,
        start_time: r.start_time!,
        end_time: r.end_time!,
        start_minutes: timeToMinutes(r.start_time!),
        end_minutes: timeToMinutes(r.end_time!),
        subject: r.subject!,
        teacher: r.teacher,
        room: r.room,
        notes: r.notes,
        source_row_number: r._source_row_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // @ts-ignore
      await db.timetable_entries.bulkAdd(entries);
      setStatus(`Successfully imported ${entries.length} master classes!`);
      setCsvText('');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>My Master Timetable</h1>
      <p style={{ marginBottom: '2rem' }}>Paste your master timetable CSV here to update your free slots.</p>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>CSV Format</label>
            <select className="form-control" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="list">Standard List Format</option>
              <option value="matrix">PDEU Matrix Format</option>
            </select>
          </div>
          {format === 'matrix' && (
            <div className="form-group">
              <label>My Sub-Group (Optional, e.g. G1)</label>
              <input 
                className="form-control" 
                value={subGroup} 
                onChange={e => setSubGroup(e.target.value)} 
                placeholder="G1"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>CSV Data</label>
          <textarea 
            className="form-control" 
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={format === 'matrix' ? 'Paste the full PDEU matrix here...' : 'day,start_time,end_time,subject,teacher,room\nMonday,09:00,10:00,Mathematics,Prof. X,Room 101'}
          />
        </div>
        <button className="btn btn-primary" onClick={handleImport} disabled={loading || !csvText}>
          {loading ? 'Importing...' : 'Import Master Timetable'}
        </button>
        {status && <div style={{ marginTop: '1rem', fontWeight: 500, color: status.includes('Error') || status.includes('invalid') ? 'var(--danger)' : 'var(--success)' }}>{status}</div>}
      </div>
    </div>
  );
}
