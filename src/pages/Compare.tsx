import { useState, useMemo, useEffect } from 'react';
import { api, type TimetableEntry } from '../services/api';
import { detectMasterFreeIntervals, findOverlappingPublicClasses, minutesToTime } from '../services/timetableEngine';

export default function Compare() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      const masterEntries = await api.getTimetableEntries(1);
      const publicTimetables = await api.getTimetables('public');
      const publicTimetableIds = publicTimetables.map((t: any) => t.id);
      
      let publicEntries: any[] = [];
      if (publicTimetableIds.length > 0) {
        publicEntries = await api.getTimetableEntries(publicTimetableIds);
      }
      
      const tracked = await api.getTrackedActivities();
      setData({ masterEntries, publicEntries, publicTimetables, tracked });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const comparison = useMemo(() => {
    if (!data) return null;
    const { masterEntries, publicEntries, publicTimetables, tracked } = data;

    // Filter by day
    const dayMaster = masterEntries.filter((e: any) => e.day_of_week === selectedDay);
    const dayPublic = publicEntries.filter((e: any) => e.day_of_week === selectedDay);

    const freeIntervals = detectMasterFreeIntervals(dayMaster);
    const overlaps = findOverlappingPublicClasses(freeIntervals, dayPublic);

    return { dayMaster, overlaps, publicTimetables, tracked };
  }, [data, selectedDay]);

  const handleTrackActivity = async (entry: TimetableEntry) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allTracked = await api.getTrackedActivities();
      const existing = allTracked.find((t: any) => 
        t.master_timetable_id === 1 && 
        t.source_entry_id === entry.id && 
        t.activity_date === today
      );

      if (!existing) {
        await api.addTrackedActivity({
          master_timetable_id: 1,
          source_timetable_id: entry.timetable_id,
          source_entry_id: entry.id!,
          activity_date: today,
          status: 'Planned',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        loadData();
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Compare Timetables</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <select className="form-control" style={{ width: '200px' }} value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>My Classes ({selectedDay})</h2>
        {comparison?.dayMaster.length === 0 ? <p>No classes.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {comparison?.dayMaster.map((e: any) => (
              <div key={e.id} className="slot-my-class">
                <strong>{e.start_time} - {e.end_time}</strong>: {e.subject} ({e.room || 'No Room'})
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginBottom: '1rem' }}>My Free Slots & Available Activities</h2>
        {comparison?.overlaps.length === 0 ? <p>No public activities during free slots.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comparison?.overlaps.map((overlap, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem' }}>
                <div className="slot-free" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                  Free: {minutesToTime(overlap.freeInterval.start_minutes)} - {minutesToTime(overlap.freeInterval.end_minutes)}
                </div>
                
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {overlap.overlappingEntries.map((pubEntry: any) => {
                    const timetable = comparison.publicTimetables.find((t: any) => t.id === pubEntry.timetable_id);
                    const isTracked = comparison.tracked.some((t: any) => t.source_entry_id === pubEntry.id);
                    
                    return (
                      <div key={pubEntry.id} className="slot-other-class" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{pubEntry.start_time} - {pubEntry.end_time}</strong> | {timetable?.name} <br/>
                          {pubEntry.subject} ({pubEntry.teacher})
                        </div>
                        <button 
                          className="btn" 
                          style={{ backgroundColor: isTracked ? 'var(--success)' : 'var(--bg-color)', color: isTracked ? 'white' : 'var(--text-color)', border: '1px solid var(--border-color)' }}
                          onClick={() => handleTrackActivity(pubEntry)}
                          disabled={isTracked}
                        >
                          {isTracked ? 'Tracked ✓' : 'Track'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
