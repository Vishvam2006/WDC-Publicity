import { useState, useEffect } from 'react';
import timetableData from '../data/timetable.json';

export default function Dashboard() {
  const [dayFilter, setDayFilter] = useState('');
  
  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    if (currentDay !== 'Sunday') setDayFilter(currentDay);
    else setDayFilter('Monday');
  }, []);

  const [timeFilter, setTimeFilter] = useState('');

  // Filter the pre-loaded JSON data
  const filteredClasses = timetableData.filter((c: any) => {
    if (dayFilter && c.day !== dayFilter) return false;
    
    if (timeFilter) {
      // Very basic time filtering (matches start time hour)
      if (!c.startTime.startsWith(timeFilter)) return false;
    }
    return true;
  });

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label>Day</label>
            <select className="form-control" value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
          <div className="form-group">
            <label>Time (Hour)</label>
            <select className="form-control" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="">All Times</option>
              <option value="08">08:00 AM</option>
              <option value="09">09:00 AM</option>
              <option value="10">10:00 AM</option>
              <option value="11">11:00 AM</option>
              <option value="12">12:00 PM</option>
              <option value="13">01:00 PM</option>
              <option value="14">02:00 PM</option>
              <option value="15">03:00 PM</option>
              <option value="16">04:00 PM</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredClasses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            No classes found for the selected filters.
          </div>
        ) : (
          filteredClasses.map((c: any, index) => (
            <div key={index} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{c.subject}</h3>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  {c.year} • {c.department} • Div {c.division} • {c.faculty} • {c.room} • {c.type === 'L' ? 'Lecture' : c.type === 'P' ? 'Practical' : c.type === 'T' ? 'Tutorial' : c.type}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold' }}>{c.startTime} - {c.endTime}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>{c.day}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
