import { useState, useEffect } from 'react';
import timetableData from '../data/timetable.json';

export default function Tracker() {
  const [completedClasses, setCompletedClasses] = useState<Record<string, boolean>>({});
  const [currentDay, setCurrentDay] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    
    // Set to Monday if it's Sunday
    const displayDay = dayName === 'Sunday' ? 'Monday' : dayName;
    setCurrentDay(displayDay);

    const dateStr = date.toISOString().split('T')[0];
    setCurrentDateString(dateStr);

    const saved = localStorage.getItem('pdpu_tracked_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === dateStr) {
          setCompletedClasses(parsed.classes || {});
        } else {
          // Clear if it's a new day
          setCompletedClasses({});
          localStorage.setItem('pdpu_tracked_classes', JSON.stringify({ date: dateStr, classes: {} }));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('pdpu_tracked_classes', JSON.stringify({ date: dateStr, classes: {} }));
    }
  }, []);

  const handleToggle = (id: string) => {
    const updated = { ...completedClasses, [id]: !completedClasses[id] };
    setCompletedClasses(updated);
    localStorage.setItem('pdpu_tracked_classes', JSON.stringify({ date: currentDateString, classes: updated }));
  };

  const myClasses = timetableData.filter((c: any) => {
    if (c.day !== currentDay) return false;
    return true;
  }).sort((a, b) => {
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
      <h1 style={{ marginBottom: '1rem' }}>Activity Tracker</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Track your classes for today ({currentDay}, {currentDateString}).
      </p>
      
      <div className="card">
        {myClasses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myClasses.map((c: any) => (
              <div 
                key={c.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  border: '1px solid #eee', 
                  borderRadius: '8px',
                  backgroundColor: completedClasses[c.id] ? '#f8fff8' : 'white',
                  opacity: completedClasses[c.id] ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ marginRight: '1rem' }}>
                  <input 
                    type="checkbox" 
                    checked={completedClasses[c.id] || false} 
                    onChange={() => handleToggle(c.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, textDecoration: completedClasses[c.id] ? 'line-through' : 'none' }}>
                    {c.subject}
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {c.year} • {c.department} • Div {c.division} • {c.faculty} • {c.room} • {c.type}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {c.startTime} - {c.endTime}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No classes scheduled for today!
          </div>
        )}
      </div>
    </div>
  );
}
