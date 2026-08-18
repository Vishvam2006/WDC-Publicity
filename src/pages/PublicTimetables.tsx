import { useState } from 'react';
import { db } from '../db/db';
import { parseCsvText, parseMatrixCsv, validateTimetableRows } from '../services/csvParser';
import { timeToMinutes } from '../services/timetableEngine';

export default function PublicTimetables() {
  const [format, setFormat] = useState('list');
  const [subGroup, setSubGroup] = useState('');
  const [csvText, setCsvText] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    if (!department || !batch || !division) {
      setStatus('Error: Please specify Department, Batch, and Division');
      return;
    }

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
      
      // Ensure group hierarchy exists
      let dept: any = await db.departments.where('name').equals(department).first();
      if (!dept) dept = await db.departments.add({ name: department, code: department, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      const deptId = typeof dept === 'number' ? dept : dept.id;

      let btc: any = await db.batches.where({ department_id: deptId, name: batch }).first();
      if (!btc) btc = await db.batches.add({ department_id: deptId, name: batch, academic_year: '2026-2027', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      const batchId = typeof btc === 'number' ? btc : btc.id;

      let div: any = await db.divisions.where({ batch_id: batchId, name: division }).first();
      if (!div) div = await db.divisions.add({ batch_id: batchId, name: division, display_name: division, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      const divId = typeof div === 'number' ? div : div.id;

      const groupName = `${department} ${batch} ${division}`;

      // Create a new public timetable entry
      const timetableId = await db.timetables.add({
        owner_id: 1,
        name: `${groupName} Timetable`,
        type: 'public',
        department_id: deptId,
        batch_id: batchId,
        division_id: divId,
        academic_year: '2026-2027',
        semester: '1',
        effective_from: new Date().toISOString(),
        effective_to: new Date().toISOString(),
        version: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const entries = validRows.map(r => ({
        timetable_id: timetableId,
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
      setStatus(`Successfully imported ${entries.length} classes for ${groupName}!`);
      setCsvText('');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Import Public Timetable</h1>
      <p style={{ marginBottom: '2rem' }}>Paste a public timetable CSV to compare against your free slots.</p>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Department</label>
            <input className="form-control" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. CAC" />
          </div>
          <div className="form-group">
            <label>Batch</label>
            <input className="form-control" value={batch} onChange={e => setBatch(e.target.value)} placeholder="e.g. 2028" />
          </div>
          <div className="form-group">
            <label>Division</label>
            <input className="form-control" value={division} onChange={e => setDivision(e.target.value)} placeholder="e.g. A" />
          </div>
        </div>

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
              <label>Sub-Group (Optional, e.g. G1)</label>
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
            placeholder={format === 'matrix' ? 'Paste the full PDEU matrix here...' : 'day,start_time,end_time,subject,teacher,room\nMonday,10:00,11:00,Physics,Prof. Y,Room 102'}
          />
        </div>
        <button className="btn btn-primary" onClick={handleImport} disabled={loading || !csvText}>
          {loading ? 'Importing...' : 'Import Public Timetable'}
        </button>
        {status && <div style={{ marginTop: '1rem', fontWeight: 500, color: status.includes('Error') || status.includes('invalid') ? 'var(--danger)' : 'var(--success)' }}>{status}</div>}
      </div>
    </div>
  );
}
