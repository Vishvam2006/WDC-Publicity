import { useState, useEffect } from 'react';
import timetableData from '../data/timetable.json';
import { usePublicityTracker } from '../hooks/usePublicityTracker';
import { CheckCircle, Circle } from 'lucide-react';

export default function Dashboard() {
  const [dayFilter, setDayFilter] = useState('');
  const { toggleVisited, isVisited } = usePublicityTracker();
  
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
      const filterHour = parseInt(timeFilter, 10);
      
      const getHour = (t: string) => {
        if (!t) return 0;
        let h = parseInt(t.split(/[:.]/)[0], 10);
        if (h >= 1 && h <= 7) h += 12;
        return h;
      };

      const startHour = getHour(c.startTime);
      let endHour = getHour(c.endTime);
      
      // If end hour is the same as start hour (e.g., 09:00 to 09:55), the class falls in that hour.
      // For practicals (P), assume they span at least 2 hours if endHour == startHour.
      if (c.type === 'P' && endHour === startHour) {
        endHour = startHour + 1;
      }

      if (filterHour < startHour || filterHour > endHour) {
        return false;
      }
    }
    return true;
  }).sort((a: any, b: any) => {
    const parseTime = (t: string) => {
      if (!t) return 0;
      const parts = t.split(/[:.]/);
      let h = parseInt(parts[0], 10);
      if (h >= 1 && h <= 7) h += 12; // PM adjustment
      return h * 60 + parseInt(parts[1] || '0', 10);
    };
    return parseTime(a.startTime) - parseTime(b.startTime);
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
              <option value="17">05:00 PM</option>
              <option value="18">06:00 PM</option>
              <option value="19">07:00 PM</option>
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
          filteredClasses.map((c: any) => {
            const classId = `${c.department}-${c.year}-${c.division}-${c.day}-${c.startTime}-${c.subject}`;
            const visited = isVisited(classId);

            return (
              <div 
                key={classId} 
                className="card" 
                onClick={() => toggleVisited(classId)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderLeft: visited ? '4px solid #10b981' : '4px solid var(--primary)',
                  opacity: visited ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisited(classId);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: visited ? '#10b981' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title={visited ? "Mark as unvisited" : "Mark as visited"}
                  >
                    {visited ? <CheckCircle size={28} /> : <Circle size={28} />}
                  </button>
                  <div style={{ textDecoration: visited ? 'line-through' : 'none' }}>
                    <h3 style={{ marginBottom: '0.25rem', color: visited ? '#888' : 'inherit' }}>{c.subject}</h3>
                    <div style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>
                      {c.year} • {c.department} • Div {c.division} • {c.faculty} • {c.room} • {c.type === 'L' ? 'Lecture' : c.type === 'P' ? 'Practical' : c.type === 'T' ? 'Tutorial' : c.type}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', textDecoration: visited ? 'line-through' : 'none' }}>
                  <div style={{ fontWeight: 'bold', color: visited ? '#888' : 'inherit' }}>{c.startTime} - {c.endTime}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>{c.day}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
